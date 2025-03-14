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

// 잘 됨
// 폴더 목록 조회 API
router.get("/", verifyToken, async (req, res) => {
  try {
    console.log("폴더 목록 조회");
    console.log(req.query);

    let query;
    let params = [];

    // 관리자면 사용자별 전체 폴더 조회, 사원일 경우 본인이 작성한 폴더만 조회
    if (req.query.isAdmin === "true") {
      query = `
        SELECT u.name AS user_name, u.id,
               GROUP_CONCAT(CONCAT(f.folder_name, '(', f.id, ')') ORDER BY f.id SEPARATOR ',') AS folder_list 
        FROM user u 
        JOIN folder f ON u.id = f.uid 
        GROUP BY u.name;
      `;
    } else {
      query = "SELECT folder_name, id FROM folder WHERE uid = ?";
      params = [req.userId];
    }

    const [folder_list] = await db.query(query, params);

    console.log(folder_list)

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

// 잘 됨
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

// 잘 됨
// 계획표 조회 API
router.get("/:fid/plans", verifyToken, async (req, res) => {
  try {
    console.log("계획표 조회");
    const fid = req.params.fid;
    const [plan_list] = await db.query("SELECT * FROM plan WHERE fid = ?", [
      fid,
    ]);
    console.log(plan_list);
    if (!plan_list) res.status(404).json("계획표 목록이 없습니다.");
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

// 잘 됨
// 계획표 추가 API
router.post("/:fid/plans", verifyToken, async (req, res) => {
  console.log("데이터 추가");
  const fid = req.params.fid;
  const id = req.userId;
  const { title, week, table } = req.body;

  console.log(req.body);

  try {
    // 1. 새로운 계획표 추가
    const insertPlanQuery =
      "INSERT INTO plan (fid, title, week, uid) VALUES (?, ?, ?, ?)";
    const [planResult] = await db.query(insertPlanQuery, [
      fid,
      title,
      week,
      id,
    ]);

    const newPlanId = planResult.insertId;

    // 2. 프로젝트 데이터 추가 (table 배열에 있는 값들 추가)
    if (Array.isArray(table) && table.length > 0) {
      const insertProjectQuery =
        "INSERT INTO project (pid, fid, project_name, last_week, this_week) VALUES ?";

      const projectValues = table.map((row) => [
        newPlanId, // pid
        fid, // fid
        row[0], // project_name
        row[1], // last_week
        row[2], // this_week
      ]);

      await db.query(insertProjectQuery, [projectValues]);
    }

    res.status(201).json({ message: "계획표 추가 완료", planId: newPlanId });
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

// 잘 됨
// 계획표 수정 API
router.put("/:fid/plans/:pid", verifyToken, async (req, res) => {
  const fid = req.params.fid;
  const pid = req.params.pid;
  const { title, week, table } = req.body;

  try {
    // 1. 해당 계획표가 존재하는지 확인
    const [existingPlan] = await db.query(
      "SELECT * FROM plan WHERE fid = ? AND id = ?",
      [fid, pid]
    );

    console.log("기존 계획표", existingPlan);

    if (!existingPlan) {
      return res
        .status(404)
        .json({ message: "해당 계획표를 찾을 수 없습니다." });
    }

    // 2. 기존 데이터와 입력값 비교 (plan 테이블)
    const updateFieldsPlan = [];
    const updateValuesPlan = [];

    if (title && title !== existingPlan.title) {
      updateFieldsPlan.push("title = ?");
      updateValuesPlan.push(title);
    }

    if (week && week !== existingPlan.week) {
      updateFieldsPlan.push("week = ?");
      updateValuesPlan.push(week);
    }

    // 3. project 테이블 데이터 조회 (기존 프로젝트 데이터 가져오기)
    const existingProjects = await db.query(
      "SELECT id, project_name, last_week, this_week FROM project WHERE pid = ? AND fid = ?",
      [pid, fid]
    );

    console.log("기존 프로젝트 내용", existingProjects);

    // 4. 기존 데이터와 입력값 비교 (project 테이블)
    const updateProjectQueries = [];

    for (let i = 0; i < table.length; i++) {
      const [project_name, last_week, this_week, id] = table[i];

      // 기존 데이터 찾기
      const existingProject = existingProjects[0].find((p) => p.id === id);

      console.log("같은 프로젝트", existingProject);

      // 업데이트할 필드와 값 초기화
      const updateFieldsProject = [];
      const updateValuesProject = [];

      if (existingProject) {
        // 기존 프로젝트가 있을 경우, UPDATE 쿼리 생성
        if (
          existingProject.project_name &&
          project_name &&
          project_name !== existingProject.project_name
        ) {
          updateFieldsProject.push("project_name = ?");
          updateValuesProject.push(project_name);
        }

        if (
          existingProject.last_week &&
          last_week &&
          last_week !== existingProject.last_week
        ) {
          updateFieldsProject.push("last_week = ?");
          updateValuesProject.push(last_week);
        }

        if (
          existingProject.this_week &&
          this_week &&
          this_week !== existingProject.this_week
        ) {
          updateFieldsProject.push("this_week = ?");
          updateValuesProject.push(this_week);
        }

        // 수정된 데이터가 있을 경우 업데이트 쿼리 생성
        if (updateFieldsProject.length > 0) {
          updateValuesProject.push(id, pid, fid);
          updateProjectQueries.push({
            query: `UPDATE project SET ${updateFieldsProject.join(
              ", "
            )} WHERE id = ? AND pid = ? AND fid = ?`,
            values: updateValuesProject,
          });
        }
      } else {
        // 기존 프로젝트가 없을 경우, INSERT 쿼리 생성
        updateValuesProject.push(project_name, last_week, this_week, pid, fid);
        updateProjectQueries.push({
          query: `INSERT INTO project (project_name, last_week, this_week, pid, fid) VALUES (?, ?, ?, ?, ?)`,
          values: updateValuesProject,
        });
      }
    }

    // 5. 변경 사항이 없는 경우 업데이트 실행 안 함
    if (updateFieldsPlan.length === 0 && updateProjectQueries.length === 0) {
      console.log("변경된 내용 없음");
      return res.status(200).json({ message: "변경된 내용이 없습니다." });
    }

    // 6. 변경된 내용만 업데이트 실행 (plan 테이블)
    if (updateFieldsPlan.length > 0) {
      updateValuesPlan.push(pid, fid);
      const queryPlan = `UPDATE plan SET ${updateFieldsPlan.join(
        ", "
      )} WHERE id = ? AND fid = ?`;
      await db.query(queryPlan, updateValuesPlan);
    }

    // 7. 변경된 프로젝트 내용 업데이트 실행
    for (const { query, values } of updateProjectQueries) {
      await db.query(query, values);
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
  const { fid, pid } = req.params;
  console.log("계획표 프로젝트, 유저 정보 조회", pid);
  const id = req.userId;

  try {
    let projects = [];
    let userId = id; // 기본적으로 현재 로그인한 사용자 ID

    if (pid !== "new") {
      // 해당 계획표에 속한 프로젝트 목록 조회
      const [projectRows] = await db.query(
        "SELECT * FROM project WHERE pid = ? AND fid = ?",
        [pid, fid]
      );
      projects = projectRows;
      
      if (projectRows.length > 0) {
        userId = projectRows[0].uid; // 프로젝트가 존재하면 해당 사용자의 ID로 변경
      }
    }

    // 사용자 정보 조회
    const [user_info] = await db.query(
      "SELECT name, role, number FROM user WHERE id = ?",
      [userId]
    );

    console.log(projects, user_info);

    res.status(200).json({ projects, user_info });
  } catch (error) {
    console.error("프로젝트 조회 오류:", error);
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

// 잘 됨
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

    if (existingPlan.length === 0) {
      return res
        .status(404)
        .json({ message: "해당 계획표를 찾을 수 없습니다." });
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
