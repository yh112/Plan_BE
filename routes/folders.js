const express = require("express");
const { verifyToken } = require("../middleware/middleware");
const router = express.Router();
const db = require("../db");

/**
 * @swagger
 * /api/folders:
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
 *                 folder_list:
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
 */

// 폴더 목록 조회 API
router.get("/", verifyToken, async (req, res) => {
  try {
    console.log("폴더 목록 조회");
    const [folder_list] = await db.query("SELECT folder_name, id FROM folder WHERE uid = ?", [req.userId]);
    res.status(200).json({ folder_list });
  } catch (error) {
    console.error("폴더 목록 조회 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

/**
 * @swagger
 * /api/folders:
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
router.post("/", verifyToken, async (req, res) => {
  try {
    const { folder_name } = req.body;

    console.log("폴더 추가 요청");

    if (typeof folder_name !== "string") {
      return res.status(400).json({ message: "잘못된 입력 형식입니다." });
    }

    if (!folder_name) {
      return res.status(400).json({ message: "폴더명이 필요합니다." });
    }

    const [result] = await db.query(
      "INSERT INTO folder (folder_name, uid) VALUES (?, ?)",
      [folder_name, req.userId]
    );

    res
      .status(201)
      .json({ message: "폴더 추가 완료", folder_id: result.insertId });
  } catch (error) {
    console.error("폴더 추가 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

/**
 * @swagger
 * /api/folders/{fid}/plans:
 *   get:
 *     summary: "계획표 목록 조회"
 *     description: "저장된 모든 계획표 목록을 조회합니다."
 *     tags: [Plans]
 *     parameters:
 *       - in: path
 *         name: fid
 *         required: true
 *         description: "폴더 ID"
 *         schema:
 *           type: integer
 *           example: 1
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

// 계획표 조회 API
router.get("/:fid/plans", verifyToken, async (req, res) => {
  try {
    console.log("계획표 조회");
    const fid = req.params.fid;
    const [plan_list] = await db.query("SELECT * FROM plan WHERE fid = ?", [
      fid,
    ]);
    res.status(200).json({ plan_list });
  } catch (error) {
    console.error("계획표 조회 오류:", error);
    res.status(500).json({ message: "서버 오류" });
  }
});

/**
 * @swagger
 * /api/folders/{fid}/plans:
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
 *                   example: "계획표 추가 완료"
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
router.post("/:fid/plans/:pid", verifyToken, async (req, res) => {
  console.log("계획표 추가");
  try {
    const fid = req.params.fid;
    const { title } = req.body;
    const id = req.userId;

    if (!fid || !title) {
      return res.status(400).json({ message: "폴더 ID, 제목이 필요합니다." });
    }

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

/**
 * @swagger
 * /api/folders/{fid}/plans/{pid}:
 *   patch:
 *     summary: "계획표 수정"
 *     description: "기존 계획표의 정보를 수정합니다."
 *     tags: [Plans]
 *     parameters:
 *       - in: path
 *         name: fid
 *         required: true
 *         description: "폴더 ID"
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: path
 *         name: pid
 *         required: true
 *         description: "계획표 ID"
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       description: "수정할 계획표 내용"
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: "계획표 제목"
 *                 example: "2025년도 계획"
 *     responses:
 *       "200":
 *         description: "계획표 수정 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "계획표 수정 완료"
 *       "404":
 *         description: "계획표를 찾을 수 없을 경우"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "해당 계획표를 찾을 수 없습니다."
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

// 계획표 수정 API
router.put("/:fid/plans/:pid", verifyToken, async (req, res) => {
  const fid = req.params.fid;
  const pid = req.params.pid;
  const id = req.userId;
  const { title, week, table } = req.body;

  try {
    // 1. 해당 계획표가 존재하는지 확인
    const [existingPlan] = await db.query(
      "SELECT * FROM plan WHERE fid = ? AND id = ?",
      [fid, pid]
    );

    console.log(existingPlan);

    if (!existingPlan) {
      return res
        .status(404)
        .json({ message: "해당 계획표를 찾을 수 없습니다." });
    }

    // 2. plan 테이블에서 title, week 업데이트
    const updateFieldsPlan = [];
    const updateValuesPlan = [];

    if (title) {
      updateFieldsPlan.push("title = ?");
      updateValuesPlan.push(title);
    }

    if (week) {
      updateFieldsPlan.push("week = ?");
      updateValuesPlan.push(week);
    }

    if (updateFieldsPlan.length > 0) {
      updateValuesPlan.push(pid);
      updateValuesPlan.push(fid);
      const queryPlan = `UPDATE plan SET ${updateFieldsPlan.join(
        ", "
      )} WHERE id = ? AND fid = ?`;
      await db.query(queryPlan, [...updateValuesPlan]);
    }

    const updateFieldsProject = [];
    const updateValuesProject = [];

    if (table && table.length > 0) {
      for (let i = 0; i < table.length; i++) {
        updateFieldsProject.push("project_name = ?");
        updateValuesProject.push(table[i][0]); // project_name 값

        updateFieldsProject.push("last_week = ?");
        updateValuesProject.push(table[i][1]); // last_week 값

        updateFieldsProject.push("this_week = ?");
        updateValuesProject.push(table[i][2]); // this_week 값
      }
    }

    // project 테이블의 수정 쿼리
    if (updateFieldsProject.length > 0) {
      updateValuesProject.push(pid);
      updateValuesProject.push(fid);

      const queryProject = `UPDATE project SET ${updateFieldsProject.join(
        ", "
      )} WHERE pid = ? AND fid = ?`;
      await db.query(queryProject, updateValuesProject); // 배열 직접 전달
    }

    res.status(200).json({ message: "계획표 수정 완료" });
  } catch (error) {
    console.error("계획표 수정 오류:", error);
    res.status(500).json({ message: "서버 오류" });
  }
});

/**
 * @swagger
 * /api/folders/{fid}/plans/{pid}/projects:
 *   get:
 *     summary: "계획표 프로젝트 및 유저 정보 조회"
 *     description: "계획표에 속한 프로젝트와 해당 계획표의 유저 정보를 조회합니다."
 *     tags: [Projects, Users]
 *     parameters:
 *       - in: path
 *         name: fid
 *         required: true
 *         description: "폴더 ID"
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: path
 *         name: pid
 *         required: true
 *         description: "계획표 ID"
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       "200":
 *         description: "프로젝트 및 유저 정보 조회 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 projects:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       project_name:
 *                         type: string
 *                         example: "프로젝트 A"
 *                 user_info:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "홍길동"
 *                     role:
 *                       type: string
 *                       example: "팀장"
 *                     number:
 *                       type: string
 *                       example: "12345678"
 *       "404":
 *         description: "프로젝트 또는 유저 정보를 찾을 수 없을 경우"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "해당 계획표에 속한 프로젝트가 없습니다."
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

// 계획표 프로젝트, 유저 정보 조회 API
router.get("/:fid/plans/:pid/projects", verifyToken, async (req, res) => {
  console.log("계획표 프로젝트, 유저 정보 조회");
  const { fid, pid } = req.params;
  const id = req.userId;
  console.log(fid, pid);

  try {
    let projects = null;

    if (pid !== "new") {
      // 해당 계획표에 속한 프로젝트 목록 조회
      const [projectRows] = await db.query(
        "SELECT * FROM project WHERE pid = ? AND fid = ?",
        [pid, fid]
      );
      projects = projectRows;
    }

    const [user_info, fields] = await db.query(
      "SELECT name, role, number FROM user WHERE id = ?",
      [id]
    );

    // 'projects'가 null일 경우에는 프로젝트가 없다는 의미이므로, user_info만 전달
    res.status(200).json({ projects, user_info });
  } catch (error) {
    console.error("프로젝트 조회 오류:", error);
    res.status(500).json({ message: "서버 오류" });
  }
});

/**
 * @swagger
 * /api/folders/{fid}/plans/{pid}/projects/{id}:
 *   patch:
 *     summary: "계획표 프로젝트 수정"
 *     description: "기존 계획표의 프로젝트 정보를 수정합니다."
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: fid
 *         required: true
 *         description: "폴더 ID"
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: path
 *         name: pid
 *         required: true
 *         description: "계획표 ID"
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: path
 *         name: id
 *         required: true
 *         description: "프로젝트 ID"
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       description: "수정할 프로젝트 내용"
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               project_name:
 *                 type: string
 *                 description: "프로젝트 이름"
 *                 example: "새로운 프로젝트"
 *               last_week:
 *                 type: string
 *                 description: "지난 주 진행 사항"
 *                 example: "지난 주에는 주요 작업 완료"
 *               this_week:
 *                 type: string
 *                 description: "이번 주 계획"
 *                 example: "이번 주에는 마무리 작업"
 *     responses:
 *       "200":
 *         description: "프로젝트 수정 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "프로젝트 수정 완료"
 *       "400":
 *         description: "수정할 내용이 없을 경우"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "수정할 내용이 없습니다. (프로젝트 이름, last_week, this_week 중 하나는 입력해야 합니다)"
 *       "404":
 *         description: "프로젝트를 찾을 수 없을 경우"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "해당 프로젝트를 찾을 수 없습니다."
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

// 계획표 프로젝트 수정 API
router.patch("/:fid/plans/:pid/projects/:id", verifyToken, async (req, res) => {
  console.log("계획표 프로젝트 수정");
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

/**
 * @swagger
 * /api/folders/{fid}/plans/{pid}:
 *   delete:
 *     summary: "계획표 삭제"
 *     description: "특정 계획표를 삭제합니다."
 *     tags: [Plans]
 *     parameters:
 *       - in: path
 *         name: fid
 *         required: true
 *         description: "폴더 ID"
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: path
 *         name: pid
 *         required: true
 *         description: "계획표 ID"
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       "200":
 *         description: "계획표 삭제 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "계획표 삭제 완료"
 *       "404":
 *         description: "계획표를 찾을 수 없을 경우"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "해당 계획표를 찾을 수 없습니다."
 *       "500":
 *         description: "서버 오류"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "서버 오류 발생"
 */

// 계획표 삭제 API
router.delete("/:fid/plans/:pid", verifyToken, async (req, res) => {
  try {
    console.log("계획표 삭제 요청");
    const { fid, pid } = req.params;

    // 해당 계획표가 존재하는지 확인
    const [existingPlan] = await db.query(
      "SELECT * FROM plan WHERE id = ? AND fid = ?",
      [pid, fid]
    );

    console.log(existingPlan);

    if (existingPlan.length === 0) {
      return res.status(404).json({ message: "해당 계획표를 찾을 수 없습니다." });
    }

    // 계획표 삭제 실행
    await db.query("DELETE FROM plan WHERE id = ? AND fid = ?", [pid, fid]);

    res.status(200).json({ message: "계획표 삭제 완료" });
  } catch (error) {
    console.error("계획표 삭제 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});


module.exports = router;
