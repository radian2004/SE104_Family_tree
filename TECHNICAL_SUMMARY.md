# Tài liệu tổng quan kỹ thuật - Hệ thống Quản lý Gia phả

Tài liệu này mô tả tổng quan về kiến trúc kỹ thuật, luồng hoạt động và cấu trúc của dự án.

## 1. Tổng quan kiến trúc

Dự án được xây dựng theo kiến trúc Full-stack hiện đại, bao gồm 3 thành phần chính:

-   **Frontend**: Ứng dụng Single Page Application (SPA) được xây dựng bằng **ReactJS** (sử dụng Vite) để mang lại trải nghiệm người dùng nhanh và mượt mà.
-   **Backend**: API service được xây dựng bằng **Node.js** và **Express.js** trên nền tảng **TypeScript**, đảm bảo code an toàn và dễ bảo trì.
-   **Database**: Hệ quản trị cơ sở dữ liệu **MySQL**, được quản lý và khởi chạy thông qua **Docker**.

## 2. Môi trường và Khởi chạy (Docker & WSL2)

Để đảm bảo tính nhất quán của môi trường development, dự án sử dụng Docker để containerize hóa database.

### 2.1. Yêu cầu

-   **WSL2 (Windows Subsystem for Linux)**: Cần được cài đặt trên Windows để làm nền tảng cho Docker Desktop.
-   **Docker Desktop**: Công cụ để xây dựng và quản lý các container.

### 2.2. Khởi chạy môi trường

1.  **Khởi chạy Database:**
    Mở terminal trong thư mục `backend` và chạy lệnh:
    ```bash
    docker-compose up -d
    ```
    Lệnh này sẽ đọc file `backend/docker-compose.yml` và tự động thực hiện các công việc sau:
    -   Tải về image `mysql:8.0`.
    -   Tạo một container cho MySQL server.
    -   Khởi tạo database có tên là `app` (dựa theo biến môi trường trong file).
    -   Map cổng `3307` của máy host tới cổng `3306` của container.

2.  **Khởi chạy Backend:**
    -   Cài đặt dependencies: `npm install` trong thư mục `backend`.
    -   Chạy development server: `npm run dev`.
    -   Backend sẽ kết nối tới MySQL container qua thông tin trong file `.env`.

3.  **Khởi chạy Frontend:**
    -   Cài đặt dependencies: `npm install` trong thư mục `client`.
    -   Chạy development server: `npm run dev`.
    -   Frontend sẽ giao tiếp với Backend qua địa chỉ API được cấu hình.

## 3. Cấu trúc dự án

### 3.1. Backend (`/backend`)

Backend được cấu trúc theo mô hình Layered Architecture, giúp tách biệt các mối quan tâm (separation of concerns).

-   `src/index.ts`: Điểm khởi đầu của ứng dụng, nơi Express server được khởi tạo và lắng nghe request.
-   `src/routes/`: Định nghĩa các API endpoints (ví dụ: `/users`, `/thanhvien`). Mỗi file route sẽ ánh xạ một URL tới một `controller` tương ứng.
-   `src/controllers/`: Chứa logic xử lý request và response. Controller nhận request, gọi các `service` để thực hiện nghiệp vụ và trả về response cho client.
-   `src/services/`: Chứa business logic cốt lõi của ứng dụng. Đây là nơi thực hiện các tác vụ như tính toán, truy vấn CSDL, v.v.
-   `src/models/`:
    -   `schemas/`: Định nghĩa cấu trúc của các đối tượng dữ liệu (ví dụ: `ThanhVien.schema.ts`, `TaiKhoan.schema.ts`).
-   `src/utils/`: Chứa các hàm tiện ích tái sử dụng (ví dụ: xử lý JWT, mã hóa password).
-   `docker-compose.yml`: Khai báo dịch vụ MySQL cho môi trường development.
-   `init.sql`: **Rất quan trọng**, file này chứa toàn bộ định nghĩa schema của database (`CREATE TABLE`), các `TRIGGER` để tự động sinh ID, cập nhật trạng thái, và dữ liệu mẫu (`INSERT INTO`).

### 3.2. Frontend (`/client`)

Frontend được cấu trúc theo hướng component-based.

-   `src/pages/`: Mỗi file là một trang hoàn chỉnh của ứng dụng (ví dụ: `LoginPage.jsx`, `ThanhVienPage.jsx`).
-   `src/components/`: Chứa các component có thể tái sử dụng (ví dụ: `ThanhVienCard.jsx`, `ThanhVienForm.jsx`).
-   `src/services/`: Chứa các module giao tiếp với API backend (ví dụ: `auth.js`, `thanhvien.js`).
-   `src/store/`: Quản lý trạng thái toàn cục của ứng dụng bằng **Zustand**.
-   `src/api/client.js`: File trung tâm cấu hình **Axios** để giao tiếp với backend.
-   `src/hooks/`: Chứa các custom hook để tái sử dụng logic (ví dụ: `useAuth.js`).
-   `src/utils/`: Chứa các hằng số (`constants.js`) và hàm tiện ích (`helpers.js`).

## 4. Luồng hoạt động (Data Flow)

### 4.1. Database ↔️ Backend

1.  **Kết nối**:
    -   Khi backend khởi động, `services/database.services.ts` tạo một "pool" kết nối tới MySQL container dựa trên các biến môi trường trong file `.env` (ví dụ `DB_HOST`, `DB_PASSWORD`).
    -   Pool này quản lý và tái sử dụng các kết nối để tăng hiệu năng.
    ```typescript
    // backend/src/services/database.services.ts
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '123456',
      database: process.env.DB_DATABASE || 'app',
      // ...
    });
    ```

2.  **Truy vấn**:
    -   Khi một service cần dữ liệu, nó sẽ gọi hàm `query` từ `databaseService`.
    -   Hàm này sử dụng `pool.execute` với các tham số truyền vào, đây là một phương pháp an toàn để **chống lại SQL Injection**.

### 4.2. Backend ↔️ Frontend

1.  **Cấu hình API Client**:
    -   File `client/src/api/client.js` cấu hình một `axios instance` với `baseURL` trỏ tới địa chỉ của backend.
    -   Điều này giúp tránh việc lặp lại URL trong mỗi lần gọi API.

2.  **Authentication & Authorization**:
    -   **Request Interceptor**: Trước khi một request được gửi đi, interceptor sẽ tự động lấy `access_token` từ local storage và gắn vào header `Authorization`.
        ```javascript
        // client/src/api/client.js
        apiClient.interceptors.request.use((config) => {
          const token = getAccessToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        });
        ```
    -   **Refresh Token (Rất quan trọng)**:
        -   Khi `access_token` hết hạn, backend sẽ trả về lỗi `401 Unauthorized`.
        -   **Response Interceptor** của Axios sẽ bắt lỗi này.
        -   Nó tự động gửi `refresh_token` đang lưu tới endpoint `/users/refresh-token` của backend để lấy một cặp token mới.
        -   Nếu thành công, nó lưu token mới và **tự động gửi lại request ban đầu** mà không cần người dùng can thiệp.
        -   Nếu thất bại (refresh token hết hạn), nó sẽ xóa mọi token và điều hướng người dùng về trang đăng nhập.

3.  **Luồng gọi API (Ví dụ: Lấy danh sách thành viên)**:
    -   Người dùng truy cập trang "Thành Viên".
    -   Component `ThanhVienPage.jsx` gọi hàm `fetchThanhViens()` từ `services/thanhvien.js`.
    -   Hàm `fetchThanhViens()` sử dụng `apiClient` (đã cấu hình) để gửi GET request tới `/thanhvien` của backend.
    -   Backend: `thanhvien.routes.ts` nhận request, chuyển cho `thanhvien.controllers.ts`.
    -   Controller gọi `thanhvien.services.ts` để lấy dữ liệu từ database.
    -   Dữ liệu được trả về dưới dạng JSON cho frontend.
    -   Frontend nhận dữ liệu, cập nhật state trong `thanhvienStore.js` (Zustand), và UI được render lại để hiển thị danh sách.
