const express = require('express');
const router = express.Router();
const {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getCategories
} = require('../controllers/bookController');
const { protect, authorize } = require('../middleware/auth');

// Public or Protected routes
router.get('/meta/categories', getCategories);
router.get('/', getBooks);
router.get('/:id', getBookById);

// Admin / Librarian only
router.post('/', protect, authorize('admin', 'librarian'), createBook);
router.put('/:id', protect, authorize('admin', 'librarian'), updateBook);
router.delete('/:id', protect, authorize('admin', 'librarian'), deleteBook);

module.exports = router;
