import express from 'express';
import { Request, Response } from 'express';
import { queryApi, bucket } from '../controllers/influxdb';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
    let list_of_results: any[] = [];
	queryApi.queryRows(`from(bucket: "${bucket}") |> range(start: -27d) |> filter(fn: (r) => r._measurement == "prediction" and r["_field"] == "value")`, {
		next(row, tableMeta) {
			list_of_results.push(tableMeta.toObject(row));
		},
	error(error) {
		console.error('Error fetching data from InfluxDB:', error);
		res.status(500).send('Internal server error');
	},
	complete() {
		console.log('Finished SUCCESS');
		res.status(200).json(list_of_results);
	},
	});
});

export default router;
