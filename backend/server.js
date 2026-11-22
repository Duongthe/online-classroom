const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

const Message = require('./models/Message');
const Enrollment = require('./models/Enrollment');
const User = require('./models/User');
const Course = require('./models/Course');

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully!'))
  .catch((err) => console.error('MongoDB connection error:', err.message));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/enrollments', require('./routes/enrollmentRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));

app.get('/', (req, res) => {
  res.send('EduSphere LMS API is running...');
});

io.on('connection', (socket) => {
  socket.on('join_course', (courseId) => {
    socket.join(courseId);
  });

  socket.on('send_message', async (data) => {
    try {
      const { courseId, senderId, content } = data;
      if (!courseId || !senderId || !content?.trim()) return;

      const [senderUser, course] = await Promise.all([
        User.findById(senderId),
        Course.findById(courseId),
      ]);
      if (!senderUser || !course) return;

      // Ràng buộc theo vai trò:
      // - Admin: được phép
      // - Teacher: phải là giảng viên phụ trách khóa học đó
      // - Student: phải đã ghi danh vào khóa học đó
      if (senderUser.role === 'Teacher' && course.teacher.toString() !== senderId) {
        return;
      }
      if (senderUser.role === 'Student') {
        const isEnrolled = await Enrollment.findOne({ course: courseId, student: senderId });
        if (!isEnrolled) return;
      }

      const newMessage = await Message.create({
        course: courseId,
        sender: senderId,
        content: content.trim(),
      });

      const populatedMessage = await newMessage.populate('sender', 'fullName role');
      io.to(courseId).emit('receive_message', populatedMessage);
    } catch (error) {
      console.error('Lỗi gửi tin nhắn Socket:', error.message);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});