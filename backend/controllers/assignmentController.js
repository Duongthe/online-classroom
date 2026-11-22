const Assignment = require('../models/Assignment');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

// 1. Giảng viên giao bài tập mới (Ràng buộc đúng giảng viên chủ lớp)
exports.createAssignment = async (req, res) => {
  try {
    const { title, description, dueDate, courseId } = req.body;

    if (!title || !description || !courseId) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ tiêu đề, mô tả và mã khóa học!' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Không tìm thấy khóa học!' });
    }

    if (req.user.role !== 'Admin' && course.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Bạn không có quyền giao bài tập cho lớp của giảng viên khác!' });
    }

    const newAssignment = await Assignment.create({
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate || null,
      course: courseId,
    });

    res.status(201).json({
      message: 'Giao bài tập thành công!',
      assignment: newAssignment,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tạo bài tập!', error: error.message });
  }
};

// 2. Học viên nộp bài tập (Ràng buộc bắt buộc phải đăng ký khóa học trước)
exports.submitAssignment = async (req, res) => {
  try {
    const { fileUrl, textContent } = req.body;
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Không tìm thấy bài tập!' });
    }

    const isEnrolled = await Enrollment.findOne({
      course: assignment.course,
      student: req.user.id,
    });

    if (!isEnrolled) {
      return res.status(403).json({
        message: 'Bạn cần đăng ký tham gia khóa học trước khi nộp bài!',
      });
    }

    if (!fileUrl && !textContent) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đường dẫn bài làm hoặc nội dung trả lời!' });
    }

    const existingIndex = assignment.submissions.findIndex(
      (sub) => sub.student.toString() === req.user.id
    );

    if (existingIndex > -1) {
      assignment.submissions[existingIndex].fileUrl = fileUrl || '';
      assignment.submissions[existingIndex].textContent = textContent || '';
      assignment.submissions[existingIndex].submittedAt = Date.now();
    } else {
      assignment.submissions.push({
        student: req.user.id,
        fileUrl: fileUrl || '',
        textContent: textContent || '',
      });
    }

    await assignment.save();

    res.status(200).json({
      message: existingIndex > -1 ? 'Cập nhật bài nộp thành công!' : 'Nộp bài tập thành công!',
      assignment,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi nộp bài tập!', error: error.message });
  }
};

// 3. Giảng viên chấm điểm (Ràng buộc đúng giảng viên chủ lớp)
exports.gradeSubmission = async (req, res) => {
  try {
    const { submissionId, grade, feedback } = req.body;
    const assignment = await Assignment.findById(req.params.id).populate('course');

    if (!assignment) {
      return res.status(404).json({ message: 'Không tìm thấy bài tập!' });
    }

    if (req.user.role !== 'Admin' && assignment.course?.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Bạn không có quyền chấm điểm cho lớp của giảng viên khác!' });
    }

    const submission = assignment.submissions.id(submissionId);
    if (!submission) {
      return res.status(404).json({ message: 'Không tìm thấy bài nộp của học viên!' });
    }

    submission.grade = grade;
    submission.feedback = feedback || '';

    await assignment.save();

    res.status(200).json({
      message: 'Đã lưu điểm và nhận xét thành công!',
      assignment,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi chấm điểm!', error: error.message });
  }
};