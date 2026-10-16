const Book = require('../models/Book');
const Transaction = require('../models/Transaction');

// @desc    Get all books with search, filters, pagination and sorting
// @route   GET /api/books
// @access  Public (or Private)
exports.getBooks = async (req, res, next) => {
  try {
    const {
      q,
      category,
      available,
      sort,
      page = 1,
      limit = 10
    } = req.query;

    const query = {};

    // Search query across title, author, isbn, category
    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { author: searchRegex },
        { isbn: searchRegex },
        { category: searchRegex },
        { publisher: searchRegex }
      ];
    }

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Availability filter
    if (available === 'true') {
      query.availableCopies = { $gt: 0 };
    } else if (available === 'false') {
      query.availableCopies = { $eq: 0 };
    }

    // Sorting
    let sortOption = { createdAt: -1 };
    if (sort === 'title-asc') sortOption = { title: 1 };
    else if (sort === 'title-desc') sortOption = { title: -1 };
    else if (sort === 'year-desc') sortOption = { publicationYear: -1 };
    else if (sort === 'year-asc') sortOption = { publicationYear: 1 };
    else if (sort === 'copies-desc') sortOption = { availableCopies: -1 };
    else if (sort === 'oldest') sortOption = { createdAt: 1 };

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await Book.countDocuments(query);
    const books = await Book.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: books.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      books
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single book by ID
// @route   GET /api/books/:id
// @access  Public
exports.getBookById = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Also get active borrow count
    const activeBorrows = await Transaction.countDocuments({
      book: book._id,
      status: { $in: ['issued', 'overdue'] }
    });

    res.status(200).json({
      success: true,
      book,
      activeBorrows
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new book
// @route   POST /api/books
// @access  Private (Admin/Librarian)
exports.createBook = async (req, res, next) => {
  try {
    const {
      title,
      isbn,
      author,
      category,
      publisher,
      publicationYear,
      description,
      coverImage,
      totalCopies,
      location
    } = req.body;

    // Check duplicate ISBN
    const existingBook = await Book.findOne({ isbn: isbn.toUpperCase().trim() });
    if (existingBook) {
      return res.status(400).json({
        success: false,
        message: `A book with ISBN "${isbn}" already exists.`
      });
    }

    const copies = parseInt(totalCopies, 10) || 1;

    const book = await Book.create({
      title,
      isbn: isbn.toUpperCase().trim(),
      author,
      category,
      publisher,
      publicationYear,
      description,
      coverImage: coverImage || undefined,
      totalCopies: copies,
      availableCopies: copies,
      location: location || 'Main Section'
    });

    res.status(201).json({
      success: true,
      message: 'Book added successfully',
      book
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update book
// @route   PUT /api/books/:id
// @access  Private (Admin/Librarian)
exports.updateBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    const {
      title,
      isbn,
      author,
      category,
      publisher,
      publicationYear,
      description,
      coverImage,
      totalCopies,
      location
    } = req.body;

    // Check ISBN uniqueness if changed
    if (isbn && isbn.toUpperCase().trim() !== book.isbn) {
      const duplicate = await Book.findOne({ isbn: isbn.toUpperCase().trim() });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `ISBN "${isbn}" is already registered to another book.`
        });
      }
      book.isbn = isbn.toUpperCase().trim();
    }

    // Handle totalCopies modification
    if (totalCopies !== undefined) {
      const newTotal = parseInt(totalCopies, 10);
      const currentlyIssued = book.totalCopies - book.availableCopies;

      if (newTotal < currentlyIssued) {
        return res.status(400).json({
          success: false,
          message: `Cannot decrease total copies to ${newTotal}. Currently ${currentlyIssued} copies are issued to students.`
        });
      }

      // Update available copies proportionally
      book.availableCopies = newTotal - currentlyIssued;
      book.totalCopies = newTotal;
    }

    if (title) book.title = title;
    if (author) book.author = author;
    if (category) book.category = category;
    if (publisher) book.publisher = publisher;
    if (publicationYear) book.publicationYear = publicationYear;
    if (description !== undefined) book.description = description;
    if (coverImage) book.coverImage = coverImage;
    if (location) book.location = location;

    await book.save();

    res.status(200).json({
      success: true,
      message: 'Book updated successfully',
      book
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete book
// @route   DELETE /api/books/:id
// @access  Private (Admin/Librarian)
exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check if book has active issued transactions
    const activeIssues = await Transaction.countDocuments({
      book: book._id,
      status: { $in: ['issued', 'overdue'] }
    });

    if (activeIssues > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete book. There are currently ${activeIssues} active issue(s) for this book.`
      });
    }

    await Book.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all distinct book categories
// @route   GET /api/books/meta/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Book.distinct('category');
    res.status(200).json({
      success: true,
      categories: categories.sort()
    });
  } catch (error) {
    next(error);
  }
};
