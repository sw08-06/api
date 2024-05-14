import express from 'express';
import { Request, Response } from 'express';
import { InfluxDB, Point } from '@influxdata/influxdb-client';
import { url, token, org, bucket } from '../controllers/influxdb';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
	const writeApi = new InfluxDB({ url, token }).getWriteApi(org, bucket);
	let list_of_points: any[] = [];

	if (Array.isArray(req.body))
		req.body.forEach(item => {
			list_of_points.push(
				new Point('data')
					.timestamp(item.time)
					.tag('data_type', item.data_type)
					.tag('window_id', item.window_id)
					.floatField('value', item.value)
			);
		});
	writeApi.writePoints(list_of_points);
	writeApi.close().then(() => {
		console.log('Generated data written to DB');
		res.status(200).send();
	});
});

export default router;
