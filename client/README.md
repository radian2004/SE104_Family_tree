# Client (Frontend)

Đây là project frontend cho ứng dụng Quản lý Gia Phả, được xây dựng bằng React và Vite.

## 1. Công nghệ sử dụng

- **Framework:** [React](https://reactjs.org/) (sử dụng Hooks)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Routing:** [React Router DOM](https://reactrouter.com/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **HTTP Client:** [Axios](https://axios-http.com/)
- **Form Handling:** [React Hook Form](https://react-hook-form.com/)
- **Schema Validation:** [Zod](https://zod.dev/)

## 2. Cài đặt và Chạy dự án

1.  **Di chuyển vào thư mục `client`:**
    ```bash
    cd client
    ```

2.  **Cài đặt các dependencies:**
    ```bash
    npm install
    ```

3.  **Tạo file môi trường `.env`:**
    Tạo một file mới tên là `.env` trong thư mục gốc của `client` và thêm vào biến môi trường cho API backend.
    ```env
    VITE_API_BASE_URL=http://localhost:4000/api
    ```
    *(Lưu ý: Thay đổi URL nếu backend của bạn chạy ở một địa chỉ khác)*

4.  **Chạy ứng dụng ở chế độ development:**
    ```bash
    npm run dev
    ```
    Ứng dụng sẽ chạy tại `http://localhost:5173`.

## 3. Cấu trúc thư mục

```
client/
├── src/
│   ├── api/
│   │   └── client.js         # Cấu hình Axios client, interceptors
│   ├── assets/               # Chứa các file tĩnh (hình ảnh, fonts)
│   ├── components/           # Các component React tái sử dụng
│   ├── hooks/                # Các custom React hooks
│   ├── pages/                # Các component tương ứng với một trang
│   ├── services/             # Lớp giao tiếp với API backend
│   ├── store/                # Quản lý state global bằng Zustand
│   ├── styles/               # Các file CSS global
│   ├── utils/                # Các hàm tiện ích, hằng số
│   └── App.jsx               # Component gốc, quản lý routing
└── package.json              # Danh sách dependencies và scripts
```

## 4. Luồng dữ liệu và Tương tác giữa các file

Đây là luồng xử lý dữ liệu chính của ứng dụng, từ khi người dùng tương tác đến khi dữ liệu được hiển thị.

### Sơ đồ luồng:

**Component UI** -> **Store (Zustand)** -> **Service** -> **API Client (Axios)** -> **Backend**

### Diễn giải chi tiết:

1.  **Tương tác người dùng (UI Layer - `src/pages` & `src/components`)**
    - Một component (ví dụ: `ThanhVienPage.jsx`) cần hiển thị danh sách thành viên.
    - Nó gọi một hàm (thường đặt trong `useEffect`) để bắt đầu quá trình lấy dữ liệu.

2.  **Hàm thực thi (Action Layer - thường nằm trong Component hoặc Custom Hook)**
    - Hàm này sẽ gọi một phương thức từ **Service** tương ứng (ví dụ `ThanhVienService.getList()`).
    - Trước khi gọi service, nó có thể cập nhật state trong **Store (Zustand)** để cho biết quá trình tải đang diễn ra (ví dụ: `useThanhVienStore.getState().setLoading(true)`).

3.  **Lớp Service (`src/services`)**
    - File `thanhvien.js` chứa class `ThanhVienService`.
    - Phương thức `getList()` trong service này chịu trách nhiệm gọi đến API endpoint của backend.
    - Nó sử dụng `apiClient` đã được cấu hình sẵn để thực hiện HTTP request.
    - **Ví dụ:** `apiClient.get('/thanhvien')`.

4.  **API Client (`src/api/client.js`)**
    - Đây là nơi cấu hình `axios`.
    - **Request Interceptor:** Trước khi request được gửi đi, interceptor sẽ tự động đính kèm `Authorization` header (chứa access token) vào request.
    - **Response Interceptor:** Khi nhận được phản hồi:
        - Nếu thành công, dữ liệu được trả về cho **Service**.
        - Nếu gặp lỗi `401 Unauthorized` (token hết hạn), interceptor sẽ tự động gọi API `/refresh-token` để lấy access token mới, sau đó **thử lại request ban đầu** một lần nữa với token mới. Nếu refresh token thất bại, người dùng sẽ bị đẩy về trang đăng nhập.

5.  **Quay trở lại Service và Store**
    - **Service** (`thanhvien.js`) nhận dữ liệu từ `apiClient` và trả nó về cho hàm đã gọi nó trong component.
    - Component nhận dữ liệu và cập nhật vào state global thông qua các hàm setter của **Store (Zustand)** (ví dụ: `useThanhVienStore.getState().setThanhVienList(data)`).

6.  **Hiển thị trên UI**
    - Component `ThanhVienPage.jsx` đang "lắng nghe" các thay đổi trong `useThanhVienStore`.
    - Khi state `thanhvienList` trong store được cập nhật, component sẽ tự động render lại để hiển thị danh sách thành viên mới nhất.

Luồng dữ liệu một chiều và được quản lý tập trung này giúp cho việc debug và bảo trì code trở nên dễ dàng hơn.

## 5. Các Scripts có sẵn

-   `npm run dev`: Chạy server development.
-   `npm run build`: Build code cho production.
-   `npm run lint`: Kiểm tra lỗi coding style bằng ESLint.
-   `npm run preview`: Chạy bản build production ở local để kiểm tra.
