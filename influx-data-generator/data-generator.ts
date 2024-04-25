import { InfluxDB, Point } from '@influxdata/influxdb-client'

export async function addData(client: InfluxDB, org: string, bucket: string) {
  const writeApi = client.getWriteApi(org, bucket)

  const dataPoints = [
    new Point('BVP')
      .floatField('value', 700),
    new Point('EDA')
      .floatField('value', 1.5),
    new Point('TEMP')
      .floatField('value', 35),
  ]

  await writeApi.writePoints(dataPoints)
}
