# Giải Thích Chi Tiết: Cấu Trúc Dự Án Backend

## Mục lục
1. [Tổng quan kiến trúc dự án](#1-tổng-quan-kiến-trúc-dự-án)
2. [Files cấu hình (Config Files)](#2-files-cấu-hình-config-files)
3. [Thư mục src/ - Source Code](#3-thư-mục-src---source-code)
4. [Mô hình MVC và luồng xử lý](#4-mô-hình-mvc-và-luồng-xử-lý)
5. [Dependency và Scripts](#5-dependency-và-scripts)
6. [Best Practices](#6-best-practices)

---

## 1. Tổng quan kiến trúc dự án

### Cấu trúc thư mục

```
backend/
│
├── 📁 src/                           # Source code chính
│   ├── 📄 index.ts                   # Entry point - Khởi động server
│   ├── 📄 type.d.ts                  # Type definitions - Mở rộng types
│   │
│   ├── 📁 constants/                 # Hằng số - Không thay đổi
│   │   ├── enums.ts                  # Enum types
│   │   ├── httpStatus.ts             # HTTP status codes
│   │   └── messages.ts               # Error/Success messages
│   │
│   ├── 📁 models/                    # Data models - Cấu trúc dữ liệu
│   │   ├── Errors.ts                 # Error classes
│   │   ├── 📁 requests/              # Request DTOs
│   │   │   └── User.requests.ts
│   │   └── 📁 schemas/               # Database schemas
│   │       ├── RefreshToken.schema.ts
│   │       ├── TaiKhoan.schema.ts
│   │       └── ThanhVien.schema.ts
│   │
│   ├── 📁 utils/                     # Utilities - Hàm tiện ích
│   │   ├── crypto.ts                 # Password hashing
│   │   ├── handlers.ts               # Error wrapper
│   │   ├── jwt.ts                    # JWT sign/verify
│   │   └── validation.ts             # Validation wrapper
│   │
│   ├── 📁 middlewares/               # Middleware - Xử lý trước Controller
│   │   ├── error.middlewares.ts      # Global error handler
│   │   └── users.middlewares.ts      # User validators
│   │
│   ├── 📁 services/                  # Business logic - Xử lý dữ liệu
│   │   ├── database.services.ts      # Database connection
│   │   ├── thanhvien.services.ts     # ThanhVien CRUD
│   │   └── users.services.ts         # User authentication
│   │
│   ├── 📁 controllers/               # Controllers - Xử lý HTTP requests
│   │   ├── thanhvien.controllers.ts
│   │   └── users.controllers.ts
│   │
│   └── 📁 routes/                    # Routes - Định nghĩa API endpoints
│       ├── thanhvien.routes.ts
│       └── users.routes.ts
│
├── 📁 dist/                          # Compiled JavaScript (build output)
├── 📁 node_modules/                  # Dependencies
│
├── 📄 .editorconfig                  # Editor settings
├── 📄 .env                           # Environment variables (secrets)
├── 📄 .eslintrc                      # ESLint config (code quality)
├── 📄 .eslintignore                  # ESLint ignore files
├── 📄 .prettierrc                    # Prettier config (code formatting)
├── 📄 .prettierignore                # Prettier ignore files
├── 📄 .gitignore                     # Git ignore files
├── 📄 docker-compose.yml             # Docker setup (MySQL)
├── 📄 init.sql                       # Database initialization
├── 📄 nodemon.json                   # Nodemon config (auto-restart)
├── 📄 package.json                   # Project metadata & dependencies
└── 📄 tsconfig.json                  # TypeScript config
```

---

## 2. Files cấu hình (Config Files)

### 📄 `package.json` - Trái tim của dự án Node.js

**Vai trò:** Quản lý thông tin dự án, dependencies, và scripts

```json
{
  "name": "backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "npx nodemon",           // Chạy development mode
    "build": "rimraf ./dist && tsc && tsc-alias",  // Build production
    "start": "node dist/index.js",  // Chạy production
    "lint": "eslint .",             // Kiểm tra code quality
    "lint:fix": "eslint . --fix",   // Tự động fix lỗi
    "prettier": "prettier --check .",        // Kiểm tra formatting
    "prettier:fix": "prettier --write ."     // Tự động format code
  }
}
```

**Giải thích scripts:**

| Script | Mục đích | Khi nào dùng |
|--------|----------|--------------|
| `npm run dev` | Chạy dev mode với auto-reload | Development |
| `npm run build` | Compile TypeScript → JavaScript | Trước khi deploy |
| `npm start` | Chạy file JS đã build | Production server |
| `npm run lint` | Check lỗi code style | Trước khi commit |
| `npm run lint:fix` | Tự động fix lỗi | Cleanup code |
| `npm run prettier` | Kiểm tra format | CI/CD pipeline |
| `npm run prettier:fix` | Tự động format | Trước khi commit |

**Dependencies quan trọng:**

```javascript
// Runtime dependencies (cần khi chạy app)
{
  "express": "^5.1.0",           // Web framework
  "mysql2": "^3.15.3",           // MySQL driver
  "jsonwebtoken": "^9.0.2",      // JWT authentication
  "express-validator": "^7.3.1", // Request validation
  "dotenv": "^17.2.3",           // Environment variables
  "lodash": "^4.17.21"           // Utility functions
}

// DevDependencies (chỉ cần khi develop)
{
  "typescript": "^5.9.3",        // TypeScript compiler
  "ts-node": "^10.9.2",          // Run TS trực tiếp
  "nodemon": "^3.1.11",          // Auto-restart server
  "eslint": "^9.39.1",           // Code quality
  "prettier": "^3.6.2",          // Code formatting
  "@types/express": "^5.0.5"     // TypeScript types cho Express
}
```

---

### 📄 `tsconfig.json` - Cấu hình TypeScript

**Vai trò:** Chỉ dẫn cách TypeScript compiler hoạt động

```jsonc
{
  "compilerOptions": {
    "module": "CommonJS",          // Sử dụng CommonJS (require/module.exports)
    "target": "ES2020",            // Compile xuống ES2020 syntax
    "outDir": "dist",              // Output folder cho JS files
    "baseUrl": ".",                // Base path cho imports
    "paths": {
      "~/*": ["src/*"]             // Alias: ~/ = src/
    },
    "strict": true,                // Enable tất cả strict checks
    "esModuleInterop": true,       // Tương thích với ES modules
    "skipLibCheck": true,          // Bỏ qua check node_modules
    "experimentalDecorators": true, // Cho TypeORM decorators
    "emitDecoratorMetadata": true   // Cho TypeORM decorators
  },
  "include": ["src/**/*"],         // Compile tất cả files trong src
  "files": ["src/type.d.ts"]       // Luôn include type definitions
}
```

**Tại sao cần `"~/*": ["src/*"]`?**

```typescript
// Không có alias - Khó đọc, dễ lỗi
import usersService from '../../../services/users.services';

// Có alias - Sạch sẽ, rõ ràng
import usersService from '~/services/users.services';
```

**Tại sao cần `strict: true`?**

```typescript
// strict: false - Dễ lỗi
let user;
user.name;  // Runtime error!

// strict: true - Bắt lỗi sớm
let user: User | undefined;
user.name;  // ❌ Compile error: Object is possibly 'undefined'
```

---

### 📄 `.env` - Biến môi trường (Secrets)

**Vai trò:** Lưu trữ thông tin nhạy cảm, cấu hình theo môi trường

```dotenv
# Database credentials
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=123456
DB_NAME=app

# Server config
PORT=3000

# JWT secrets (PHẢI MÃ HÓA MẠNH)
JWT_SECRET_ACCESS_TOKEN=cnpm-access-token-secret-2025-very-strong
JWT_SECRET_REFRESH_TOKEN=cnpm-refresh-token-secret-2025-very-strong

# Password hashing secret
PASSWORD_SECRET=cnpm-password-hash-secret-2025

# Token expiration
ACCESS_TOKEN_EXPIRE=15m
REFRESH_TOKEN_EXPIRE=7d
```

**⚠️ BẢO MẬT QUAN TRỌNG:**

```bash
# ❌ KHÔNG BAO GIỜ commit .env lên Git
# ✅ Thêm vào .gitignore
echo ".env" >> .gitignore

# ✅ Tạo .env.example cho team
cp .env .env.example
# Sau đó xóa giá trị nhạy cảm trong .env.example
```

**Cách sử dụng trong code:**

```typescript
import dotenv from 'dotenv';
dotenv.config();  // Load .env vào process.env

const PORT = process.env.PORT || 3000;
const DB_HOST = process.env.DB_HOST;
```

---

### 📄 `.editorconfig` - Chuẩn hóa Editor

**Vai trò:** Đảm bảo tất cả developers dùng cùng 1 style

```editorconfig
indent_size = 2       # Indent 2 spaces
indent_style = space  # Dùng space (không dùng tab)
```

**Tại sao cần?**

```javascript
// Developer A (tab = 4 spaces)
function hello() {
    console.log('hi');
}

// Developer B (tab = 2 spaces)
function hello() {
  console.log('hi');
}

// → Git conflict! → EditorConfig fix
```

---

### 📄 `.eslintrc` - Kiểm tra chất lượng code

**Vai trò:** Phát hiện lỗi tiềm ẩn, enforce coding standards

```jsonc
{
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint", "prettier"],
  "extends": [
    "eslint:recommended",                    // Rules cơ bản
    "plugin:@typescript-eslint/recommended", // Rules cho TS
    "prettier"                               // Tắt conflicts với Prettier
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "off",   // Cho phép dùng 'any'
    "@typescript-eslint/no-unused-vars": "off",    // Không cảnh báo unused vars
    "prettier/prettier": ["warn", { ... }]         // Prettier rules
  }
}
```

**Ví dụ ESLint bắt lỗi:**

```typescript
// ❌ ESLint error: 'x' is assigned but never used
const x = 10;

// ❌ ESLint error: Expected '===' but found '=='
if (user.role == 'admin') { }

// ✅ Fix
if (user.role === 'admin') { }
```

**Chạy ESLint:**

```bash
npm run lint          # Chỉ check lỗi
npm run lint:fix      # Tự động fix
```

---

### 📄 `.prettierrc` - Format code tự động

**Vai trò:** Đảm bảo code nhất quán về mặt format

```json
{
  "arrowParens": "always",     // (x) => x
  "semi": false,               // Không dùng dấu ;
  "trailingComma": "none",     // Không có dấu , cuối
  "tabWidth": 2,               // Tab = 2 spaces
  "singleQuote": true,         // Dùng 'string' thay vì "string"
  "printWidth": 120,           // Max 120 ký tự/dòng
  "jsxSingleQuote": true       // JSX dùng 'props'
}
```

**Trước và sau Prettier:**

```typescript
// Trước
const user={name:"John",age:30,email:"john@example.com"}

// Sau
const user = {
  name: 'John',
  age: 30,
  email: 'john@example.com'
}
```

**Chạy Prettier:**

```bash
npm run prettier        # Chỉ check
npm run prettier:fix    # Tự động format
```

---

### 📄 `.gitignore` - Loại trừ files khỏi Git

**Vai trò:** Không commit các files không cần thiết

```ignore
node_modules/      # Dependencies (quá lớn, install lại được)
dist/              # Build output (tạo lại được)
.env               # Secrets (không được public)
*.log              # Log files
.DS_Store          # MacOS metadata
```

**Tại sao không commit `node_modules/`?**

```
node_modules/ thường > 100MB
→ Làm chậm Git
→ Mỗi người chạy `npm install` là có lại
```

---

### 📄 `nodemon.json` - Auto-restart server

**Vai trò:** Tự động restart server khi code thay đổi

```json
{
  "watch": ["src"],                    // Theo dõi thư mục src
  "ext": ".ts,.js",                    // Theo dõi file .ts và .js
  "ignore": [],                        // Không ignore gì
  "exec": "npx ts-node ./src/index.ts" // Chạy lệnh này
}
```

**Cách hoạt động:**

```
1. Chạy npm run dev
2. Nodemon start → Chạy ts-node src/index.ts
3. Bạn sửa file src/controllers/users.controllers.ts
4. Nodemon detect thay đổi → Restart server
5. Server reload với code mới
```

**Không có Nodemon:**

```bash
# Phải tắt và chạy lại thủ công mỗi lần sửa code
npm run dev
# Sửa code...
Ctrl+C
npm run dev
# Lặp lại...
```

---

### 📄 `docker-compose.yml` - Docker container setup

**Vai trò:** Chạy MySQL trong Docker container

```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0                  # MySQL image version
    container_name: cnpm_mysql        # Container name
    restart: unless-stopped           # Auto-restart
    environment:
      MYSQL_ROOT_PASSWORD: 123456     # Root password
      MYSQL_DATABASE: app             # Database name
    ports:
      - '3306:3306'                   # Port mapping
    volumes:
      - mysql_data:/var/lib/mysql     # Persistent data

volumes:
  mysql_data:                         # Named volume
```

**Các lệnh Docker Compose:**

```bash
# Start MySQL container
docker-compose up -d

# Stop container
docker-compose down

# Xem logs
docker-compose logs -f mysql

# Restart container
docker-compose restart mysql
```

**Tại sao dùng Docker?**

```
✅ Không cần install MySQL trên máy
✅ Đồng bộ môi trường giữa team members
✅ Dễ dàng cleanup (docker-compose down -v)
✅ Tách biệt môi trường dev/prod
```

---

### 📄 `init.sql` - Khởi tạo database

**Vai trò:** Script tạo bảng và dữ liệu mẫu

```sql
-- Tạo bảng THANHVIEN
CREATE TABLE THANHVIEN ( ... );

-- Tạo bảng TAIKHOAN
CREATE TABLE TAIKHOAN ( ... );

-- Tạo bảng REFRESH_TOKENS
CREATE TABLE REFRESH_TOKENS ( ... );

-- Insert dữ liệu mẫu
INSERT INTO LOAITAIKHOAN VALUES ('LTK01', 'Admin');
```

**Cách sử dụng:**

```bash
# Import vào MySQL container
docker exec -i cnpm_mysql mysql -uroot -p123456 app < init.sql

# Hoặc kết nối và run trực tiếp
docker exec -it cnpm_mysql mysql -uroot -p123456
mysql> USE app;
mysql> SOURCE /path/to/init.sql;
```

---

## 3. Thư mục src/ - Source Code

### 📄 `src/index.ts` - Entry Point

**Vai trò:** Khởi động server, setup middleware, routes

```typescript
import express from 'express';
import databaseService from '~/services/database.services';
import usersRouter from '~/routes/users.routes';
import thanhvienRouter from '~/routes/thanhvien.routes';
import { defaultErrorHandler } from '~/middlewares/error.middlewares';

const app = express();
const PORT = process.env.PORT || 3000;

// ═══════════════════════════════════════════════════════
// 1. MIDDLEWARE SETUP
// ═══════════════════════════════════════════════════════
app.use(express.json());  // Parse JSON body

// ═══════════════════════════════════════════════════════
// 2. ROUTES REGISTRATION
// ═══════════════════════════════════════════════════════
app.use('/users', usersRouter);
app.use('/thanhvien', thanhvienRouter);

// ═══════════════════════════════════════════════════════
// 3. ERROR HANDLER (Phải đặt cuối cùng)
// ═══════════════════════════════════════════════════════
app.use(defaultErrorHandler);

// ═══════════════════════════════════════════════════════
// 4. START SERVER
// ═══════════════════════════════════════════════════════
databaseService.connect().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  });
});
```

**Thứ tự quan trọng:**

```
1. express.json()       → Parse body
2. Routes               → Handle requests
3. defaultErrorHandler  → Catch all errors
4. Start server         → Listen on port
```

**⚠️ Lỗi thường gặp:**

```typescript
// ❌ SAI: Error handler trước routes
app.use(defaultErrorHandler);
app.use('/users', usersRouter);  // Không bao giờ chạy!

// ✅ ĐÚNG: Error handler sau routes
app.use('/users', usersRouter);
app.use(defaultErrorHandler);
```

---

### 📄 `src/type.d.ts` - Type Definitions

**Vai trò:** Mở rộng types có sẵn (TypeScript Declaration File)

```typescript
import { Request } from 'express';
import { TokenPayload } from './models/requests/User.requests';

// Mở rộng Express Request interface
declare module 'express' {
  interface Request {
    decoded_authorization?: TokenPayload;
    decoded_refresh_token?: TokenPayload;
  }
}
```

**Tại sao cần?**

```typescript
// Không có type definition
req.decoded_authorization  // ❌ Error: Property does not exist

// Có type definition
req.decoded_authorization  // ✅ OK: TokenPayload | undefined
```

**Cách hoạt động:**

```
1. Middleware verify token → Gán decoded vào req
2. Controller truy cập req.decoded_authorization
3. TypeScript biết type → Autocomplete + Type checking
```

---

### 📁 `src/constants/` - Hằng số

#### `enums.ts` - Enum types

**Vai trò:** Định nghĩa các giá trị cố định

```typescript
export enum TokenType {
  AccessToken,           // 0
  RefreshToken,          // 1
  ForgotPasswordToken,   // 2
  EmailVerifyToken       // 3
}

export enum UserRole {
  Admin = 'LTK01',
  User = 'LTK02'
}
```

**Tại sao dùng Enum?**

```typescript
// ❌ KHÔNG dùng enum - Dễ lỗi typo
if (token_type === 0) { }   // 0 nghĩa là gì?
if (role === 'LTK01') { }   // Typo: 'LTK1' → Bug!

// ✅ Dùng enum - Rõ ràng, autocomplete
if (token_type === TokenType.AccessToken) { }
if (role === UserRole.Admin) { }
```

---

#### `httpStatus.ts` - HTTP Status Codes

**Vai trò:** Định nghĩa các HTTP status codes

```typescript
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500
} as const;

export default HTTP_STATUS;
```

**Sử dụng:**

```typescript
// ❌ Magic numbers
res.status(201).json({ ... });

// ✅ Rõ ràng
res.status(HTTP_STATUS.CREATED).json({ ... });
```

---

#### `messages.ts` - Messages

**Vai trò:** Tập trung tất cả messages (i18n-friendly)

```typescript
export const USERS_MESSAGES = {
  // Register
  NAME_IS_REQUIRED: 'Tên không được để trống',
  EMAIL_ALREADY_EXISTS: 'Email đã tồn tại',
  
  // Login
  LOGIN_SUCCESS: 'Đăng nhập thành công',
  EMAIL_OR_PASSWORD_INCORRECT: 'Email hoặc mật khẩu không đúng',
  
  // Logout
  LOGOUT_SUCCESS: 'Đăng xuất thành công'
} as const;
```

**Tại sao tập trung messages?**

```
✅ Dễ dàng đa ngôn ngữ (i18n)
✅ Thay đổi 1 chỗ → Áp dụng toàn bộ
✅ Không duplicate strings
✅ Typo-safe với TypeScript
```

---

### 📁 `src/models/` - Data Models

#### `Errors.ts` - Custom Error Classes

**Vai trò:** Định nghĩa các error classes tùy chỉnh

```typescript
// Error với status code
export class ErrorWithStatus {
  message: string;
  status: number;

  constructor({ message, status }: { message: string; status: number }) {
    this.message = message;
    this.status = status;
  }
}

// Error với validation details
export class EntityError extends ErrorWithStatus {
  errors: ErrorsType;

  constructor({ message, errors }: { message?: string; errors: ErrorsType }) {
    super({ message, status: HTTP_STATUS.UNPROCESSABLE_ENTITY });
    this.errors = errors;
  }
}
```

**Cách sử dụng:**

```typescript
// Throw lỗi đơn giản
throw new ErrorWithStatus({
  message: 'Email không tồn tại',
  status: HTTP_STATUS.NOT_FOUND
});

// Throw lỗi validation
throw new EntityError({
  errors: {
    email: { msg: 'Email không hợp lệ' },
    password: { msg: 'Mật khẩu quá yếu' }
  }
});
```

---

#### `schemas/` - Database Schemas

**Vai trò:** Định nghĩa cấu trúc dữ liệu lưu vào database

**`TaiKhoan.schema.ts`:**

```typescript
interface TaiKhoanType {
  TenDangNhap?: string;
  MaTV?: string;
  MatKhau: string;
  MaLoaiTK?: string;
  TGTaoMoi?: Date;
}

export default class TaiKhoan {
  TenDangNhap?: string;
  MaTV?: string;
  MatKhau: string;
  MaLoaiTK: string;
  TGTaoMoi: Date;

  constructor(taikhoan: TaiKhoanType) {
    this.TenDangNhap = taikhoan.TenDangNhap;
    this.MaTV = taikhoan.MaTV;
    this.MatKhau = taikhoan.MatKhau;
    this.MaLoaiTK = taikhoan.MaLoaiTK || 'LTK02';  // Default
    this.TGTaoMoi = taikhoan.TGTaoMoi || new Date();
  }
}
```

**Lợi ích:**

```
✅ Type safety
✅ Default values
✅ Data validation
✅ Tách biệt logic khỏi database
```

---

#### `requests/` - Request DTOs

**Vai trò:** Định nghĩa cấu trúc dữ liệu nhận từ client

**`User.requests.ts`:**

```typescript
// Register request body
export interface RegisterReqBody {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
}

// Login request body
export interface LoginReqBody {
  email: string;
  password: string;
}

// Logout request body
export interface LogoutReqBody {
  refresh_token: string;
}

// Token payload (sau khi decode JWT)
export interface TokenPayload extends JwtPayload {
  user_id: string;
  token_type: TokenType;
  iat: number;
  exp: number;
}
```

**Type-safe controllers:**

```typescript
// Controller biết chính xác structure của req.body
export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterReqBody>,
  res: Response
) => {
  const { name, email, password } = req.body;  // ✅ Autocomplete
  // ...
};
```

---

### 📁 `src/utils/` - Utilities

#### `crypto.ts` - Password Hashing

**Vai trò:** Hash password bằng SHA-256

```typescript
import { createHash } from 'crypto';

export function sha256(content: string): string {
  return createHash('sha256')
    .update(content + process.env.PASSWORD_SECRET)
    .digest('hex');
}

export function hashPassword(password: string): string {
  return sha256(password);
}
```

**Cách hoạt động:**

```
Input:  'Password123!'
        ↓
SHA-256 + SECRET
        ↓
Output: 'a1b2c3d4e5f6...' (64 ký tự hex)
```

---

#### `jwt.ts` - JWT Operations

**Vai trò:** Tạo và verify JWT tokens

```typescript
// Tạo token
export function signToken(
  payload: { user_id: string; token_type: number },
  privateKey: string,
  options?: SignOptions
): Promise<string>

// Verify token
export function verifyToken(
  token: string,
  secretKey: string
): Promise<TokenPayload>
```

**Sử dụng:**

```typescript
// Sign
const token = await signToken(
  { user_id: 'user@example.com', token_type: TokenType.AccessToken },
  process.env.JWT_SECRET_ACCESS_TOKEN,
  { expiresIn: '15m' }
);

// Verify
const decoded = await verifyToken(token, process.env.JWT_SECRET_ACCESS_TOKEN);
```

---

#### `validation.ts` - Validation Wrapper

**Vai trò:** Wrapper cho express-validator

```typescript
export const validate = (validation: ValidationChain) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await validation.run(req);
    
    const errors = validationResult(req);
    
    if (errors.isEmpty()) {
      return next();  // ✅ Không có lỗi
    }
    
    // ❌ Có lỗi → Throw EntityError
    const entityError = new EntityError({ errors: {} });
    // ... xử lý errors
    next(entityError);
  };
};
```

**Lợi ích:**

```
✅ Tự động catch validation errors
✅ Format errors thành EntityError
✅ Reusable cho mọi validator
```

---

#### `handlers.ts` - Error Wrapper

**Vai trò:** Wrapper cho async request handlers

```typescript
export const wrapAsync = <P>(func: RequestHandler<P>) => {
  return async (req: Request<P>, res: Response, next: NextFunction) => {
    try {
      await func(req, res, next);
    } catch (error) {
      next(error);  // Chuyển lỗi sang error handler
    }
  };
};
```

**Tại sao cần?**

```typescript
// ❌ Không có wrapper - Phải try/catch mọi nơi
export const registerController = async (req, res) => {
  try {
    const result = await usersService.register(req.body);
    res.json(result);
  } catch (error) {
    // Phải xử lý error ở đây
  }
};

// ✅ Có wrapper - Gọn gàng
export const registerController = async (req, res) => {
  const result = await usersService.register(req.body);
  res.json(result);
  // Error tự động catch và chuyển sang error handler
};

// Usage
router.post('/register', wrapAsync(registerController));
```

---

### 📁 `src/middlewares/` - Middlewares

#### `error.middlewares.ts` - Global Error Handler

**Vai trò:** Xử lý tất cả lỗi của ứng dụng

```typescript
export const defaultErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // ErrorWithStatus → Trả về status và message
  if (err instanceof ErrorWithStatus) {
    return res.status(err.status).json(omit(err, ['status']));
  }

  // Lỗi khác → 500 Internal Server Error
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    message: err.message,
    errorInfo: omit(err, ['stack'])
  });
};
```

**Luồng xử lý error:**

```
Controller/Middleware throw error
        ↓
wrapAsync catch
        ↓
next(error)
        ↓
defaultErrorHandler
        ↓
Response to client
```

---

#### `users.middlewares.ts` - User Validators

**Vai trò:** Validate requests cho user routes

**Các validators:**

| Validator | Mục đích | Validate gì? |
|-----------|----------|--------------|
| `registerValidator` | Đăng ký | name, email, password, confirm_password |
| `loginValidator` | Đăng nhập | email, password |
| `accessTokenValidator` | Verify access token | Authorization header |
| `refreshTokenValidator` | Verify refresh token | refresh_token trong body |

**Ví dụ `accessTokenValidator`:**

```typescript
export const accessTokenValidator = validate(
  checkSchema({
    Authorization: {
      custom: {
        options: async (value: string, { req }) => {
          // 1. Lấy token từ "Bearer <token>"
          const access_token = value.split(' ')[1];
          
          // 2. Verify token
          const decoded = await verifyToken(
            access_token,
            process.env.JWT_SECRET_ACCESS_TOKEN
          );
          
          // 3. Gán vào req để controller dùng
          req.decoded_authorization = decoded;
          
          return true;
        }
      }
    }
  }, ['headers'])
);
```

---

### 📁 `src/services/` - Business Logic

**Vai trò:** Xử lý logic nghiệp vụ, tương tác database

#### `database.services.ts` - Database Connection

**Vai trò:** Quản lý kết nối MySQL

```typescript
class DatabaseService {
  private connection: Connection | null = null;

  async connect() {
    this.connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    console.log('✅ Kết nối database thành công');
  }

  async query<T>(sql: string, params?: any[]): Promise<T> {
    const [rows] = await this.connection!.execute(sql, params);
    return rows as T;
  }
}

const databaseService = new DatabaseService();
export default databaseService;
```

**Singleton pattern:** Chỉ có 1 instance duy nhất

---

#### `users.services.ts` - User Business Logic

**Vai trò:** Xử lý authentication logic

**Các methods:**

| Method | Mục đích |
|--------|----------|
| `signAccessToken()` | Tạo access token |
| `signRefreshToken()` | Tạo refresh token |
| `signAccessAndRefreshToken()` | Tạo cả 2 tokens |
| `checkEmailExist()` | Kiểm tra email tồn tại |
| `register()` | Đăng ký tài khoản |
| `login()` | Đăng nhập |
| `logout()` | Đăng xuất |
| `checkRefreshTokenExist()` | Kiểm tra refresh token trong DB |

**Tại sao tách Service riêng?**

```
Controller: Xử lý HTTP (req/res)
Service:    Xử lý business logic
Database:   Lưu trữ dữ liệu

→ Separation of Concerns
→ Dễ test, dễ maintain
```

---

### 📁 `src/controllers/` - Controllers

**Vai trò:** Xử lý HTTP requests/responses

#### `users.controllers.ts`

```typescript
// Controller chỉ làm 3 việc:
// 1. Lấy data từ request
// 2. Gọi service xử lý
// 3. Trả về response

export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterReqBody>,
  res: Response
) => {
  // 1. Lấy data
  const body = req.body;
  
  // 2. Gọi service
  const result = await usersService.register(body);
  
  // 3. Trả response
  return res.status(HTTP_STATUS.CREATED).json({
    message: USERS_MESSAGES.REGISTER_SUCCESS,
    result
  });
};
```

**⚠️ Controller KHÔNG nên:**

```typescript
// ❌ Không xử lý business logic
// ❌ Không tương tác database trực tiếp
// ❌ Không hash password
// ❌ Không tạo token

// ✅ Chỉ gọi service và trả response
```

---

### 📁 `src/routes/` - Routes

**Vai trò:** Định nghĩa API endpoints

#### `users.routes.ts`

```typescript
const usersRouter = Router();

/**
 * POST /users/register
 * Body: { name, email, password, confirm_password }
 */
usersRouter.post(
  '/register',
  registerValidator,        // Middleware 1: Validate
  wrapAsync(registerController)  // Middleware 2: Handle
);

/**
 * POST /users/login
 * Body: { email, password }
 */
usersRouter.post(
  '/login',
  loginValidator,
  wrapAsync(loginController)
);

/**
 * POST /users/logout
 * Headers: { Authorization: Bearer <access_token> }
 * Body: { refresh_token }
 */
usersRouter.post(
  '/logout',
  accessTokenValidator,     // Middleware 1: Verify access token
  refreshTokenValidator,    // Middleware 2: Verify refresh token
  wrapAsync(logoutController)  // Middleware 3: Handle
);

export default usersRouter;
```

**Route anatomy:**

```
Method  Path         Middlewares             Controller
  ↓      ↓                ↓                      ↓
POST  /register  [registerValidator]  →  registerController
```

---

## 4. Mô hình MVC và luồng xử lý

### Kiến trúc MVC (Model-View-Controller)

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                              │
│                    (Postman, Browser)                       │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP Request
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                      ROUTES LAYER                           │
│              (routes/users.routes.ts)                       │
│        Định nghĩa endpoint và middleware chain              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                   MIDDLEWARE LAYER                          │
│            (middlewares/users.middlewares.ts)               │
│        Validate request, verify token, authorize            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                   CONTROLLER LAYER                          │
│            (controllers/users.controllers.ts)               │
│         Nhận request → Gọi service → Trả response           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                            │
│              (services/users.services.ts)                   │
│        Business logic, hash password, create tokens         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER                            │
│             (services/database.services.ts)                 │
│            Execute SQL queries, return results              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                        MYSQL                                │
│                   (Docker Container)                        │
└─────────────────────────────────────────────────────────────┘
```

---

### Luồng xử lý request chi tiết

**Ví dụ: POST /users/register**

```
┌──────────────────────────────────────────────────────────────┐
│ 1. CLIENT gửi request                                        │
│    POST http://localhost:3000/users/register                 │
│    Body: { name, email, password, confirm_password }         │
└────────────────────────┬─────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ 2. EXPRESS nhận request                                      │
│    → express.json() parse body                               │
│    → Route matching: /users/register                         │
└────────────────────────┬─────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ 3. ROUTES                                                    │
│    users.routes.ts:                                          │
│    router.post('/register', registerValidator, controller)   │
└────────────────────────┬─────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ 4. MIDDLEWARE: registerValidator                             │
│    ✓ Check name (1-100 chars)                               │
│    ✓ Check email (valid format, not exists)                 │
│    ✓ Check password (strong)                                │
│    ✓ Check confirm_password (match)                         │
│                                                              │
│    ❌ Nếu lỗi → throw EntityError → Error Handler            │
│    ✅ Nếu OK → next() → Controller                           │
└────────────────────────┬─────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ 5. CONTROLLER: registerController                            │
│    const result = await usersService.register(req.body);     │
└────────────────────────┬─────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ 6. SERVICE: users.services.register()                        │
│    A. INSERT THANHVIEN → Get MaTV                            │
│    B. Hash password                                          │
│    C. INSERT TAIKHOAN                                        │
│    D. Create access_token + refresh_token                    │
│    E. INSERT REFRESH_TOKENS                                  │
│    F. Return { access_token, refresh_token }                 │
└────────────────────────┬─────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ 7. DATABASE: database.services.query()                       │
│    Execute SQL queries → Return results                      │
└────────────────────────┬─────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ 8. MYSQL                                                     │
│    INSERT INTO THANHVIEN ...                                 │
│    INSERT INTO TAIKHOAN ...                                  │
│    INSERT INTO REFRESH_TOKENS ...                            │
└────────────────────────┬─────────────────────────────────────┘
                         ↓ (Return results)
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ 9. CONTROLLER nhận result từ service                         │
│    res.status(201).json({                                    │
│      message: 'Đăng ký thành công',                          │
│      result: { access_token, refresh_token }                 │
│    })                                                        │
└────────────────────────┬─────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ 10. CLIENT nhận response                                     │
│     Status: 201 Created                                      │
│     Body: { message, result }                                │
└──────────────────────────────────────────────────────────────┘
```

---

### Responsibility của từng layer

| Layer | Responsibility | Ví dụ |
|-------|----------------|-------|
| **Routes** | Định nghĩa endpoint, middleware chain | `router.post('/register', validator, controller)` |
| **Middleware** | Validate, authenticate, authorize | Check email format, verify token |
| **Controller** | Handle HTTP, gọi service, trả response | `res.json({ ... })` |
| **Service** | Business logic, tương tác database | Hash password, create tokens, INSERT DB |
| **Database** | Execute SQL queries | `connection.execute(sql, params)` |
| **Model** | Define data structure | `class TaiKhoan { ... }` |
| **Utils** | Helper functions | `hashPassword()`, `signToken()` |

---

## 5. Dependency và Scripts

### Dependencies (Runtime)

**Sản xuất:** Cần khi chạy app

```json
{
  "express": "Web framework",
  "mysql2": "MySQL driver",
  "jsonwebtoken": "JWT authentication",
  "express-validator": "Request validation",
  "dotenv": "Environment variables",
  "lodash": "Utility functions",
  "typeorm": "ORM (không dùng trong project này)",
  "reflect-metadata": "Decorators support"
}
```

### DevDependencies (Development)

**Chỉ dev:** Không cần khi deploy

```json
{
  "typescript": "TypeScript compiler",
  "ts-node": "Run TypeScript trực tiếp",
  "nodemon": "Auto-restart server",
  "eslint": "Code quality checker",
  "prettier": "Code formatter",
  "@types/*": "TypeScript type definitions",
  "rimraf": "Cross-platform rm -rf",
  "tsc-alias": "Resolve path aliases"
}
```

---

### Scripts chi tiết

#### `npm run dev`

```bash
# Chạy nodemon
npx nodemon

# nodemon.json config:
# → Watch src/
# → Execute: ts-node src/index.ts
# → Auto-restart khi file thay đổi
```

**Khi nào dùng:** Development, code và test

---

#### `npm run build`

```bash
# 1. Xóa thư mục dist cũ
rimraf ./dist

# 2. Compile TypeScript → JavaScript
tsc

# 3. Resolve path aliases (~/)
tsc-alias

# Kết quả: dist/ chứa JavaScript code
```

**Khi nào dùng:** Trước khi deploy lên production

---

#### `npm start`

```bash
# Chạy file JavaScript đã build
node dist/index.js

# Không auto-restart
# Không compile TypeScript
```

**Khi nào dùng:** Production server

---

#### `npm run lint`

```bash
# Chạy ESLint check toàn bộ project
eslint .

# Hiển thị lỗi nhưng không fix
```

**Khi nào dùng:** Trước khi commit, trong CI/CD

---

#### `npm run lint:fix`

```bash
# Chạy ESLint và tự động fix lỗi
eslint . --fix

# Fix được: spacing, quotes, semicolons...
# Không fix được: logic errors
```

**Khi nào dùng:** Cleanup code

---

## 6. Best Practices

### 📂 Tổ chức code

✅ **Tách biệt concerns**

```
Routes     → Định nghĩa API
Middlewares → Validate, authenticate
Controllers → Handle HTTP
Services    → Business logic
Database    → SQL queries
```

✅ **Sử dụng path aliases**

```typescript
// ❌ Khó đọc
import usersService from '../../../services/users.services';

// ✅ Rõ ràng
import usersService from '~/services/users.services';
```

✅ **Consistent naming**

```
files:       users.controllers.ts (lowercase, plural)
classes:     UsersService (PascalCase, singular)
functions:   getUserById (camelCase)
constants:   HTTP_STATUS (UPPER_CASE)
```

---

### 🔐 Bảo mật

✅ **Không commit secrets**

```bash
# .gitignore
.env
*.log
node_modules/
```

✅ **Hash passwords**

```typescript
// ❌ KHÔNG BAO GIỜ lưu plain text
const password = 'Password123!';

// ✅ Luôn hash
const hashedPassword = hashPassword(password);
```

✅ **Validate inputs**

```typescript
// Validate mọi input từ client
registerValidator,
loginValidator,
accessTokenValidator
```

✅ **Use environment variables**

```typescript
// ❌ Hardcode
const secret = 'my-secret-key';

// ✅ Env var
const secret = process.env.JWT_SECRET_ACCESS_TOKEN;
```

---

### ⚡ Performance

✅ **Connection pooling**

```typescript
// MySQL connection pool
const pool = mysql.createPool({
  connectionLimit: 10
});
```

✅ **Async/await**

```typescript
// ✅ Non-blocking
const result = await usersService.register(body);
```

✅ **Parallel operations**

```typescript
// ✅ Chạy song song
const [access_token, refresh_token] = await Promise.all([
  signAccessToken(user_id),
  signRefreshToken(user_id)
]);
```

---

### 🧪 Testing (Recommended)

✅ **Unit tests**

```typescript
// tests/services/users.services.test.ts
describe('UsersService', () => {
  it('should register a new user', async () => {
    const result = await usersService.register({...});
    expect(result).toHaveProperty('access_token');
  });
});
```

✅ **Integration tests**

```typescript
// tests/routes/users.routes.test.ts
describe('POST /users/register', () => {
  it('should return 201 Created', async () => {
    const response = await request(app)
      .post('/users/register')
      .send({...});
    expect(response.status).toBe(201);
  });
});
```

---

### 📝 Documentation

✅ **JSDoc comments**

```typescript
/**
 * Đăng ký tài khoản mới
 * @param payload - Thông tin đăng ký
 * @returns Access token và refresh token
 */
async register(payload: RegisterReqBody) { }
```

✅ **README.md**

```markdown
# Backend API

## Setup
1. `npm install`
2. `docker-compose up -d`
3. `npm run dev`

## API Endpoints
- POST /users/register
- POST /users/login
- POST /users/logout
```

---

## 🎯 Tổng kết

### Cấu trúc dự án

```
Config Files     → .env, tsconfig.json, package.json
    ↓
Entry Point      → src/index.ts
    ↓
Routes           → Định nghĩa API
    ↓
Middlewares      → Validate, authenticate
    ↓
Controllers      → Handle HTTP
    ↓
Services         → Business logic
    ↓
Database         → SQL queries
    ↓
Models           → Data structure
```

### Vai trò từng thành phần

| Component | Vai trò |
|-----------|---------|
| `package.json` | Quản lý dependencies và scripts |
| `tsconfig.json` | Cấu hình TypeScript compiler |
| `.env` | Lưu secrets và configs |
| `.eslintrc` | Kiểm tra code quality |
| `.prettierrc` | Format code |
| `nodemon.json` | Auto-restart server |
| `docker-compose.yml` | Chạy MySQL container |
| `src/index.ts` | Entry point, setup server |
| `src/routes/` | Định nghĩa API endpoints |
| `src/middlewares/` | Validate, authenticate |
| `src/controllers/` | Xử lý HTTP requests |
| `src/services/` | Business logic |
| `src/models/` | Data structures |
| `src/utils/` | Helper functions |
| `src/constants/` | Hằng số, enums, messages |

---

## 📚 Tài liệu tham khảo

- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [REST API Design](https://restfulapi.net/)
- [JWT Introduction](https://jwt.io/introduction)

---

**Chúc bạn code vui vẻ! 🚀**
