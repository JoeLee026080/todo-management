/**
 * JWT 驗證中間件
 * - 從 Authorization header 取出 Bearer Token
 * - 驗證 Token 有效性
 * - 將解碼後的 payload 掛載到 req.user
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// 擴充 Express Request 型別，加入 user 欄位
export interface AuthRequest extends Request {
  user?: jwt.JwtPayload | string;
}

/**
 * 驗證 JWT Token 的中間件
 * 
 * 流程：
 *  Authorization: Bearer <token>
 *  → 取出 token → jwt.verify() → 成功則 next() / 失敗回錯誤
 */
export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1]; // 格式：Bearer <token>

  if (!token) {
    res.status(401).json({ error: '未提供認證 Token，請先登入' });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET!;
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token 無效或已過期，請重新登入' });
  }
}
