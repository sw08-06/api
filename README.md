# backend
This repository contains the code for the service responsible for the communication between the other services. That is, it contains the API server, business logic, influxdb connection, etc.

To install the required packages locally to run the project, use npm with the following command:
```
npm install
```

Alternatively, Docker Compose can be used to start up two services. An InfluxDB service and a Stress Predictor service. To do this create a `.env` file in the project root directory and populate it with the following environment variables:
```
INFLUX_USERNAME="USERNAME"
INFLUX_PASSWORD="PASSWORD"
INFLUX_BUCKET="BUCKET"
INFLUX_ORG="ORG"
INFLUX_TOKEN="TOKEN"
INFLUX_URL="http://IP_ADDRESS_OF_HOST_MACHINE:8086"
```
Ensure to replace `"USERNAME"`, `"PASSWORD"`, `"BUCKET"`, `"ORG"`, `"TOKEN"`, and `"IP_ADDRESS_OF_HOST_MACHINE"` with your actual InfluxDB credentials and server information.

Then, run the following command in the terminal:
```
docker-compose up -d
```