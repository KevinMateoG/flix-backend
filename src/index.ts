import express, { type Express, type Request, type Response } from 'express';
import 'dotenv/config'

const app: Express = express();
const PORT = process.env.PORT

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

app.listen(3000)


console.log(`conection http://localhost:${PORT}`)