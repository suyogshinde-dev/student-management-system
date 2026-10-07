import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  BookOpen,
  CheckCircle,
  Award,
  TrendingUp,
  FileText,
  Building,
  GraduationCap,
  Calendar,
  Percent,
  AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

const DashboardPage = () => {
  const { role } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    dashboardService
      .getStats()
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <div className="loading-spinner"></div>
        <p style={{ marginTop: '16px', color: '#64748b' }}>Loading Analytics & Dashboard...</p>
      </div>
    );
  }

  // Check if API returned student-isolated dashboard stats
  if (stats?.is_student) {
    const { student, attendance_percentage, gpa, enrolled_courses_count, recent_marks, recent_attendance, enrolled_courses } = stats;
    const isLowAtt = attendance_percentage < 75;

    return (
      <div>
        <div style={{ marginBottom: '28px' }}>
          <h1 className="page-title">Student Academic Portal</h1>
          <p className="page-subtitle">Personal academic performance, attendance overview, and grade transcript summary</p>
        </div>

        {/* Student Welcome Banner */}
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)',
            color: '#ffffff',
            padding: '24px',
            marginBottom: '28px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                fontWeight: 800,
              }}
            >
              {student?.name ? student.name[0] : 'S'}
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Welcome back, {student?.name || 'Student'}!</h2>
              <p style={{ opacity: 0.9, fontSize: '0.9rem' }}>
                Roll Number: <strong>{student?.roll_number}</strong> | Department: <strong>{student?.department_name || student?.course || 'General'}</strong> | Semester: <strong>{student?.current_semester}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Personal Metrics Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div>
              <div className="stat-label">ATTENDANCE RATE</div>
              <div className="stat-value" style={{ color: isLowAtt ? '#ef4444' : '#10b981' }}>
                {attendance_percentage}%
              </div>
              {isLowAtt && (
                <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <AlertTriangle size={14} /> Below 75% Requirement!
                </div>
              )}
            </div>
            <div
              className="stat-icon-wrapper"
              style={{
                background: isLowAtt
                  ? 'linear-gradient(135deg, #ef4444, #f87171)'
                  : 'linear-gradient(135deg, #10b981, #34d399)',
              }}
            >
              <Percent size={24} />
            </div>
          </div>

          <div className="stat-card">
            <div>
              <div className="stat-label">ACADEMIC GPA</div>
              <div className="stat-value">{gpa} / 4.0</div>
              <div style={{ fontSize: '0.78rem', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <Award size={14} /> Cumulative Grade
              </div>
            </div>
            <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' }}>
              <GraduationCap size={24} />
            </div>
          </div>

          <div className="stat-card">
            <div>
              <div className="stat-label">ENROLLED COURSES</div>
              <div className="stat-value">{enrolled_courses_count}</div>
            </div>
            <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)' }}>
              <BookOpen size={24} />
            </div>
          </div>
        </div>

        {/* Enrolled Courses & Recent Marks */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Enrolled Courses</h3>
            </div>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Course Code</th>
                    <th>Course Title</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(enrolled_courses || []).map((e) => (
                    <tr key={e.id}>
                      <td><strong>{e.course_code}</strong></td>
                      <td>{e.course_name}</td>
                      <td><span className="badge badge-success">{e.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Recent Exam Grades</h3>
            </div>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Exam Type</th>
                    <th>Marks</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {(recent_marks || []).map((m) => (
                    <tr key={m.id}>
                      <td><strong>{m.course_code}</strong></td>
                      <td>{m.exam_type}</td>
                      <td>{m.marks_obtained} / {m.max_marks}</td>
                      <td><span className="badge badge-success">{m.grade}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin / Staff Institutional Analytics Dashboard
  const {
    total_students,
    active_students,
    total_courses,
    total_departments,
    overall_attendance,
    avg_gpa,
    department_distribution,
    grade_distribution,
    recent_enrollments,
    recent_students
  } = stats || {};

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 className="page-title">Academic Analytics Dashboard</h1>
          <p className="page-subtitle">Real-time overview of student enrollments, attendance, and academic performance</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/reports')}>
            <FileText size={16} /> Export Reports
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/students')}>
            <Users size={16} /> Student Directory
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div>
            <div className="stat-label">TOTAL ENROLLED STUDENTS</div>
            <div className="stat-value">{total_students || 0}</div>
            <div style={{ fontSize: '0.78rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <TrendingUp size={14} /> {active_students} Active Status
            </div>
          </div>
          <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}>
            <Users size={26} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">ACTIVE COURSES</div>
            <div className="stat-value">{total_courses || 0}</div>
            <div style={{ fontSize: '0.78rem', color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <Building size={14} /> Across {total_departments} Departments
            </div>
          </div>
          <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)' }}>
            <BookOpen size={26} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">AVERAGE ATTENDANCE RATE</div>
            <div className="stat-value">{overall_attendance}%</div>
            <div style={{ fontSize: '0.78rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <CheckCircle size={14} /> Mandate Met
            </div>
          </div>
          <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #10b981, #34d399)' }}>
            <CheckCircle size={26} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">AVERAGE ACADEMIC GPA</div>
            <div className="stat-value">{avg_gpa} / 4.0</div>
            <div style={{ fontSize: '0.78rem', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <Award size={14} /> Cumulative Grade Score
            </div>
          </div>
          <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' }}>
            <GraduationCap size={26} />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px', marginBottom: '28px' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Student Distribution by Department</h3>
          </div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={department_distribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="code" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} name="Students Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Grade Performance Breakdown</h3>
          </div>
          <div style={{ width: '100%', height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={grade_distribution || []}
                  dataKey="count"
                  nameKey="grade"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={4}
                  label={({ grade, count }) => `${grade}: ${count}`}
                >
                  {(grade_distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity & Quick Lists */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recently Added Students</h3>
            <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={() => navigate('/students')}>
              View All
            </button>
          </div>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(recent_students || []).slice(0, 5).map((st) => (
                  <tr key={st.id}>
                    <td><strong>{st.roll_number}</strong></td>
                    <td>{st.name}</td>
                    <td>{st.department_code || st.course}</td>
                    <td><span className="badge badge-success">{st.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Course Enrollments</h3>
            <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={() => navigate('/enrollments')}>
              Manage
            </button>
          </div>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course Code</th>
                  <th>Year</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(recent_enrollments || []).slice(0, 5).map((en) => (
                  <tr key={en.id}>
                    <td>{en.student_name}</td>
                    <td><strong>{en.course_code}</strong></td>
                    <td>{en.academic_year}</td>
                    <td><span className="badge badge-info">{en.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
