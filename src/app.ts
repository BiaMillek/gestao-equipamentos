import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger';
import { errorHandler, notFound } from './middlewares/errorHandler';
import routes from './routes';

const app = express();
app.use(cors());
app.use(express.json());
app.get('/', (_req, res) => res.json({ status: 'ok', api: 'TI Estoque', docs: '/api-docs' }));
app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(routes);
app.use(notFound);
app.use(errorHandler);

export default app;
