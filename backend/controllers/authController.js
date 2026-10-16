const User = require('../models/User');
const Member = require('../models/Member');
const jwt = require('jsonwebtoken');

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_library_jwt_key_2026_xyz987', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, studentId, department, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.'
      });
    }

    // Default role is student unless specified as librarian or admin
    const userRole = role === 'admin' || role === 'librarian' ? role : 'student';

    // If student, check studentId uniqueness
    if (userRole === 'student' && studentId) {
      const existingId = await User.findOne({ studentId });
      if (existingId) {
        return res.status(400).json({
          success: false,
          message: 'A student with this Student ID already exists.'
        });
      }
    }

    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
      studentId: studentId || (userRole === 'student' ? `STU-${Date.now().toString().slice(-5)}` : undefined),
      department: department || 'General',
      phone: phone || ''
    });

    // If student role, ensure a Member record is linked or created
    if (user.role === 'student') {
      let member = await Member.findOne({
        $or: [{ email: user.email }, { studentId: user.studentId }]
      });

      if (!member) {
        member = await Member.create({
          studentId: user.studentId,
          name: user.name,
          email: user.email,
          department: user.department,
          phone: user.phone || 'N/A',
          status: 'active',
          user: user._id
        });
      } else {
        member.user = user._id;
        await member.save();
      }
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        department: user.department,
        phone: user.phone
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    // Check for user (include password for comparison)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password does not match.'
      });
    }

    // Check if there is a linked member record for student
    let memberData = null;
    if (user.role === 'student') {
      memberData = await Member.findOne({
        $or: [{ user: user._id }, { email: user.email }, { studentId: user.studentId }]
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        department: user.department,
        phone: user.phone,
        memberId: memberData ? memberData._id : null
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    let memberData = null;
    if (user.role === 'student') {
      memberData = await Member.findOne({
        $or: [{ user: user._id }, { email: user.email }, { studentId: user.studentId }]
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        department: user.department,
        phone: user.phone,
        avatar: user.avatar,
        memberId: memberData ? memberData._id : null,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, department, avatar } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (department) user.department = department;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    // If student, synchronize member record too
    if (user.role === 'student') {
      await Member.findOneAndUpdate(
        { $or: [{ user: user._id }, { email: user.email }] },
        { name: user.name, phone: user.phone, department: user.department }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        department: user.department,
        phone: user.phone,
        avatar: user.avatar
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};
