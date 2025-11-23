/**
 * RESTful API 伺服器
 * - 提供 CRUD 操作（Create, Read, Update, Delete）
 * - 資料庫：MongoDB
 * - 採用 Express + async error handling
 */

// === 環境變數與套件載入 ===
require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
require('express-async-errors'); // 自動捕獲 async/await 中的錯誤，避免未處理的 Promise rejection
const cors = require('cors');

// 路由模組
const setupItemsRoutes = require('./routes/items');

// === Express 應用程式初始化 ===
const app = express();

// 中間件設定
app.use(express.json());
app.use(cors());

// === 資料庫連線 ===
const uri = process.env.MONGODB_URI;

// 環境變數驗證 - 提早發現配置問題
if (!uri) {
  console.error("❌ 缺少 MongoDB 連線字串，請確認 .env 設定");
  process.exit(1);
}

const client = new MongoClient(uri);
let db;

/**
 * 建立 MongoDB 連線
 * @returns {Promise<boolean>} 是否成功連線
 */
async function connectToDatabase() {
  try {
    await client.connect();
    db = client.db('crudDemo');
    console.log("🎉 MongoDB 連線成功");
    return true;
  } catch (error) {
    console.error("❌ 連線失敗:", error.message);
    return false;
  }
}

/**
 * 設定 RESTful API 路由
 * 引入路由模組，分離路由邏輯
 */
function setupRoutes() {
  // 設定 Items API 路由
  const itemsRouter = setupItemsRoutes(db);
  app.use('/api/items', itemsRouter);

  /**
   * 全域錯誤處理
   * 統一處理所有路由中未捕獲的錯誤
   * 提供一致的錯誤回應格式
   */
  app.use((err, req, res, next) => {
    console.error('API 錯誤:', err);
    res.status(500).json({
      error: err.message || '發生了未知錯誤',
      path: req.path // 記錄發生錯誤的路徑，便於除錯
    });
  });
}

/**
 * 啟動伺服器
 * @param {number} port - 伺服器埠號，預設從環境變數或 3000
 * @returns {Promise<Server|null>} Express 伺服器實例（用於測試）或 null（連線失敗時）
 */
async function startServer(port = process.env.PORT || 3000) {
  const isConnected = await connectToDatabase();
  
  if (isConnected) {
    setupRoutes();
    const serverInstance = app.listen(port, () => {
      // 測試環境下避免控制台輸出
      if (process.env.NODE_ENV !== 'test') {
        console.log(`API 運行在 http://localhost:${port}`);
      }
    });
    return serverInstance; // 回傳實例供測試使用
  }
  return null;
}

/**
 * 關閉伺服器
 * 確保所有連線正確釋放，避免資源洩漏
 * @param {Server} serverInstance - Express 伺服器實例
 */
async function closeServer(serverInstance) {
  // 關閉 HTTP 伺服器
  if (serverInstance) {
    await new Promise(resolve => serverInstance.close(resolve));
  }
  
  // 關閉 MongoDB 連線
  if (client && client.topology && client.topology.isConnected()) {
    await client.close();
  }
}

// 僅在直接執行此檔案時啟動伺服器（非 import/require 時）
if (require.main === module) {
  startServer();
}

// === 模組導出 ===
/**
 * 導出項目：
 * - app: Express 實例，供測試用
 * - 生命週期函數：啟動、關閉伺服器
 * - getDb: 取得資料庫實例（測試時可替換為 mock）
 * - ObjectId: MongoDB 物件 ID 轉換工具
 * - setupItemsRoutes: Items 路由設定函數（供其他模組使用）
 */
module.exports = {
  app,
  connectToDatabase,
  setupRoutes,
  startServer,
  closeServer,
  getDb: () => db,
  ObjectId,
  setupItemsRoutes
};