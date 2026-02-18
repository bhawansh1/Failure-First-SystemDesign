import express from 'express';
import cors from 'cors';
import orderRoutes from './routes/order.routes';
import metricsRoutes from './routes/metrics.routes';
import productRoutes from './routes/product.routes';
import queueRoutes from './routes/queue.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/orders', orderRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/products', productRoutes);
app.use('/api/queue', queueRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
