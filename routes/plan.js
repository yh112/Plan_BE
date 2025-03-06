const express = require("express");
const router = express.Router();
const db = require("../db");

/**
 * @swagger
 * /api/plan/plan_list:
 *   get:
 *     summary: "계획표 목록 조회"
 *     description: "저장된 모든 계획표 목록을 조회합니다."
 *     tags: [Plans]
 *     responses:
 *       "200":
 *         description: "계획표 목록 조회 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 plans_list:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: "계획표 ID"
 *                         example: 1
 *                       fid:
 *                         type: integer
 *                         description: "폴더 ID"
 *                         example: 1
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

// 계획표 조회 API
router.get("/plan_list", async (req, res) => {
    try {
        const [plan_list] = await db.query("SELECT * FROM plans");
        res.status(200).json({ plan_list });
        console.log(plan_list);
    } catch (error) {
        console.error("폴더 목록 조회 오류:", error);
        res.status(500).json({ message: "서버 오류" });
    }
});

/**
 * @swagger
 * /api/plan/add_plan:
 *   post:
 *     summary: "계획표 추가"
 *     description: "새로운 계획표를 추가합니다."
 *     tags: [Plans]
 *     requestBody:
 *       description: "계획표 추가를 위한 데이터 입력"
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               folder_name:
 *                 type: integer
 *                 description: "폴더 ID"
 *                 example: 1
 *               uid:
 *                 type: integer
 *                 description: "사용자 ID"
 *                 example: 1
 *               title:
 *                 type: string
 *                 description: "계획표 제목"
 *                 example: "주간 일정"
 *     responses:
 *       "201":
 *         description: "계획표 추가 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "폴더 추가 완료"
 *       "400":
 *         description: "잘못된 요청 (필수 값 누락)"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "폴더 ID, 사용자 ID, 제목이 필요합니다."
 *       "500":
 *         description: "서버 오류"
 */

// 계획표 추가 API
router.post("/add_plan", async (req, res) => {
    try {
        const { fid, uid, title } = req.body;

        console.log(req.body)

        if (!fid || !uid || !title) {
            return res.status(400).json({ message: "폴더 ID, 사용자 ID, 제목이 필요합니다." });
        }

        const [result] = await db.query(
            "INSERT INTO plans (fid, uid, created_at) VALUES (?, ?, ?)",
            [folder_name, uid, new Date()]
        );

        res.status(201).json({ message: "폴더 추가 완료"});
    } catch (error) {
        console.error("폴더 추가 오류:", error);
        res.status(500);
    }
});

module.exports = router;
