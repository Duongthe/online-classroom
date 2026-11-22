import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Plus, Search, LogOut, Users, CheckCircle2,
  GraduationCap, FileText, ArrowRight, X, Sparkles, Edit3, Trash2,
  Award, Clock, ShieldAlert, FileCheck2, Send, AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [courseFilter, setCourseFilter] = useState('ALL');

  // State cho Phiếu yêu cầu mở lớp (Teacher)
  const [myRequests, setMyRequests] = useState([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqTitle, setReqTitle] = useState('');
  const [reqDesc, setReqDesc] = useState('');
  const [reqNote, setReqNote] = useState('');

  // State cho Modal Tạo Khóa Học trống (Chỉ Admin dùng trên Dashboard)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // State cho Modal Chỉnh sửa Khóa Học
  const [editingCourse, setEditingCourse] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // State cho Modal Giao Bài Tập
  const [selectedCourseForAssign, setSelectedCourseForAssign] = useState(null);
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('');

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchCourses = async (keyword = '') => {
    try {
      const res = await api.get(`/courses?search=${encodeURIComponent(keyword)}`);
      setCourses(res.data);
    } catch (err) {
      showNotification('Không thể tải danh sách khóa học', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRequests = async () => {
    if (user?.role !== 'Teacher') return;
    try {
      const res = await api.get('/courses/requests/my');
      setMyRequests(res.data);
    } catch (err) {
      console.error('Lỗi tải phiếu yêu cầu:', err);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchCourses();
    fetchMyRequests();
  }, [user]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (user) fetchCourses(search);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  // Giảng viên gửi phiếu yêu cầu mở lớp
  const handleSendCourseRequest = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/courses/requests', {
        title: reqTitle,
        description: reqDesc,
        note: reqNote,
      });
      showNotification(res.data.message);
      setMyRequests((prev) => [res.data.request, ...prev]);
      setShowRequestModal(false);
      setReqTitle('');
      setReqDesc('');
      setReqNote('');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Lỗi gửi phiếu yêu cầu', 'error');
    }
  };

  // Admin tạo khóa học mới
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      await api.post('/courses/create', { title: newTitle, description: newDesc });
      showNotification('Tạo khóa học mới thành công! Bạn có thể vào lớp để gán giảng viên.');
      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      fetchCourses(search);
    } catch (err) {
      showNotification(err.response?.data?.message || 'Lỗi tạo khóa học', 'error');
    }
  };

  // Cập nhật khóa học
  const openEditModal = (course) => {
    setEditingCourse(course);
    setEditTitle(course.title);
    setEditDesc(course.description);
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/courses/${editingCourse._id}`, {
        title: editTitle,
        description: editDesc,
      });
      showNotification('Cập nhật thông tin khóa học thành công!');
      setEditingCourse(null);
      fetchCourses(search);
    } catch (err) {
      showNotification(err.response?.data?.message || 'Lỗi cập nhật khóa học', 'error');
    }
  };

  // Xóa khóa học
  const handleDeleteCourse = async (courseId, courseTitle) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa khóa học "${courseTitle}"?`)) {
      return;
    }
    try {
      await api.delete(`/courses/${courseId}`);
      showNotification('Đã xóa khóa học thành công!');
      fetchCourses(search);
    } catch (err) {
      showNotification(err.response?.data?.message || 'Lỗi xóa khóa học', 'error');
    }
  };

  // Ghi danh khóa học (Student)
  const handleEnroll = async (courseId) => {
    try {
      const res = await api.post('/enrollments/enroll', { courseId });
      showNotification(res.data.message || 'Đăng ký khóa học thành công!');
      fetchCourses(search);
    } catch (err) {
      showNotification(err.response?.data?.message || 'Đăng ký thất bại', 'error');
    }
  };

  // Giao bài tập
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/assignments/create', {
        title: assignTitle,
        description: assignDesc,
        dueDate: assignDueDate,
        courseId: selectedCourseForAssign._id,
      });
      showNotification('Đã giao bài tập mới thành công!');
      setSelectedCourseForAssign(null);
      setAssignTitle('');
      setAssignDesc('');
      setAssignDueDate('');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Lỗi tạo bài tập', 'error');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Teacher':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
  };

  const isEnrolled = (course) => {
    return course.enrolledStudents?.some(
      (student) => student === user?.id || student?._id === user?.id
    );
  };

  const isMyTeachingCourse = (course) => {
    return course.teacher?._id === user?.id || course.teacher === user?.id;
  };

  const displayedCourses = courses.filter((course) => {
    if (courseFilter === 'MY_COURSES') {
      if (user?.role === 'Student') return isEnrolled(course);
      if (user?.role === 'Teacher') return isMyTeachingCourse(course);
    }
    return true;
  });

  const myCoursesCount = courses.filter((c) =>
    user?.role === 'Student' ? isEnrolled(c) : isMyTeachingCourse(c)
  ).length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-white font-medium transition-all ${
            toast.type === 'error' ? 'bg-red-600' : 'bg-slate-900'
          }`}
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">
              Edu<span className="text-indigo-600">Sphere</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {user?.role === 'Admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Quản trị hệ thống</span>
              </button>
            )}

            {user?.role === 'Student' && (
              <button
                onClick={() => navigate('/grades')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span>Bảng điểm của tôi</span>
              </button>
            )}

            <div className="hidden sm:flex items-center gap-2.5">
              <span className="text-sm font-medium text-slate-700">{user?.fullName}</span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getRoleBadge(user?.role)}`}>
                {user?.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-700 rounded-3xl p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider bg-white/15 px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              Không gian học tập trực tuyến
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Chào mừng trở lại, {user?.fullName}!
            </h1>
            <p className="text-indigo-100 text-sm sm:text-base">
              {user?.role === 'Teacher'
                ? 'Quản lý các lớp học được phân công, gửi phiếu yêu cầu mở lớp mới cho Admin và chấm điểm bài tập.'
                : user?.role === 'Admin'
                ? 'Giám sát toàn bộ khóa học, phê duyệt phiếu mở lớp và phân công giảng viên phụ trách.'
                : 'Khám phá các khóa học mới, theo dõi bài tập và nâng cao kiến thức mỗi ngày.'}
            </p>
          </div>

          {user?.role === 'Teacher' && (
            <button
              onClick={() => setShowRequestModal(true)}
              className="shrink-0 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold px-5 py-3 rounded-xl shadow-md flex items-center gap-2 transition cursor-pointer"
            >
              <FileCheck2 className="w-5 h-5" />
              <span>Tạo phiếu yêu cầu mở lớp</span>
            </button>
          )}

          {user?.role === 'Admin' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="shrink-0 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold px-5 py-3 rounded-xl shadow-md flex items-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>Tạo lớp học mới</span>
            </button>
          )}
        </div>

        {/* Khu vực theo dõi Phiếu yêu cầu mở lớp (Chỉ hiển thị cho Giảng viên) */}
        {user?.role === 'Teacher' && myRequests.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-indigo-600" />
                <span>Phiếu yêu cầu mở lớp của tôi ({myRequests.length})</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {myRequests.map((req) => (
                <div
                  key={req._id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      {req.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3" />
                          Chờ Admin duyệt
                        </span>
                      )}
                      {req.status === 'APPROVED' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          Đã duyệt & Mở lớp
                        </span>
                      )}
                      {req.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800">
                          <AlertCircle className="w-3 h-3" />
                          Bị từ chối
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">{req.title}</h4>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-1">{req.description}</p>
                  </div>

                  {req.adminNote && (
                    <div className="text-xs bg-white p-2 rounded-lg border border-slate-200 text-slate-700">
                      <span className="font-semibold">Phản hồi Admin: </span>
                      {req.adminNote}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Thanh Filter Tabs + Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setCourseFilter('ALL')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                courseFilter === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Tất cả khóa học ({courses.length})
            </button>

            {user?.role !== 'Admin' && (
              <button
                onClick={() => setCourseFilter('MY_COURSES')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                  courseFilter === 'MY_COURSES'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {user?.role === 'Teacher' ? 'Lớp tôi phụ trách' : 'Lớp học của tôi'} ({myCoursesCount})
              </button>
            )}
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên khóa học hoặc mô tả..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-xs"
            />
          </div>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 h-60 animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : displayedCourses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-800">
              {courseFilter === 'MY_COURSES'
                ? 'Bạn chưa có lớp học nào trong danh mục này'
                : 'Không tìm thấy khóa học nào'}
            </h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedCourses.map((course) => {
              const enrolled = isEnrolled(course);
              const canManageCourse =
                user?.role === 'Admin' || course.teacher?._id === user?.id;

              return (
                <div
                  key={course._id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                        <BookOpen className="w-3.5 h-3.5" />
                        Khóa học
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                          <Users className="w-3.5 h-3.5" />
                          {course.enrolledStudents?.length || 0}
                        </span>

                        {canManageCourse && (
                          <div className="flex items-center gap-1 ml-1">
                            <button
                              onClick={() => openEditModal(course)}
                              title="Chỉnh sửa khóa học"
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(course._id, course.title)}
                              title="Xóa khóa học"
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3
                        onClick={() => navigate(`/courses/${course._id}`)}
                        className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition line-clamp-1 cursor-pointer"
                      >
                        {course.title}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>
                        Giảng viên:{' '}
                        <strong className={course.teacher ? 'text-slate-700' : 'text-amber-600'}>
                          {course.teacher?.fullName || 'Chưa phân công GV'}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => navigate(`/courses/${course._id}`)}
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{user?.role === 'Admin' ? 'Vào lớp / Add GV' : 'Xem chi tiết'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    {user?.role === 'Student' ? (
                      enrolled ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Đã tham gia
                        </span>
                      ) : (
                        <button
                          onClick={() => handleEnroll(course._id)}
                          className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg transition shadow-xs cursor-pointer"
                        >
                          Đăng ký học
                        </button>
                      )
                    ) : canManageCourse ? (
                      <button
                        onClick={() => setSelectedCourseForAssign(course)}
                        className="text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Giao bài</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL: Giảng viên tạo phiếu yêu cầu mở lớp */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-lg">
                <FileCheck2 className="w-5 h-5" />
                <span>Phiếu yêu cầu mở lớp học</span>
              </div>
              <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendCourseRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên lớp học đề xuất</label>
                <input
                  type="text"
                  required
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  placeholder="VD: Lập trình Di động với React Native"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả nội dung môn học</label>
                <textarea
                  rows="3"
                  required
                  value={reqDesc}
                  onChange={(e) => setReqDesc(e.target.value)}
                  placeholder="Mục tiêu, nội dung giảng dạy dự kiến..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú gửi Admin (không bắt buộc)</label>
                <input
                  type="text"
                  value={reqNote}
                  onChange={(e) => setReqNote(e.target.value)}
                  placeholder="VD: Đề xuất mở cho học kỳ 1, dự kiến 50 sinh viên..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>Gửi phiếu duyệt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Admin tạo lớp học mới */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-900">Tạo lớp học mới</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên khóa học</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="VD: Cơ sở dữ liệu phân tán"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả chi tiết</label>
                <textarea
                  rows="3"
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Nội dung chính của khóa học..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold"
                >
                  Tạo lớp học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Chỉnh sửa Khóa Học */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-900">Chỉnh sửa khóa học</h3>
              <button onClick={() => setEditingCourse(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateCourse} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên khóa học</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả chi tiết</label>
                <textarea
                  rows="3"
                  required
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Giao bài tập mới */}
      {selectedCourseForAssign && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Giao bài tập mới</h3>
                <p className="text-xs text-indigo-600 font-medium mt-0.5">{selectedCourseForAssign.title}</p>
              </div>
              <button onClick={() => setSelectedCourseForAssign(null)} className="text-slate-400 hover:text-slate-600">
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
                  placeholder="VD: Bài tập tuần 1 - Xây dựng REST API"
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
                  onClick={() => setSelectedCourseForAssign(null)}
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
    </div>
  );
}

export default Dashboard;