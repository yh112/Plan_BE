const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/middleware");
const db = require("../db");

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
