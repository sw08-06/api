import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();

app.disable("x-powered-by");
app.use(bodyParser.json({ limit: '50mb' }));
app.use(cors());

export default app;
