import cors from 'cors';
import express from 'express';
import { errorHandler, notFound } from './middlewares/errorHandler';
import routes from './routes';

const app = express();
app.use(cors());
app.use(express.json());
app.get('/', (_req, res) => res.json({ status: 'ok', api: 'TI Estoque' }));
app.use(routes);
app.use(notFound);
app.use(errorHandler);

export default app;
