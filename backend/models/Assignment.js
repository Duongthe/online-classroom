const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  course: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true 
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  dueDate: { type: Date }, // Hạn nộp
  submissions: [{ // Danh sách sinh viên nộp bài
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fileUrl: String,
    textContent: String,
    grade: Number, // Điểm số
    feedback: { type: String, default: '' }, // Nhận xét của giảng viên
    submittedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);