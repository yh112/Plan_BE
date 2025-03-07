require("dotenv").config();
const jwt = require("jsonwebtoken");

const TOKEN_SECRET = process.env.TOKEN_SECRET;

// Access Token 발급 함수
exports.makeAccessToken = (payload) => {
  return jwt.sign(payload, TOKEN_SECRET, { expiresIn: "30m" });
};

// Refresh Token 발급 함수 (httpOnly 쿠키로 저장)
exports.makeRefreshToken = (payload) => {
  return jwt.sign(payload, TOKEN_SECRET, { expiresIn: "7d" });
};

// Access Token 유효성 검사
exports.verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, TOKEN_SECRET);
    return { ok: true, id: decoded.id };
  } catch (error) {
    return { ok: false, message: error.message };
  }
};

// Refresh Token 검증 및 Access Token 재발급
exports.verifyRefreshToken = (req, res) => {
  try {
    const token = req.cookies.refreshToken; // httpOnly 쿠키에서 가져오기
    if (!token) {
      return res.status(403).json({ message: "Refresh token이 없습니다." });
    }

    const decoded = jwt.verify(token, TOKEN_SECRET);
    const newAccessToken = exports.makeAccessToken({ id: decoded.id });

    return res.json({ accessToken: newAccessToken }); // 새 accessToken 발급
  } catch (error) {
    return res.status(403).json({ message: "Refresh token이 유효하지 않습니다." });
  }
};