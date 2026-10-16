const express = require('express');
const router = express.Router();
const {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  getMemberHistory
} = require('../controllers/memberController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Student history can be viewed by student themselves or admin/librarian
router.get('/:id/history', getMemberHistory);
router.get('/:id', getMemberById);

// Admin & Librarian management routes
router.get('/', authorize('admin', 'librarian'), getMembers);
router.post('/', authorize('admin', 'librarian'), createMember);
router.put('/:id', authorize('admin', 'librarian'), updateMember);
router.delete('/:id', authorize('admin', 'librarian'), deleteMember);

module.exports = router;
