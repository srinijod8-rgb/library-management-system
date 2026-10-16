const Member = require('../models/Member');
const Transaction = require('../models/Transaction');

// @desc    Get all members with search, filters, pagination
// @route   GET /api/members
// @access  Private (Admin/Librarian)
exports.getMembers = async (req, res, next) => {
  try {
    const { q, status, department, page = 1, limit = 10 } = req.query;

    const query = {};

    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), 'i');
      query.$or = [
        { name: regex },
        { studentId: regex },
        { email: regex },
        { department: regex },
        { phone: regex }
      ];
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (department && department !== 'All') {
      query.department = department;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await Member.countDocuments(query);
    const members = await Member.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Calculate active borrowed books for each member
    const memberIds = members.map((m) => m._id);
    const activeTransactions = await Transaction.aggregate([
      {
        $match: {
          member: { $in: memberIds },
          status: { $in: ['issued', 'overdue'] }
        }
      },
      {
        $group: {
          _id: '$member',
          activeCount: { $sum: 1 }
        }
      }
    ]);

    const activeMap = {};
    activeTransactions.forEach((t) => {
      activeMap[t._id.toString()] = t.activeCount;
    });

    const enrichedMembers = members.map((m) => ({
      ...m.toObject(),
      activeBorrows: activeMap[m._id.toString()] || 0
    }));

    res.status(200).json({
      success: true,
      count: enrichedMembers.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      members: enrichedMembers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single member by ID
// @route   GET /api/members/:id
// @access  Private (Admin/Librarian/Student Owner)
exports.getMemberById = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    const activeBorrows = await Transaction.find({
      member: member._id,
      status: { $in: ['issued', 'overdue'] }
    }).populate('book');

    const pastBorrows = await Transaction.find({
      member: member._id,
      status: 'returned'
    })
      .populate('book')
      .sort({ returnDate: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      member,
      activeBorrows,
      pastBorrows
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new member
// @route   POST /api/members
// @access  Private (Admin/Librarian)
exports.createMember = async (req, res, next) => {
  try {
    const { studentId, name, email, department, phone, status } = req.body;

    const existingStudentId = await Member.findOne({ studentId: studentId.toUpperCase().trim() });
    if (existingStudentId) {
      return res.status(400).json({
        success: false,
        message: `A member with Student ID "${studentId}" already exists.`
      });
    }

    const existingEmail = await Member.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: `A member with email "${email}" already exists.`
      });
    }

    const member = await Member.create({
      studentId: studentId.toUpperCase().trim(),
      name,
      email: email.toLowerCase().trim(),
      department,
      phone,
      status: status || 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Member registered successfully',
      member
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update member
// @route   PUT /api/members/:id
// @access  Private (Admin/Librarian)
exports.updateMember = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    const { studentId, name, email, department, phone, status } = req.body;

    if (studentId && studentId.toUpperCase().trim() !== member.studentId) {
      const duplicate = await Member.findOne({ studentId: studentId.toUpperCase().trim() });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Student ID "${studentId}" is already used by another member.`
        });
      }
      member.studentId = studentId.toUpperCase().trim();
    }

    if (email && email.toLowerCase().trim() !== member.email) {
      const duplicate = await Member.findOne({ email: email.toLowerCase().trim() });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Email "${email}" is already used by another member.`
        });
      }
      member.email = email.toLowerCase().trim();
    }

    if (name) member.name = name;
    if (department) member.department = department;
    if (phone) member.phone = phone;
    if (status) member.status = status;

    await member.save();

    res.status(200).json({
      success: true,
      message: 'Member updated successfully',
      member
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete member
// @route   DELETE /api/members/:id
// @access  Private (Admin/Librarian)
exports.deleteMember = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    const activeBorrows = await Transaction.countDocuments({
      member: member._id,
      status: { $in: ['issued', 'overdue'] }
    });

    if (activeBorrows > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete member. Member currently has ${activeBorrows} unreturned book(s).`
      });
    }

    await Member.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Member deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get member borrowing history
// @route   GET /api/members/:id/history
// @access  Private
exports.getMemberHistory = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ member: req.params.id })
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
