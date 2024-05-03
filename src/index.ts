import * as dotenv from 'dotenv'
const express = require('express');
import { Request, Response } from 'express';
import cors from "cors";
import * as bodyParser from "body-parser";
import { InfluxDB, Point } from '@influxdata/influxdb-client';
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

const queryApi = new InfluxDB({url, token }).getQueryApi(org);
const writeApi = new InfluxDB({url, token}).getWriteApi(org, bucket);
const fluxQuery = 'from(bucket: "test") |> range(start: -31d)';


// Middleware to parse JSON bodies
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  addData(writeApi, org, bucket);
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

// GET request from frontend 
app.get('/api/predictions', async (req: Request, res: Response) => {
  let o: any;

  queryApi.queryRows('from(bucket: "test") |> range(start: -365d) |> filter(fn: (r) => r._measurement == "prediction")', {
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

// GET request from stress predictor
app.get('/api/stress-predict', async (req: Request, res: Response) => {
  console.log("latest window_size is: " + req.query["number_param"]);

  let o: any[] = [];
  queryApi.queryRows(`from(bucket: "test") |> range(start: -31d) |> filter(fn: (r) => r._measurement == "data" and r.window_id > "${req.query["number_param"]}")`
  , {
    next(row, tableMeta) {
      const rowData = tableMeta.toObject(row)
      console.log(`${rowData._time} ${rowData._measurement}: ${rowData._field}=${rowData._value}`);
      o.push(rowData);
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

// POST request from stress predictor
app.post('/api/stress-predict', async (req: Request, res: Response) => {
  const predictionsList = [];

  for (let prediction of res.locals.predictions)
    predictionsList.push(
      new Point('prediction')
      .tag('window_id', prediction.window_id)
      .floatField('value', prediction.prediction)
    );

  writeApi.writePoints(predictionsList);
  writeApi.close().then(() => {
    console.log('WRITE FINISHED');
    res.status(200).send();
  });

})

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});