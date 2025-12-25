# HƯỚNG DẪN TRIỂN KHAI ROUTE REFRESH TOKEN

## Mục đích
Tạo route `/users/refresh-token` để cấp lại access token và refresh token mới khi access token hết hạn, giúp người dùng duy trì phiên đăng nhập mà không cần đăng nhập lại.

---

## BƯỚC 1: CẬP NHẬT MESSAGES

### File: `src/constants/messages.ts`

**Thêm messages mới vào object `USERS_MESSAGES`:**

```typescript
export const USERS_MESSAGES = {
  // ... existing messages ...
  
  // Refresh Token (THÊM MỚI)
  REFRESH_TOKEN_SUCCESS: 'Làm mới token thành công',
  USED_REFRESH_TOKEN_OR_NOT_EXIST: 'Refresh token không tồn tại hoặc đã được sử dụng',
  
  // ... rest of messages ...
}
```

**Vị trí:** Thêm sau phần "Logout" và trước phần "Register success"

---

## BƯỚC 2: CẬP NHẬT REQUEST TYPES

### File: `src/models/requests/User.requests.ts`

**Thêm interface mới:**

```typescript
export interface RefreshTokenReqBody {
  refresh_token: string;
}
```

**Vị trí:** Thêm sau interface `LogoutReqBody`

---

## BƯỚC 3: CẬP NHẬT USERS SERVICE

### File: `src/services/users.services.ts`

**3.1. Thêm method mới vào class `UsersService`:**

```typescript
/**
 * Làm mới access token và refresh token
 * @param old_refresh_token - Refresh token cũ
 * @param user_id - ID người dùng (email)
 */
async refreshToken(old_refresh_token: string, user_id: string) {
  // 1. Xóa refresh token cũ khỏi database
  const deleteSql = 'DELETE FROM REFRESH_TOKENS WHERE token = ?';
  await databaseService.query(deleteSql, [old_refresh_token]);

  // 2. Tạo cặp token mới
  const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id);

  // 3. Lưu refresh token mới vào database
  const expDate = new Date();
  expDate.setDate(expDate.getDate() + 7);

  const insertRefreshTokenSql = `
    INSERT INTO REFRESH_TOKENS (token, TenDangNhap, NgayHetHan) 
    VALUES (?, ?, ?)
  `;
  await databaseService.query(insertRefreshTokenSql, [refresh_token, user_id, expDate]);

  return {
    access_token,
    refresh_token
  };
}
```

**Vị trí:** Thêm sau method `checkRefreshTokenExist` (cuối class, trước dòng xuất export)

**Giải thích:**
- Method này nhận `old_refresh_token` và `user_id`
- Xóa refresh token cũ để đảm bảo mỗi refresh token chỉ được dùng 1 lần
- Tạo cặp token mới (access + refresh)
- Lưu refresh token mới vào database với thời hạn 7 ngày
- Trả về cả 2 token mới

---

## BƯỚC 4: TẠO CONTROLLER

### File: `src/controllers/users.controllers.ts`

**4.1. Thêm import type mới:**

Cập nhật dòng import từ User.requests:

```typescript
import { LoginReqBody, LogoutReqBody, RegisterReqBody, RefreshTokenReqBody } from '~/models/requests/User.requests';
```

**4.2. Thêm controller mới:**

```typescript
/**
 * Controller làm mới token
 * POST /users/refresh-token
 * Body: { refresh_token: string }
 */
export const refreshTokenController = async (
  req: Request<ParamsDictionary, any, RefreshTokenReqBody>,
  res: Response
) => {
  const { refresh_token } = req.body;
  
  // Lấy user_id từ decoded_refresh_token (đã được validate bởi middleware)
  const { user_id } = req.decoded_refresh_token as TokenPayload;
  
  // Gọi service để làm mới token
  const result = await usersService.refreshToken(refresh_token, user_id);

  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.REFRESH_TOKEN_SUCCESS,
    result
  });
};
```

**Vị trí:** Thêm sau `logoutController` (cuối file, trước export)

**Giải thích:**
- Nhận `refresh_token` từ body
- Lấy `user_id` từ `decoded_refresh_token` (được middleware gán vào req)
- Gọi service để tạo token mới
- Trả về token mới với status 200

---

## BƯỚC 5: CẬP NHẬT ROUTES

### File: `src/routes/users.routes.ts`

**5.1. Thêm import controller:**

Cập nhật dòng import từ controllers:

```typescript
import {
  registerController,
  loginController,
  logoutController,
  refreshTokenController  // THÊM MỚI
} from '~/controllers/users.controllers';
```

**5.2. Thêm route mới:**

```typescript
/**
 * Description: Làm mới access token và refresh token
 * Path: /users/refresh-token
 * Method: POST
 * Body: { refresh_token: string }
 */
usersRouter.post('/refresh-token', refreshTokenValidator, wrapAsync(refreshTokenController));
```

**Vị trí:** Thêm sau route `/logout` và trước các route con (thanhvien, thanhtich, ketthuc)

**Giải thích:**
- Route chỉ cần `refreshTokenValidator` (không cần access token vì token đã hết hạn)
- Validator sẽ:
  - Kiểm tra refresh token có tồn tại không
  - Verify refresh token với secret key
  - Kiểm tra token có trong database không
  - Gán decoded token vào req

---

## BƯỚC 6: CẬP NHẬT TYPE DEFINITIONS

### File: `src/type.d.ts`

**Thêm property mới vào namespace Express.Request:**

```typescript
declare namespace Express {
  interface Request {
    decoded_authorization?: TokenPayload;
    decoded_refresh_token?: TokenPayload;  // THÊM MỚI (nếu chưa có)
  }
}
```

**Lưu ý:** Kiểm tra xem `decoded_refresh_token` đã tồn tại chưa. Nếu đã có thì bỏ qua bước này.

---

## BƯỚC 7: TEST API

### 7.1. Test với Postman/Thunder Client

**Endpoint:** `POST http://localhost:4000/users/refresh-token`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Expected Response (Success - 200 OK):**
```json
{
  "message": "Làm mới token thành công",
  "result": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Expected Response (Error - 401 Unauthorized):**
```json
{
  "message": "Refresh token không tồn tại hoặc đã được sử dụng"
}
```

### 7.2. Lưu ý khi test

1. **Lấy refresh token từ đâu?**
   - Đăng nhập qua `/users/login` để lấy refresh token
   - Lưu refresh token để test

2. **Kịch bản test:**
   - **Test 1:** Gửi refresh token hợp lệ → Nhận token mới
   - **Test 2:** Gửi lại refresh token cũ (đã dùng) → Nhận lỗi 401
   - **Test 3:** Gửi refresh token không tồn tại → Nhận lỗi 401
   - **Test 4:** Gửi refresh token hết hạn → Nhận lỗi JWT expired
   - **Test 5:** Không gửi refresh token → Nhận lỗi validation

---

## BƯỚC 8: KIỂM TRA DATABASE

### Kiểm tra table REFRESH_TOKENS

**Query:**
```sql
SELECT * FROM REFRESH_TOKENS ORDER BY NgayTao DESC;
```

**Kết quả mong đợi:**
- Mỗi lần gọi refresh-token, token cũ bị xóa
- Token mới được thêm vào với NgayHetHan = hiện tại + 7 ngày
- Không có token trùng lặp

---

## TÓM TẮT FLOW HOẠT ĐỘNG

### Luồng Refresh Token:

```
1. Client gửi refresh_token → POST /users/refresh-token

2. refreshTokenValidator middleware:
   ├─ Kiểm tra refresh_token có trong body không
   ├─ Verify JWT signature và thời hạn
   ├─ Kiểm tra token có trong database không
   └─ Gán decoded_refresh_token vào req

3. refreshTokenController:
   ├─ Lấy user_id từ decoded_refresh_token
   └─ Gọi usersService.refreshToken()

4. usersService.refreshToken():
   ├─ Xóa refresh_token cũ khỏi database (one-time use)
   ├─ Tạo access_token mới (15 phút)
   ├─ Tạo refresh_token mới (7 ngày)
   ├─ Lưu refresh_token mới vào database
   └─ Trả về cả 2 token

5. Client nhận:
   ├─ access_token mới → Lưu vào memory/state
   └─ refresh_token mới → Lưu vào localStorage/secure storage
```

---

## BẢO MẬT VÀ LƯU Ý

### 1. Refresh Token Rotation
- ✅ Đã implement: Mỗi refresh token chỉ dùng được 1 lần
- ✅ Token cũ bị xóa ngay khi tạo token mới
- ✅ Ngăn chặn token replay attacks

### 2. Lưu trữ token ở client
- **Access Token:** Lưu trong memory/state (React Context/Redux)
- **Refresh Token:** Lưu trong localStorage/httpOnly cookie
- **Không lưu** access token trong localStorage (dễ bị XSS)

### 3. Xử lý lỗi refresh token
- Nếu refresh token hết hạn/không hợp lệ → Logout user
- Redirect về trang login
- Xóa token khỏi storage

### 4. Race condition
- Nếu nhiều request cùng lúc → Chỉ request đầu tiên thành công
- Request sau sẽ nhận lỗi "token không tồn tại"
- Client cần implement retry logic với token mới

---

## CHECKLIST HOÀN THÀNH

- [ ] Cập nhật messages trong `constants/messages.ts`
- [ ] Thêm `RefreshTokenReqBody` vào `models/requests/User.requests.ts`
- [ ] Thêm method `refreshToken()` vào `services/users.services.ts`
- [ ] Thêm `refreshTokenController` vào `controllers/users.controllers.ts`
- [ ] Thêm route `/refresh-token` vào `routes/users.routes.ts`
- [ ] Kiểm tra `decoded_refresh_token` trong `type.d.ts`
- [ ] Test API với Postman/Thunder Client
- [ ] Kiểm tra database REFRESH_TOKENS

---

## THAM KHẢO

- **JWT Best Practices:** https://tools.ietf.org/html/rfc8725
- **OAuth 2.0 Refresh Token:** https://oauth.net/2/grant-types/refresh-token/
- **Token Rotation Strategy:** https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation

---

**Ngày tạo:** 23/12/2025
**Phiên bản:** 1.0
