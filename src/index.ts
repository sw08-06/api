import * as dotenv from 'dotenv'
const express = require('express');
import { Request, Response } from 'express';
import cors from "cors";
import * as bodyParser from "body-parser";
import { InfluxDB, Point } from '@influxdata/influxdb-client';
import { addData, addPredictions } from '../influx-data-generator/data-generator';

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

const queryApi = new InfluxDB({url, token}).getQueryApi(org);
const fluxQuery = 'from(bucket: "test") |> range(start: -31d)';

// Middleware to parse JSON bodies
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  const writeApi = new InfluxDB({url, token}).getWriteApi(org, bucket);
  //addPredictions(writeApi);
  addData(writeApi)
  res.status(200).send('Hello, TypeScript with Express!');
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
app.route("/api/stress-predict")
  .get(async (req: Request, res: Response) => {
    let o: any[] = [];
    let next_window_to_predict: number | null = null;

    // get latest prediction from db
      // if no prediction -> check for lowest window_id value
    // send

  
    const find_max_window_query = `from(bucket: "test") 
      |> range(start: -inf) 
      |> filter(fn: (r) => r["_measurement"] == "prediction") 
      |> filter(fn: (r) => r["_field"] == "window_id") 
      |> max()`;

      queryApi.queryRows(find_max_window_query, 
      {
        next(row, tableMeta) {
          const rowData = tableMeta.toObject(row)
          console.log(`${rowData._measurement}: ${rowData._field}=${rowData._value}`);
          next_window_to_predict = rowData._value + 1 ;
        },
        error(error) {
          console.error('Error fetching data from InfluxDB:', error);
          res.status(500).send('Internal server error');
        },
        complete() {
          console.log('find max window query completed.');
          console.log(`The window found is: ${next_window_to_predict}`);
        },
      });

      // TODO: Check if any window_id was found. If not, query for the smallest window_id
    if(next_window_to_predict == null) {
      queryApi.queryRows(`from(bucket: "test") 
        |> range(start: -inf)
        |> filter(fn: (r) => r._measurement == "data" and r._field == "window_id")
        |> min()`,
      {
        next(row, tableMeta) {
          const rowData = tableMeta.toObject(row)
          console.log("Query for data larger than last window.")
          console.log(`${rowData._time} ${rowData._measurement}: ${rowData._field}=${rowData._value}`);
          o.push(rowData);
        },
        error(error) {
          console.error('Error fetching data from InfluxDB:', error);
          res.status(500).send('Internal server error');
        },
        complete() {
          console.log('if branch: Finished SUCCESS');
          res.status(200).json(o);
        },
      });
    } else {
      queryApi.queryRows(`from(bucket: "test") 
        |> range(start: -inf)
        |> filter(fn: (r) => r._measurement == "data" and r._field == "window_id" and r._value == 8)`, // TODO: unable to use ${} for the 8
      {
        next(row, tableMeta) {
          const rowData = tableMeta.toObject(row)
          console.log("Query for data larger than last window.")
          console.log(`${rowData._time} ${rowData._measurement}: ${rowData._field}=${rowData._value}`);
          o.push(rowData);
        },
        error(error) {
          console.error('Error fetching data from InfluxDB:', error);
          res.status(500).send('Internal server error');
        },
        complete() {
          console.log('else branch: Finished SUCCESS');
          res.status(200).json(o);
        },
      });
    }

  })
  .post(async (req: Request, res: Response) => {
    const writeApi = new InfluxDB({url, token}).getWriteApi(org, bucket);
    console.log("latest prediction is: " + req.body.prediction);
  
    writeApi.writePoint(
      new Point('prediction')
        .tag('window_id', String(req.query["number_param"]))
        .floatField('value', req.body.prediction)
    );
    writeApi.close().then(() => {
      console.log('WRITE FINISHED');
      res.status(200).send();
    });
  });

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});