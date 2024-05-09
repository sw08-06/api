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

app.get("/", (req: Request, res: Response) => {
	const writeApi = new InfluxDB({ url, token }).getWriteApi(org, bucket);
	res.status(200).send('Hello, TypeScript with Express!');
});

// GET request from frontend 
app.get("/api/predictions", async (req: Request, res: Response) => {
	let o: any;

	queryApi.queryRows(`from(bucket: "${bucket}") |> range(start: -365d) |> filter(fn: (r) => r._measurement == "prediction")`, {
		next(row, tableMeta) {
			o = tableMeta.toObject(row);                  // TODO: Check that this is correct
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
					.intField('window_id', item.window_id)
					.intField('index', item.index)
					.intField('value', item.value)
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
		let next_window_to_predict: number | null = null;

		queryApi.queryRows(`from(bucket: "${bucket}") 
		|> range(start: -inf)
		|> filter(fn: (r) => r["_measurement"] == "prediction") 
		|> filter(fn: (r) => r["_field"] == "window_id") 
		|> max()`,
			{
				next(row, tableMeta) {
					const rowData = tableMeta.toObject(row)
					console.log(`${rowData._measurement}: ${rowData._field}=${rowData._value}`);
					next_window_to_predict = rowData._value + 1;
				},
				error(error) {
					console.error('Error fetching data from InfluxDB:', error);
					res.status(500).send('Internal server error');
				},
				complete() {
					console.log(`The window found is: ${next_window_to_predict}`);

					if (next_window_to_predict == null) {
						influxdbQuerier(
							`from(bucket: "${bucket}") 
							|> range(start: -inf)
							|> filter(fn: (r) => r._measurement == "data" and r._field == "window_id")
							|> min()`,
							next_window_to_predict,
							res
						);
					} else {
						influxdbQuerier(
							`from(bucket: "${bucket}") 
							|> range(start: -inf)
							|> filter(fn: (r) => r._measurement == "data" and 
								r._field == "window_id" and r._value == ${next_window_to_predict})`,
							next_window_to_predict,
							res
						);
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

function influxdbQuerier(query: string, next_window_to_predict: number | null, res: Response) {
	let list_of_results: any[] = [];
	queryApi.queryRows(query,
		{
			next(row, tableMeta) {
				const rowData = tableMeta.toObject(row)
				console.log(`${rowData._measurement}: ${rowData._field}=${rowData._value}`);
				list_of_results.push(rowData);
			},
			error(error) {
				console.error('Error fetching data from InfluxDB:', error);
				res.status(500).send('Internal server error');
			},
			complete() {
				if (next_window_to_predict == null)
					res.status(404).send("No data available");
				else
					res.status(200).json(list_of_results);
			},
		});
}