const express = require("express");
const { verifyToken } = require("../middleware/middleware");
const router = express.Router();
const db = require("../db");

/**
 * @swagger
 * /api/plans:
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
 *                 plan_list:
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
 */

// 계획표 목록 조회 API
router.get("/:fid", verifyToken, async (req, res) => {
  try {
    // 토큰이 유효한 경우, plan 데이터 조회
    const fid = req.params.fid;
    console.log(fid);
    const [plan_list] = await db.query("SELECT * FROM plan WHERE fid = ?", [
      fid,
    ]);
    res.status(200).json({ plan_list });
  } catch (error) {
    console.error("계획표 조회 오류:", error);
    res.status(500).json({ message: "서버 오류" });
  }
});

//

/**
 * @swagger
 * /api/plans:
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
 *               fid:
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
router.post("/:fid", verifyToken, async (req, res) => {
  try {
    const fid = req.params.fid;
    const { title } = req.body;

    if (!fid || !title) {
      return res.status(400).json({ message: "폴더 ID, 제목이 필요합니다." });
    }

    // 계획표 추가 작업 (uid는 토큰에서 가져온 id)
    const [result] = await db.query(
      "INSERT INTO plan (fid, uid, title) VALUES (?, ?, ?)",
      [fid, id, title]
    );

    res.status(201).json({ message: "계획표 추가 완료" });
  } catch (error) {
    console.error("계획표 추가 오류:", error);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 계획표 수정 API
router.patch("/:pid", verifyToken, async (req, res) => {
  const pid = req.params.pid; // URL 파라미터에서 계획표 ID 추출
  const { fid, title } = req.body; // 수정할 내용 (폴더 ID, 제목)

  // 수정할 데이터가 없으면 에러 반환
  if (!fid && !title) {
    return res.status(400).json({
      message: "수정할 내용이 없습니다. (폴더 ID 또는 제목을 입력하세요)",
    });
  }

  try {
    // 계획표가 존재하는지 확인
    const [existingPlan] = await db.query(
      "SELECT * FROM plan WHERE id = ? AND uid = ?",
      [pid, id]
    );

    if (!existingPlan) {
      return res
        .status(404)
        .json({ message: "해당 계획표를 찾을 수 없습니다." });
    }

    // 수정할 내용이 있으면 쿼리 작성
    const updateFields = [];
    const updateValues = [];

    if (fid) {
      updateFields.push("fid = ?");
      updateValues.push(fid);
    }

    if (title) {
      updateFields.push("title = ?");
      updateValues.push(title);
    }

    updateValues.push(pid); // WHERE 조건 추가

    // 계획표 내용 수정 쿼리
    const updateQuery = `UPDATE plan SET ${updateFields.join(
      ", "
    )} WHERE id = ? AND uid = ?`;
    await db.query(updateQuery, updateValues);

    res.status(200).json({ message: "계획표 수정 완료" });
  } catch (error) {
    console.error("계획표 수정 오류:", error);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 계획표 프로젝트 조회 API
router.get("/:pid/projects", verifyToken, async (req, res) => {
  const planId = req.params.pid; // 계획표 ID
  
  try {
    // 해당 계획표에 속한 프로젝트 목록 조회
    const [projects] = await db.query(
      "SELECT * FROM project WHERE plan_id = ?",
      [planId]
    );

    if (projects.length === 0) {
      return res
        .status(404)
        .json({ message: "해당 계획표에 속한 프로젝트가 없습니다." });
    }

    res.status(200).json({ projects });
  } catch (error) {
    console.error("프로젝트 조회 오류:", error);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 계획표 프로젝트 수정 API
router.patch("/:pid/projects/:id", verifyToken, async (req, res) => {
  const planId = req.params.pid; // 계획표 ID
  const projectId = req.params.id; // 프로젝트 ID
  
  const { project_name, last_week, this_week } = req.body;

  // 수정할 내용이 없으면 에러 반환
  if (!project_name && !last_week && !this_week) {
    return res.status(400).json({
      message:
        "수정할 내용이 없습니다. (프로젝트 이름, last_week, this_week 중 하나는 입력해야 합니다)",
    });
  }

  try {
    // 해당 프로젝트가 존재하는지 확인
    const [existingProject] = await db.query(
      "SELECT * FROM project WHERE id = ? AND plan_id = ? AND uid = ?",
      [projectId, planId, id]
    );

    if (!existingProject) {
      return res
        .status(404)
        .json({ message: "해당 프로젝트를 찾을 수 없습니다." });
    }

    // 수정할 내용이 있으면 쿼리 작성
    const updateFields = [];
    const updateValues = [];

    if (project_name) {
      updateFields.push("project_name = ?");
      updateValues.push(project_name);
    }

    if (last_week) {
      updateFields.push("last_week = ?");
      updateValues.push(last_week);
    }

    if (this_week) {
      updateFields.push("this_week = ?");
      updateValues.push(this_week);
    }

    updateValues.push(projectId, planId, id); // WHERE 조건 추가

    // 프로젝트 내용 수정 쿼리
    const updateQuery = `UPDATE project SET ${updateFields.join(
      ", "
    )} WHERE id = ? AND plan_id = ? AND uid = ?`;
    await db.query(updateQuery, updateValues);

    res.status(200).json({ message: "프로젝트 수정 완료" });
  } catch (error) {
    console.error("프로젝트 수정 오류:", error);
    res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;
