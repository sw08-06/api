import * as dotenv from 'dotenv'
import { InfluxDB } from '@influxdata/influxdb-client';
import { Response } from 'express';

dotenv.config();
export const url: string = process.env.INFLUX_URL!;
export const token: string = process.env.INFLUX_TOKEN!;
export const org: string = process.env.INFLUX_ORG!;
export const bucket: string = process.env.INFLUX_BUCKET!;

export const queryApi = new InfluxDB({ url, token }).getQueryApi(org);
export const writeApi = new InfluxDB({ url, token }).getWriteApi(org, bucket);

export async function influxdbQuerier(query: string, res: Response): Promise<any> {
    return new Promise((resolve, reject) => {
        let list_of_results: any[] = [];
        queryApi.queryRows(query, {
            next(row, tableMeta) {
                list_of_results.push(tableMeta.toObject(row));
            },
            error(error) {
                console.error('Error fetching data from InfluxDB:', error);
                res.status(500).send('Internal server error');
                reject(error);
            },
            complete() {
                resolve(list_of_results);
            },
        });
    });
}
