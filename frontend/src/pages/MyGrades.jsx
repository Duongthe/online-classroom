import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Award, BookOpen, CheckCircle2, Clock,
  FileText, AlertCircle, ExternalLink, Filter
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function MyGrades() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [summary, setSummary] = useState({
    totalCourses: 0,
    totalAssignments: 0,
    submittedCount: 0,
    gradedCount: 0,
    averageGrade: null,
  });
  const [grades, setGrades] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchMyGrades();
  }, [user]);

  const fetchMyGrades = async () => {
    try {
      const res = await api.get('/assignments/my-grades');
      setSummary(res.data.summary || {});
      setGrades(res.data.grades || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải dữ liệu bảng điểm!');
    } finally {
      setLoading(false);
    }
  };

  const filteredGrades = grades.filter((item) => {
    if (filterStatus === 'ALL') return true;
    return item.status === filterStatus;
  });

  const getGradeColor = (grade) => {
    if (grade >= 8) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (grade >= 5) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Quay lại Dashboard</span>
          </button>

          <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm bg-indigo-50 px-3.5 py-1.5 rounded-full">
            <Award className="w-4 h-4" />
            <span>Bảng điểm cá nhân</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {/* Banner tổng quan điểm số */}
        <div className="bg-gradient-to-r from-indigo-600 via-blue-700 to-slate-900 rounded-3xl p-8 text-white shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold">Kết quả học tập của {user?.fullName}</h1>
              <p className="text-indigo-100 text-sm mt-1">
                Theo dõi điểm số, nhận xét của giảng viên và tiến độ hoàn thành bài tập trên tất cả khóa học.
              </p>
            </div>

            <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-4 text-center">
              <p className="text-xs uppercase tracking-wider text-indigo-100 font-semibold">Điểm trung bình</p>
              <p className="text-3xl font-extrabold mt-1">
                {summary.averageGrade !== null ? `${summary.averageGrade} / 10` : '--'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-2xl p-4 border border-white/15">
              <p className="text-xs text-indigo-200">Khóa học tham gia</p>
              <p className="text-2xl font-extrabold mt-1">{summary.totalCourses}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 border border-white/15">
              <p className="text-xs text-indigo-200">Tổng số bài tập</p>
              <p className="text-2xl font-extrabold mt-1">{summary.totalAssignments}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 border border-white/15">
              <p className="text-xs text-indigo-200">Đã nộp bài</p>
              <p className="text-2xl font-extrabold mt-1 text-amber-300">{summary.submittedCount}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 border border-white/15">
              <p className="text-xs text-indigo-200">Đã có điểm</p>
              <p className="text-2xl font-extrabold mt-1 text-emerald-300">{summary.gradedCount}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-2 text-sm font-medium">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Bộ lọc trạng thái */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 px-2">
            <Filter className="w-3.5 h-3.5" />
            Lọc theo:
          </span>
          {[
            { key: 'ALL', label: `Tất cả (${grades.length})` },
            { key: 'GRADED', label: `Đã chấm điểm (${grades.filter((g) => g.status === 'GRADED').length})` },
            { key: 'SUBMITTED', label: `Chờ chấm (${grades.filter((g) => g.status === 'SUBMITTED').length})` },
            { key: 'NOT_SUBMITTED', label: `Chưa nộp (${grades.filter((g) => g.status === 'NOT_SUBMITTED').length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                filterStatus === tab.key
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Bảng điểm chi tiết */}
        {filteredGrades.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Chưa có dữ liệu điểm số trong mục này</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Hãy tham gia các khóa học và hoàn thành bài tập được giao để xem kết quả chấm điểm tại đây.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Khám phá khóa học</span>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-xs uppercase text-slate-500 font-semibold">
                  <th className="py-3.5 px-5">Khóa học</th>
                  <th className="py-3.5 px-5">Tên bài tập</th>
                  <th className="py-3.5 px-5">Trạng thái</th>
                  <th className="py-3.5 px-5 text-center">Điểm số</th>
                  <th className="py-3.5 px-5">Nhận xét giảng viên</th>
                  <th className="py-3.5 px-5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredGrades.map((item) => (
                  <tr key={item.assignmentId} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-5 font-semibold text-indigo-700">
                      {item.courseTitle}
                    </td>
                    <td className="py-3.5 px-5">
                      <p className="font-bold text-slate-900">{item.assignmentTitle}</p>
                      {item.dueDate && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          Hạn nộp: {new Date(item.dueDate).toLocaleDateString('vi-VN')}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      {item.status === 'GRADED' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Đã chấm điểm
                        </span>
                      )}
                      {item.status === 'SUBMITTED' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">
                          <Clock className="w-3.5 h-3.5" />
                          Chờ chấm điểm
                        </span>
                      )}
                      {item.status === 'NOT_SUBMITTED' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                          Chưa nộp bài
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      {item.grade !== null ? (
                        <span
                          className={`inline-block font-extrabold text-sm px-3 py-1 rounded-xl border ${getGradeColor(
                            item.grade
                          )}`}
                        >
                          {item.grade} / 10
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">--</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-slate-600 max-w-xs">
                      {item.feedback ? (
                        <p className="italic">"{item.feedback}"</p>
                      ) : (
                        <span className="text-slate-400">Chưa có nhận xét</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => navigate(`/courses/${item.courseId}`)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition cursor-pointer"
                      >
                        <span>Vào lớp</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default MyGrades;