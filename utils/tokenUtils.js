require("dotenv").config();
const jwt = require("jsonwebtoken");

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
  throw new Error("TOKEN_SECRET 값이 설정되지 않았습니다.");
}

exports.makeAccessToken = (payload) => {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
};

exports.makeRefreshToken = (payload) => {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
};

// Access Token 유효성 검사
exports.verifyAccessToken = (token) => {
  try {
    console.log("액세스 토큰 유효성 검사 요청");
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    console.log("액세스 토큰 유효");
    return { ok: true, id: decoded.id };
  } catch (error) {
    console.log("액세스 토큰 만료");
    return { ok: false, message: "유효하지 않은 토큰입니다." };
  }
};

// Refresh Token 검증 및 Access Token 재발급
exports.verifyRefreshToken = (req, res) => {
  try {
    
    console.log("리프레쉬 토큰 검증");
    
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(403).json({ message: "Refresh token이 없습니다." });
    }

    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET);
    const newAccessToken = exports.makeAccessToken({ id: decoded.id });

    return res.json({ accessToken: newAccessToken });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Refresh token이 만료되었습니다. 다시 로그인하세요." });
    }
    return res.status(403).json({ message: "Refresh token이 유효하지 않습니다." });
  }
};
