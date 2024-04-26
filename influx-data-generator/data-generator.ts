import { InfluxDB, Point } from '@influxdata/influxdb-client'

export async function addData(client: InfluxDB, org: string, bucket: string) {
  const writeApi = client.getWriteApi(org, bucket)

  const dataPoints = [
    new Point('data')
      .tag('data_type', 'bvp')
      .floatField('value', 700),
    new Point('data')
      .tag('data_type', 'eda')
      .floatField('value', 1.5),
    new Point('data')
      .tag('data_type', 'temp')
      .floatField('value', 35),
  ]

  writeApi.writePoints(dataPoints)
  writeApi.close().then(() => {
    console.log('WRITE FINISHED')
  })
}