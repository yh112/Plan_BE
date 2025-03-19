require("dotenv").config();
const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");
const TokenUtils = require("../utils/tokenUtils");
const { verifyToken } = require("../middleware/middleware");
const jwt = require("jsonwebtoken");

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: "회원가입"
 *     description: "새로운 사용자를 등록합니다."
 *     tags: [Auth]
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
 */

// Signup API
router.post("/signup", verifyToken, async (req, res) => {
  try {
    const { user_id, password, user_name, number, role } = req.body;

    console.log("회원가입 요청");

    if (typeof user_id !== "string" || typeof password !== "string" || typeof user_name !== "string" || typeof number !== "string" || typeof role !== "string"
    ) {
      return res.status(400).json({ message: "잘못된 입력 형식입니다." });
    }

    // 아이디 중복 확인
    const [existingUser] = await db.query(
      "SELECT * FROM user WHERE user_id = ?",
      [user_id]
    );
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "이미 존재하는 아이디입니다." });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 12);

    // DB에 저장
    const [id] = await db.query("INSERT INTO user (user_id, password, name, number, role, admin) VALUES (?, ?, ?, ?, ?, ?)", [
      user_id,
      hashedPassword,
      user_name,
      number,
      role,
      role === "사원" ? 'N' : 'Y',
    ]);

    // 히스토리 테이블에 저장
    await db.query("INSERT INTO history_copy (table_name, row_id, action, old_data, new_data) VALUES (?, ?, ?, ?, ?)", [
      user_id,
      id.insertId,
      'INSERT',
      null,
      JSON.stringify({ user_id, password: hashedPassword, user_name, number, role }),
    ]);

    res.status(201).json({ message: "회원가입 완료" });
  } catch (error) {
    console.error("회원가입 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: "로그인"
 *     description: "사용자가 아이디와 비밀번호로 로그인합니다."
 *     tags: [Auth]
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
 */

// Login API
router.post("/login", async (req, res) => {
  try {
    const { user_id, password } = req.body;

    console.log("로그인 요청");

    // 사용자 정보 조회
    const [auth] = await db.query("SELECT * FROM user WHERE user_id = ?", [
      user_id,
    ]);

    // 아이디 검증
    if (auth.length === 0) {
      return res.status(400).json({ message: "존재하지 않는 아이디입니다." });
    }

    // 비밀번호 검증
    const isMatch = await bcrypt.compare(password, auth[0].password);
    if (!isMatch) {
      return res.status(400).json({ message: "비밀번호가 일치하지 않습니다." });
    }

    // 관리자 확인 (Boolean)
    const isAdmin = auth[0].admin === "N" ? false : true;

    // JWT 토큰 발급
    const accessToken = TokenUtils.makeAccessToken({ id: auth[0].id });
    const refreshToken = TokenUtils.makeRefreshToken({ id: auth[0].id });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true, // HTTPS 환경에서만 사용 (개발 중에는 false)
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    });

    res.status(200).json({ accessToken, isAdmin });
  } catch (error) {
    console.error("로그인 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

// 로그인 여부 확인
router.get("/", verifyToken, (req, res) => {
  try {
    console.log("로그인 여부 확인 요청");
    // const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>에서 토큰만 추출
    const header = req.get("Authorization");
    
    if (!header) {
      return res.status(401).json({ message: "로그인되지 않았습니다." });
    }
    
    const token = header.split(" ")[1];
    const { ok, message, id } = verifyAccessToken(token); // 토큰 유효성 검사
    if (!ok) {
      return res.status(401).json({ message }); // 토큰 유효성 실패 시 에러 메시지 반환
    }

    // 로그인된 상태라면 사용자 정보 반환
    res.status(200).json({ message: "로그인됨", userId: id });
  } catch (error) {
    console.error("로그인 여부 확인 오류:", error);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 토큰 갱신 API
router.post("/refresh", (req, res) => {
  console.log("토큰 리프레쉬 요청");
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken)
    return res.status(403).json({ message: "Refresh token이 없습니다." });

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err)
      return res
        .status(403)
        .json({ message: "Refresh token이 유효하지 않습니다." });

    const newAccessToken = TokenUtils.makeAccessToken({ id: user.id });
    res.status(200).json({ accessToken: newAccessToken });
  });
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: "로그아웃"
 *     description: "사용자를 로그아웃합니다."
 *     tags: [Auth]
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
 */

// Logout API
router.post("/logout", (req, res) => {
  console.log("로그아웃 요청");
  try {
    res.clearCookie("refreshToken");
    res.status(200).json({ message: "로그아웃 완료" });
  } catch (error) {
    console.error("로그아웃 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

// 유저 삭제 API
router.delete("/", verifyToken, async (req, res) => {
  console.log("유저 삭제 요청");

  try {
    const { user_name } = req.body;

    console.log(req.body);

    // 이름이 제공되지 않으면 400 에러 반환
    if (!user_name) {
      return res.status(400).json({ message: "이름이 제공되지 않았습니다." });
    }

    // 이름으로 유저 조회
    const [user] = await db.query("SELECT * FROM user WHERE name = ?", [user_name]);

    // 유저가 없으면 404 에러 반환
    if (user.length === 0) {
      return res.status(404).json({ message: "유저를 찾을 수 없습니다." });
    }

    // 유저 삭제
    await db.query("DELETE FROM user WHERE name = ?", [user_name]);

    // 히스토리 테이블에 저장
    const { id, user_id, password, number, role } = user[0];
    await db.query("INSERT INTO history_copy (table_name, row_id, action, old_data, new_data) VALUES (?, ?, ?, ?, ?)", [
      user_id,
      id,
      'delete',
      JSON.stringify({ user_id, password: hashedPassword, user_name, number, role }),
      null,
    ]);

    // 삭제 성공 메시지 반환
    res.status(200).json({ message: "유저가 성공적으로 삭제되었습니다." });
  } catch (error) {
    console.error("유저 삭제 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

module.exports = router;
