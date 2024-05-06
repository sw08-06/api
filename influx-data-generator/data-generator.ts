import { Point, WriteApi } from '@influxdata/influxdb-client'

export async function addPredictions(writeApi: WriteApi) {
  const dataPoints = [
    new Point('prediction')
      .intField('window_id', 1)
      .intField('value', 1),
    new Point('prediction')
      .intField('window_id', 2)
      .intField('value', 0),
    new Point('prediction')
      .intField('window_id', 7)
      .intField('value', 1),
  ]

  writeApi.writePoints(dataPoints)
  writeApi.close().then(() => {
    console.log('predictions: WRITE FINISHED')
  })
}

export async function addData(writeApi: WriteApi) {
  const dataPoints = [
    new Point('data')
      .tag('data_type', 'bvp')
      .intField('window_id', 1)
      .floatField('value', 700),
    new Point('data')
      .tag('data_type', 'eda')
      .intField('window_id', 1)
      .floatField('value', 1.5),
    new Point('data')
      .tag('data_type', 'temp')
      .intField('window_id', 1)
      .floatField('value', 35),

    new Point('data')
      .tag('data_type', 'bvp')
      .intField('window_id', 7)
      .floatField('value', 700),
    new Point('data')
      .tag('data_type', 'eda')
      .intField('window_id', 7)
      .floatField('value', 1.5),
    new Point('data')
      .tag('data_type', 'temp')
      .intField('window_id', 7)
      .floatField('value', 35),

    new Point('data')
      .tag('data_type', 'bvp')
      .intField('window_id', 8)
      .floatField('value', 700),
    new Point('data')
      .tag('data_type', 'eda')
      .intField('window_id', 8)
      .floatField('value', 1.5),
    new Point('data')
      .tag('data_type', 'temp')
      .intField('window_id', 8)
      .floatField('value', 35),
  ]

  writeApi.writePoints(dataPoints)
  writeApi.close().then(() => {
    console.log('datapoints: WRITE FINISHED')
  })
}