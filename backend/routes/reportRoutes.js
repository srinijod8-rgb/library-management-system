const express = require('express');
const router = express.Router();
const {
  getReportSummary,
  exportCsv
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin', 'librarian'));

router.get('/summary', getReportSummary);
router.get('/export', exportCsv);

module.exports = router;
