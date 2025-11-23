/**
 * Items API 路由模組
 * - 提供 CRUD 操作路由處理
 * - 分離路由邏輯，提升代碼可維護性
 */

import express, { Request, Response } from 'express';
import { ObjectId, Db } from 'mongodb';
import type { Router } from 'express';

/**
 * 設定 Items 相關路由
 * @param {Db} db - MongoDB 資料庫實例
 * @returns {Router} Express 路由器
 */
export default function setupItemsRoutes(db: Db): Router {
  const router = express.Router();
  /**
   * @route GET /items
   * @desc 取得所有項目
   * @returns {Array<Object>} 所有項目列表
   */
  router.get('/', async (_req: Request, res: Response) => {
    const items = await db.collection('items').find().toArray();
    res.json(items);
  });

  /**
   * @route POST /items
   * @desc 新增單一項目
   * @param {Object} req.body - 新增的項目資料
   * @returns {Object} 插入結果（含 insertedId）
   */
  router.post('/', async (req: Request, res: Response) => {
    const result = await db.collection('items').insertOne(req.body);
    res.json(result);
  });

  /**
   * @route PUT /items/:id
   * @desc 更新指定項目
   * @param {string} id - MongoDB ObjectId
   * @param {Object} req.body - 更新資料
   * @returns {Object} 更新結果（matchedCount, modifiedCount）
   */
  router.put('/:id', async (req: Request, res: Response) => {
    const result = await db.collection('items').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { name: req.body.name } }
    );
    res.json(result);
  });

  /**
   * @route DELETE /items/:id
   * @desc 刪除指定項目
   * @param {string} id - MongoDB ObjectId
   * @returns {Object} 刪除結果（deletedCount）
   */
  router.delete('/:id', async (req: Request, res: Response) => {
    const result = await db.collection('items').deleteOne({
      _id: new ObjectId(req.params.id)
    });
    res.json(result);
  });

  return router;
}
