import * as dotenv from 'dotenv'
const express = require('express');
import { Request, Response } from 'express';
import cors from "cors";
import * as bodyParser from "body-parser";
import { InfluxDB } from '@influxdata/influxdb-client';
import { addData } from '../influx-data-generator/data-generator';

dotenv.config()
const app = express();
const port = 3000;

app.disable("x-powered-by");
app.use(bodyParser.json());
app.use(cors());

const url: string = process.env.INFLUX_URL!
const token: string = process.env.INFLUX_TOKEN!
const org: string = process.env.INFLUX_ORG!
const bucket: string = process.env.INFLUX_BUCKET!

const client = new InfluxDB({ url: url, token: token });
const queryApi = client.getQueryApi(org)
const fluxQuery = 'from(bucket: "test") |> range(start: 2024-01-01T08:00:00Z, stop: 2025-01-01T08:00:00Z)';


// Middleware to parse JSON bodies
app.use(express.json());

app.get('/', (req: Request, res: Response) => {  
  //addData(client, org, bucket);
  res.status(200).send('Hello, TypeScript with Express!');
});

app.get('/api/influx-data', async (req: Request, res: Response) => {
  try {
    let o: any;
    queryApi.queryRows(fluxQuery, {
      next(row, tableMeta) {
        o = tableMeta.toObject(row)
        console.log(`${o._time} ${o._measurement}: ${o._field}=${o._value}`)
      },
      error(error) {
        console.error(error)
        console.log('Finished ERROR')
      },
      complete() {
        console.log('Finished SUCCESS')
        res.json(o).send()
      },
    })
  } catch (error) {
    console.error('Error fetching data from InfluxDB:', error);
    res.status(500).send('Internal server error');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});