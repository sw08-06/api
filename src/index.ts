import * as dotenv from 'dotenv'
const express = require('express');
import { Request, Response } from 'express';
import cors from "cors";
import * as bodyParser from "body-parser";
import { InfluxDB, Point } from '@influxdata/influxdb-client';


dotenv.config()
const app = express();
const port = 3000;

app.disable("x-powered-by");
app.use(bodyParser.json({ limit: '50mb' }));
app.use(cors());

const url: string = process.env.INFLUX_URL!
const token: string = process.env.INFLUX_TOKEN!
const org: string = process.env.INFLUX_ORG!
const bucket: string = process.env.INFLUX_BUCKET!

const queryApi = new InfluxDB({ url, token }).getQueryApi(org);

app.use(express.json());

app.get("/", (req: Request, res: Response) => { res.status(200).send('Hello, TypeScript with Express!'); });

// GET request from frontend 
app.get("/api/predictions", async (req: Request, res: Response) => {
	let o: any;

	queryApi.queryRows(`from(bucket: "${bucket}") |> range(start: -inf) |> filter(fn: (r) => r._measurement == "prediction")`, {
		next(row, tableMeta) {
			o = tableMeta.toObject(row);
			console.log(`${o._time} ${o._measurement}: ${o._field}=${o._value}`);
		},
		error(error) {
			console.error('Error fetching data from InfluxDB:', error);
			res.status(500).send('Internal server error');
		},
		complete() {
			console.log('Finished SUCCESS');
			res.status(200).json(o);
		},
	});
});

app.post("/api/stress-generator", async (req: Request, res: Response) => {
	const writeApi = new InfluxDB({ url, token }).getWriteApi(org, bucket);
	let list_of_points: any[] = [];

	if (Array.isArray(req.body))
		req.body.forEach(item => {
			list_of_points.push(
				new Point('data')
					.timestamp(item.time)
					.tag('data_type', item.data_type)
					.tag('window_id', item.window_id)
					.intField('index', item.index)
					.floatField('value', item.value)
			);
		});
	writeApi.writePoints(list_of_points);
	writeApi.close().then(() => {
		console.log('WRITE FINISHED');
		res.status(200).send();
	});
});

// GET request from stress predictor
app.route("/api/stress-predict")
	.get(async (req: Request, res: Response) => {
		let next_window_id_to_predict: number = 0;

		queryApi.queryRows(`from(bucket: "${bucket}") 
		|> range(start: -inf)
		|> filter(fn: (r) => r["_measurement"] == "prediction") 
		|> filter(fn: (r) => r["_field"] == "window_id") 
		|> max()`,
			{
				next(row, tableMeta) {
					const rowData = tableMeta.toObject(row)
					console.log(`${rowData._measurement}: ${rowData._field}=${rowData._value}`);
					next_window_id_to_predict = rowData._value + 1;
				},
				error(error) {
					console.error('Error fetching data from InfluxDB:', error);
					res.status(500).send('Internal server error');
				},
				async complete() {
					console.log(`\nThe next window found is: ${next_window_id_to_predict}\n`);
					 let min_window = await influxdbQuerier(
						`from(bucket: "${bucket}")
						|> range(start: -inf)
						|> filter(fn: (r) => r["_measurement"] == "data" and r["window_id"] >= "${next_window_id_to_predict}")
						|> min()`,
						res
					);



					if(Array.isArray(min_window)) {
						console.log("\n\nthis is the min_win value:: " + min_window[0].window_id);

						let next_window_to_predict = await influxdbQuerier(
							`from(bucket: "${bucket}")
							|> range(start: -inf)
							|> filter(fn: (r) => r["_measurement"] == "data" and r["window_id"] == "${min_window[0].window_id}")`,
							res
						);
						
						console.log("comeon now!: " + next_window_to_predict);
						res.status(200).json(next_window_to_predict);
					} else {
						console.log("There is no data available");
						res.status(404).send('There is no data available');
					}

					
				},
			});
	})
	.post(async (req: Request, res: Response) => {
		const writeApi = new InfluxDB({ url, token }).getWriteApi(org, bucket);

		// Checks if the request comes from the stress generator (req.body is of type list of Object) or 
		// stress predictor (req.body is of type Object).
		if (Array.isArray(req.body)) {
			let list_of_points: any[] = [];

			req.body.forEach(item => {
				const milliseconds = new Date(item.time + "Z").getTime();
				const nanoseconds = milliseconds * 1e6;
				list_of_points.push(
					new Point('prediction')
						.timestamp(nanoseconds)
						.intField('window_id', item.window_id)
						.intField('value', item.value)
				);
			});
			writeApi.writePoints(list_of_points);
			writeApi.close().then(() => {
				console.log('WRITE FINISHED');
				res.status(200).send();
			});
		} else {
			writeApi.writePoint(
				new Point('prediction')
					.intField('window_id', req.query["number_param"])
					.intField('value', req.body.prediction)
			);
			writeApi.close().then(() => {
				console.log('WRITE FINISHED');
				res.status(200).send();
			});
		}
	});

app.listen(port, () => {
	console.log(`Server is running on http://localhost:${port}`);
});

async function influxdbQuerier(query: string, res: Response): Promise<any> {
    return new Promise((resolve, reject) => {
        let list_of_results: any[] = [];
        queryApi.queryRows(query, {
            next(row, tableMeta) {
                const rowData = tableMeta.toObject(row)
                // console.log(`${rowData._measurement}: ${rowData._field}=${rowData._value}`);
                list_of_results.push(rowData);
            },
            error(error) {
                console.error('Error fetching data from InfluxDB:', error);
                res.status(500).send('Internal server error');
                reject(error);
            },
            complete() {
				if(list_of_results === undefined || list_of_results.length == 0)
					resolve("No data available")
				else
               		resolve(list_of_results);
            },
        });
    });
}