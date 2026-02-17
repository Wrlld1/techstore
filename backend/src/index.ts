import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { createServer } from 'http';
import { config } from './config';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { initSocket } from './sockets';
import { verifyEmailConnection } from './services/email';

const app = express();
const httpServer = createServer(app);

initSocket(httpServer);

app.use(cors({
  origin: config.clientUrl,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/api/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api', routes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

httpServer.listen(config.port, () => {
  console.log(`
  🚀 TechStore Server started
  📍 Port: ${config.port}
  🌍 Environment: ${config.nodeEnv}
  🔗 URL: http://localhost:${config.port}
  📚 API: http://localhost:${config.port}/api
  `);

  // Check email connection
  verifyEmailConnection();
});

export default app;
