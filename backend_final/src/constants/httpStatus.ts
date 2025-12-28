const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  MULTIPLE_CHOICES: 300,  // ← THÊM: Cho trường hợp nhiều người trùng tên
  CONFLICT: 409,          // ← Kiểm tra đã có chưa
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500
} as const;

export default HTTP_STATUS;