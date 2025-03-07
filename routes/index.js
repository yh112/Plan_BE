const express = require("express");
const router = express.Router();
const authRouter = require("./auth");
const folderRouter = require("./folders");
const planRouter = require("./plans");
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: 회원 가입, 로그인 처리
 */

/**
 * @swagger
 * tags:
 *   name: Folders
 *   description: 폴더 생성, 조회
 */

/**
 * @swagger
 * tags:
 *   name: Plans
 *   description: 게시글 생성, 조회, 수정, 삭제
 */

router.use("/auth", authRouter);
router.use("/folders", folderRouter);
router.use("/plans", planRouter);

module.exports = router;
