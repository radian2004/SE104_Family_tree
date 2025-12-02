import express from 'express';
import databaseService from '~/services/database.services';
import usersRouter from '~/routes/users.routes';
import thanhvienRouter from '~/routes/thanhvien.routes';
import { defaultErrorHandler } from '~/middlewares/error.middlewares';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware parse JSON
app.use(express.json());

// Routes
app.use('/users', usersRouter);
app.use('/thanhvien', thanhvienRouter);

// Default error handler (đặt sau tất cả routes)
app.use(defaultErrorHandler);

// Kết nối database và start server
databaseService.connect().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  });
});