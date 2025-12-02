// src/services/database.services.ts
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

class DatabaseService {
  private pool: mysql.Pool;

  constructor() {
    // Tạo connection pool
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10, // Số connection tối đa
      queueLimit: 0
    });
  }

  async connect() {
    try {
      // Test connection
      const connection = await this.pool.getConnection();
      console.log('✅ Đã kết nối thành công với MySQL database!');
      connection.release();
    } catch (error) {
      console.error('❌ Lỗi kết nối MySQL:', error);
      throw error;
    }
  }

  // Thực thi query với parameters (tránh SQL injection)
  async query<T = any>(sql: string, params?: any[]): Promise<T> {
    const [rows] = await this.pool.execute(sql, params);
    return rows as T;
  }

  // Lấy pool để dùng transaction
  getPool() {
    return this.pool;
  }
}

const databaseService = new DatabaseService();
export default databaseService;