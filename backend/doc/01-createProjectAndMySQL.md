# Chuyển dự án từ MongoDB sang MySQL — Hướng dẫn All-in-One

Mục đích: Trong file này hướng dẫn chi tiết cách thay MongoDB (MongoDB Driver) bằng MySQL cho dự án Node + TypeScript hiện tại. Bao gồm: cài MySQL (Docker hoặc local), cài thư viện, cấu hình `.env`, cấu hình TypeORM (DataSource), tạo entity mẫu, service kết nối, và cách sử dụng trong `index.ts`.

Lưu ý: Hướng dẫn này dùng TypeORM (thích hợp cho TypeScript). Nếu bạn muốn dùng Prisma, Sequelize hoặc query builder khác, tôi có thể thêm hướng dẫn tương ứng.

---

**Mục lục**
- Yêu cầu trước
- Cài MySQL (Docker Compose) — tùy chọn khuyên dùng
- Cài MySQL (cài local)
- Cài package cần thiết
- Thiết lập `.env`
- Cấu hình TypeORM (DataSource)
- Tạo `src/models/User.ts` (entity mẫu)
- Tạo `src/services/database.services.ts` (class kết nối)
- Ví dụ `src/services/users.services.ts` (sử dụng repository)
- Sử dụng trong `src/index.ts`
- Chạy và kiểm tra
- Lời khuyên và xử lý lỗi thường gặp

---

**Yêu cầu trước**
- Node.js (12+ hoặc 14+ khuyến nghị)
- npm hoặc yarn
- TypeScript project đã có (workspace hiện tại của bạn đã có `tsconfig.json` và `src/`)

---

**1) Cài MySQL — khuyến nghị dùng Docker Compose (nhanh, dễ reset)**

Tạo file `docker-compose.yml` ở gốc dự án (nếu bạn đã có MySQL local, bỏ qua phần Docker):

```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    container_name: cnpm_mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: piedshoping_be
      MYSQL_USER: pieduser
      MYSQL_PASSWORD: piedpass
    ports:
      - '3306:3306'
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

Chạy:

```powershell
docker-compose up -d
```

MySQL sẽ chạy tại `localhost:3306`. Thông tin mặc định theo file trên:
- DB: `piedshoping_be`
- USER: `pieduser`
- PASS: `piedpass`


**2) Hoặc cài MySQL local**
- Cài MySQL từ trang chính thức hoặc dùng MySQL Workbench.
- Tạo database `piedshoping_be` và user tương tự ở trên.

---

**3) Cài package cần thiết**

Trong thư mục `backend` (hoặc nơi có `package.json`) chạy:

```powershell
cd backend
npm install dotenv typeorm mysql2 reflect-metadata
```

Giải thích:
- `mysql2`: driver MySQL cho Node
- `typeorm`: ORM thân thiện với TypeScript
- `reflect-metadata`: cần thiết cho TypeORM (import 1 lần ở entry)
- `dotenv`: đọc `.env`

Nếu bạn dùng `yarn`:

```powershell
yarn add dotenv typeorm mysql2 reflect-metadata
```

**Dev deps (nếu chưa có):**
- giữ nguyên `ts-node`, `nodemon` nếu bạn dùng `npm run dev`.

---

**4) Thiết lập `.env`**

Tạo file `.env` ở gốc `backend` (không commit vào git):

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=pieduser
DB_PASSWORD=piedpass
DB_NAME=piedshoping_be
```

(Điều chỉnh theo môi trường của bạn — Docker hoặc local)

---

**5) Cấu hình TypeORM (DataSource) — file `src/services/database.services.ts`**

Tạo/Thay thế file `src/services/database.services.ts` bằng code sau (phiên bản TypeORM >= 0.3):

```ts
// src/services/database.services.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // entities: khi chạy ts-node trong dev, load .ts; khi chạy build (dist), load .js
  entities: [path.join(__dirname, '..', 'models', '**', '*.{ts,js}')],
  migrations: [path.join(__dirname, '..', 'migrations', '**', '*.{ts,js}')],
  synchronize: true, // CHỈ DÙNG DEV: tự tạo/đồng bộ bảng
  logging: false,
});

class DatabaseService {
  private dataSource = AppDataSource;

  async connect(): Promise<void> {
    try {
      if (!this.dataSource.isInitialized) {
        await this.dataSource.initialize();
      }
      console.log('Connected to MySQL via TypeORM');
    } catch (error) {
      console.error('TypeORM initialize error', error);
      throw error;
    }
  }

  getDataSource(): DataSource {
    if (!this.dataSource.isInitialized) {
      throw new Error('DataSource not initialized. Call connect() first.');
    }
    return this.dataSource;
  }
}

const databaseService = new DatabaseService();
export default databaseService;
```

Giải thích nhanh:
- `synchronize: true` tự tạo bảng theo entities (tiện dev). Production: dùng migrations và `synchronize: false`.
- `entities` dùng glob để hỗ trợ ts-node (dev) và js (build)

---

**6) Tạo `User` entity mẫu**

Tạo file `src/models/User.ts`:

```ts
// src/models/User.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 150, unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ nullable: true })
  fname?: string;
}
```

Khi `synchronize: true`, TypeORM sẽ tự tạo bảng `users`.

---

**7) Ví dụ service: `src/services/users.services.ts`**

Tạo file `src/services/users.services.ts`:

```ts
// src/services/users.services.ts
import databaseService from './database.services';
import { User } from '~/models/User';

export async function findUserByEmail(email: string) {
  const ds = databaseService.getDataSource();
  return ds.getRepository(User).findOneBy({ email });
}

export async function createUser(payload: Partial<User>) {
  const ds = databaseService.getDataSource();
  const repo = ds.getRepository(User);
  const user = repo.create(payload as User);
  return repo.save(user);
}
```

(Đảm bảo `paths` alias `~/*` trỏ tới `src/*` như trong `tsconfig.json` — nếu không, dùng relative paths `../models/User`)

---

**8) Sử dụng trong `src/index.ts`**

Thay thế phần gọi `databaseService` hiện tại (Mongo) bằng MySQL TypeORM:

```ts
// src/index.ts (chỉ đoạn liên quan)
import express from 'express';
import databaseService from './services/database.services';
import usersRouter from './routes/users.routes';

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(express.json());

// Connect DB then start server
(async () => {
  try {
    await databaseService.connect();

    app.get('/', (req, res) => res.send('hello world'));
    app.use('/user', usersRouter);

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
  }
})();
```

Lưu ý: đặt `reflect-metadata` import 1 lần (đã import trong `database.services.ts`, nếu bạn import ở `index.ts` cũng được). Chỉ cần 1 import `import 'reflect-metadata'` trước khi TypeORM chạy.

---

**9) Cập nhật controller `users.controllers.ts` để dùng users.services**

Ví dụ `loginController` ban đầu (mock) có thể được sửa để check DB:

```ts
// src/controllers/users.controllers.ts
import { Request, Response } from 'express';
import { findUserByEmail } from '~/services/users.services';

export const loginController = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(400).json({ error: 'Invalid email or password' });
  }

  // TODO: compare password hashed
  if (user.password !== password) {
    return res.status(400).json({ error: 'Invalid email or password' });
  }

  return res.json({ data: { id: user.id, email: user.email, fname: user.fname } });
};
```

(Trong thực tế, dùng `bcrypt` để hash & compare password.)

---

**10) Chạy và kiểm tra**

1) Cài dependencies (nếu chưa):

```powershell
cd backend
npm install
```

2) Nếu dùng Docker Compose MySQL:

```powershell
docker-compose up -d
```

3) Chạy dev server (dùng nodemon/ts-node như cấu hình project):

```powershell
npm run dev
```

4) Mở Postman, test `POST http://localhost:3000/user/login` với JSON body:

```json
{ "email": "a@a.com", "password": "123" }
```

Bạn có thể dùng `createUser` trong một route tạm thời hoặc insert trực tiếp vào DB để có user test.

---

**11) Lời khuyên & production checklist**
- Đừng dùng `synchronize: true` trên production. Dùng migrations (TypeORM CLI hoặc thư viện migration) để kiểm soát schema.
- Lưu mật khẩu DB vào `.env`, không commit.
- Hash mật khẩu (bcrypt) trước khi lưu.
- Tắt logging production.
- Nếu deploy cloud (Heroku, Azure), cấu hình biến môi trường tương ứng.

---

**12) Một số lỗi thường gặp & cách xử lý**
- "ECONNREFUSED" -> Kiểm tra MySQL đang chạy, port, firewall, Docker mapping.
- "ER_ACCESS_DENIED_ERROR" -> Kiểm tra user/password và quyền trên database.
- TypeORM không tìm entity khi build -> đảm bảo `entities` glob bao gồm `.js` trong `dist` (sử dụng `**/*.{ts,js}`).
- `DataSource not initialized` -> chắc chắn `await databaseService.connect()` đã chạy trước khi gọi repository.

---

**13) Tùy chỉnh (nếu bạn không muốn TypeORM)**
- Bạn có thể dùng `mysql2` trực tiếp (pool + raw queries) hoặc dùng Prisma/Sequelize/Knex.
- Nếu muốn, tôi có thể cung cấp ví dụ tương ứng (Prisma migration, hoặc mysql2 pool service).

---

Kết luận: Thay thế MongoDB bằng MySQL gồm 3 phần chính:
- Thiết lập MySQL (Docker hoặc local)
- Cài thư viện (`mysql2`, `typeorm`, `reflect-metadata`, `dotenv`)
- Viết service kết nối TypeORM + entity + cập nhật controller/service để gọi repository

Muốn tôi tạo sẵn các file `database.services.ts`, `models/User.ts`, `services/users.services.ts` trong repo luôn không? Nếu có, tôi sẽ tạo các file mẫu và chỉnh `index.ts` giúp bạn chạy thử ngay.
