import express from 'express';
import { Request, Response } from 'express';
import { queryApi, influxdbQuerier, bucket, url, token, org } from '../controllers/influxdb';
import { InfluxDB, Point } from '@influxdata/influxdb-client';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
    let next_window_id_to_predict: number = 0;

    queryApi.queryRows(`from(bucket: "${bucket}") 
    |> range(start: -inf)
    |> filter(fn: (r) => r["_measurement"] == "prediction") 
    |> filter(fn: (r) => r["_field"] == "window_id") 
    |> max()`,
        {
            next(row, tableMeta) {
                const rowData = tableMeta.toObject(row)
                next_window_id_to_predict = rowData._value + 1;
            },
            error(error) {
                console.error('Error fetching data from InfluxDB:', error);
                res.status(500).send('Internal server error');
            },
            async complete() {
                let min_window = await influxdbQuerier(
                    `from(bucket: "${bucket}")
                    |> range(start: -inf)
                    |> filter(fn: (r) => r["_measurement"] == "data" and r["window_id"] >= "${next_window_id_to_predict}")
                    |> min()`,
                    res
                );

                try {
                    console.log("\nthis is the min_win value:: " + min_window[0].window_id);

                    let next_window_to_predict = await influxdbQuerier(
                        `from(bucket: "${bucket}")
                        |> range(start: -inf)
                        |> filter(fn: (r) => r["_measurement"] == "data" and r["window_id"] == "${min_window[0].window_id}")`,
                        res
                    );

                    res.status(200).json(next_window_to_predict);
                } catch (error) {
                    console.log("There is no new data available");
                    res.status(204).send();
                }
            },
        });
});

router.post('/', async (req: Request, res: Response) => {
    const writeApi = new InfluxDB({ url, token }).getWriteApi(org, bucket);

    // Checks if the request comes from the stress generator (req.body is of type list of Object) or 
    // stress predictor (req.body is of type Object).
    if (Array.isArray(req.body)) {
        let list_of_points: any[] = [];
        req.body.forEach(item => {
            list_of_points.push(
                new Point('prediction')
                    .timestamp(item.time)
                    .intField('window_id', item.window_id)
                    .intField('value', item.value)
            );
        });
        writeApi.writePoints(list_of_points);
        writeApi.close().then(() => {
            console.log('Generated predictions written to DB');
            res.status(200).send();
        });
    } else {
        writeApi.writePoint(
            new Point('prediction')
                .timestamp(req.body.time)
                .intField('window_id', req.body.window_id)
                .intField('value', req.body.prediction)
        );
        writeApi.close().then(() => {
            console.log('New prediction written to DB');
            res.status(200).send();
        });
    }
});

export default router;
