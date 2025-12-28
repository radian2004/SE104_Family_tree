import express from 'express';
import cors from 'cors';
import databaseService from '~/services/database.services';
import usersRouter from '~/routes/users.routes';
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

// CORS - QUAN TRỌNG: Phải cho phép credentials
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000'); // URL của client
  res.header('Access-Control-Allow-Credentials', 'true');  // ✅ CHO PHÉP GỬI COOKIES
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Routes
app.use('/users', usersRouter);

// Default error handler (đặt sau tất cả routes)
app.use(defaultErrorHandler);

// Kết nối database và start server
databaseService.connect().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  });
});