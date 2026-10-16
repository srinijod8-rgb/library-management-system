const express = require('express');
const router = express.Router();
const {
  issueBook,
  returnBook,
  getTransactions,
  getOverdueTransactions,
  getMemberTransactions
} = require('../controllers/transactionController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Circulation routes
router.get('/', getTransactions);
router.get('/overdue', getOverdueTransactions);
router.get('/member/:memberId', getMemberTransactions);

// Admin & Librarian operations
router.post('/issue', authorize('admin', 'librarian'), issueBook);
router.put('/:id/return', authorize('admin', 'librarian'), returnBook);

module.exports = router;
