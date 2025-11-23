# Node.js CRUD 應用程式

這是一個使用 Node.js、Express 與 MongoDB 所開發的待辦事項清單（Todo List）應用程式。

## 安裝步驟

1. 複製此專案倉儲到本地端  
2. 執行 `npm install` 來安裝所需套件  
3. 將 `.env.example` 檔案複製並另存為 `.env`，然後填入你的 MongoDB 連線字串  
4. 執行 `npm start` 來啟動應用程式  

## 環境變數設定

請在 `.env` 檔案中設定以下環境變數：

- `MONGODB_URI`: MongoDB 資料庫的連線字串  

## 功能特色

- 支援基本的 CRUD 操作（新增、讀取、更新、刪除）  
- 前端介面使用 Vue.js 開發  
- 後端服務使用 Express.js 架設  
- 資料儲存使用 MongoDB  