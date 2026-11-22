import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, Mail, Lock, User, ShieldCheck,
  ArrowRight, AlertCircle, BookOpen, Video, Award
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await api.post('/auth/register', { fullName, email, password, role });
        const loginRes = await api.post('/auth/login', { email, password });
        login(loginRes.data.user, loginRes.data.token);
        navigate('/dashboard');
      } else {
        const res = await api.post('/auth/login', { email, password });
        login(res.data.user, res.data.token);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-slate-950">
      {/* Hình nền chủ đề học trực tuyến (Online Learning) */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-1000"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1920&q=80')`,
        }}
      />

      {/* Lớp phủ tối + làm mờ nhấn chìm background để nổi bật khung trung tâm */}
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-md" />

      {/* Các hiệu ứng ánh sáng trang trí chìm */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/25 rounded-full blur-3xl pointer-events-none" />

      {/* Các thẻ nổi trang trí liên quan đến học online */}
      <div className="hidden xl:flex items-center gap-3 absolute top-14 left-16 bg-white/10 backdrop-blur-md border border-white/15 text-white px-4 py-3 rounded-2xl shadow-xl">
        <div className="p-2 bg-indigo-500/30 rounded-xl">
          <Video className="w-5 h-5 text-indigo-300" />
        </div>
        <div>
          <p className="text-xs text-slate-300">Lớp học tương tác</p>
          <p className="text-sm font-semibold">Học mọi lúc, mọi nơi</p>
        </div>
      </div>

      <div className="hidden xl:flex items-center gap-3 absolute bottom-14 right-16 bg-white/10 backdrop-blur-md border border-white/15 text-white px-4 py-3 rounded-2xl shadow-xl">
        <div className="p-2 bg-emerald-500/30 rounded-xl">
          <Award className="w-5 h-5 text-emerald-300" />
        </div>
        <div>
          <p className="text-xs text-slate-300">Quản lý bài tập</p>
          <p className="text-sm font-semibold">Theo dõi tiến độ trực quan</p>
        </div>
      </div>

      {/* Khung Card Trung Tâm - Tự động bung rộng mượt mà khi bấm Đăng ký */}
      <div
        className={`relative z-10 w-full transition-all duration-500 ease-out bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/50 border border-white/40 overflow-hidden ${
          isRegister ? 'max-w-2xl' : 'max-w-md'
        }`}
      >
        {/* Banner ảnh minh họa học trực tuyến thu nhỏ ở đỉnh Card */}
        <div className="relative h-32 w-full overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80"
            alt="Online Classroom Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-indigo-950/60 to-transparent flex flex-col justify-end p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-white">
                <div className="p-2 bg-indigo-600 rounded-xl shadow-lg">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-lg font-bold tracking-tight block leading-none">EduSphere LMS</span>
                  <span className="text-[11px] text-blue-200">Online Classroom Platform</span>
                </div>
              </div>

              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-white/90 bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
                <BookOpen className="w-3.5 h-3.5 text-blue-300" />
                E-Learning
              </span>
            </div>
          </div>
        </div>

        {/* Nội dung Form */}
        <div className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              {isRegister ? 'Đăng ký tài khoản học tập' : 'Đăng nhập hệ thống'}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {isRegister
                ? 'Mở rộng không gian học tập — điền đầy đủ thông tin để tham gia lớp học'
                : 'Chào mừng trở lại! Nhập thông tin để vào lớp học của bạn'}
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Khi isRegister = true, bố cục tự bung thành lưới 2 cột (grid-cols-2) trên màn hình rộng */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className={`grid gap-4 ${isRegister ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
              {isRegister && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Họ và tên</label>
                  <div className="relative">
                    <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Địa chỉ Email</label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu</label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  />
                </div>
              </div>

              {isRegister && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Vai trò tham gia</label>
                  <div className="relative">
                    <ShieldCheck className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    >
                      <option value="Student">Học viên (Student)</option>
                      <option value="Teacher">Giảng viên (Teacher)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition disabled:opacity-60 mt-2"
            >
              <span>{loading ? 'Đang xử lý...' : isRegister ? 'Hoàn tất đăng ký' : 'Đăng nhập ngay'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center text-sm text-slate-600">
            {isRegister ? 'Đã có tài khoản trên hệ thống?' : 'Chưa có tài khoản học tập?'}{' '}
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-indigo-600 font-semibold hover:underline"
            >
              {isRegister ? 'Quay lại đăng nhập' : 'Đăng ký tài khoản mới'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;