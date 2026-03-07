/**
 * RESTful API 伺服器
 * - 提供 CRUD 操作（Create, Read, Update, Delete）
 * - 資料庫：MongoDB
 * - 採用 Express + async error handling
 */

// === 環境變數與套件載入 ===
import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import { MongoClient, Db } from 'mongodb';
import 'express-async-errors'; // 自動捕獲 async/await 中的錯誤，避免未處理的 Promise rejection
import cors from 'cors';
import { fileURLToPath } from 'url';
import type { Server } from 'http';

// 路由模組
import setupItemsRoutes from './routes/items.js';
import setupAuthRoutes from './routes/auth.js';
import { authenticateToken } from './middleware/auth.js';

// 取代 CommonJS 的 __filename，比對執行入口使用
const __filename = fileURLToPath(import.meta.url);

// === Express 應用程式初始化 ===
const app = express();

// 中間件設定
app.use(express.json());
app.use(cors());

// === 資料庫連線 ===
const uri = process.env.MONGODB_URI;

// 環境變數驗證 - 提早發現配置問題
if (!uri) {
  console.error('❌ 缺少 MongoDB 連線字串，請確認 .env 設定');
  process.exit(1);
}

const client = new MongoClient(uri);
let db: Db | undefined;
let routesInitialized = false;

/**
 * 建立 MongoDB 連線
 * @returns {Promise<boolean>} 是否成功連線
 */
async function connectToDatabase(): Promise<boolean> {
  try {
    await client.connect();
    db = client.db('crudDemo');
    console.log('🎉 MongoDB 連線成功');
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ 連線失敗:', message);
    return false;
  }
}

/**
 * 設定 RESTful API 路由
 * 引入路由模組，分離路由邏輯
 */
function setupRoutes(): void {
  if (routesInitialized) {
    return; // 避免重複註冊路由
  }

  if (!db) {
    throw new Error('資料庫尚未連線，無法設定路由');
  }

  // 認證路由（公開，不需要 Token）
  const authRouter = setupAuthRoutes();
  app.use('/api/auth', authRouter);

  // 設定 Items API 路由（受 JWT 保護）
  const itemsRouter = setupItemsRoutes(db);
  app.use('/api/items', authenticateToken, itemsRouter);

  /**
   * 全域錯誤處理
   * 統一處理所有路由中未捕獲的錯誤
   * 提供一致的錯誤回應格式
   */
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('API 錯誤:', err);
    res.status(500).json({
      error: err.message || '發生了未知錯誤',
      path: req.path // 記錄發生錯誤的路徑，便於除錯
    });
  });

  routesInitialized = true;
}

/**
 * 啟動伺服器
 * @param {number} port - 伺服器埠號，預設從環境變數或 3000
 * @returns {Promise<Server|null>} Express 伺服器實例（用於測試）或 null（連線失敗時）
 */
async function startServer(port = Number(process.env.PORT) || 3000): Promise<Server | null> {
  const isConnected = await connectToDatabase();

  if (isConnected) {
    setupRoutes();
    const serverInstance = app.listen(port, () => {
      // 測試環境下避免控制台輸出
      if (process.env.NODE_ENV !== 'test') {
        console.log(`API 運行在 http://localhost:${port}`);
      }
    });
    return serverInstance;
  }
  return null;
}

// 僅在直接執行此檔案時啟動伺服器（非 import/require 時）
if (process.argv[1] === __filename) {
  void startServer();
}

// === 模組導出 ===
/**
 * 導出項目：
 * - app: Express 實例，供測試用
 * - connectToDatabase: 資料庫連線函數
 * - setupRoutes: 路由設定函數
 */
export {
  app,
  connectToDatabase,
  setupRoutes
};
