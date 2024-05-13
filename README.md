# API
This repository contains the code for the service responsible for the communication between the other services. That is, it contains the API server, business logic, and influxdb connection.

To install the required packages locally to run the project, use npm with the following command:
```
npm install
```

Alternatively, Docker Compose can be used to start up two services. An InfluxDB service and a API service. To do this create a `.env` file in the project root directory and populate it with the following environment variables:
```
INFLUX_USERNAME="USERNAME"
INFLUX_PASSWORD="PASSWORD"
INFLUX_BUCKET="BUCKET"
INFLUX_ORG="ORG"
INFLUX_TOKEN="TOKEN"
INFLUX_URL="http://influxdb:8086"
```
Ensure to replace `"USERNAME"`, `"PASSWORD"`, `"BUCKET"`, `"ORG"`, and `"TOKEN"` with your actual InfluxDB credentials and server information.

Then, run the following command in the terminal:
```
docker-compose up
```

To run the entire system, the `deployment` repository must first be cloned from the organization. This repository contains the Docker Compose file for running the entire system. Additionally, the other repositories must be cloned for the `frontend`, `data_generator`, `stress_predictor`, and `api` components. After cloning, ensure that all these repositories are placed within the same folder.

## License
This project is licensed under the MIT License.