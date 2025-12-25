import express from 'express';
import cookieParser from 'cookie-parser';
import databaseService from '~/services/database.services';
import usersRouter from '~/routes/users.routes';
import lookupsRouter from '~/routes/lookups.routes';
import { defaultErrorHandler } from '~/middlewares/error.middlewares';


const app = express();
const PORT = process.env.PORT || 3000;

// CORS middleware - TỰ VIẾT để đảm bảo hoạt động đúng
app.use((req, res, next) => {
  // Chỉ cho phép frontend origin
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Xử lý preflight request
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Middleware parse JSON
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/users', usersRouter);

// Lookups routes - không cần auth (public data)
app.use('/', lookupsRouter);

// Default error handler (đặt sau tất cả routes)
app.use(defaultErrorHandler);

// Kết nối database và start server
databaseService.connect().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  });
});