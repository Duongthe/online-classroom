const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Enrollment = require('../models/Enrollment');
const Material = require('../models/Material');
const Message = require('../models/Message');
const User = require('../models/User');
const CourseRequest = require('../models/CourseRequest');

// 1. Lấy danh sách tất cả khóa học
exports.getAllCourses = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ],
      };
    }

    const courses = await Course.find(query)
      .populate('teacher', 'fullName email role')
      .sort({ createdAt: -1 });

    const coursesWithCounts = await Promise.all(
      courses.map(async (course) => {
        const enrollments = await Enrollment.find({ course: course._id }).select('student');
        return {
          ...course.toObject(),
          enrolledStudents: enrollments.map((e) => e.student),
        };
      })
    );

    res.status(200).json(coursesWithCounts);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy danh sách khóa học!', error: error.message });
  }
};

// 2. Lấy chi tiết 1 khóa học
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('teacher', 'fullName email');
    if (!course) {
      return res.status(404).json({ message: 'Không tìm thấy khóa học!' });
    }

    const assignments = await Assignment.find({ course: course._id })
      .populate('submissions.student', 'fullName email')
      .sort({ createdAt: -1 });

    const materials = await Material.find({ course: course._id }).sort({ createdAt: -1 });

    const enrollments = await Enrollment.find({ course: course._id })
      .populate('student', 'fullName email')
      .sort({ enrolledAt: -1 });

    const enrolledStudents = enrollments
      .filter((e) => e.student)
      .map((e) => ({
        _id: e.student._id,
        fullName: e.student.fullName,
        email: e.student.email,
        enrolledAt: e.enrolledAt,
      }));

    const isOwnerTeacher = course.teacher?._id?.toString() === req.user.id;
    const canManage = req.user.role === 'Admin' || isOwnerTeacher;
    const isEnrolled =
      canManage || enrolledStudents.some((s) => s._id.toString() === req.user.id);

    res.status(200).json({
      course,
      assignments,
      materials,
      enrolledStudents,
      isEnrolled,
      canManage,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy chi tiết khóa học!', error: error.message });
  }
};

// 3. Tạo khóa học mới
exports.createCourse = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ tên và mô tả khóa học!' });
    }

    const newCourse = await Course.create({
      title: title.trim(),
      description: description.trim(),
      teacher: req.user.role === 'Admin' ? null : req.user.id,
    });

    const populatedCourse = await newCourse.populate('teacher', 'fullName email role');
    res.status(201).json({
      message: 'Tạo khóa học mới thành công!',
      course: populatedCourse,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi tạo khóa học!', error: error.message });
  }
};

// 4. Admin vào từng lớp và Add / Đổi / Gỡ Giảng viên phụ trách
exports.assignTeacherToCourse = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Chỉ Admin mới có quyền gán giảng viên vào lớp!' });
    }

    const { teacherId } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học!' });
    }

    if (!teacherId) {
      course.teacher = null;
      await course.save();
      return res.status(200).json({
        message: 'Đã gỡ giảng viên khỏi lớp học!',
        course,
      });
    }

    const teacherUser = await User.findById(teacherId);
    if (!teacherUser || teacherUser.role !== 'Teacher') {
      return res.status(400).json({ message: 'Tài khoản được chọn không phải là Giảng viên!' });
    }

    course.teacher = teacherId;
    await course.save();

    const updatedCourse = await course.populate('teacher', 'fullName email role');
    res.status(200).json({
      message: `Đã thêm giảng viên ${teacherUser.fullName} vào lớp!`,
      course: updatedCourse,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi phân công giảng viên!', error: error.message });
  }
};

// 5. Cập nhật thông tin khóa học
exports.updateCourse = async (req, res) => {
  try {
    const { title, description } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Không tìm thấy khóa học!' });
    }

    if (req.user.role !== 'Admin' && course.teacher?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa khóa học này!' });
    }

    if (title) course.title = title.trim();
    if (description) course.description = description.trim();

    await course.save();
    const updatedCourse = await course.populate('teacher', 'fullName email role');

    res.status(200).json({
      message: 'Cập nhật khóa học thành công!',
      course: updatedCourse,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi cập nhật khóa học!', error: error.message });
  }
};

// 6. Xóa khóa học
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Không tìm thấy khóa học!' });
    }

    if (req.user.role !== 'Admin' && course.teacher?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa khóa học này!' });
    }

    await Assignment.deleteMany({ course: course._id });
    await Enrollment.deleteMany({ course: course._id });
    await Material.deleteMany({ course: course._id });
    await Message.deleteMany({ course: course._id });
    await course.deleteOne();

    res.status(200).json({ message: 'Đã xóa khóa học thành công!' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi xóa khóa học!', error: error.message });
  }
};

// 7. Thêm tài liệu học tập
exports.addCourseMaterial = async (req, res) => {
  try {
    const { title, type, url, description } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Không tìm thấy khóa học!' });
    }

    if (req.user.role !== 'Admin' && course.teacher?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Chỉ giảng viên phụ trách lớp mới được thêm tài liệu!' });
    }

    if (!title || !url) {
      return res.status(400).json({ message: 'Vui lòng nhập tiêu đề và đường dẫn tài liệu!' });
    }

    const material = await Material.create({
      course: req.params.id,
      title: title.trim(),
      type: type || 'Document',
      url: url.trim(),
      description: description?.trim() || '',
    });

    res.status(201).json({
      message: 'Thêm tài liệu học tập thành công!',
      material,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi thêm tài liệu!', error: error.message });
  }
};

// 8. Lấy lịch sử tin nhắn thảo luận của lớp học
exports.getCourseMessages = async (req, res) => {
  try {
    const messages = await Message.find({ course: req.params.id })
      .populate('sender', 'fullName role')
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi tải lịch sử thảo luận!', error: error.message });
  }
};

// 9. Giảng viên tạo phiếu yêu cầu mở lớp gửi Admin duyệt
exports.createCourseRequest = async (req, res) => {
  try {
    if (req.user.role !== 'Teacher') {
      return res.status(403).json({ message: 'Chỉ Giảng viên mới có thể gửi phiếu yêu cầu mở lớp!' });
    }

    const { title, description, note } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ tên lớp và mô tả đề xuất!' });
    }

    const newRequest = await CourseRequest.create({
      title: title.trim(),
      description: description.trim(),
      note: note?.trim() || '',
      teacher: req.user.id,
    });

    const populated = await newRequest.populate('teacher', 'fullName email');
    res.status(201).json({
      message: 'Đã gửi phiếu yêu cầu mở lớp! Vui lòng chờ Admin phê duyệt.',
      request: populated,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi gửi phiếu yêu cầu!', error: error.message });
  }
};

// 10. Giảng viên xem danh sách phiếu yêu cầu của chính mình
exports.getMyCourseRequests = async (req, res) => {
  try {
    const requests = await CourseRequest.find({ teacher: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi tải danh sách phiếu yêu cầu!', error: error.message });
  }
};

// 11. Admin lấy tất cả phiếu yêu cầu mở lớp của các Giảng viên
exports.getAllCourseRequests = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Chỉ Admin mới có quyền xem tất cả phiếu yêu cầu!' });
    }

    const requests = await CourseRequest.find()
      .populate('teacher', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi tải danh sách phiếu yêu cầu!', error: error.message });
  }
};

// 12. Admin Duyệt hoặc Từ chối phiếu yêu cầu mở lớp
exports.reviewCourseRequest = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Chỉ Admin mới có quyền duyệt phiếu!' });
    }

    const { status, adminNote } = req.body;
    const requestDoc = await CourseRequest.findById(req.params.requestId).populate('teacher', 'fullName email');

    if (!requestDoc) {
      return res.status(404).json({ message: 'Không tìm thấy phiếu yêu cầu!' });
    }

    if (requestDoc.status !== 'PENDING') {
      return res.status(400).json({ message: 'Phiếu yêu cầu này đã được xử lý trước đó!' });
    }

    requestDoc.status = status;
    requestDoc.adminNote = adminNote?.trim() || '';
    await requestDoc.save();

    let createdCourse = null;
    if (status === 'APPROVED') {
      createdCourse = await Course.create({
        title: requestDoc.title,
        description: requestDoc.description,
        teacher: requestDoc.teacher._id,
      });
      createdCourse = await createdCourse.populate('teacher', 'fullName email role');
    }

    res.status(200).json({
      message:
        status === 'APPROVED'
          ? `Đã duyệt phiếu và mở lớp "${requestDoc.title}" cho giảng viên ${requestDoc.teacher.fullName}!`
          : 'Đã từ chối phiếu yêu cầu mở lớp.',
      request: requestDoc,
      course: createdCourse,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi xử lý phiếu yêu cầu!', error: error.message });
  }
};