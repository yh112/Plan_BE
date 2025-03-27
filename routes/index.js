const express = require("express");
const router = express.Router();
const authRouter = require("./auth");
const folderRouter = require("./folders");
const historyRouter = require("./history");

router.use("/auth", authRouter);
router.use("/folders", folderRouter);
router.use("/history", historyRouter);

module.exports = router;
