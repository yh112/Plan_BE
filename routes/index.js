const express = require("express");
const router = express.Router();
const authRouter = require("./auth");
const folderRouter = require("./folders");
const historyRouter = require("./history");
const searchRouter = require("./search");

router.use("/auth", authRouter);
router.use("/folders", folderRouter);
router.use("/history", historyRouter);
router.use("/search", searchRouter);

module.exports = router;
