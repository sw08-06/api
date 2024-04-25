import * as dotenv from 'dotenv'
dotenv.config()
const express = require('express');
import { Request, Response } from 'express';
import * as bodyParser from "body-parser";
import { InfluxDB } from '@influxdata/influxdb-client';
import { addData } from '../influx-data-generator/data-generator';

const url: string = process.env.INFLUX_URL!
const token: string = process.env.INFLUX_TOKEN!
const org: string = process.env.INFLUX_ORG!
const bucket: string = process.env.INFLUX_BUCKET!

const app = express();
const port = 3000;

app.disable("x-powered-by");
app.use(bodyParser.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, TypeScript with Express!');
});


const client = new InfluxDB({ url: "http://localhost:8086/", token: "token123" });
const queryApi = client.getQueryApi("org")
const fluxQuery = 'from(bucket: "test") |> range(start: 2024-01-01T08:00:00Z, stop: 2025-01-01T08:00:00Z)';

// Middleware to parse JSON bodies
app.use(express.json());

addData(client, org, bucket)

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