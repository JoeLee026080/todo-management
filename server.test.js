/**
 * API 端點整合測試
 * 測試目標：驗證所有 CRUD 操作的正確性
 * 測試策略：使用 Mock MongoDB 進行隔離測試，不依賴真實資料庫
 */

// === Mock 物件定義區 ===
// 注意：必須在 jest.mock() 之前定義，因為 Jest 會提升 mock 宣告

/**
 * Mock MongoDB Collection 操作方法
 * 模擬資料庫集合的基本 CRUD 操作
 */
const mockCollectionFunctions = {
  find: jest.fn().mockReturnThis(), // 支援鏈式調用：find().toArray()
  toArray: jest.fn(),
  insertOne: jest.fn(),
  updateOne: jest.fn(),
  deleteOne: jest.fn(),
};

/**
 * Mock MongoDB Database 實例
 * 提供 collection() 方法來存取 mock 集合
 */
const mockDbFunctions = {
  collection: jest.fn(() => mockCollectionFunctions),
};

/**
 * Mock MongoDB Client 實例
 * 模擬資料庫連線與生命週期管理
 */
const mockClientFunctions = {
  connect: jest.fn().mockResolvedValue(true), // 模擬成功連線
  db: jest.fn(() => mockDbFunctions), // 回傳 mock 的資料庫實例
  close: jest.fn().mockResolvedValue(undefined) // 模擬優雅關閉連線
};

// === Jest Mock 宣告 ===
/**
 * Mock mongodb 模組
 * Jest 會自動將此宣告提升至檔案頂部執行
 */
jest.mock('mongodb', () => ({
  // Mock MongoClient 建構函數
  MongoClient: jest.fn(() => mockClientFunctions),
  
  // Mock ObjectId 建構函數，回傳可識別的測試物件
  ObjectId: jest.fn().mockImplementation(function(id) {
    return { 
      _isMockObjectId: true, // 標記此為 mock 物件，便於測試斷言
      id: id || 'new_mocked_oid' 
    };
  }),
}));

// === 測試模組載入 ===
const request = require('supertest'); // HTTP 請求測試工具
const serverModule = require('./server'); // 被測試的伺服器模組
const app = serverModule.app; // Express 應用實例

// === 測試套件 ===
describe('API Endpoints', () => {
  /**
   * 測試前置作業
   * 建立 mock 資料庫連線並設定路由
   */
  beforeAll(async () => {
    await serverModule.connectToDatabase(); // 使用 mock 的 MongoClient
    serverModule.setupRoutes(); // 註冊所有 API 路由
  });

  /**
   * 測試後置清理
   * 關閉 mock 的資料庫連線
   */
  afterAll(async () => {
    if (mockClientFunctions.close.mock) {
      await mockClientFunctions.close();
    }
  });

  /**
   * 每個測試前重置 Mock 狀態
   * 確保測試之間互不影響
   */
  beforeEach(() => {
    // 清除 Client 層級的 mock 記錄
    if (mockClientFunctions.connect.mockClear) mockClientFunctions.connect.mockClear();
    if (mockClientFunctions.db.mockClear) mockClientFunctions.db.mockClear();
    if (mockClientFunctions.close.mockClear) mockClientFunctions.close.mockClear();
    
    // 清除 Database 層級的 mock 記錄
    if (mockDbFunctions.collection.mockClear) mockDbFunctions.collection.mockClear();
    
    // 清除 Collection 層級的所有 mock 記錄
    Object.values(mockCollectionFunctions).forEach(mockFn => {
      if (mockFn.mockClear) mockFn.mockClear();
    });
    
    // 清除 ObjectId 建構函數的呼叫記錄
    const { ObjectId } = require('mongodb');
    if (ObjectId.mockClear) {
      ObjectId.mockClear();
    }
    
    // 重設鏈式調用的回傳值
    mockCollectionFunctions.find.mockReturnThis();
  });

  // === 查詢操作測試 ===
  describe('GET /api/items', () => {
    /**
     * 測試正常情況：成功取得所有項目
     */
    it('應該返回所有項目', async () => {
      const mockItems = [{ _id: '1', name: 'Test Item 1' }];
      mockCollectionFunctions.toArray.mockResolvedValue(mockItems);

      const response = await request(app).get('/api/items');

      // 驗證 HTTP 回應
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(mockItems);
      
      // 驗證資料庫操作是否正確執行
      expect(mockDbFunctions.collection).toHaveBeenCalledWith('items');
      expect(mockCollectionFunctions.find).toHaveBeenCalledWith();
      expect(mockCollectionFunctions.toArray).toHaveBeenCalledTimes(1);
    });

    /**
     * 測試異常情況：資料庫查詢失敗
     */
    it('當獲取項目出錯時應處理錯誤', async () => {
      mockCollectionFunctions.toArray.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/items');

      // 驗證錯誤處理機制
      expect(response.statusCode).toBe(500);
      expect(response.body).toEqual({
        error: 'Database error',
        path: '/api/items'
      });
    });
  });

  // === 新增操作測試 ===
  describe('POST /api/items', () => {
    /**
     * 測試正常情況：成功新增項目
     */
    it('應該創建一個新項目', async () => {
      const newItemData = { name: 'New Test Item' };
      
      // 產生 mock 的 ObjectId 實例
      const mockNewObjectId = require('mongodb').ObjectId();
      require('mongodb').ObjectId.mockClear(); // 清除此次呼叫記錄

      const mockInsertResult = { 
        acknowledged: true, 
        insertedId: mockNewObjectId 
      };
      mockCollectionFunctions.insertOne.mockResolvedValue(mockInsertResult);

      const response = await request(app)
        .post('/api/items')
        .send(newItemData);

      // 驗證新增成功的回應結構
      expect(response.statusCode).toBe(200);
      expect(response.body.acknowledged).toBe(true);
      expect(response.body.insertedId).toEqual(mockNewObjectId);

      // 驗證資料庫操作參數
      expect(mockDbFunctions.collection).toHaveBeenCalledWith('items');
      expect(mockCollectionFunctions.insertOne).toHaveBeenCalledWith(newItemData);
    });
  });

  // === 更新操作測試 ===
  describe('PUT /api/items/:id', () => {
    /**
     * 測試正常情況：成功更新指定項目
     */
    it('應該更新一個已存在的項目', async () => {
      const itemId = 'item_id_to_update';
      const itemUpdateData = { name: 'Updated Item Name' };
      const mockUpdateResult = { 
        acknowledged: true, 
        modifiedCount: 1, 
        matchedCount: 1 
      };
      mockCollectionFunctions.updateOne.mockResolvedValue(mockUpdateResult);
      const { ObjectId } = require('mongodb');

      const response = await request(app)
        .put(`/api/items/${itemId}`)
        .send(itemUpdateData);

      // 驗證更新成功的回應
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(mockUpdateResult);
      
      // 驗證 ObjectId 轉換是否正確執行
      expect(ObjectId).toHaveBeenCalledWith(itemId);
      
      // 驗證更新操作的參數結構
      expect(mockDbFunctions.collection).toHaveBeenCalledWith('items');
      expect(mockCollectionFunctions.updateOne).toHaveBeenCalledWith(
        { _id: expect.objectContaining({ _isMockObjectId: true, id: itemId }) },
        { $set: { name: itemUpdateData.name } }
      );
    });
  });

  // === 刪除操作測試 ===
  describe('DELETE /api/items/:id', () => {
    /**
     * 測試正常情況：成功刪除指定項目
     */
    it('應該刪除一個項目', async () => {
      const itemId = 'item_id_to_delete';
      const mockDeleteResult = { 
        acknowledged: true, 
        deletedCount: 1 
      };
      mockCollectionFunctions.deleteOne.mockResolvedValue(mockDeleteResult);
      const { ObjectId } = require('mongodb');

      const response = await request(app)
        .delete(`/api/items/${itemId}`);

      // 驗證刪除成功的回應
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(mockDeleteResult);

      // 驗證 ObjectId 轉換是否正確執行
      expect(ObjectId).toHaveBeenCalledWith(itemId);

      // 驗證刪除操作的參數結構
      expect(mockDbFunctions.collection).toHaveBeenCalledWith('items');
      expect(mockCollectionFunctions.deleteOne).toHaveBeenCalledWith(
        { _id: expect.objectContaining({ _isMockObjectId: true, id: itemId }) }
      );
    });
  });
});