const Book = require('../models/Book');
const Member = require('../models/Member');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
exports.getStats = async (req, res, next) => {
  try {
    const now = new Date();

    // Check if current user is student
    if (req.user.role === 'student') {
      const studentMember = await Member.findOne({
        $or: [{ user: req.user._id }, { email: req.user.email }, { studentId: req.user.studentId }]
      });

      if (!studentMember) {
        return res.status(200).json({
          success: true,
          isStudent: true,
          stats: {
            activeBorrows: 0,
            overdueBorrows: 0,
            totalReturned: 0,
            totalFines: 0
          },
          recentTransactions: [],
          upcomingDue: []
        });
      }

      const [activeBorrows, overdueBorrows, returnedBorrows, recentTransactions] = await Promise.all([
        Transaction.find({
          member: studentMember._id,
          status: { $in: ['issued', 'overdue'] }
        }).populate('book'),
        Transaction.find({
          member: studentMember._id,
          status: { $in: ['issued', 'overdue'] },
          dueDate: { $lt: now }
        }).populate('book'),
        Transaction.countDocuments({
          member: studentMember._id,
          status: 'returned'
        }),
        Transaction.find({ member: studentMember._id })
          .populate('book')
          .sort({ createdAt: -1 })
          .limit(6)
      ]);

      const totalFines = overdueBorrows.reduce((sum, item) => {
        const diff = now.getTime() - new Date(item.dueDate).getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return sum + (days > 0 ? days * 1.0 : 0);
      }, 0);

      return res.status(200).json({
        success: true,
        isStudent: true,
        stats: {
          activeBorrows: activeBorrows.length,
          overdueBorrows: overdueBorrows.length,
          totalReturned: returnedBorrows,
          totalFines
        },
        activeList: activeBorrows,
        recentTransactions
      });
    }

    // Admin / Librarian comprehensive dashboard stats
    const [
      totalBooks,
      copiesAgg,
      totalMembers,
      issuedBooks,
      overdueCount,
      recentTransactions,
      categoryDistribution
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
      Transaction.find()
        .populate('book', 'title author coverImage')
        .populate('member', 'name studentId department')
        .populate('issuedBy', 'name role')
        .sort({ createdAt: -1 })
        .limit(8),
      Book.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalCopies: { $sum: '$totalCopies' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 6 }
      ])
    ]);

    const totalCopies = copiesAgg.length > 0 ? copiesAgg[0].totalCopies : 0;
    const availableCopies = copiesAgg.length > 0 ? copiesAgg[0].availableCopies : 0;

    // Monthly borrowing trends for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlyStats = await Transaction.aggregate([
      {
        $match: {
          issueDate: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$issueDate' },
            month: { $month: '$issueDate' }
          },
          issuedCount: { $sum: 1 },
          returnedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'returned'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedTrends = monthlyStats.map((item) => ({
      month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      issued: item.issuedCount,
      returned: item.returnedCount
    }));

    res.status(200).json({
      success: true,
      isStudent: false,
      stats: {
        totalBooks,
        totalCopies,
        availableCopies,
        issuedBooks,
        registeredMembers: totalMembers,
        overdueBooks: overdueCount
      },
      recentTransactions,
      categoryDistribution: categoryDistribution.map((c) => ({
        category: c._id || 'Uncategorized',
        count: c.count,
        copies: c.totalCopies
      })),
      monthlyTrends: formattedTrends
    });
  } catch (error) {
    next(error);
  }
};
