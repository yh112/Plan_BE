const express = require("express");
const router = express.Router();
const db = require("../db");

/**
 * @swagger
 * /api/folder/folder_list:
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "서버 오류"
 */

// 폴더 목록 조회 API
router.get("/folder_list", async (req, res) => {
    try {
        const [folders_list] = await db.query("SELECT * FROM folders");
        res.status(200).json({ folders_list });
        console.log(folders_list);
    } catch (error) {
        console.error("폴더 목록 조회 오류:", error);
        res.status(500).json({ message: "서버 오류" });
    }
});

/**
 * @swagger
 * /api/folder/add_folder:
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
router.post("/add_folder", async (req, res) => {
    try {
        const { folder_name, uid } = req.body;

        console.log(req.body)

        if (!folder_name || !uid) {
            return res.status(400).json({ message: "폴더명과 사용자 ID가 필요합니다." });
        }

        const [result] = await db.query(
            "INSERT INTO folders (folder_name, uid, created_at) VALUES (?, ?, ?)",
            [folder_name, uid, new Date()]
        );

        res.status(201).json({ message: "폴더 추가 완료", folder_id: result.insertId });
    } catch (error) {
        console.error("폴더 추가 오류:", error);
        res.status(500).json({ message: "서버 오류" });
    }
});

module.exports = router;
