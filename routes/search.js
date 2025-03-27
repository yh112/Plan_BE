const express = require("express");
const { verifyToken } = require("../middleware/middleware");
const router = express.Router();
const db = require("../db");

// 검색어에 따라 조회하는 API
router.get("/", verifyToken, async (req, res) => {
    console.log("검색 요청");
    const userId = req.userId;
    const keyword = req.query.keyword;
  
    if (!keyword || keyword.trim() === "") {
      return res.status(400).json({ message: "검색어가 필요합니다." });
    }
  
    const likeKeyword = `%${keyword}%`;
  
    try {
      // 폴더 검색
      const [folders] = await db.query(
        `SELECT id, folder_name FROM folder 
         WHERE uid = ? AND folder_name LIKE ?`,
        [userId, likeKeyword]
      );
  
      // 계획표 검색
      const [plans] = await db.query(
        `SELECT id, title, fid FROM plan 
         WHERE uid = ? AND title LIKE ?`,
        [userId, likeKeyword]
      );
  
      // 프로젝트 검색 (project_name, last_week, this_week)
      const [projects] = await db.query(
        `SELECT id, project_name, pid, fid, last_week, this_week FROM project 
         WHERE uid = ? 
         AND (project_name LIKE ? OR last_week LIKE ? OR this_week LIKE ?)`,
        [userId, likeKeyword, likeKeyword, likeKeyword]
      );
  
      res.status(200).json({
        folders,
        plans,
        projects,
      });
    } catch (err) {
      console.error("검색 오류:", err);
      res.status(500).json({ message: "서버 오류 발생" });
    }
  });

  module.exports = router;