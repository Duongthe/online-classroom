const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

exports.enrollCourse = async (req, res) => {
    try {
        const { courseId } = req.body;
        const studentId = req.user.id; // Lấy ID học viên từ Token (đã qua middleware)

        // 1. Kiểm tra khóa học có tồn tại không
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Không tìm thấy khóa học!' });
        }

        // 2. Kiểm tra xem học viên đã đăng ký khóa này chưa để tránh đăng ký trùng
        const existingEnrollment = await Enrollment.findOne({ student: studentId, course: courseId });
        if (existingEnrollment) {
            return res.status(400).json({ message: 'Bạn đã đăng ký khóa học này rồi!' });
        }

        // 3. Tiến hành lưu vào database
        const newEnrollment = new Enrollment({
            student: studentId,
            course: courseId
        });

        await newEnrollment.save();
        res.status(201).json({ 
            message: 'Đăng ký khóa học thành công!', 
            enrollment: newEnrollment 
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server!', error: error.message });
    }
};