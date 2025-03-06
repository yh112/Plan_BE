const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');

/**
 * @swagger
 * /api/user/signup:
 *   post:
 *     summary: "회원가입"
 *     description: "새로운 사용자를 등록합니다."
 *     tags: [Users]
 *     requestBody:
 *       description: "사용자의 회원가입 정보를 입력받습니다."
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: string
 *                 description: "사용자 아이디"
 *                 example: "test_user"
 *               password:
 *                 type: string
 *                 description: "사용자 비밀번호"
 *                 example: "123456"
 *     responses:
 *       "201":
 *         description: "회원가입 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "회원가입 완료"
 *       "400":
 *         description: "이미 존재하는 아이디"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "이미 존재하는 아이디입니다."
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

// Signup API
router.post("/signup", async (req, res) => {
    try {
        const { user_id, password } = req.body;

        // 아이디 중복 확인
        const [existingUser] = await db.query("SELECT * FROM users WHERE user_id = ?", [user_id]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: "이미 존재하는 아이디입니다." });
        }

        // 비밀번호 해싱
        const hashedPassword = await bcrypt.hash(password, 10);

        // DB에 저장
        await db.query(
            "INSERT INTO users (user_id, password, created_at) VALUES (?, ?, ?)", 
            [user_id, hashedPassword, new Date()]
        );

        res.status(201).json({ message: '회원가입 완료' });
    } catch (error) {
        console.error("회원가입 오류:", error);
        res.status(500);
    }
});

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: "로그인"
 *     description: "사용자가 아이디와 비밀번호로 로그인합니다."
 *     tags: [Users]
 *     requestBody:
 *       description: "사용자의 로그인 정보를 입력받습니다."
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: string
 *                 description: "사용자 아이디"
 *                 example: "test_user"
 *               password:
 *                 type: string
 *                 description: "사용자 비밀번호"
 *                 example: "123456"
 *     responses:
 *       "200":
 *         description: "로그인 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "로그인 성공"
 *                 token:
 *                   type: string
 *                   description: "JWT 토큰"
 *                   example: "eyJhbGciOiJIUzI1NiIsInR..."
 *       "400":
 *         description: "잘못된 요청"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "존재하지 않는 아이디입니다."
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

// Login API
router.post("/login", async (req, res) => {
    try {
        const { user_id, password } = req.body;

        // 사용자 정보 조회
        const [user] = await db.query("SELECT * FROM users WHERE user_id = ?", [user_id]);
        if (user.length === 0) {
            return res.status(400).json({ message: "존재하지 않는 아이디입니다." });
        }

        // 비밀번호 검증
        const isMatch = await bcrypt.compare(password, user[0].password);
        if (!isMatch) {
            return res.status(400).json({ message: "비밀번호가 일치하지 않습니다." });
        }

        // JWT 토큰 발급
        const token = jwt.sign({ id: user[0].id }, "SECRET_KEY", { expiresIn: "1h" });

        res.status(200).json({ message: "로그인 성공", token });
    } catch (error) {
        console.error("로그인 오류:", error);
        res.status(500);
    }
});

/**
 * @swagger
 * /api/user/logout:
 *   post:
 *     summary: "로그아웃"
 *     description: "사용자를 로그아웃합니다."
 *     tags: [Users]
 *     responses:
 *       "200":
 *         description: "로그아웃 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "로그아웃 완료"
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

// Logout API
router.post("/logout", (req, res) => {
    try {
        res.status(200).json({ message: "로그아웃 완료"});
    } catch (error) {
        console.error("로그아웃 오류:", error);
        res.status(500).json({message: "서버 오류"});
    }
})
module.exports = router;