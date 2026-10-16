const Transaction = require('../models/Transaction');
const Book = require('../models/Book');
const Member = require('../models/Member');

// Helper to calculate overdue fine (e.g. $1 or $0.50/day)
const DAILY_FINE_RATE = 1.0; // $1.00 per day overdue

// @desc    Issue a book to a member
// @route   POST /api/transactions/issue
// @access  Private (Admin/Librarian)
exports.issueBook = async (req, res, next) => {
  try {
    const { bookId, memberId, dueDate, remarks } = req.body;

    if (!bookId || !memberId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both bookId and memberId'
      });
    }

    // Check member
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }
    if (member.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Member status is '${member.status}'. Only active members can borrow books.`
      });
    }

    // Check book and available copies
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    if (book.availableCopies <= 0) {
      return res.status(400).json({
        success: false,
        message: `Book "${book.title}" is currently out of stock (0 available copies).`
      });
    }

    // Check if this student already has an active issue of this SAME book
    const existingActiveIssue = await Transaction.findOne({
      book: bookId,
      member: memberId,
      status: { $in: ['issued', 'overdue'] }
    });

    if (existingActiveIssue) {
      return res.status(400).json({
        success: false,
        message: `Member "${member.name}" already has an active borrow for "${book.title}". Duplicate active issues are not permitted.`
      });
    }

    // Set due date (defaults to 14 days from now if not specified)
    const issueDate = new Date();
    let calculatedDueDate;
    if (dueDate) {
      calculatedDueDate = new Date(dueDate);
      if (calculatedDueDate <= issueDate) {
        return res.status(400).json({
          success: false,
          message: 'Due date must be after today.'
        });
      }
    } else {
      calculatedDueDate = new Date();
      calculatedDueDate.setDate(calculatedDueDate.getDate() + 14);
    }

    // Atomically decrement available copies
    const updatedBook = await Book.findOneAndUpdate(
      { _id: bookId, availableCopies: { $gt: 0 } },
      { $inc: { availableCopies: -1 } },
      { new: true }
    );

    if (!updatedBook) {
      return res.status(400).json({
        success: false,
        message: 'Could not reserve book copy. Stock may have just been depleted.'
      });
    }

    const transaction = await Transaction.create({
      book: bookId,
      member: memberId,
      issuedBy: req.user._id,
      issueDate,
      dueDate: calculatedDueDate,
      status: 'issued',
      remarks: remarks || ''
    });

    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('book')
      .populate('member')
      .populate('issuedBy', 'name email role');

    res.status(201).json({
      success: true,
      message: `Book "${book.title}" successfully issued to ${member.name}.`,
      transaction: populatedTransaction,
      remainingCopies: updatedBook.availableCopies
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Return a book
// @route   PUT /api/transactions/:id/return
// @access  Private (Admin/Librarian)
exports.returnBook = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('book')
      .populate('member');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (transaction.status === 'returned') {
      return res.status(400).json({
        success: false,
        message: `This book was already returned on ${new Date(transaction.returnDate).toLocaleDateString()}.`
      });
    }

    const returnDate = new Date();
    transaction.returnDate = returnDate;
    transaction.status = 'returned';

    // Calculate overdue fine if applicable
    const dueTime = new Date(transaction.dueDate).getTime();
    const returnTime = returnDate.getTime();
    if (returnTime > dueTime) {
      const diffTime = returnTime - dueTime;
      const overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      transaction.fineAmount = overdueDays * DAILY_FINE_RATE;
    } else {
      transaction.fineAmount = 0;
    }

    if (req.body.remarks) {
      transaction.remarks = req.body.remarks;
    }

    await transaction.save();

    // Increment available copies for book
    await Book.findByIdAndUpdate(transaction.book._id, {
      $inc: { availableCopies: 1 }
    });

    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('book')
      .populate('member')
      .populate('issuedBy', 'name email role');

    res.status(200).json({
      success: true,
      message: `Book "${transaction.book.title}" successfully returned! ${
        transaction.fineAmount > 0
          ? `Overdue fine charged: $${transaction.fineAmount.toFixed(2)}.`
          : 'Returned on time.'
      }`,
      transaction: populatedTransaction
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get transactions with search, status filter, and pagination
// @route   GET /api/transactions
// @access  Private
exports.getTransactions = async (req, res, next) => {
  try {
    const { status, memberId, bookId, q, page = 1, limit = 10 } = req.query;

    const query = {};

    // Role-based scoping: If student, restrict to their member id
    if (req.user.role === 'student') {
      const studentMember = await Member.findOne({
        $or: [{ user: req.user._id }, { email: req.user.email }, { studentId: req.user.studentId }]
      });
      if (!studentMember) {
        return res.status(200).json({
          success: true,
          count: 0,
          total: 0,
          totalPages: 1,
          currentPage: 1,
          transactions: []
        });
      }
      query.member = studentMember._id;
    } else if (memberId) {
      query.member = memberId;
    }

    if (bookId) {
      query.book = bookId;
    }

    const now = new Date();

    if (status && status !== 'all') {
      if (status === 'overdue') {
        query.status = { $ne: 'returned' };
        query.dueDate = { $lt: now };
      } else {
        query.status = status;
      }
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Search filter across book title / student name / studentId
    let filterQuery = { ...query };
    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      const [matchingBooks, matchingMembers] = await Promise.all([
        Book.find({ $or: [{ title: searchRegex }, { isbn: searchRegex }] }).select('_id'),
        Member.find({ $or: [{ name: searchRegex }, { studentId: searchRegex }] }).select('_id')
      ]);

      const bookIds = matchingBooks.map((b) => b._id);
      const memberIds = matchingMembers.map((m) => m._id);

      filterQuery.$or = [
        { book: { $in: bookIds } },
        { member: { $in: memberIds } }
      ];
    }

    const total = await Transaction.countDocuments(filterQuery);
    const transactions = await Transaction.find(filterQuery)
      .populate('book')
      .populate('member')
      .populate('issuedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Annotate dynamic overdue status & fine for issued items past due date
    const enrichedTransactions = transactions.map((t) => {
      const obj = t.toObject();
      if (obj.status === 'issued' && new Date(obj.dueDate) < now) {
        obj.isOverdue = true;
        const diff = now.getTime() - new Date(obj.dueDate).getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        obj.overdueDays = days;
        obj.estimatedFine = days * DAILY_FINE_RATE;
      } else {
        obj.isOverdue = false;
        obj.overdueDays = 0;
        obj.estimatedFine = obj.fineAmount || 0;
      }
      return obj;
    });

    res.status(200).json({
      success: true,
      count: enrichedTransactions.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      transactions: enrichedTransactions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get overdue transactions
// @route   GET /api/transactions/overdue
// @access  Private (Admin/Librarian/Student)
exports.getOverdueTransactions = async (req, res, next) => {
  try {
    const now = new Date();
    const query = {
      status: { $ne: 'returned' },
      dueDate: { $lt: now }
    };

    if (req.user.role === 'student') {
      const studentMember = await Member.findOne({
        $or: [{ user: req.user._id }, { email: req.user.email }, { studentId: req.user.studentId }]
      });
      if (!studentMember) {
        return res.status(200).json({ success: true, count: 0, transactions: [] });
      }
      query.member = studentMember._id;
    }

    const transactions = await Transaction.find(query)
      .populate('book')
      .populate('member')
      .populate('issuedBy', 'name email role')
      .sort({ dueDate: 1 });

    const enriched = transactions.map((t) => {
      const obj = t.toObject();
      const diff = now.getTime() - new Date(obj.dueDate).getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      obj.overdueDays = days;
      obj.estimatedFine = days * DAILY_FINE_RATE;
      return obj;
    });

    res.status(200).json({
      success: true,
      count: enriched.length,
      transactions: enriched
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get member transactions
// @route   GET /api/transactions/member/:memberId
// @access  Private
exports.getMemberTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ member: req.params.memberId })
      .populate('book')
      .populate('issuedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      transactions
    });
  } catch (error) {
    next(error);
  }
};
