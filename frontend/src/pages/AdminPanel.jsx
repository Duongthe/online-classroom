import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ShieldAlert, Users, BookOpen, Lock, Unlock,
  Trash2, CheckCircle2, AlertCircle, Search, UserPlus, Edit3, KeyRound, X,
  FileCheck2, Clock, Check, Ban, UserCheck
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function AdminPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'users' | 'courses'
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal 1: Cấp tài khoản mới
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('Teacher');

  // Modal 2: Sửa thông tin & Phân quyền User
  const [editingUser, setEditingUser] = useState(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('Student');

  // Modal 3: Đặt lại mật khẩu
  const [resetUser, setResetUser] = useState(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');

  // Modal 4: Duyệt / Từ chối phiếu yêu cầu mở lớp
  const [reviewingRequest, setReviewingRequest] = useState(null);
  const [reviewAction, setReviewAction] = useState('APPROVED'); // 'APPROVED' | 'REJECTED'
  const [adminNote, setAdminNote] = useState('');

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!user || user.role !== 'Admin') {
      navigate('/dashboard');
      return;
    }
    fetchAdminData();
  }, [user]);

  const fetchAdminData = async () => {
    try {
      const [usersRes, coursesRes, requestsRes] = await Promise.all([
        api.get('/auth/users'),
        api.get('/courses'),
        api.get('/courses/requests/all'),
      ]);
      setUsers(usersRes.data);
      setCourses(coursesRes.data);
      setRequests(requestsRes.data);
    } catch (err) {
      showNotification('Không thể tải dữ liệu quản trị!', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý duyệt / từ chối phiếu yêu cầu mở lớp
  const openReviewModal = (reqItem, action) => {
    setReviewingRequest(reqItem);
    setReviewAction(action);
    setAdminNote('');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/courses/requests/${reviewingRequest._id}/review`, {
        status: reviewAction,
        adminNote,
      });
      showNotification(res.data.message);
      setRequests((prev) =>
        prev.map((r) => (r._id === reviewingRequest._id ? res.data.request : r))
      );
      if (res.data.course) {
        setCourses((prev) => [{ ...res.data.course, enrolledStudents: [] }, ...prev]);
      }
      setReviewingRequest(null);
    } catch (err) {
      showNotification(err.response?.data?.message || 'Lỗi xử lý phiếu', 'error');
    }
  };

  // Tạo tài khoản mới
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/users', {
        fullName: newFullName,
        email: newEmail,
        password: newPassword,
        role: newRole,
      });
      showNotification(res.data.message);
      setUsers((prev) => [res.data.user, ...prev]);
      setShowCreateUserModal(false);
      setNewFullName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('Teacher');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Lỗi tạo tài khoản', 'error');
    }
  };

  // Sửa thông tin & Phân quyền
  const openEditUserModal = (targetUser) => {
    setEditingUser(targetUser);
    setEditFullName(targetUser.fullName);
    setEditEmail(targetUser.email);
    setEditRole(targetUser.role);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/auth/users/${editingUser._id}`, {
        fullName: editFullName,
        email: editEmail,
        role: editRole,
      });
      showNotification(res.data.message);
      setUsers((prev) => prev.map((u) => (u._id === editingUser._id ? res.data.user : u)));
      setEditingUser(null);
    } catch (err) {
      showNotification(err.response?.data?.message || 'Lỗi cập nhật tài khoản', 'error');
    }
  };

  // Đặt lại mật khẩu
  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/auth/users/${resetUser._id}/reset-password`, {
        newPassword: resetPasswordValue,
      });
      showNotification(res.data.message);
      setResetUser(null);
      setResetPasswordValue('');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Lỗi đặt lại mật khẩu', 'error');
    }
  };

  // Khóa / Mở khóa tài khoản
  const handleToggleUserStatus = async (targetUser) => {
    try {
      const res = await api.put(`/auth/users/${targetUser._id}/toggle-status`);
      showNotification(res.data.message);
      setUsers((prev) =>
        prev.map((u) => (u._id === targetUser._id ? { ...u, isActive: res.data.user.isActive } : u))
      );
    } catch (err) {
      showNotification(err.response?.data?.message || 'Lỗi cập nhật trạng thái', 'error');
    }
  };

  // Xóa vĩnh viễn tài khoản
  const handleDeleteUser = async (targetUser) => {
    if (!window.confirm(`Xác nhận xóa vĩnh viễn tài khoản "${targetUser.fullName}" (${targetUser.email})?`)) {
      return;
    }
    try {
      const res = await api.delete(`/auth/users/${targetUser._id}`);
      showNotification(res.data.message);
      setUsers((prev) => prev.filter((u) => u._id !== targetUser._id));
    } catch (err) {
      showNotification(err.response?.data?.message || 'Lỗi xóa tài khoản', 'error');
    }
  };

  // Xóa khóa học
  const handleDeleteCourse = async (courseId, title) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa khóa học "${title}" và toàn bộ dữ liệu liên quan?`)) {
      return;
    }
    try {
      const res = await api.delete(`/courses/${courseId}`);
      showNotification(res.data.message);
      setCourses((prev) => prev.filter((c) => c._id !== courseId));
    } catch (err) {
      showNotification(err.response?.data?.message || 'Lỗi xóa khóa học', 'error');
    }
  };

  const pendingRequestsCount = requests.filter((r) => r.status === 'PENDING').length;

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredCourses = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.teacher?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRequests = requests.filter(
    (r) =>
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.teacher?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-white font-medium ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-slate-900'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Quay lại Dashboard</span>
          </button>

          <div className="flex items-center gap-2 text-purple-700 font-bold text-sm bg-purple-50 px-3.5 py-1.5 rounded-full">
            <ShieldAlert className="w-4 h-4" />
            <span>Trang Quản Trị Hệ Thống (Admin)</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {/* Banner & Thống kê */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-800 to-slate-900 rounded-3xl p-8 text-white shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold">Trung tâm Quản trị EduSphere</h1>
              <p className="text-purple-100 text-sm mt-1">
                Duyệt phiếu yêu cầu mở lớp của giảng viên, quản lý tài khoản và vào từng lớp để phân công giảng viên.
              </p>
            </div>

            <button
              onClick={() => setShowCreateUserModal(true)}
              className="shrink-0 inline-flex items-center gap-2 bg-white text-purple-800 hover:bg-purple-50 font-bold text-sm px-5 py-3 rounded-xl shadow-md transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Cấp tài khoản mới</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/15">
              <p className="text-xs text-purple-200">Phiếu chờ duyệt</p>
              <p className="text-2xl font-extrabold mt-1 text-amber-300">{pendingRequestsCount}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/15">
              <p className="text-xs text-purple-200">Giảng viên</p>
              <p className="text-2xl font-extrabold mt-1">{users.filter((u) => u.role === 'Teacher').length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/15">
              <p className="text-xs text-purple-200">Sinh viên</p>
              <p className="text-2xl font-extrabold mt-1">{users.filter((u) => u.role === 'Student').length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/15">
              <p className="text-xs text-purple-200">Tổng lớp học</p>
              <p className="text-2xl font-extrabold mt-1">{courses.length}</p>
            </div>
          </div>
        </div>

        {/* Thanh công cụ Tabs + Bộ lọc + Tìm kiếm */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('requests')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                activeTab === 'requests'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Phiếu yêu cầu mở lớp ({requests.length})</span>
              {pendingRequestsCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-400 text-slate-900">
                  {pendingRequestsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('courses')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                activeTab === 'courses'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Danh sách lớp học ({courses.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                activeTab === 'users'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Tài khoản ({users.length})</span>
            </button>

            {activeTab === 'users' && (
              <>
                <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />
                {['ALL', 'Admin', 'Teacher', 'Student'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      roleFilter === r
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {r === 'ALL' ? 'Tất cả' : r}
                  </button>
                ))}
              </>
            )}
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>
        </div>

        {/* TAB 1: Duyệt phiếu yêu cầu mở lớp của Giảng viên */}
        {activeTab === 'requests' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
            {filteredRequests.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                Chưa có phiếu yêu cầu mở lớp nào từ giảng viên.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-xs uppercase text-slate-500 font-semibold">
                    <th className="py-3.5 px-5">Lớp học đề xuất</th>
                    <th className="py-3.5 px-5">Giảng viên gửi</th>
                    <th className="py-3.5 px-5">Trạng thái</th>
                    <th className="py-3.5 px-5 text-right">Phê duyệt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredRequests.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-5 max-w-md">
                        <p className="font-bold text-slate-900">{r.title}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{r.description}</p>
                        {r.note && (
                          <p className="text-xs text-indigo-600 mt-1">Ghi chú GV: {r.note}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-slate-800">{r.teacher?.fullName}</p>
                        <p className="text-xs text-slate-500">{r.teacher?.email}</p>
                      </td>
                      <td className="py-3.5 px-5">
                        {r.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                            <Clock className="w-3.5 h-3.5" />
                            Chờ duyệt
                          </span>
                        )}
                        {r.status === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Đã duyệt
                          </span>
                        )}
                        {r.status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-800">
                            <Ban className="w-3.5 h-3.5" />
                            Từ chối
                          </span>
                        )}
                        {r.adminNote && (
                          <p className="text-[11px] text-slate-500 mt-1">Admin: {r.adminNote}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {r.status === 'PENDING' ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => openReviewModal(r, 'APPROVED')}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Duyệt & Mở lớp</span>
                            </button>
                            <button
                              onClick={() => openReviewModal(r, 'REJECTED')}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-semibold transition"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Từ chối</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Đã xử lý</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 2: Danh sách lớp học (Bấm vào từng lớp để Add / Đổi Giảng viên) */}
        {activeTab === 'courses' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-xs uppercase text-slate-500 font-semibold">
                  <th className="py-3.5 px-5">Tên khóa học</th>
                  <th className="py-3.5 px-5">Giảng viên đứng lớp</th>
                  <th className="py-3.5 px-5">Sĩ số</th>
                  <th className="py-3.5 px-5 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredCourses.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-5">
                      <p className="font-bold text-slate-900">{c.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-1 max-w-md">{c.description}</p>
                    </td>
                    <td className="py-3.5 px-5">
                      {c.teacher ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg text-xs">
                          <UserCheck className="w-3.5 h-3.5" />
                          {c.teacher.fullName}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg text-xs">
                          Chưa có giảng viên
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-slate-600 font-semibold">
                      {c.enrolledStudents?.length || 0} sinh viên
                    </td>
                    <td className="py-3.5 px-5 text-right space-x-2">
                      <button
                        onClick={() => navigate(`/courses/${c._id}`)}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition"
                      >
                        Vào lớp / Add GV
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(c._id, c.title)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-semibold transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: Quản lý Tài khoản */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-xs uppercase text-slate-500 font-semibold">
                  <th className="py-3.5 px-5">Người dùng</th>
                  <th className="py-3.5 px-5">Vai trò</th>
                  <th className="py-3.5 px-5">Trạng thái</th>
                  <th className="py-3.5 px-5 text-right">Thao tác quản trị</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredUsers.map((u) => {
                  const isActive = u.isActive !== false;
                  const isSelf = u._id === user?.id;

                  return (
                    <tr key={u._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-5">
                        <p className="font-bold text-slate-900">
                          {u.fullName} {isSelf && <span className="text-xs font-normal text-purple-600">(Bạn)</span>}
                        </p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          u.role === 'Admin'
                            ? 'bg-purple-100 text-purple-700'
                            : u.role === 'Teacher'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2.5 py-1 rounded-full">
                            Đã bị khóa
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            onClick={() => openEditUserModal(u)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Sửa / Quyền</span>
                          </button>

                          <button
                            onClick={() => {
                              setResetUser(u);
                              setResetPasswordValue('');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold transition"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Đổi pass</span>
                          </button>

                          {!isSelf && (
                            <>
                              <button
                                onClick={() => handleToggleUserStatus(u)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                                  isActive
                                    ? 'bg-orange-50 hover:bg-orange-100 text-orange-700'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                                }`}
                              >
                                {isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                <span>{isActive ? 'Khóa' : 'Mở'}</span>
                              </button>

                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Xóa</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* MODAL DUYỆT / TỪ CHỐI PHIẾU YÊU CẦU MỞ LỚP */}
      {reviewingRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-bold text-lg ${reviewAction === 'APPROVED' ? 'text-emerald-700' : 'text-red-700'}`}>
                {reviewAction === 'APPROVED' ? 'Duyệt phiếu & Mở lớp chính thức' : 'Từ chối phiếu yêu cầu'}
              </h3>
              <button onClick={() => setReviewingRequest(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-sm space-y-1">
                <p className="font-bold text-slate-900">{reviewingRequest.title}</p>
                <p className="text-xs text-slate-600">Giảng viên: {reviewingRequest.teacher?.fullName}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ghi chú phản hồi cho Giảng viên {reviewAction === 'REJECTED' ? '(Bắt buộc)' : '(Không bắt buộc)'}
                </label>
                <textarea
                  rows="3"
                  required={reviewAction === 'REJECTED'}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder={
                    reviewAction === 'APPROVED'
                      ? 'VD: Đã duyệt mở lớp, giảng viên tiến hành cập nhật tài liệu...'
                      : 'VD: Lớp học này đã có trong kỳ hiện tại...'
                  }
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewingRequest(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white rounded-xl font-semibold text-sm ${
                    reviewAction === 'APPROVED'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {reviewAction === 'APPROVED' ? 'Xác nhận duyệt' : 'Xác nhận từ chối'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CẤP TÀI KHOẢN MỚI */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-purple-700 font-bold text-lg">
                <UserPlus className="w-5 h-5" />
                <span>Cấp tài khoản mới</span>
              </div>
              <button onClick={() => setShowCreateUserModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="VD: Nguyễn Văn Giảng"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email đăng nhập</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="teacher@edusphere.edu.vn"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu khởi tạo</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phân quyền vai trò</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                >
                  <option value="Teacher">Teacher (Giảng viên)</option>
                  <option value="Student">Student (Sinh viên)</option>
                  <option value="Admin">Admin (Quản trị viên)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-sm"
                >
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SỬA THÔNG TIN & PHÂN QUYỀN USER */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-lg">
                <Edit3 className="w-5 h-5" />
                <span>Sửa thông tin & Phân quyền</span>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vai trò hệ thống</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                >
                  <option value="Student">Student (Sinh viên)</option>
                  <option value="Teacher">Teacher (Giảng viên)</option>
                  <option value="Admin">Admin (Quản trị viên)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ĐẶT LẠI MẬT KHẨU */}
      {resetUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Đặt lại mật khẩu</h3>
                <p className="text-xs text-amber-600 font-medium mt-0.5">
                  Tài khoản: {resetUser.fullName} ({resetUser.email})
                </p>
              </div>
              <button onClick={() => setResetUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu mới (tối thiểu 6 ký tự)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  placeholder="Nhập mật khẩu mới..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetUser(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-sm"
                >
                  Xác nhận đổi mật khẩu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;