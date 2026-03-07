/**
 * 認證路由模組
 * - POST /login：使用寫死的管理員帳號驗證，成功回傳 JWT Token
 *
 * 第一版（練習用）：帳號密碼寫死在後端
 * 後續版本可改為資料庫查詢 + bcrypt 密碼比對
 */

import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { Router } from 'express';

// ── 寫死的管理員帳號（第一版練習用）──
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

/**
 * 設定認證路由
 * @returns {Router} Express 路由器
 */
export default function setupAuthRoutes(): Router {
  const router = express.Router();

  /**
   * @route  POST /api/auth/login
   * @desc   使用管理員帳號密碼登入，回傳 JWT Token
   * @body   { username: string, password: string }
   * @return { token: string }
   */
  router.post('/login', (req: Request, res: Response) => {
    const { username, password } = req.body as {
      username?: string;
      password?: string;
    };

    // 1. 欄位驗證
    if (!username || !password) {
      res.status(400).json({ error: '請提供帳號（username）與密碼（password）' });
      return;
    }

    // 2. 帳號密碼比對（第一版寫死）
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      res.status(401).json({ error: '帳號或密碼錯誤' });
      return;
    }

    // 3. 簽發 JWT
    const secret = process.env.JWT_SECRET!;
    const token = jwt.sign(
      { username, role: 'admin' }, // payload
      secret,
      { expiresIn: '1h' }          // 1 小時後過期
    );

    res.json({ token });
  });

  return router;
}
