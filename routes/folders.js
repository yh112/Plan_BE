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

    console.log(folder_list);

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
  const id = req.userId;
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
      "INSERT INTO folder (folder_name, uid) VALUES (?, ?) RETURNING *",
      [folder_name, req.userId]
    );

    console.log(result);

    // history_copy 테이블에 추가
    await db.query(
      "INSERT INTO history_copy (table_name, row_id, action, old_data, new_data) VALUES (?, ?, ?, ?, ?)",
      [
        "folder",
        result[0].id,
        "INSERT",
        null,
        JSON.stringify({
          folder_name: folder_name,
          uid: id,
          created_date: result[0].created_date,
        }),
      ]
    );

    res
      .status(201)
      .json({ message: "폴더 추가 완료", folder_id: result.insertId });
  } catch (error) {
    console.error("폴더 추가 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

// 폴더 삭제 API
router.delete("/:fid", verifyToken, async (req, res) => {
  console.log("폴더 삭제 요청");

  try {
    const fid = req.params.fid;

    // 1. 폴더 가져오기
    const [folderResult] = await db.query("SELECT * FROM folder WHERE id = ?", [
      fid,
    ]);
    if (folderResult.length === 0) {
      return res.status(404).json({ message: "해당 폴더를 찾을 수 없습니다." });
    }
    const folder = folderResult[0];

    // 2. plan 목록 가져오기
    const [plansResult] = await db.query("SELECT * FROM plan WHERE fid = ?", [
      fid,
    ]);

    // 3. 각 plan마다 project 조회해서 plans 확장
    const plansWithProjects = await Promise.all(
      plansResult.map(async (plan) => {
        const [projects] = await db.query(
          "SELECT * FROM project WHERE pid = ?",
          [plan.id]
        );
        return {
          ...plan,
          projects: projects,
        };
      })
    );

    // 4. 전체 JSON 구조로 합치기
    const fullData = {
      ...folder,
      plans: plansWithProjects,
    };

    // 5. 로그 기록
    await db.query(
      "INSERT INTO history_copy (table_name, row_id, action, old_data, new_data) VALUES (?, ?, ?, ?, ?)",
      ["folder", fid, "DELETE", JSON.stringify(fullData), null]
    );

    // 6. 실제 삭제
    await db.query("DELETE FROM folder WHERE id = ?", [fid]);

    res.status(204).json({ message: "폴더 삭제 완료" });
  } catch (error) {
    console.error("폴더 삭제 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

router.put("/:fid", verifyToken, async (req, res) => {
  console.log("폴더 수정 요청, fid:", req.params.fid);
  try {
    const fid = req.params.fid;
    const { folder_name } = req.body;

    // 1. 폴더 가져오기
    const [folderResult] = await db.query("SELECT * FROM folder WHERE id = ?", [
      fid,
    ]);

    console.log(folderResult);
    
    if (folderResult.length === 0) {
      return res.status(404).json({ message: "해당 폴더를 찾을 수 없습니다." });
    }
    const folder = folderResult[0];

    const updateFolder = await db.query(
      "UPDATE folder SET folder_name = ? WHERE id = ? RETURNING *",
      [folder_name, fid]
    );

    // 2. 로그 기록
    await db.query(
      "INSERT INTO history_copy (table_name, row_id, action, old_data, new_data) VALUES (?, ?, ?, ?, ?)",
      [
        "folder",
        fid,
        "UPDATE",
        JSON.stringify(folder),
        JSON.stringify(updateFolder[0]),
      ]
    );
  } catch (error) {
    console.error("폴더 수정 오류:", error);
    res.status(500).json({ message: "서버 오류" });
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

// 잘 됨 (사용중)
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

    // 2. 프로젝트 데이터 추가
    const insertProjectQuery =
      "INSERT INTO project (pid, fid, uid, project_name, last_week, this_week) VALUES ?";

    const projectValues = table.map((row) => [
      newPlanId, // pid
      fid, // fid
      id,
      row[0] || null, // project_name
      row[1] || null, // last_week
      row[2] || null, // this_week
    ]);

    const [project] = await db.query(insertProjectQuery, [projectValues]);

    await db.query(
      "INSERT INTO history_copy (table_name, row_id, action, old_data, new_data) VALUES (?, ?, ?, ?, ?)",
      [
        "plan",
        newPlanId,
        "INSERT",
        null,
        JSON.stringify({
          title,
          week,
          project_data: table.map((t) => ({
            pid: newPlanId,
            fid: fid,
            uid: id,
            project_name: t[0],
            last_week: t[1],
            this_week: t[2],
            feedback: null,
          })),
        }),
      ]
    );

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
  const uid = req.userId;
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
    const [existingProjects] = await db.query(
      "SELECT id, project_name, last_week, this_week FROM project WHERE pid = ? AND fid = ?",
      [pid, fid]
    );

    console.log("기존 프로젝트 내용", existingProjects);

    // 4. 기존 데이터와 입력값 비교 (project 테이블)
    const updateProjectQueries = [];

    for (let i = 0; i < table.length; i++) {
      const [project_name, last_week, this_week, id] = table[i];

      // 기존 데이터 찾기
      const existingProject = existingProjects.find((p) => p.id === id);

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
          updateValuesProject.push(id, pid, fid, uid);
          updateProjectQueries.push({
            query: `UPDATE project SET ${updateFieldsProject.join(
              ", "
            )} WHERE id = ? AND pid = ? AND fid = ? AND uid = ?`,
            values: updateValuesProject,
          });
        }
      } else {
        // 기존 프로젝트가 없을 경우, INSERT 쿼리 생성
        updateValuesProject.push(
          project_name,
          last_week,
          this_week,
          pid,
          fid,
          uid
        );
        updateProjectQueries.push({
          query: `INSERT INTO project (project_name, last_week, this_week, pid, fid, uid) VALUES (?, ?, ?, ?, ?, ?)`,
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

    console.log(existingPlan[0]);

    await db.query(
      "INSERT INTO history_copy (table_name, row_id, action, old_data, new_data) VALUES (?, ?, ?, ?, ?)",
      [
        "plan",
        pid,
        "UPDATE",
        JSON.stringify({
          uid,
          fid,
          title: existingPlan[0].title,
          week: existingPlan[0].week,
          modified_date: existingPlan[0].modified_date,
          created_date: existingPlan[0].created_date,
          project_data: existingProjects.map((p) => ({
            pid: pid,
            fid: fid,
            uid: uid,
            project_name: p.project_name,
            last_week: p.last_week,
            this_week: p.this_week,
            feedback: p.feedback,
          })),
        }),
        JSON.stringify({
          uid,
          fid,
          title,
          week,
          modified_date: existingPlan[0].modified_date,
          created_date: existingPlan[0].created_date,
          project_data: table.map((t) => ({
            pid: pid,
            fid: fid,
            uid: uid,
            project_name: t[0],
            last_week: t[1],
            this_week: t[2],
            feedback: t[3],
          })),
        }),
      ]
    );

    res.status(200).json({ message: "계획표 수정 완료" });
  } catch (error) {
    console.error("계획표 수정 오류:", error);
    res.status(500).json({ message: "서버 오류" });
  }
});

router.put("/:fid/plans/:pid/feedback", verifyToken, async (req, res) => {
  console.log("Feedback 수정 요청");

  const fid = req.params.fid;
  const pid = req.params.pid;
  const id = req.userId;
  const { feedback } = req.body;

  try {
    // 해당 계획표가 존재하는지 확인
    const [existingPlan] = await db.query(
      "SELECT * FROM plan WHERE fid = ? AND id = ?",
      [fid, pid]
    );

    if (existingPlan.length === 0) {
      return res
        .status(404)
        .json({ message: "해당 계획표를 찾을 수 없습니다." });
    }

    // feedback만 업데이트
    const [q] = await db.query(
      "UPDATE project SET feedback = ? WHERE pid = ? AND fid = ?",
      [feedback, pid, fid]
    );

    let updatedProjects = [];

    if (q.affectedRows > 0) {
      [updatedProjects] = await db.query(
        "SELECT * FROM project WHERE pid = ? AND fid = ?",
        [pid, fid]
      );
    }

    await db.query(
      "INSERT INTO history_copy (table_name, row_id, action, old_data, new_data) VALUES (?, ?, ?, ?, ?)",
      [
        "plan",
        pid,
        "UPDATE",
        null,
        JSON.stringify({
          title: existingPlan.title,
          week: existingPlan.week,
          modified_date: existingPlan.modified_date,
          created_date: existingPlan.created_date,
          project_data: updatedProjects.map((t) => ({
            pid: pid,
            fid: fid,
            uid: id,
            project_name: t.project_name,
            last_week: t.last_week,
            this_week: t.this_week,
            feedback: null,
          })),
        }),
      ]
    );

    res.status(200).json({ message: "Feedback 수정 완료" });
  } catch (error) {
    console.error("Feedback 수정 오류:", error);
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

function getLastWeekRange() {
  const today = new Date();

  // 지난 주의 날짜로 설정 (7일 전)
  today.setDate(today.getDate() - 7);

  // 오늘의 요일 (0: 일요일, 1: 월요일, ..., 6: 토요일)
  const dayOfWeek = today.getDay();

  // 월요일 날짜 계산
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  // 일요일 날짜 계산
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  // 날짜를 YYYY.MM.DD 형식으로 변환하는 함수
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}.${month}.${day}`;
  };

  // 지난 주의 월요일부터 일요일까지의 범위 반환
  return `${formatDate(monday)}~${formatDate(sunday)}`;
}

// 계획표 프로젝트, 유저 정보 조회 API
router.get("/:fid/plans/:pid/projects", verifyToken, async (req, res) => {
  const { fid, pid } = req.params;
  console.log("계획표 프로젝트, 유저 정보 조회", pid);
  const id = req.userId;

  console.log(pid);

  try {
    let userInfo;
    let projects = [];

    if (pid === "new") {
      const [infos, fields] = await db.query(
        "SELECT * FROM user WHERE id = ?",
        [req.userId]
      );
      userInfo = infos;
      const lastWeek = getLastWeekRange();

      const [projectRows] = await db.query(
        "SELECT * FROM project WHERE pid IN (SELECT id FROM plan WHERE week = ? AND fid = ? AND uid = ?);",
        [lastWeek, fid, id]
      );
      // projects = projectRows;
      console.log(projectRows);
      const result = projectRows.map((project) => {
        if (!project.this_week) {
          // this_week가 비어있으면 빈값으로 처리
          return {
            ...project,
            project_name: "", // project_name을 빈값으로
            this_week: "", // this_week을 빈값으로
          };
        } else {
          // this_week가 있으면 project_name과 this_week만 채우고 나머지는 빈값으로 처리
          return {
            project_name: project.project_name || "",
            this_week: "",
            // 나머지 값은 빈값으로 처리
            last_week: project.last_week || "",
            feedback: "",
            // 여기에 필요한 추가 필드들을 빈값으로 처리
          };
        }
      });

      projects = result;
    } else {
      // 해당 계획표에 속한 프로젝트 목록 조회
      const [projectRows] = await db.query(
        "SELECT * FROM project WHERE pid = ? AND fid = ?",
        [pid, fid]
      );
      projects = projectRows;

      console.log(projectRows);

      if (projectRows.length > 0) {
        const userId = projectRows[0].uid; // 프로젝트의 소유자 ID 가져오기

        // 프로젝트의 uid를 기준으로 user_info 가져오기
        const [infos, fields] = await db.query(
          "SELECT name, role, number FROM user WHERE id = ?",
          [userId]
        );
        userInfo = infos;
        console.log(infos);
      } else {
        const [planInfo] = await db.query(
          "SELECT * FROM plan WHERE id = ? AND fid = ?",
          [pid, fid]
        );
        if (planInfo.length > 0) {
          const userId = planInfo[0].uid;
          const [infos, fields] = await db.query(
            "SELECT name, role, number FROM user WHERE id = ?",
            [userId]
          );
          userInfo = infos;
        }
      }
    }

    // 결과 반환
    return res.status(200).json({ userInfo, projects });
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

    // 해당 계획표와 관련된 프로젝트도 조회
    const [relatedProject] = await db.query(
      "SELECT * FROM project WHERE pid = ? AND fid = ?",
      [pid, fid]
    );

    // 계획표 삭제 실행
    await db.query("DELETE FROM plan WHERE id = ? AND fid = ?", [pid, fid]);

    // `history_copy`에 삭제된 계획표와 관련된 프로젝트 정보 기록
    await db.query(
      "INSERT INTO history_copy (table_name, row_id, action, old_data, new_data) VALUES (?, ?, ?, ?, ?)",
      [
        "plan",
        pid,
        "DELETE",
        JSON.stringify({
          plan_data: existingPlan[0],
          project_data: relatedProject.length > 0 ? relatedProject : [], // 관련된 프로젝트 정보 추가
        }),
        null,
      ]
    );
    xx;
    res.status(200).json({ message: "계획표 삭제 완료" });
  } catch (error) {
    console.error("계획표 삭제 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

module.exports = router;
