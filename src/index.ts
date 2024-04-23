// src/index.ts
import express, { Request, Response } from 'express';
import * as bodyParser from "body-parser";
import { InfluxDB } from '@influxdata/influxdb-client';
//import routes from "./routes";

const app = express();
const port = 3000;

app.disable("x-powered-by");
app.use(bodyParser.json());

//app.use("/", routes)


app.get('/', (req, res) => {
  res.send('Hello, TypeScript with Express!');
});


/* from(bucket: "test")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["_measurement"] == "measurement1")
  |> filter(fn: (r) => r["_field"] == "field1")
  |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)
  |> yield(name: "mean") */

const queryApi = new InfluxDB({url: "http://localhost:8086", token: "_ishXjFThVYXQyZRIacHDAbaYkUjFTolREuto5_MfjzYqQ008IezFqbiyDWIBVBkSFXNEAu4Nz4RZsmbBXG6mA=="}).getQueryApi("org");
const fluxQuery = 'from(bucket: "test") |> range(start: 2024-01-01T08:00:00Z, stop: 2025-01-01T08:00:00Z)';

// Middleware to parse JSON bodies
app.use(express.json());

// Define a route to fetch data from InfluxDB
app.get('/api/influx-data', async (req: Request, res: Response) => {
  try {
    const resultPromise = queryApi.rows(fluxQuery);

    // Wait for the result promise to resolve
    const result = await resultPromise;

    // Log the result to the console
    console.log(result);
      
  } catch (error) {
    console.error('Error fetching data from InfluxDB:', error);
    res.status(500).send('Internal server error');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});