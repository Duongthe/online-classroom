const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Assignment = require('../models/Assignment');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. Đăng ký tài khoản
exports.register = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email này đã được sử dụng!' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      role: role || 'Student',
    });

    await newUser.save();
    res.status(201).json({ message: 'Đăng ký tài khoản thành công!' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi đăng ký!', error: error.message });
  }
};

// 2. Đăng nhập (Có kiểm tra trạng thái Khóa tài khoản)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không chính xác!' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: 'Tài khoản của bạn đã bị Quản trị viên khóa!' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không chính xác!' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Đăng nhập thành công!',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi đăng nhập!', error: error.message });
  }
};

// 3. Lấy thông tin hồ sơ & thống kê cá nhân
exports.getProfileStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
    }

    let stats = {};

    if (user.role === 'Student') {
      const enrollments = await Enrollment.find({ student: user._id }).populate('course', 'title');
      const courseIds = enrollments.map((e) => e.course?._id).filter(Boolean);
      const assignments = await Assignment.find({ course: { $in: courseIds } }).populate('course', 'title');

      let submittedCount = 0;
      let totalGrade = 0;
      let gradedCount = 0;
      const upcomingAssignments = [];

      assignments.forEach((assign) => {
        const mySub = assign.submissions.find((s) => s.student.toString() === user._id.toString());
        if (mySub) {
          submittedCount++;
          if (mySub.grade !== null && mySub.grade !== undefined) {
            totalGrade += mySub.grade;
            gradedCount++;
          }
        } else if (assign.dueDate && new Date(assign.dueDate) >= new Date()) {
          upcomingAssignments.push({
            _id: assign._id,
            title: assign.title,
            courseTitle: assign.course?.title,
            courseId: assign.course?._id,
            dueDate: assign.dueDate,
          });
        }
      });

      stats = {
        enrolledCoursesCount: courseIds.length,
        totalAssignments: assignments.length,
        submittedCount,
        averageGrade: gradedCount > 0 ? Number((totalGrade / gradedCount).toFixed(2)) : null,
        upcomingAssignments: upcomingAssignments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 5),
      };
    } else {
      const courseFilter = user.role === 'Admin' ? {} : { teacher: user._id };
      const courses = await Course.find(courseFilter);
      const courseIds = courses.map((c) => c._id);

      const totalStudents = await Enrollment.countDocuments({ course: { $in: courseIds } });
      const assignments = await Assignment.find({ course: { $in: courseIds } });

      let pendingGradesCount = 0;
      assignments.forEach((assign) => {
        assign.submissions.forEach((sub) => {
          if (sub.grade === null || sub.grade === undefined) {
            pendingGradesCount++;
          }
        });
      });

      stats = {
        managedCoursesCount: courses.length,
        totalStudents,
        totalAssignments: assignments.length,
        pendingGradesCount,
      };
    }

    res.status(200).json({ user, stats });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi tải dữ liệu hồ sơ!', error: error.message });
  }
};

// 4. Cập nhật họ tên cá nhân
exports.updateProfile = async (req, res) => {
  try {
    const { fullName } = req.body;
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ message: 'Họ tên không được để trống!' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { fullName: fullName.trim() },
      { new: true }
    ).select('-password');

    res.status(200).json({
      message: 'Cập nhật thông tin thành công!',
      user: {
        id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi cập nhật thông tin!', error: error.message });
  }
};

// 5. Đổi mật khẩu
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự!' });
    }

    const user = await User.findById(req.user.id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác!' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: 'Đổi mật khẩu thành công!' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi đổi mật khẩu!', error: error.message });
  }
};

// 6. [ADMIN] Lấy danh sách toàn bộ người dùng trên hệ thống
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy danh sách người dùng!', error: error.message });
  }
};

// 7. [ADMIN] Khóa / Mở khóa tài khoản người dùng
exports.toggleUserStatus = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
    }

    if (targetUser._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Không thể tự khóa tài khoản của chính mình!' });
    }

    targetUser.isActive = !targetUser.isActive;
    await targetUser.save();

    res.status(200).json({
      message: targetUser.isActive ? 'Đã mở khóa tài khoản!' : 'Đã khóa tài khoản thành công!',
      user: {
        _id: targetUser._id,
        fullName: targetUser.fullName,
        email: targetUser.email,
        role: targetUser.role,
        isActive: targetUser.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi cập nhật trạng thái tài khoản!', error: error.message });
  }
};
// 8. [ADMIN] Tạo tài khoản mới (Cấp trực tiếp tài khoản Teacher / Student / Admin)
exports.adminCreateUser = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;
    if (!fullName || !email || !password || password.length < 6) {
      return res.status(400).json({ message: 'Vui lòng nhập đủ thông tin (mật khẩu >= 6 ký tự)!' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email này đã tồn tại trên hệ thống!' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role || 'Student',
      isActive: true,
    });

    res.status(201).json({
      message: 'Tạo tài khoản mới thành công!',
      user: {
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi tạo tài khoản!', error: error.message });
  }
};

// 9. [ADMIN] Chỉnh sửa thông tin & Phân quyền (Role) người dùng
exports.adminUpdateUser = async (req, res) => {
  try {
    const { fullName, email, role } = req.body;
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
    }

    if (targetUser._id.toString() === req.user.id && role && role !== 'Admin') {
      return res.status(400).json({ message: 'Không thể tự hạ quyền Admin của chính mình!' });
    }

    if (email && email.toLowerCase().trim() !== targetUser.email) {
      const emailExists = await User.findOne({ email: email.toLowerCase().trim() });
      if (emailExists) {
        return res.status(400).json({ message: 'Email mới đã được tài khoản khác sử dụng!' });
      }
      targetUser.email = email.toLowerCase().trim();
    }

    if (fullName) targetUser.fullName = fullName.trim();
    if (role) targetUser.role = role;

    await targetUser.save();

    res.status(200).json({
      message: 'Cập nhật thông tin & phân quyền thành công!',
      user: {
        _id: targetUser._id,
        fullName: targetUser.fullName,
        email: targetUser.email,
        role: targetUser.role,
        isActive: targetUser.isActive,
        createdAt: targetUser.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi cập nhật người dùng!', error: error.message });
  }
};

// 10. [ADMIN] Đặt lại mật khẩu cho người dùng (Reset Password)
exports.adminResetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự!' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
    }

    const salt = await bcrypt.genSalt(10);
    targetUser.password = await bcrypt.hash(newPassword, salt);
    await targetUser.save();

    res.status(200).json({ message: `Đã đặt lại mật khẩu cho ${targetUser.fullName}!` });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi đặt lại mật khẩu!', error: error.message });
  }
};

// 11. [ADMIN] Xóa vĩnh viễn tài khoản người dùng
exports.adminDeleteUser = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
    }

    if (targetUser._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Không thể tự xóa tài khoản của chính mình!' });
    }

    // Dọn dẹp dữ liệu ghi danh của sinh viên nếu có
    await Enrollment.deleteMany({ student: targetUser._id });
    await targetUser.deleteOne();

    res.status(200).json({ message: 'Đã xóa tài khoản khỏi hệ thống!' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi xóa tài khoản!', error: error.message });
  }
};