# Todo Management — Node.js RESTful API

![CI](https://github.com/JoeLee026080/todo-management/actions/workflows/test.yml/badge.svg)

> 一個具備完整 CRUD、JWT 認證與 CI 自動化測試的 Todo API，
> 適合作為後端工程實踐的參考範本。

以 **Node.js + TypeScript + MongoDB** 建構的 RESTful API 後端。
專案包含一個 **簡單的 Vue 3 前端介面**，用於示範與測試 API 功能。

作為個人練習專案，重點實踐以下三項後端工程核心技能：

- **單元測試** — Jest + Supertest，mock MongoDB 進行隔離測試，覆蓋 CRUD 與 JWT 認證邏輯
- **JWT 認證** — Bearer Token 機制，保護受限 API 路由
- **GitHub Actions CI** — 每次 push / PR 自動觸發測試，確保主線品質

---
## 專案截圖


---

## 技術棧

| 類別 | 技術 |
|---|---|
| 執行環境 | Node.js 20 |
| 語言 | TypeScript |
| 框架 | Express.js |
| 資料庫 | MongoDB |
| 身份驗證 | JSON Web Token (jsonwebtoken) |
| 前端 | Vue 3 + Axios |
| 測試 | Jest + Supertest |
| CI | GitHub Actions |

---

## 專案結構

```
├── src/
│   ├── server.ts          # 應用程式入口、DB 連線與路由掛載
│   ├── routes/
│   │   ├── auth.ts        # POST /api/auth/login
│   │   └── items.ts       # CRUD /api/items
│   └── middleware/
│       └── auth.ts        # JWT 驗證中間件
├── auth.test.ts            # JWT 登入與受保護路由測試
├── server.test.ts          # CRUD API 整合測試
├── .github/workflows/
│   └── test.yml            # GitHub Actions CI 設定
└── index.html              # Vue 3 前端
```

---

## API 端點

### 認證（無須 Token）

| 方法 | 路徑 | 說明 |
|---|---|---|
| POST | `/api/auth/login` | 登入，回傳 JWT Token |

**Request body**
```json
{ "username": "admin", "password": "admin123" }
```

### 待辦事項（需帶 Bearer Token）

| 方法 | 路徑 | 說明 |
|---|---|---|
| GET | `/api/items` | 取得所有項目 |
| POST | `/api/items` | 新增項目 |
| PUT | `/api/items/:id` | 更新指定項目 |
| DELETE | `/api/items/:id` | 刪除指定項目 |

所有受保護路由需在 Header 加入：
```
Authorization: Bearer <token>
```

---

## 本地開發

### 安裝與啟動

```bash
# 1. 安裝相依套件
npm install

# 2. 設定環境變數
cp .env.example .env
# 填入 MONGODB_URI 與 JWT_SECRET

# 3. 啟動開發伺服器（hot reload）
npm run dev
```

### 執行測試

```bash
npm test
```

測試採用 mock MongoDB，**不需要連線真實資料庫**即可執行。

---

## 環境變數

請在 `.env` 檔案中設定以下環境變數：

| 變數名稱 | 說明 |
|---|---|
| `MONGODB_URI` | MongoDB 資料庫連線字串 |
| `JWT_SECRET` | 簽發與驗證 JWT Token 的密鑰 |