const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');

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
        res.status(500).json({ message: "서버 오류" });
    }
});


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
        const token = jwt.sign({ id: user[0].user_id }, "SECRET_KEY", { expiresIn: "1h" });

        res.status(200).json({ message: "로그인 성공", token });
    } catch (error) {
        console.error("로그인 오류:", error);
        res.status(500).json({ message: "서버 오류" });
    }
});

module.exports = router;