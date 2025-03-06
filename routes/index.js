const express = require("express");
const router = express.Router();
const userRouter = require("./user");
const folderRouter = require("./folder");
const planRouter = require("./plan");
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: 회원 가입, 로그인 처리
 */

/**
 * @swagger
 * tags:
 *   name: Folders
 *   description: 폴더 추가 조회
 */

/**
 * @swagger
 * tags:
 *   name: Plans
 *   description: 폴더 추가 조회
 */

router.use("/user", userRouter);
router.use("/folder", folderRouter);
router.use("/plan", planRouter);

module.exports = router;
