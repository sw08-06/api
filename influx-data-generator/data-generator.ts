import { Point, WriteApi } from '@influxdata/influxdb-client'

export async function addData(writeApi: WriteApi, org: string, bucket: string) {
  const dataPoints = [
    new Point('data')
      .tag('data_type', 'bvp')
      .tag('window_id', '7')
      .floatField('value', 700),
    new Point('data')
      .tag('data_type', 'eda')
      .tag('window_id', '7')
      .floatField('value', 1.5),
    new Point('data')
      .tag('data_type', 'temp')
      .tag('window_id', '7')
      .floatField('value', 35),
  ]

  writeApi.writePoints(dataPoints)
  writeApi.close().then(() => {
    console.log('WRITE FINISHED')
  })
}