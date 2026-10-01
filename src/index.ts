import express, { type Express, type Request, type Response } from 'express';
import 'dotenv/config';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.ts';
import cors from 'cors';
import moviesRouter from './routes/movies.route.ts';
import tmdbRouter from './routes/tmdb.route.ts';
import profileRouter from './routes/profile.route.ts';
import watchHistoryRouter from './routes/watch-history.route.ts';
import myListRouter from './routes/my-list.route.ts';
import dislikesRouter from './routes/dislikes.route.ts';

const app: Express = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));

app.use('/api/auth', toNodeHandler(auth));

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Flix Backend OK');
});

app.use('/api/movies', moviesRouter);
app.use('/api/tmdb', tmdbRouter);
app.use('/api/profile', profileRouter);
app.use('/api/watch-history', watchHistoryRouter);
app.use('/api/my-list', myListRouter);
app.use('/api/dislikes', dislikesRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
