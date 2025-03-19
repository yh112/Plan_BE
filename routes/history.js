// const express = require("express");
// const router = express.Router();
// const { verifyToken } = require("../middleware/middleware");
// const db = require("../db");
// const { userInfo } = require("node:os");

// // 마지막 활동을 되돌리는 함수 (undo)
// async function undo(userId) {
//   // 가장 최근의 작업을 가져옵니다.
//   const query = `
//       SELECT * FROM db_activity_log
//       WHERE user_id = ?
//       ORDER BY created_at DESC LIMIT 1
//     `;
//   const [rows] = await db.query(query, [userId]);
//   if (rows.length === 0) {
//     throw new Error("Undo할 작업이 없습니다.");
//   }

//   console.log(rows);

//   const lastAction = rows[0];
//   const { action, table_name, record_id, old_data, new_data } = lastAction;

//   // 폴더 테이블 작업
//   if (lastAction.table_name === "folder") {
//     // 폴더 생성 취소 (폴더 삭제)
//     if (lastAction.action === "INSERT") {
//       const deleteQuery = `DELETE FROM ${table_name} WHERE id = ?`;
//       await db.query(deleteQuery, [record_id]);
//     } else if (lastAction.action === "DELETE") {
//       // 폴더 삭제 취소 (폴더 다시 생성)
//       const insertQuery = `INSERT INTO ${table_name} (id, folder_name) VALUES (?, ?)`;
//       await db.query(insertQuery, [record_id, old_data.folder_name]);
//     }
//   }
//   // 계획표 테이블 작업
//   else if (lastAction.table_name === "plan") {
//     // 계획 생성 취소 (계획 삭제)
//     if (lastAction.action === "INSERT") {
//       const deleteQuery = `DELETE FROM ${table_name} WHERE id = ?`;
//       await db.query(deleteQuery, [record_id]);
//     } else if (lastAction.action === "DELETE") {
//       // 계획 삭제 취소 (계획 다시 생성)
//       const insertQuery = `INSERT INTO ${table_name} (id, title, week) VALUES (?, ?, ?)`;
//       await db.query(insertQuery, [record_id, old_data.title, old_data.week]);
//     } else if (lastAction.action === "UPDATE") {
//       // 계획 수정 취소 (계획 수정)
//       const updateQuery = `UPDATE ${table_name} SET title = ? AND week = ? WHERE id = ?`;
//       await db.query(updateQuery, [old_data.title, old_data.week, record_id]);
//     }
//   }
//   // 프로젝트 테이블 작업
//   else if (lastAction.table_name === "project") {
//     // 프로젝트 생성 취소 (프로젝트 삭제)
//     if (lastAction.action === "INSERT") {
//       const deleteQuery = `DELETE FROM ${table_name} WHERE id = ?`;
//       await db.query(deleteQuery, [record_id]);
//     } else if (lastAction.action === "DELETE") {
//       // 프로젝트 삭제 취소 (프로젝트 다시 생성)
//       const insertQuery = `INSERT INTO ${table_name} (id, project_name, last_week, this_week, feedback) VALUES (?, ?, ?, ?, ?)`;
//       await db.query(insertQuery, [
//         record_id,
//         old_data.project_name,
//         old_data.last_week,
//         old_data.this_week,
//         old_data.feedback,
//       ]);
//     } else if (lastAction.action === "UPDATE") {
//       // 프로젝트 수정 취소 (프로젝트 수정)
//       const updateQuery = `UPDATE ${table_name} SET project_name = ? AND last_week = ? AND this_week = ? AND feedback = ? WHERE id = ?`;
//       await db.query(updateQuery, [
//         old_data.project_name,
//         old_data.last_week,
//         old_data.this_week,
//         old_data.feedback,
//         record_id,
//       ]);
//     }
//   }
//   // 유저 테이블 작업
//   else if (lastAction.table_name === "user") {
//     if (lastAction.action === "INSERT") {
//       const deleteQuery = `DELETE FROM ${table_name} WHERE id = ?`;
//       await db.query(deleteQuery, [record_id]);
//     } else if (lastAction.action === "DELETE") {
//       // 유저 삭제 취소 (유저 다시 생성)
//       const insertQuery = `INSERT INTO ${table_name} (id, user_id, password, user_name, number, role, admin) VALUES (?, ?, ?, ?, ?, ?, ?)`;
//       await db.query(insertQuery, [
//         record_id,
//         old_data.user_id,
//         old_data.password,
//         old_data.user_name,
//         old_data.number,
//         old_data.role,
//         old_data.admin,
//       ]);
//     } else if (lastAction.action === "UPDATE") {
//       // 유저 수정 취소 (유저 수정)
//       const updateQuery = `UPDATE ${table_name} SET user_id = ? AND password = ? AND user_name = ? AND number = ? AND role = ? AND admin = ? WHERE id = ?`;
//       await db.query(updateQuery, [
//         old_data.user_id,
//         old_data.password,
//         old_data.user_name,
//         old_data.number,
//         old_data.role,
//         old_data.admin,
//         record_id,
//       ]);
//     }
//   }

//   // 로그에서 해당 작업을 삭제하거나 상태 업데이트
//   return lastAction;
// }

// // redo 기능
// async function redo(userId) {
//   // redoStack에서 복원할 작업을 가져옵니다.
//   const query = `
//       SELECT * FROM db_activity_log
//       WHERE user_id = ?
//       ORDER BY created_at DESC LIMIT 1
//     `;
//   const [rows] = await db.query(query, [userId]);
//   if (rows.length === 0) {
//     throw new Error("Redo할 작업이 없습니다.");
//   }

//   const lastUndoneAction = rows[0];
//   const { action, table_name, record_id, old_data, new_data } = lastAction;

//   // 폴더 테이블 작업
//   if (table_name === "folder") {
//     if (action === "DELETE") {
//       const deleteQuery = `DELETE FROM ${table_name} WHERE id = ?`;
//       await db.query(deleteQuery, [record_id]);
//     } else if (action === "INSERT") {
//       const insertQuery = `INSERT INTO ${table_name} (id, folder_name) VALUES (?, ?)`;
//       await db.query(insertQuery, [record_id, new_data.folder_name]);
//     }
//   }
//   // 계획표 테이블 작업
//   else if (table_name === "plan") {
//     if (action === "DELETE") {
//       const deleteQuery = `DELETE FROM ${table_name} WHERE id = ?`;
//       await db.query(deleteQuery, [record_id]);
//     } else if (action === "INSERT") {
//       const insertQuery = `INSERT INTO ${table_name} (id, title, week) VALUES (?, ?, ?)`;
//       await db.query(insertQuery, [record_id, new_data.title, new_data.week]);
//     } else if (action === "UPDATE") {
//       const updateQuery = `UPDATE ${table_name} SET title = ?, week = ? WHERE id = ?`;
//       await db.query(updateQuery, [new_data.title, new_data.week, record_id]);
//     }
//   }
//   // 프로젝트 테이블 작업
//   else if (table_name === "project") {
//     if (action === "DELETE") {
//       const deleteQuery = `DELETE FROM ${table_name} WHERE id = ?`;
//       await db.query(deleteQuery, [record_id]);
//     } else if (action === "INSERT") {
//       const insertQuery = `INSERT INTO ${table_name} (id, project_name, last_week, this_week, feedback) VALUES (?, ?, ?, ?, ?)`;
//       await db.query(insertQuery, [
//         record_id,
//         new_data.project_name,
//         new_data.last_week,
//         new_data.this_week,
//         new_data.feedback,
//       ]);
//     } else if (action === "UPDATE") {
//       const updateQuery = `UPDATE ${table_name} SET project_name = ?, last_week = ?, this_week = ?, feedback = ? WHERE id = ?`;
//       await db.query(updateQuery, [
//         new_data.project_name,
//         new_data.last_week,
//         new_data.this_week,
//         new_data.feedback,
//         record_id,
//       ]);
//     }
//   }
//   // 유저 테이블 작업
//   else if (table_name === "user") {
//     if (action === "DELETE") {
//       const deleteQuery = `DELETE FROM ${table_name} WHERE id = ?`;
//       await db.query(deleteQuery, [record_id]);
//     } else if (action === "INSERT") {
//       const insertQuery = `INSERT INTO ${table_name} (id, user_id, password, user_name, number, role, admin) VALUES (?, ?, ?, ?, ?, ?, ?)`;
//       await db.query(insertQuery, [
//         record_id,
//         new_data.user_id,
//         new_data.password,
//         new_data.user_name,
//         new_data.number,
//         new_data.role,
//         new_data.admin,
//       ]);
//     } else if (action === "UPDATE") {
//       const updateQuery = `UPDATE ${table_name} SET user_id = ?, password = ?, user_name = ?, number = ?, role = ?, admin = ? WHERE id = ?`;
//       await db.query(updateQuery, [
//         new_data.user_id,
//         new_data.password,
//         new_data.user_name,
//         new_data.number,
//         new_data.role,
//         new_data.admin,
//         record_id,
//       ]);
//     }
//   }

//   return lastUndoneAction;
// }

// // undo 라우터
// router.post("/undo", verifyToken, async (req, res) => {
//   const userId = req.userId;
//   try {
//     const undoneAction = await undo(userId);
//     res.status(200).json({ message: "Undo 성공", action: undoneAction });
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

// // redo 라우터
// router.post("/redo", verifyToken, async (req, res) => {
//   const userId = req.userId;
//   try {
//     const redoneAction = await redo(userId);
//     res.status(200).json({ message: "Redo 성공", action: redoneAction });
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/middleware");
const db = require("../db");
const { userInfo } = require("node:os");
const e = require("express");

// // 마지막 활동을 되돌리는 함수 (undo)
// async function undo(userId) {
//   console.log("[UNDO] 실행 - userId:", userId);

//   const query = `
//       SELECT * FROM db_activity_log 
//       WHERE user_id = ? 
//       ORDER BY id DESC LIMIT 1
//     `;
//   const [rows] = await db.query(query, [userId]);
//   if (rows.length === 0) {
//     throw new Error("Undo할 작업이 없습니다.");
//   }

//   console.log("[UNDO] 마지막 작업:", rows[0]);

//   const lastAction = rows[0];
//   const { action, table_name, record_id, old_data, new_data } = lastAction;

//   console.log("[UNDO] 실행할 테이블:", table_name, "작업 유형:", action);

//   const parseData = JSON.parse(old_data);
//   console.log(parseData);

//   const parseNewData = JSON.parse(new_data);
//   console.log(parseNewData);

//   if (table_name === "folder") {
//     if (action === "INSERT") {
//       console.log("[UNDO] 폴더 생성 취소 - ID:", record_id);
//       const deleteQuery = `DELETE FROM ${table_name} WHERE id = ?`;
//       await db.query(deleteQuery, [record_id]);
//     } else if (action === "DELETE") {
//       console.log(
//         "[UNDO] 폴더 삭제 취소 - ID:",
//         record_id,
//         "폴더명:",
//         parseData.folder_name
//       );
//       const insertQuery = `INSERT INTO ${table_name} (id, folder_name) VALUES (?, ?)`;
//       await db.query(insertQuery, [record_id, parseData.folder_name]);
//     }
//   }
//   // 계획표 테이블 작업
//   else if (table_name === "plan") {
//     if (action === "INSERT") {
//       console.log("[UNDO] 계획 생성 취소 - ID:", record_id);
//       const deleteQuery = `DELETE FROM ${table_name} WHERE id = ?`;
//       await db.query(deleteQuery, [record_id]);
//     } else if (action === "DELETE") {
//       console.log("[UNDO] 계획 삭제 취소 - ID:", record_id);

//       // 계획표 데이터 복원
//       const insertPlanQuery = `INSERT INTO ${table_name} (id, title, week, uid, fid) VALUES (?, ?, ?, ?, ?)`;
//       await db.query(insertPlanQuery, [
//         record_id,
//         parseData.title,
//         parseData.week,
//         parseData.uid,
//         parseData.fid,
//       ]);

//       console.log("[UNDO] 계획 복원 완료 - ID:", record_id);

//       console.log(parseData.project_data);

//       // 만약 parseData.project_data가 문자열 형태라면
//       if (typeof parseData.project_data === "string") {
//         parseData.project_data = JSON.parse(parseData.project_data);
//       }

//       // 연결된 모든 프로젝트 복원
//       if (parseData.project_data && parseData.project_data.length > 0) {
//         for (const project of parseData.project_data) {
//           console.log("[UNDO] 프로젝트 복원 - ID:", project.id); // 각 프로젝트의 ID 출력
//           const insertProjectQuery = `
//         INSERT INTO project (id, project_name, last_week, this_week, feedback, uid, fid, pid) 
//         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

//           // 프로젝트 데이터에서 값을 배열로 추출하여 INSERT 쿼리에 전달
//           await db.query(insertProjectQuery, [
//             project.id, // 프로젝트 ID
//             project.project_name, // 프로젝트 이름
//             project.last_week, // 지난 주
//             project.this_week, // 이번 주
//             project.feedback, // 피드백
//             project.uid, // 유저 ID
//             project.fid, // 폴더 ID
//             project.pid, // 계획 ID
//           ]);
//         }
//       }
//       console.log("[UNDO] 계획 및 관련 프로젝트 복원 완료 - ID:", record_id);
//     } else if (action === "UPDATE") {
//       console.log("[UNDO] 계획 수정 취소 - ID:", record_id);
//       const updateQuery = `UPDATE ${table_name} SET title = ?, week = ? WHERE id = ?`;
//       await db.query(updateQuery, [parseData.title, parseData.week, record_id]);
//     }
//   } else if (table_name === "project") {
//     if (action === "INSERT") {
//       console.log("[UNDO] 프로젝트 생성 취소 - ID:", record_id);
//       const deleteQuery = `DELETE FROM ${table_name} WHERE id = ?`;
//       await db.query(deleteQuery, [record_id]);
//     } else if (action === "DELETE") {
//       console.log("[UNDO] 프로젝트 삭제 취소 - ID:", record_id);
//       const insertQuery = `INSERT INTO ${table_name} (id, project_name, last_week, this_week, feedback) VALUES (?, ?, ?, ?, ?)`;
//       await db.query(insertQuery, [
//         record_id,
//         parseData.project_name,
//         parseData.last_week,
//         parseData.this_week,
//         parseData.feedback,
//       ]);
//     } else if (action === "UPDATE") {
//       console.log("[UNDO] 프로젝트 수정 취소 - ID:", record_id);
//       const updateQuery = `UPDATE ${table_name} SET project_name = ?, last_week = ?, this_week = ?, feedback = ? WHERE id = ?`;
//       await db.query(updateQuery, [
//         parseData.project_name,
//         parseData.last_week,
//         parseData.this_week,
//         parseData.feedback,
//         record_id,
//       ]);
//     }
//   } else if (table_name === "user") {
//     if (action === "INSERT") {
//       console.log("[UNDO] 유저 생성 취소 - ID:", record_id);
//       const deleteQuery = `DELETE FROM ${table_name} WHERE id = ?`;
//       await db.query(deleteQuery, [record_id]);
//     } else if (action === "DELETE") {
//       console.log("[UNDO] 유저 삭제 취소 - ID:", record_id);
//       const insertQuery = `INSERT INTO ${table_name} (id, user_id, password, name, number, role, admin) VALUES (?, ?, ?, ?, ?, ?, ?)`;
//       await db.query(insertQuery, [
//         record_id,
//         parseData.user_id,
//         parseData.password,
//         parseData.name,
//         parseData.number,
//         parseData.role,
//         parseData.admin,
//       ]);
//     } else if (action === "UPDATE") {
//       console.log("[UNDO] 유저 수정 취소 - ID:", record_id);
//       const updateQuery = `UPDATE ${table_name} SET user_id = ?, password = ?, user_name = ?, number = ?, role = ?, admin = ? WHERE id = ?`;
//       await db.query(updateQuery, [
//         parseData.user_id,
//         parseData.password,
//         parseData.user_name,
//         parseData.number,
//         parseData.role,
//         parseData.admin,
//         record_id,
//       ]);
//     }
//   }

//   return lastAction;
// }

// // redo 기능
// async function redo(userId) {
//   console.log("[REDO] 실행 - userId:", userId);

//   const query = `
//       SELECT * FROM db_activity_log 
//       WHERE user_id = ? 
//       ORDER BY id DESC LIMIT 1
//     `;
//   const [rows] = await db.query(query, [userId]);
//   if (rows.length === 0) {
//     throw new Error("Redo할 작업이 없습니다.");
//   }

//   console.log("[REDO] 마지막 실행 취소된 작업:", rows[0]);

//   const lastUndoneAction = rows[0];
//   const { action, table_name, record_id, old_data, new_data } =
//     lastUndoneAction;

//   console.log("[REDO] 실행할 테이블:", table_name, "작업 유형:", action);
//   console.log(typeof old_data);

//   const parseData = JSON.parse(old_data);
//   console.log(parseData);

//   const parseNewData = JSON.parse(new_data);
//   console.log(parseNewData);

//   // 폴더 테이블 작업
//   if (table_name === "folder") {
//     // 폴더 삭제 취소 (폴더 생성)
//     if (action === "DELETE") {
//       console.log("[REDO] 폴더 생성 다시 실행 - ID:", record_id);
//       const insertQuery = `INSERT INTO ${table_name} (id, folder_name) VALUES (?, ?)`;
//       await db.query(insertQuery, [record_id, parseData.folder_name]);
//     }
//     // 폴더 생성 취소 (폴더 삭제)
//     else if (action === "INSERT") {
//       console.log("[REDO] 폴더 삭제 다시 실행 - ID:", record_id);
//       const deleteQuery = `DELETE FROM ${table_name} WHERE id = ?`;
//       await db.query(deleteQuery, [record_id]);
//     }
//   }
//   // 계획표 테이블 작업
//   else if (table_name === "plan") {
//     // 계획 생성 취소 (계획 삭제)
//     if (action === "DELETE") {
//       console.log("[REDO] 계획표 생성 다시 실행 - ID:", record_id);
//       const insertQuery = `INSERT INTO ${table_name} (id, fid, title, week, uid) VALUES (?, ?, ?, ?, ?)`;
//       await db.query(insertQuery, [
//         record_id,
//         parseData.fid,
//         parseData.title,
//         parseData.week,
//         parseData.uid,
//       ]);
//     }
//     // 계획 삭제 취소 (계획 다시 생성)
//     else if (action === "INSERT") {
//       console.log("[REDO] 계획표 삭제 다시 실행 - ID:", record_id);
//       const deleteQuery = `DELETE FROM ${table_name} WHERE id = ?`;
//       await db.query(deleteQuery, [record_id]);
//     }
//     // 계획 수정 취소 (전 내용으로 복구)
//     else if (action === "UPDATE") {
//       console.log("[REDO] 계획 수정 다시 실행 - ID:", record_id);
//       const updateQuery = `UPDATE ${table_name} SET title = ?, week = ? WHERE id = ?`;
//       await db.query(updateQuery, [parseData.title, parseData.week, record_id]);
//     }
//   }
//   // 프로젝트 테이블 작업
//   else if (table_name === "project") {
//     // 프로젝트 삭제 취소 (프로젝트 생성)
//     if (action === "DELETE") {
//       console.log("[REDO] 프로젝트 생성 다시 실행 - ID:", record_id);
//       const insertQuery = `INSERT INTO ${table_name} (id, project_name, last_week, this_week, feedback) VALUES (?, ?, ?, ?, ?)`;
//       await db.query(insertQuery, [
//         record_id,
//         parseData.project_name,
//         parseData.last_week,
//         parseData.this_week,
//         parseData.feedback,
//       ]);
//     }
//     // 프로젝트 생성 취소 (프로젝트 삭제)
//     else if (action === "INSERT") {
//       console.log("[REDO] 프로젝트 삭제 다시 실행 - ID:", record_id);
//       const deleteQuery = `DELETE FROM ${table_name} WHERE id = ?`;
//       await db.query(deleteQuery, [record_id]);
//     }
//     // 프로젝트 수정 취소 (프로젝트 수정)
//     else if (action === "UPDATE") {
//       console.log("[REDO] 프로젝트 수정 다시 실행 - ID:", record_id);
//       const updateQuery = `UPDATE ${table_name} SET project_name = ?, last_week = ?, this_week = ?, feedback = ? WHERE id = ?`;
//       await db.query(updateQuery, [
//         parseData.project_name,
//         parseData.last_week,
//         parseData.this_week,
//         parseData.feedback,
//         record_id,
//       ]);
//     }
//   }
//   // 유저 테이블 작업
//   else if (table_name === "user") {
//     if (action === "DELETE") {
//       console.log("[REDO] 유저 생성 다시 실행 - ID:", record_id);

//       // 유저 데이터 파싱
//       console.log(old_data, userId);
//       const insertUserQuery = `
//           INSERT INTO ${table_name} (user_id, password, name, number, role, admin) 
//           VALUES (?, ?, ?, ?, ?, ?)`;

//       await db.query(insertUserQuery, [
//         parseData.user_id, // user_id
//         parseData.password, // password
//         parseData.name, // name
//         parseData.number, // number
//         parseData.role, // role
//         parseData.admin, // admin
//       ]);

//       console.log("[REDO] 유저 데이터 복원 완료 - ID:", record_id);

//       // 폴더 데이터 복원
//       if (parseData.folders && parseData.folders.length > 0) {
//         for (const folder of parseData.folders) {
//           console.log("[REDO] 폴더 복원 - ID:", folder.id);
//           const insertFolderQuery = `
//               INSERT INTO folders (id, folder_name, uid) 
//               VALUES (?, ?, ?)`;

//           await db.query(insertFolderQuery, [
//             folder.id,
//             folder.folder_name,
//             record_id,
//           ]);
//         }
//       }

//       // 계획표 데이터 복원
//       if (parseData.plans && parseData.plans.length > 0) {
//         for (const plan of parseData.plans) {
//           console.log("[REDO] 계획표 복원 - ID:", plan.id);
//           const insertPlanQuery = `
//               INSERT INTO plans (id, title, week, fid, uid) 
//               VALUES (?, ?, ?, ?, ?)`;

//           await db.query(insertPlanQuery, [
//             plan.id,
//             plan.title,
//             plan.week,
//             plan.fid,
//             record_id,
//           ]);
//         }
//       }

//       // 프로젝트 데이터 복원
//       if (parseData.projects && parseData.projects.length > 0) {
//         for (const project of parseData.projects) {
//           console.log("[REDO] 프로젝트 복원 - ID:", project.id);
//           const insertProjectQuery = `
//               INSERT INTO projects (id, project_name, feedback, this_week, last_week, uid, fid, pid) 
//               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

//           await db.query(insertProjectQuery, [
//             project.id,
//             project.project_name,
//             project.feedback,
//             project.this_week,
//             project.last_week,
//             record_id,
//             project.fid,
//             project.pid,
//           ]);
//         }
//       }
//       console.log("[REDO] 유저 및 모든 관련 데이터 복원 완료 - ID:", record_id);
//     } else if (action === "INSERT") {
//       console.log("[REDO] 유저 삭제 다시 실행 - ID:", record_id);
//       const deleteQuery = `DELETE FROM ${table_name} WHERE id = ?`;
//       await db.query(deleteQuery, [record_id]);
//     } else if (action === "UPDATE") {
//       console.log("[REDO] 유저 수정 다시 실행 - ID:", record_id);
//       const updateQuery = `UPDATE ${table_name} SET user_id = ?, password = ?, user_name = ?, number = ?, role = ?, admin = ? WHERE id = ?`;
//       await db.query(updateQuery, [
//         parseNewData.user_id,
//         parseNewData.password,
//         parseNewData.user_name,
//         parseNewData.number,
//         parseNewData.role,
//         parseNewData.admin,
//         record_id,
//       ]);
//     }
//   }
//   return lastUndoneAction;
// }

// // undo 라우터
// router.post("/undo", verifyToken, async (req, res) => {
//   const userId = req.userId;
//   try {
//     console.log("[REQUEST] /undo 요청 - userId:", userId);
//     const undoneAction = await undo(userId);
//     res.status(200).json({ message: "Undo 성공", action: undoneAction });
//   } catch (error) {
//     console.error("[ERROR] /undo 실패:", error.message);
//     res.status(400).json({ message: error.message });
//   }
// });

// // redo 라우터
// router.post("/redo", verifyToken, async (req, res) => {
//   const userId = req.userId;
//   try {
//     console.log("[REQUEST] /redo 요청 - userId:", userId);
//     const redoneAction = await redo(userId);
//     res.status(200).json({ message: "Redo 성공", action: redoneAction });
//   } catch (error) {
//     console.error("[ERROR] /redo 실패:", error.message);
//     res.status(400).json({ message: error.message });
//   }
// });

const undoLastAction = async (req, res) => {
  try {
      // undo 프로시저 호출
      await db.query('CALL undo_last_action();');
      res.status(200).json({ message: 'Undo successful.' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
  }
};

const redoLastAction = async (req, res) => {
  try {
      // redo 프로시저 호출
      await db.query('CALL redo_last_action();');
      res.status(200).json({ message: 'Redo successful.' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
  }
};

// Express.js 예시
router.post('/undo', undoLastAction);
router.post('/redo', redoLastAction);


module.exports = router;
