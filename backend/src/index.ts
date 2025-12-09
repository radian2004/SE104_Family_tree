import express from 'express';
import cors from 'cors';
import databaseService from '~/services/database.services';
import usersRouter from '~/routes/users.routes';
import thanhvienRouter from '~/routes/thanhvien.routes';
import lookupsRouter from '~/routes/lookups.routes';
import { defaultErrorHandler } from '~/middlewares/error.middlewares';

const app = express();
const PORT = process.env.PORT || 3000;

// CORS middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware parse JSON
app.use(express.json());

// Routes
app.use('/users', usersRouter);
app.use('/thanhvien', thanhvienRouter);
app.use('/', lookupsRouter);

// Default error handler (đặt sau tất cả routes)
app.use(defaultErrorHandler);

// Kết nối database và start server
databaseService.connect().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  });
});