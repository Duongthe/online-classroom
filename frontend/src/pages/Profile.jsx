import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, Mail, ShieldCheck, BookOpen, CheckCircle2,
  Award, Clock, Lock, Save, Calendar, Users, FileText, AlertCircle
} from 'lucide-react';
import api from '../services/api';

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Form cập nhật tên
  const [fullName, setFullName] = useState('');
  const [updatingInfo, setUpdatingInfo] = useState(false);

  // Form đổi mật khẩu
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchProfileStats();
  }, []);

  const fetchProfileStats = async () => {
    try {
      const res = await api.get('/auth/profile');
      setStats(res.data.stats);
      setFullName(res.data.user.fullName);
    } catch (err) {
      showNotification('Không thể tải dữ liệu hồ sơ', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdatingInfo(true);
    try {
      const res = await api.put('/auth/profile', { fullName });
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      showNotification(res.data.message);
    } catch (err) {
      showNotification(err.response?.data?.message || 'Cập nhật thất bại', 'error');
    } finally {
      setUpdatingInfo(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showNotification('Mật khẩu xác nhận không khớp!', 'error');
      return;
    }
    setChangingPass(true);
    try {
      const res = await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      showNotification(res.data.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Đổi mật khẩu thất bại', 'error');
    } finally {
      setChangingPass(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isStudent = user?.role === 'Student';

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-white font-medium ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-slate-900'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Quay lại Dashboard</span>
          </button>

          <span className="text-sm font-bold text-slate-800">Hồ sơ & Thống kê cá nhân</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white text-3xl font-extrabold flex items-center justify-center shadow-md shrink-0">
            {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="text-center sm:text-left flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900">{user?.fullName}</h1>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                user?.role === 'Admin'
                  ? 'bg-purple-100 text-purple-700'
                  : user?.role === 'Teacher'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                {user?.role}
              </span>
            </div>
            <p className="text-sm text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-4 h-4" />
              <span>{user?.email}</span>
            </p>
          </div>
        </div>

        {/* Thẻ Thống kê Tổng quan (Analytics) */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {isStudent ? (
              <>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-indigo-600 mb-2">
                    <span className="text-xs font-semibold uppercase text-slate-500">Lớp đang học</span>
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <p className="text-3xl font-extrabold text-slate-900">{stats.enrolledCoursesCount}</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-emerald-600 mb-2">
                    <span className="text-xs font-semibold uppercase text-slate-500">Tiến độ nộp bài</span>
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <p className="text-3xl font-extrabold text-slate-900">
                    {stats.submittedCount}<span className="text-base font-medium text-slate-400">/{stats.totalAssignments}</span>
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-amber-500 mb-2">
                    <span className="text-xs font-semibold uppercase text-slate-500">Điểm trung bình</span>
                    <Award className="w-5 h-5" />
                  </div>
                  <p className="text-3xl font-extrabold text-slate-900">
                    {stats.averageGrade !== null ? `${stats.averageGrade}/10` : 'Chưa có'}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-rose-500 mb-2">
                    <span className="text-xs font-semibold uppercase text-slate-500">Bài sắp đến hạn</span>
                    <Clock className="w-5 h-5" />
                  </div>
                  <p className="text-3xl font-extrabold text-slate-900">{stats.upcomingAssignments?.length || 0}</p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-indigo-600 mb-2">
                    <span className="text-xs font-semibold uppercase text-slate-500">Lớp phụ trách</span>
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <p className="text-3xl font-extrabold text-slate-900">{stats.managedCoursesCount}</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-emerald-600 mb-2">
                    <span className="text-xs font-semibold uppercase text-slate-500">Tổng học viên</span>
                    <Users className="w-5 h-5" />
                  </div>
                  <p className="text-3xl font-extrabold text-slate-900">{stats.totalStudents}</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-blue-600 mb-2">
                    <span className="text-xs font-semibold uppercase text-slate-500">Bài tập đã giao</span>
                    <FileText className="w-5 h-5" />
                  </div>
                  <p className="text-3xl font-extrabold text-slate-900">{stats.totalAssignments}</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-amber-500 mb-2">
                    <span className="text-xs font-semibold uppercase text-slate-500">Bài chờ chấm điểm</span>
                    <Clock className="w-5 h-5" />
                  </div>
                  <p className="text-3xl font-extrabold text-slate-900">{stats.pendingGradesCount}</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Danh sách bài tập sắp đến hạn (Dành cho Student) */}
        {isStudent && stats?.upcomingAssignments?.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-rose-500" />
              <span>Bài tập chưa nộp sắp đến hạn</span>
            </h2>
            <div className="divide-y divide-slate-100">
              {stats.upcomingAssignments.map((item) => (
                <div key={item._id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{item.title}</p>
                    <p className="text-xs text-slate-500">Lớp: {item.courseTitle}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                      Hạn: {new Date(item.dueDate).toLocaleDateString('vi-VN')}
                    </span>
                    <button
                      onClick={() => navigate(`/courses/${item.courseId}`)}
                      className="text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      Làm ngay
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2 Form Cài đặt tài khoản */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Form 1: Cập nhật thông tin */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              <span>Thông tin cá nhân</span>
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên hiển thị</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email đăng nhập (Cố định)</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm cursor-not-allowed"
                />
              </div>

              <button
                type="submit"
                disabled={updatingInfo}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>{updatingInfo ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
              </button>
            </form>
          </div>

          {/* Form 2: Đổi mật khẩu */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-600" />
              <span>Đổi mật khẩu bảo mật</span>
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu mới (tối thiểu 6 ký tự)</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={changingPass}
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition disabled:opacity-60"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{changingPass ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</span>
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Profile;