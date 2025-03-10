const express = require("express");
const { verifyToken } = require("../middleware/middleware");
const router = express.Router();
const db = require("../db");

/**
 * @swagger
 * /api/folders:
 *   get:
 *     summary: "폴더 목록 조회"
 *     description: "저장된 모든 폴더 목록을 조회합니다."
 *     tags: [Folders]
 *     responses:
 *       "200":
 *         description: "폴더 목록 조회 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 folders_list:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: "폴더 ID"
 *                         example: 1
 *                       folder_name:
 *                         type: string
 *                         description: "폴더명"
 *                         example: "work"
 *                       uid:
 *                         type: integer
 *                         description: "사용자 ID"
 *                         example: 1
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         description: "생성 일자"
 *                         example: "2025-03-06T12:00:00Z"
 *       "500":
 *         description: "서버 오류"
 */

// 폴더 목록 조회 API
router.get("/", verifyToken, async (req, res) => {
  try {
    console.log("폴더 목록 조회");
    const [folder_list] = await db.query("SELECT folder_name, id FROM folder");
    res.status(200).json({ folder_list });
  } catch (error) {
    console.error("폴더 목록 조회 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

/**
 * @swagger
 * /api/folders:
 *   post:
 *     summary: "폴더 추가"
 *     description: "새로운 폴더를 추가합니다."
 *     tags: [Folders]
 *     requestBody:
 *       description: "폴더 추가를 위한 데이터 입력"
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               folder_name:
 *                 type: string
 *                 description: "폴더명"
 *                 example: "work"
 *               uid:
 *                 type: integer
 *                 description: "사용자 ID"
 *                 example: 1
 *     responses:
 *       "201":
 *         description: "폴더 추가 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "폴더 추가 완료"
 *                 folder_id:
 *                   type: integer
 *                   description: "추가된 폴더 ID"
 *                   example: 10
 *       "400":
 *         description: "잘못된 요청 (필수 값 누락)"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "폴더명과 사용자 ID가 필요합니다."
 *       "500":
 *         description: "서버 오류"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "서버 오류"
 */

// 폴더 추가 API
router.post("/", verifyToken, async (req, res) => {
  try {
    const { folder_name } = req.body;

    console.log("폴더 추가 요청");

    if (typeof folder_name !== "string") {
      return res.status(400).json({ message: "잘못된 입력 형식입니다." });
    }

    if (!folder_name) {
      return res.status(400).json({ message: "폴더명이 필요합니다." });
    }

    const [result] = await db.query(
      "INSERT INTO folder (folder_name, uid) VALUES (?, ?)",
      [folder_name, req.userId]
    );

    res
      .status(201)
      .json({ message: "폴더 추가 완료", folder_id: result.insertId });
  } catch (error) {
    console.error("폴더 추가 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

module.exports = router;
