/**
 * JWT 登入功能測試 (TDD)
 * 測試順序：
 * 1. 登入端點（正確/錯誤帳密、缺少欄位）
 * 2. 受保護路由（無 Token、有效 Token、無效 Token）
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

// === MongoDB Mock（與 server.test.ts 相同，隔離資料庫依賴）===
const mockCollectionFunctions = {
  find: jest.fn<() => any>().mockReturnThis(),
  toArray: jest.fn<() => Promise<any>>(),
  insertOne: jest.fn<() => Promise<any>>(),
  updateOne: jest.fn<() => Promise<any>>(),
  deleteOne: jest.fn<() => Promise<any>>(),
};

const mockDbFunctions = {
  collection: jest.fn(() => mockCollectionFunctions),
};

const mockClientFunctions = {
  connect: jest.fn<() => Promise<boolean>>().mockResolvedValue(true),
  db: jest.fn(() => mockDbFunctions),
  close: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
};

jest.unstable_mockModule('mongodb', () => ({
  MongoClient: jest.fn(() => mockClientFunctions),
  ObjectId: jest.fn().mockImplementation(function (id: string) {
    return { _isMockObjectId: true, id: id || 'new_mocked_oid' };
  }),
}));

// === 模組載入（在 mock 後 await import）===
const request = (await import('supertest')).default;
const serverModule = await import('./src/server.js');
const app = serverModule.app;

// === 測試套件 ===
describe('JWT 驗證功能', () => {
  beforeAll(async () => {
    await serverModule.connectToDatabase();
    serverModule.setupRoutes();
  });

  afterAll(async () => {
    await mockClientFunctions.close();
  });

  beforeEach(() => {
    mockCollectionFunctions.find.mockReturnThis();
    Object.values(mockCollectionFunctions).forEach(fn => fn.mockClear());
    mockDbFunctions.collection.mockClear();
    mockClientFunctions.connect.mockClear();
  });

  // ─────────────────────────────────────────────
  describe('POST /api/auth/login', () => {
    it('正確帳號密碼 → 200 + 回傳 token 字串', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin123' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(typeof res.body.token).toBe('string');
      expect(res.body.token.length).toBeGreaterThan(0);
    });

    it('帳號錯誤 → 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'hacker', password: 'admin123' });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('密碼錯誤 → 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'wrongpass' });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('缺少密碼欄位 → 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('缺少帳號欄位 → 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'admin123' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  // ─────────────────────────────────────────────
  describe('受保護路由：GET /api/items', () => {
    it('沒有 Authorization header → 401', async () => {
      const res = await request(app).get('/api/items');
      expect(res.statusCode).toBe(401);
    });

    it('使用無效 Token → 401', async () => {
      const res = await request(app)
        .get('/api/items')
        .set('Authorization', 'Bearer this.is.invalid');

      expect(res.statusCode).toBe(401);
    });

    it('使用有效 Token → 200 + 資料', async () => {
      // Step 1: 登入取得 token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin123' });
      const { token } = loginRes.body as { token: string };

      // Step 2: 帶 token 存取受保護路由
      mockCollectionFunctions.find.mockReturnThis();
      mockCollectionFunctions.toArray.mockResolvedValue([{ _id: '1', name: 'Test' }]);

      const res = await request(app)
        .get('/api/items')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
