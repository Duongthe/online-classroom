import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  ArrowLeft, BookOpen, Calendar, CheckCircle2, Clock,
  FileText, Send, Users, Plus, X, AlertCircle, Link as LinkIcon,
  Award, MessageSquare, ExternalLink, MessageCircle, FolderOpen, Video, Presentation,
  Lock, UserCheck, Eye, UserPlus, UserMinus
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // State cho Admin Add Giảng viên trực tiếp vào từng lớp
  const [teachersList, setTeachersList] = useState([]);
  const [showAssignTeacherModal, setShowAssignTeacherModal] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  // State cho Real-time Chat
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const socketRef = useRef(null);
  const chatEndRef = useRef(null);

  // State cho Modal Nộp bài (Student)
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [textContent, setTextContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // State cho Modal Giao bài tập mới
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('');

  // State cho Modal Thêm tài liệu học tập
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [matTitle, setMatTitle] = useState('');
  const [matType, setMatType] = useState('Slide');
  const [matUrl, setMatUrl] = useState('');
  const [matDesc, setMatDesc] = useState('');

  // State cho Modal Chấm bài
  const [gradingAssignment, setGradingAssignment] = useState(null);
  const [gradesInput, setGradesInput] = useState({});

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchCourseDetail();
    fetchMessages();
    if (user.role === 'Admin') {
      fetchTeachersList();
    }

    socketRef.current = io('http://localhost:5000');
    socketRef.current.emit('join_course', id);

    socketRef.current.on('receive_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [id, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchCourseDetail = async () => {
    try {
      const res = await api.get(`/courses/${id}`);
      setCourse(res.data.course);
      setAssignments(res.data.assignments || []);
      setMaterials(res.data.materials || []);
      setEnrolledStudents(res.data.enrolledStudents || []);
      setIsEnrolled(Boolean(res.data.isEnrolled));
      setCanManage(Boolean(res.data.canManage));
    } catch (err) {
      showNotification(err.response?.data?.message || 'Không thể tải thông tin lớp học', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachersList = async () => {
    try {
      const res = await api.get('/auth/users');
      const onlyTeachers = res.data.filter((u) => u.role === 'Teacher' && u.isActive !== false);
      setTeachersList(onlyTeachers);
    } catch (err) {
      console.error('Lỗi tải danh sách giảng viên:', err);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/courses/${id}/messages`);
      setMessages(res.data);
    } catch (err) {
      console.error('Lỗi tải lịch sử chat:', err);
    }
  };

  // Admin Add hoặc Đổi Giảng viên vào lớp này
  const openAssignTeacherModal = () => {
    setSelectedTeacherId(course?.teacher?._id || teachersList[0]?._id || '');
    setShowAssignTeacherModal(true);
  };

  const handleAssignTeacherSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/courses/${id}/assign-teacher`, {
        teacherId: selectedTeacherId,
      });
      showNotification(res.data.message);
      setShowAssignTeacherModal(false);
      fetchCourseDetail();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Lỗi phân công giảng viên', 'error');
    }
  };

  // Admin Gỡ giảng viên khỏi lớp
  const handleRemoveTeacher = async () => {
    if (!window.confirm('Bạn có chắc muốn gỡ giảng viên khỏi lớp học này?')) return;
    try {
      const res = await api.put(`/courses/${id}/assign-teacher`, { teacherId: null });
      showNotification(res.data.message);
      setShowAssignTeacherModal(false);
      fetchCourseDetail();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Lỗi gỡ giảng viên', 'error');
    }
  };

  const canInteract = canManage || isEnrolled;
  const isOtherTeacher = user?.role === 'Teacher' && !canManage;

  const handleEnrollHere = async () => {
    try {
      const res = await api.post('/enrollments/enroll', { courseId: id });
      showNotification(res.data.message || 'Đăng ký khóa học thành công!');
      fetchCourseDetail();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Đăng ký thất bại', 'error');
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!canInteract) {
      showNotification('Bạn không có quyền gửi tin nhắn trong lớp học này!', 'error');
      return;
    }
    if (!newMessage.trim()) return;

    socketRef.current.emit('send_message', {
      courseId: id,
      senderId: user.id,
      content: newMessage.trim(),
    });
    setNewMessage('');
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!canInteract) {
      showNotification('Vui lòng đăng ký khóa học trước khi nộp bài!', 'error');
      return;
    }
    if (!fileUrl.trim() && !textContent.trim()) {
      showNotification('Vui lòng nhập đường dẫn bài làm hoặc nội dung trả lời!', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post(`/assignments/${selectedAssignment._id}/submit`, {
        fileUrl,
        textContent,
      });
      showNotification(res.data.message || 'Nộp bài tập thành công!');
      setSelectedAssignment(null);
      setFileUrl('');
      setTextContent('');
      fetchCourseDetail();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Lỗi khi nộp bài', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/assignments/create', {
        title: assignTitle,
        description: assignDesc,
        dueDate: assignDueDate,
        courseId: id,
      });
      showNotification('Đã giao bài tập mới thành công!');
      setShowAssignModal(false);
      setAssignTitle('');
      setAssignDesc('');
      setAssignDueDate('');
      fetchCourseDetail();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Lỗi tạo bài tập', 'error');
    }
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/courses/${id}/materials`, {
        title: matTitle,
        type: matType,
        url: matUrl,
        description: matDesc,
      });
      showNotification('Đã đăng tải tài liệu học tập!');
      setShowMaterialModal(false);
      setMatTitle('');
      setMatType('Slide');
      setMatUrl('');
      setMatDesc('');
      fetchCourseDetail();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Lỗi đăng tải tài liệu', 'error');
    }
  };

  const openGradingModal = (assign) => {
    setGradingAssignment(assign);
    const initialGrades = {};
    assign.submissions?.forEach((sub) => {
      initialGrades[sub._id] = {
        grade: sub.grade ?? '',
        feedback: sub.feedback ?? '',
      };
    });
    setGradesInput(initialGrades);
  };

  const handleSaveGrade = async (submissionId) => {
    const data = gradesInput[submissionId];
    if (data?.grade === '' || data?.grade === undefined) {
      showNotification('Vui lòng nhập điểm số!', 'error');
      return;
    }

    try {
      await api.put(`/assignments/${gradingAssignment._id}/grade`, {
        submissionId,
        grade: Number(data.grade),
        feedback: data.feedback,
      });
      showNotification('Đã lưu điểm số thành công!');
      fetchCourseDetail();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Lỗi lưu điểm', 'error');
    }
  };

  const getMaterialIcon = (type) => {
    switch (type) {
      case 'Video':
        return <Video className="w-5 h-5 text-rose-600" />;
      case 'Slide':
        return <Presentation className="w-5 h-5 text-amber-600" />;
      default:
        return <FileText className="w-5 h-5 text-indigo-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Không tìm thấy lớp học</h2>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium"
        >
          Quay lại Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-white font-medium ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-slate-900'
        }`}>
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Quay lại danh sách khóa học</span>
          </button>

          <div className="flex items-center gap-2.5">
            <span className="text-sm font-medium text-slate-700 hidden sm:inline">{user?.fullName}</span>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700">
              {user?.role}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {/* Course Banner + Khung Giảng viên phụ trách (Admin có nút Add / Đổi GV trực tiếp tại đây) */}
        <div className="bg-gradient-to-r from-indigo-600 via-blue-700 to-slate-900 rounded-3xl p-8 text-white shadow-lg">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full">
                <BookOpen className="w-3.5 h-3.5" />
                Không gian lớp học
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">{course.title}</h1>
              <p className="text-blue-100 text-sm sm:text-base leading-relaxed">{course.description}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 min-w-[250px] space-y-2.5">
              <div>
                <p className="text-xs text-blue-200 uppercase font-semibold">Giảng viên phụ trách</p>
                {course.teacher ? (
                  <>
                    <p className="font-bold text-base mt-1">{course.teacher.fullName}</p>
                    <p className="text-xs text-blue-200 mt-0.5">{course.teacher.email}</p>
                  </>
                ) : (
                  <p className="font-semibold text-amber-300 text-sm mt-1">Chưa phân công giảng viên</p>
                )}
              </div>

              {user?.role === 'Admin' && (
                <button
                  onClick={openAssignTeacherModal}
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-white text-indigo-800 hover:bg-indigo-50 font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{course.teacher ? 'Đổi / Gỡ giảng viên' : 'Add giảng viên vào lớp'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Biểu ngữ 1: Dành cho Sinh viên chưa đăng ký khóa học */}
        {user?.role === 'Student' && !isEnrolled && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-amber-950 text-base">Bạn đang xem trước khóa học này</h3>
                <p className="text-sm text-amber-800 mt-0.5">
                  Vui lòng đăng ký tham gia lớp học để mở khóa tài liệu bài giảng, nộp bài tập và tham gia thảo luận trực tuyến.
                </p>
              </div>
            </div>

            <button
              onClick={handleEnrollHere}
              className="shrink-0 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-sm transition cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Đăng ký tham gia ngay</span>
            </button>
          </div>
        )}

        {/* Biểu ngữ 2: Dành cho Giảng viên khác xem lớp không phải mình phụ trách */}
        {isOtherTeacher && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3 text-blue-900 text-sm">
            <Eye className="w-5 h-5 text-blue-600 shrink-0" />
            <span>
              Bạn đang xem lớp học này ở chế độ chỉ đọc (không thể chỉnh sửa tài liệu, giao/chấm bài hay gửi tin nhắn).
            </span>
          </div>
        )}

        {/* Bố cục 2 cột */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* CỘT TRÁI */}
          <div className="lg:col-span-7 space-y-8">
            {/* PHẦN 1: Tài liệu & Bài giảng */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FolderOpen className="w-6 h-6 text-amber-600" />
                  <h2 className="text-xl font-bold text-slate-900">
                    Tài liệu & Bài giảng ({materials.length})
                  </h2>
                </div>

                {canManage && (
                  <button
                    onClick={() => setShowMaterialModal(true)}
                    className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-xs transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm tài liệu</span>
                  </button>
                )}
              </div>

              {materials.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                  <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-700">Chưa có tài liệu học tập nào</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {materials.map((mat) =>
                    canInteract ? (
                      <a
                        key={mat._id}
                        href={mat.url}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-300 transition flex items-start gap-3.5 group"
                      >
                        <div className="p-2.5 rounded-xl bg-slate-100 group-hover:bg-indigo-50 transition shrink-0">
                          {getMaterialIcon(mat.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              {mat.type}
                            </span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm mt-1.5 truncate group-hover:text-indigo-600">
                            {mat.title}
                          </h4>
                          {mat.description && (
                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{mat.description}</p>
                          )}
                        </div>
                      </a>
                    ) : (
                      <div
                        key={mat._id}
                        onClick={() => showNotification('Bạn cần tham gia lớp học để mở tài liệu này!', 'error')}
                        className="bg-slate-100/80 p-4 rounded-2xl border border-slate-200 flex items-start gap-3.5 opacity-75 cursor-not-allowed"
                      >
                        <div className="p-2.5 rounded-xl bg-slate-200 shrink-0">
                          <Lock className="w-5 h-5 text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                            {mat.type} • Đã khóa
                          </span>
                          <h4 className="font-bold text-slate-700 text-sm mt-1.5 truncate">{mat.title}</h4>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* PHẦN 2: Danh sách bài tập */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-6 h-6 text-indigo-600" />
                  <h2 className="text-xl font-bold text-slate-900">
                    Bài tập trên lớp ({assignments.length})
                  </h2>
                </div>

                {canManage && (
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Giao bài tập</span>
                  </button>
                )}
              </div>

              {assignments.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-slate-800">Chưa có bài tập nào được giao</h3>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignments.map((assign) => {
                    const mySubmission = assign.submissions?.find(
                      (sub) => sub.student === user?.id || sub.student?._id === user?.id
                    );
                    const isOverdue = assign.dueDate && new Date(assign.dueDate) < new Date();

                    return (
                      <div
                        key={assign._id}
                        className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <h3 className="text-lg font-bold text-slate-900">{assign.title}</h3>
                              {user?.role === 'Student' && isEnrolled && (
                                mySubmission ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Đã nộp
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full">
                                    <Clock className="w-3.5 h-3.5" />
                                    Chưa nộp
                                  </span>
                                )
                              )}

                              {mySubmission && mySubmission.grade !== null && mySubmission.grade !== undefined && (
                                <span className="inline-flex items-center gap-1 text-xs font-bold bg-indigo-600 text-white px-3 py-0.5 rounded-full shadow-sm">
                                  <Award className="w-3.5 h-3.5" />
                                  Điểm: {mySubmission.grade}/10
                                </span>
                              )}
                            </div>

                            <p className="text-slate-600 text-sm leading-relaxed">{assign.description}</p>

                            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-500">
                              {assign.dueDate && (
                                <span className={`inline-flex items-center gap-1.5 font-medium ${isOverdue ? 'text-red-600' : 'text-slate-600'}`}>
                                  <Calendar className="w-4 h-4" />
                                  Hạn nộp: {new Date(assign.dueDate).toLocaleDateString('vi-VN')}
                                </span>
                              )}

                              {canManage && (
                                <span className="inline-flex items-center gap-1.5 font-medium text-indigo-600">
                                  <Users className="w-4 h-4" />
                                  Đã nộp: {assign.submissions?.length || 0} học viên
                                </span>
                              )}
                            </div>

                            {mySubmission && (
                              <div className="mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                                {mySubmission.fileUrl && (
                                  <div>
                                    <span className="font-semibold text-slate-900">Liên kết bài nộp: </span>
                                    <a
                                      href={mySubmission.fileUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="break-all text-indigo-600 hover:underline"
                                    >
                                      {mySubmission.fileUrl}
                                    </a>
                                  </div>
                                )}
                                {mySubmission.textContent && (
                                  <div>
                                    <span className="font-semibold text-slate-900">Nội dung trả lời: </span>
                                    <span className="text-slate-700">{mySubmission.textContent}</span>
                                  </div>
                                )}
                                {mySubmission.feedback && (
                                  <div className="pt-2 border-t border-slate-200/70 flex items-start gap-1.5 text-slate-700">
                                    <MessageSquare className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                    <div>
                                      <span className="font-semibold text-slate-900">Nhận xét: </span>
                                      <span>{mySubmission.feedback}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {user?.role === 'Student' ? (
                            isEnrolled ? (
                              <button
                                onClick={() => {
                                  setSelectedAssignment(assign);
                                  setFileUrl(mySubmission?.fileUrl || '');
                                  setTextContent(mySubmission?.textContent || '');
                                }}
                                className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition ${
                                  mySubmission
                                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200'
                                }`}
                              >
                                <Send className="w-4 h-4" />
                                <span>{mySubmission ? 'Nộp lại' : 'Nộp bài'}</span>
                              </button>
                            ) : (
                              <span className="shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-400 flex items-center gap-1.5">
                                <Lock className="w-3.5 h-3.5" />
                                <span>Cần đăng ký</span>
                              </span>
                            )
                          ) : canManage ? (
                            <button
                              onClick={() => openGradingModal(assign)}
                              className="shrink-0 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-sm font-semibold flex items-center gap-2 transition"
                            >
                              <Award className="w-4 h-4" />
                              <span>Chấm bài ({assign.submissions?.length || 0})</span>
                            </button>
                          ) : (
                            <span className="shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-500 flex items-center gap-1.5">
                              <Eye className="w-3.5 h-3.5" />
                              <span>Chỉ xem</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* PHẦN 3: Danh sách Sinh viên đã ghi danh vào lớp */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <Users className="w-6 h-6 text-emerald-600" />
                <h2 className="text-xl font-bold text-slate-900">
                  Sinh viên tham gia lớp ({enrolledStudents.length})
                </h2>
              </div>

              {enrolledStudents.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                  <p className="text-sm text-slate-500">Chưa có sinh viên nào đăng ký vào lớp học này.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 shadow-xs">
                  {enrolledStudents.map((stu) => (
                    <div key={stu._id} className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
                          {stu.fullName?.charAt(0)?.toUpperCase() || 'S'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{stu.fullName}</p>
                          <p className="text-xs text-slate-500">{stu.email}</p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400">
                        Tham gia: {new Date(stu.enrolledAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CỘT PHẢI: Khung Thảo luận lớp học Real-time */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-[560px] sticky top-24 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Thảo luận lớp học</h3>
                  <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Trực tuyến (Real-time)
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/40">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 px-4">
                  <MessageCircle className="w-10 h-10 mb-2 opacity-40" />
                  <p className="text-sm font-medium text-slate-600">Chưa có tin nhắn nào</p>
                  <p className="text-xs mt-1">Hãy gửi lời chào hoặc đặt câu hỏi cho giảng viên và các bạn cùng lớp!</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.sender?._id === user?.id || msg.sender === user?.id;
                  const isTeacherMsg = msg.sender?.role === 'Teacher' || msg.sender?.role === 'Admin';

                  return (
                    <div
                      key={msg._id || idx}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[11px] font-semibold text-slate-600">
                          {isMe ? 'Bạn' : msg.sender?.fullName || 'Thành viên'}
                        </span>
                        {isTeacherMsg && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-indigo-100 text-indigo-700 rounded">
                            {msg.sender?.role}
                          </span>
                        )}
                      </div>

                      <div
                        className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-xs ${
                          isMe
                            ? 'bg-indigo-600 text-white rounded-br-sm'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                        }`}
                      >
                        <p className="break-words">{msg.content}</p>
                        <span
                          className={`block text-[10px] mt-1 text-right ${
                            isMe ? 'text-indigo-200' : 'text-slate-400'
                          }`}
                        >
                          {msg.createdAt
                            ? new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Vừa xong'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {canInteract ? (
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Nhập tin nhắn thảo luận..."
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition disabled:opacity-50"
                  title="Gửi tin nhắn"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="p-3.5 bg-slate-100 border-t border-slate-200 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {isOtherTeacher
                    ? 'Chỉ giảng viên phụ trách lớp này mới được tham gia thảo luận.'
                    : 'Bạn cần đăng ký tham gia khóa học để gửi tin nhắn thảo luận.'}
                </span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* MODAL CHO ADMIN: Add / Đổi / Gỡ Giảng viên trực tiếp vào từng lớp */}
      {showAssignTeacherModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-lg">
                <UserPlus className="w-5 h-5" />
                <span>Phân công Giảng viên đứng lớp</span>
              </div>
              <button onClick={() => setShowAssignTeacherModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignTeacherSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Chọn Giảng viên phụ trách lớp <span className="font-bold text-slate-900">{course.title}</span>
                </label>
                <select
                  required
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                >
                  {teachersList.length === 0 ? (
                    <option value="">Chưa có tài khoản Giảng viên nào</option>
                  ) : (
                    teachersList.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.fullName} ({t.email})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                {course.teacher ? (
                  <button
                    type="button"
                    onClick={handleRemoveTeacher}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-semibold text-xs transition"
                  >
                    <UserMinus className="w-4 h-4" />
                    <span>Gỡ GV khỏi lớp</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAssignTeacherModal(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium text-sm"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={teachersList.length === 0}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm disabled:opacity-50"
                  >
                    Xác nhận gán GV
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THÊM TÀI LIỆU HỌC TẬP */}
      {showMaterialModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-900">Đăng tải tài liệu học tập</h3>
              <button onClick={() => setShowMaterialModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMaterial} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tiêu đề tài liệu</label>
                <input
                  type="text"
                  required
                  value={matTitle}
                  onChange={(e) => setMatTitle(e.target.value)}
                  placeholder="VD: Slide Bài 1 - Giới thiệu MERN Stack"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Loại tài liệu</label>
                <select
                  value={matType}
                  onChange={(e) => setMatType(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Slide">Slide bài giảng</option>
                  <option value="Video">Video bài học (YouTube / Drive)</option>
                  <option value="Document">Tài liệu PDF / Doc</option>
                  <option value="Link">Liên kết tham khảo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Đường dẫn (URL)</label>
                <input
                  type="url"
                  required
                  value={matUrl}
                  onChange={(e) => setMatUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả ngắn (không bắt buộc)</label>
                <input
                  type="text"
                  value={matDesc}
                  onChange={(e) => setMatDesc(e.target.value)}
                  placeholder="Ghi chú nội dung tài liệu..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMaterialModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold"
                >
                  Đăng tài liệu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NỘP BÀI */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Nộp bài tập</h3>
                <p className="text-xs text-indigo-600 font-medium mt-0.5">{selectedAssignment.title}</p>
              </div>
              <button onClick={() => setSelectedAssignment(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAssignment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Đường dẫn bài làm (GitHub, Google Drive...)
                </label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    placeholder="https://github.com/username/project..."
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nội dung trả lời / Ghi chú cho giảng viên
                </label>
                <textarea
                  rows="3"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Mô tả ngắn gọn bài làm hoặc câu trả lời của bạn..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAssignment(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm disabled:opacity-60"
                >
                  {submitting ? 'Đang gửi...' : 'Xác nhận nộp bài'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GIAO BÀI TẬP */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-900">Giao bài tập mới</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tiêu đề bài tập</label>
                <input
                  type="text"
                  required
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  placeholder="VD: Bài tập thực hành số 2"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Yêu cầu chi tiết</label>
                <textarea
                  rows="3"
                  required
                  value={assignDesc}
                  onChange={(e) => setAssignDesc(e.target.value)}
                  placeholder="Mô tả yêu cầu bài tập..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hạn nộp bài</label>
                <input
                  type="date"
                  required
                  value={assignDueDate}
                  onChange={(e) => setAssignDueDate(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold"
                >
                  Giao bài tập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHẤM ĐIỂM */}
      {gradingAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Danh sách bài nộp & Chấm điểm</h3>
                <p className="text-xs text-indigo-600 font-medium mt-0.5">{gradingAssignment.title}</p>
              </div>
              <button onClick={() => setGradingAssignment(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {!gradingAssignment.submissions || gradingAssignment.submissions.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">
                  Chưa có học viên nào nộp bài tập này.
                </div>
              ) : (
                gradingAssignment.submissions.map((sub) => (
                  <div key={sub._id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">
                          {sub.student?.fullName || 'Học viên'}
                        </p>
                        <p className="text-xs text-slate-500">{sub.student?.email}</p>
                      </div>
                      <span className="text-xs text-slate-400">
                        Nộp lúc: {new Date(sub.submittedAt).toLocaleString('vi-VN')}
                      </span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-sm text-slate-800 space-y-1.5">
                      {sub.fileUrl && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="break-all text-indigo-600 font-medium">{sub.fileUrl}</span>
                          <a
                            href={sub.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="shrink-0 text-indigo-600 hover:text-indigo-800"
                            title="Mở liên kết"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      )}
                      {sub.textContent && (
                        <p className="text-slate-700 text-xs">{sub.textContent}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
                      <div className="sm:col-span-3">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.5"
                          placeholder="Điểm (0-10)"
                          value={gradesInput[sub._id]?.grade ?? ''}
                          onChange={(e) =>
                            setGradesInput({
                              ...gradesInput,
                              [sub._id]: { ...gradesInput[sub._id], grade: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="sm:col-span-6">
                        <input
                          type="text"
                          placeholder="Nhận xét cho học viên..."
                          value={gradesInput[sub._id]?.feedback ?? ''}
                          onChange={(e) =>
                            setGradesInput({
                              ...gradesInput,
                              [sub._id]: { ...gradesInput[sub._id], feedback: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <button
                          type="button"
                          onClick={() => handleSaveGrade(sub._id)}
                          className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition"
                        >
                          Lưu điểm
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseDetail;