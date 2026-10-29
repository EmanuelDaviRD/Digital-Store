import cors from 'cors';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { errorHandler, notFound } from './middleware.js';
import categoryRoutes from './routes/categories.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import userRoutes from './routes/users.js';

const app = express();
const uploadDirectory = fileURLToPath(new URL('../uploads/', import.meta.url));

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json({ limit: '8mb' }));
app.use('/uploads', express.static(uploadDirectory, { fallthrough: false, dotfiles: 'deny' }));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/v1', userRoutes, categoryRoutes, productRoutes, orderRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
