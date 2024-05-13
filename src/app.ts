import express, {Request, Response} from 'express';
import router from './routes';
import middleware from './middleware';

const app = middleware;

app.use(express.json());
app.use(router);
app.get("/", (req: Request, res: Response) => { res.status(200).send('Hello, TypeScript with Express!'); });

const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
