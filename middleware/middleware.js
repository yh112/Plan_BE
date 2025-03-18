const { verifyAccessToken } = require("../utils/tokenUtils");
const db = require("../db"); // DB 연결 객체

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>에서 토큰만 추출
  if (!token) {
    return res.status(403).json({ message: "Access token이 없습니다." });
  }

  const { ok, message, id } = verifyAccessToken(token); // 토큰 유효성 검사
  if (!ok) {
    return res.status(403).json({ message }); // 토큰 유효성 실패 시 에러 메시지 반환
  }

  req.userId = id; // 토큰에서 사용자 ID를 req에 저장

  // ✅ MySQL 세션 변수 설정
  try {
    await db.query("SET @SESSION_USER_ID = ?", [id]);
  } catch (error) {
    console.error("MySQL 세션 변수 설정 오류:", error);
    return res.status(500).json({ message: "서버 오류 발생" });
  }

  next(); // 유효한 토큰이면 요청 처리 계속 진행
};

module.exports = { verifyToken };
