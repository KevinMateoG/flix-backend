import express, { type Express, type Request, type Response } from 'express';
import 'dotenv/config';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.ts';
import cors from 'cors';
import moviesRouter from './routes/movies.route.ts';

const app: Express = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Flix Backend OK');
});

app.use('/api/auth', toNodeHandler(auth));

app.use('/api/movies', moviesRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
