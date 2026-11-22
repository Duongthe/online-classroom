const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// 1. Giảng viên / Admin giao bài tập mới
exports.createAssignment = async (req, res) => {
  try {
    const { title, description, dueDate, courseId } = req.body;

    if (!title || !description || !courseId) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin bài tập!' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Không tìm thấy khóa học!' });
    }

    if (req.user.role !== 'Admin' && course.teacher?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Chỉ giảng viên phụ trách lớp mới được giao bài tập!' });
    }

    const newAssignment = await Assignment.create({
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate || null,
      course: courseId,
    });

    res.status(201).json({
      message: 'Giao bài tập mới thành công!',
      assignment: newAssignment,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi tạo bài tập!', error: error.message });
  }
};

// 2. Sinh viên nộp bài tập (hoặc nộp lại)
exports.submitAssignment = async (req, res) => {
  try {
    const { fileUrl, textContent } = req.body;
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Không tìm thấy bài tập!' });
    }

    if (!fileUrl?.trim() && !textContent?.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập đường dẫn hoặc nội dung bài làm!' });
    }

    const isEnrolled = await Enrollment.findOne({
      student: req.user.id,
      course: assignment.course,
    });

    if (!isEnrolled && req.user.role === 'Student') {
      return res.status(403).json({ message: 'Bạn cần đăng ký tham gia lớp học trước khi nộp bài!' });
    }

    const existingSubIndex = assignment.submissions.findIndex(
      (sub) => sub.student?.toString() === req.user.id
    );

    if (existingSubIndex > -1) {
      assignment.submissions[existingSubIndex].fileUrl = fileUrl?.trim() || '';
      assignment.submissions[existingSubIndex].textContent = textContent?.trim() || '';
      assignment.submissions[existingSubIndex].submittedAt = new Date();
    } else {
      assignment.submissions.push({
        student: req.user.id,
        fileUrl: fileUrl?.trim() || '',
        textContent: textContent?.trim() || '',
        submittedAt: new Date(),
      });
    }

    await assignment.save();
    res.status(200).json({
      message: 'Nộp bài tập thành công!',
      assignment,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi nộp bài tập!', error: error.message });
  }
};

// 3. Giảng viên / Admin chấm điểm và nhận xét bài nộp
exports.gradeSubmission = async (req, res) => {
  try {
    const { submissionId, grade, feedback } = req.body;
    const assignment = await Assignment.findById(req.params.id).populate('course');

    if (!assignment) {
      return res.status(404).json({ message: 'Không tìm thấy bài tập!' });
    }

    if (req.user.role !== 'Admin' && assignment.course?.teacher?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Bạn không có quyền chấm điểm bài tập của lớp này!' });
    }

    const submission = assignment.submissions.id(submissionId);
    if (!submission) {
      return res.status(404).json({ message: 'Không tìm thấy bài nộp của sinh viên!' });
    }

    submission.grade = Number(grade);
    submission.feedback = feedback?.trim() || '';

    await assignment.save();
    res.status(200).json({
      message: 'Đã lưu điểm và nhận xét thành công!',
      assignment,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi chấm điểm!', error: error.message });
  }
};

// 4. Lấy bảng điểm tổng hợp tất cả bài tập của Sinh viên đang đăng nhập
exports.getMyGrades = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Lấy danh sách các lớp sinh viên đã ghi danh
    const enrollments = await Enrollment.find({ student: studentId }).populate({
      path: 'course',
      populate: { path: 'teacher', select: 'fullName email' },
    });

    const enrolledCourses = enrollments
      .filter((e) => e.course)
      .map((e) => e.course);

    const courseIds = enrolledCourses.map((c) => c._id);

    // Lấy toàn bộ bài tập thuộc các lớp sinh viên đã tham gia
    const assignments = await Assignment.find({ course: { $in: courseIds } })
      .populate('course', 'title')
      .sort({ createdAt: -1 });

    // Ghép trạng thái nộp bài & điểm số của riêng sinh viên này
    const gradeItems = assignments.map((assign) => {
      const mySub = assign.submissions?.find(
        (sub) => sub.student?.toString() === studentId
      );

      let status = 'NOT_SUBMITTED';
      if (mySub) {
        status =
          mySub.grade !== null && mySub.grade !== undefined
            ? 'GRADED'
            : 'SUBMITTED';
      }

      return {
        assignmentId: assign._id,
        assignmentTitle: assign.title,
        dueDate: assign.dueDate,
        courseId: assign.course?._id,
        courseTitle: assign.course?.title || 'Khóa học',
        status,
        grade: mySub?.grade ?? null,
        feedback: mySub?.feedback || '',
        fileUrl: mySub?.fileUrl || '',
        submittedAt: mySub?.submittedAt || null,
      };
    });

    // Tính thống kê & điểm trung bình các bài đã chấm
    const gradedItems = gradeItems.filter((item) => item.status === 'GRADED');
    const averageGrade =
      gradedItems.length > 0
        ? Number(
            (
              gradedItems.reduce((sum, item) => sum + Number(item.grade), 0) /
              gradedItems.length
            ).toFixed(2)
          )
        : null;

    res.status(200).json({
      summary: {
        totalCourses: enrolledCourses.length,
        totalAssignments: gradeItems.length,
        submittedCount: gradeItems.filter((i) => i.status !== 'NOT_SUBMITTED').length,
        gradedCount: gradedItems.length,
        averageGrade,
      },
      grades: gradeItems,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi tải bảng điểm cá nhân!', error: error.message });
  }
};