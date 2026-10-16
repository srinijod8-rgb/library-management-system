const Book = require('../models/Book');
const Member = require('../models/Member');
const Transaction = require('../models/Transaction');

// @desc    Get aggregated report summaries
// @route   GET /api/reports/summary
// @access  Private (Admin/Librarian)
exports.getReportSummary = async (req, res, next) => {
  try {
    const now = new Date();

    const [
      totalBooks,
      copiesAgg,
      totalMembers,
      issuedCount,
      overdueCount,
      returnedCount,
      mostBorrowed
    ] = await Promise.all([
      Book.countDocuments(),
      Book.aggregate([
        {
          $group: {
            _id: null,
            totalCopies: { $sum: '$totalCopies' },
            availableCopies: { $sum: '$availableCopies' }
          }
        }
      ]),
      Member.countDocuments(),
      Transaction.countDocuments({ status: { $in: ['issued', 'overdue'] } }),
      Transaction.countDocuments({
        status: { $in: ['issued', 'overdue'] },
        dueDate: { $lt: now }
      }),
      Transaction.countDocuments({ status: 'returned' }),
      Transaction.aggregate([
        { $group: { _id: '$book', borrowCount: { $sum: 1 } } },
        { $sort: { borrowCount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'books',
            localField: '_id',
            foreignField: '_id',
            as: 'bookDetails'
          }
        },
        { $unwind: '$bookDetails' },
        {
          $project: {
            _id: 1,
            borrowCount: 1,
            title: '$bookDetails.title',
            isbn: '$bookDetails.isbn',
            author: '$bookDetails.author',
            category: '$bookDetails.category',
            availableCopies: '$bookDetails.availableCopies',
            totalCopies: '$bookDetails.totalCopies'
          }
        }
      ])
    ]);

    const totalCopies = copiesAgg.length > 0 ? copiesAgg[0].totalCopies : 0;
    const availableCopies = copiesAgg.length > 0 ? copiesAgg[0].availableCopies : 0;

    res.status(200).json({
      success: true,
      summary: {
        totalBooks,
        totalCopies,
        availableCopies,
        issuedCopies: totalCopies - availableCopies,
        totalMembers,
        issuedTransactions: issuedCount,
        overdueTransactions: overdueCount,
        returnedTransactions: returnedCount
      },
      mostBorrowed
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export specific report dataset to CSV
// @route   GET /api/reports/export
// @access  Private (Admin/Librarian)
exports.exportCsv = async (req, res, next) => {
  try {
    const { type = 'books' } = req.query;
    let csvData = '';
    let filename = `report_${type}_${Date.now()}.csv`;

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    if (type === 'books') {
      const books = await Book.find().sort({ title: 1 });
      const headers = ['ISBN', 'Title', 'Author', 'Category', 'Publisher', 'Year', 'Location', 'Total Copies', 'Available Copies'];
      const rows = books.map((b) => [
        escapeCsv(b.isbn),
        escapeCsv(b.title),
        escapeCsv(b.author),
        escapeCsv(b.category),
        escapeCsv(b.publisher),
        escapeCsv(b.publicationYear),
        escapeCsv(b.location),
        escapeCsv(b.totalCopies),
        escapeCsv(b.availableCopies)
      ]);
      csvData = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    } else if (type === 'members') {
      const members = await Member.find().sort({ name: 1 });
      const headers = ['Student ID', 'Name', 'Email', 'Department', 'Phone', 'Status', 'Registered Date'];
      const rows = members.map((m) => [
        escapeCsv(m.studentId),
        escapeCsv(m.name),
        escapeCsv(m.email),
        escapeCsv(m.department),
        escapeCsv(m.phone),
        escapeCsv(m.status),
        escapeCsv(new Date(m.createdAt).toLocaleDateString())
      ]);
      csvData = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    } else if (type === 'issued') {
      const issued = await Transaction.find({ status: { $in: ['issued', 'overdue'] } })
        .populate('book')
        .populate('member')
        .populate('issuedBy', 'name');
      const headers = ['Transaction ID', 'Book Title', 'ISBN', 'Student ID', 'Student Name', 'Department', 'Issue Date', 'Due Date', 'Status'];
      const rows = issued.map((t) => [
        escapeCsv(t._id),
        escapeCsv(t.book ? t.book.title : 'Deleted Book'),
        escapeCsv(t.book ? t.book.isbn : 'N/A'),
        escapeCsv(t.member ? t.member.studentId : 'N/A'),
        escapeCsv(t.member ? t.member.name : 'N/A'),
        escapeCsv(t.member ? t.member.department : 'N/A'),
        escapeCsv(new Date(t.issueDate).toLocaleDateString()),
        escapeCsv(new Date(t.dueDate).toLocaleDateString()),
        escapeCsv(t.status)
      ]);
      csvData = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    } else if (type === 'overdue') {
      const now = new Date();
      const overdue = await Transaction.find({
        status: { $in: ['issued', 'overdue'] },
        dueDate: { $lt: now }
      })
        .populate('book')
        .populate('member');
      const headers = ['Book Title', 'Student ID', 'Student Name', 'Student Phone', 'Student Email', 'Due Date', 'Days Overdue', 'Est. Fine ($)'];
      const rows = overdue.map((t) => {
        const diff = now.getTime() - new Date(t.dueDate).getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return [
          escapeCsv(t.book ? t.book.title : 'Deleted Book'),
          escapeCsv(t.member ? t.member.studentId : 'N/A'),
          escapeCsv(t.member ? t.member.name : 'N/A'),
          escapeCsv(t.member ? t.member.phone : 'N/A'),
          escapeCsv(t.member ? t.member.email : 'N/A'),
          escapeCsv(new Date(t.dueDate).toLocaleDateString()),
          escapeCsv(days),
          escapeCsv((days * 1.0).toFixed(2))
        ];
      });
      csvData = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    } else {
      // Complete History
      const history = await Transaction.find()
        .populate('book')
        .populate('member')
        .populate('issuedBy', 'name')
        .sort({ createdAt: -1 });
      const headers = ['Transaction ID', 'Book Title', 'Student ID', 'Student Name', 'Issue Date', 'Due Date', 'Return Date', 'Status', 'Fine Amount'];
      const rows = history.map((t) => [
        escapeCsv(t._id),
        escapeCsv(t.book ? t.book.title : 'N/A'),
        escapeCsv(t.member ? t.member.studentId : 'N/A'),
        escapeCsv(t.member ? t.member.name : 'N/A'),
        escapeCsv(new Date(t.issueDate).toLocaleDateString()),
        escapeCsv(new Date(t.dueDate).toLocaleDateString()),
        escapeCsv(t.returnDate ? new Date(t.returnDate).toLocaleDateString() : 'Not Returned'),
        escapeCsv(t.status),
        escapeCsv(t.fineAmount ? `$${t.fineAmount.toFixed(2)}` : '$0.00')
      ]);
      csvData = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvData);
  } catch (error) {
    next(error);
  }
};
