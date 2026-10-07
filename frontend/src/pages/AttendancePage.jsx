import React, { useState, useEffect } from 'react';
import { attendanceService, courseService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Calendar, CheckCircle, XCircle, Clock, Users, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import BatchAttendanceModal from '../components/BatchAttendanceModal';
import Toast from '../components/Toast';

const AttendancePage = () => {
  const { role } = useAuth();
  const isStudentRole = role === 'STUDENT';

  const [attendances, setAttendances] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);

  const fetchData = async (targetPage = page) => {
    setLoading(true);
    try {
      const params = { page: targetPage };
      if (selectedCourse) params.course = selectedCourse;
      if (selectedStatus) params.status = selectedStatus;

      const res = await attendanceService.getAll(params);
      if (res.results) {
        setAttendances(res.results);
        setCount(res.count);
        setNextUrl(res.next);
        setPrevUrl(res.previous);
      } else {
        setAttendances(res);
        setCount(res.length);
        setNextUrl(null);
        setPrevUrl(null);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    courseService.getAll().then((data) => setCourses(data.results || data));
  }, []);

  useEffect(() => {
    setPage(1);
    fetchData(1);
  }, [selectedCourse, selectedStatus]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchData(newPage);
  };

  // Calculate summary metrics
  const total = attendances.length;
  const present = attendances.filter((a) => a.status === 'Present').length;
  const absent = attendances.filter((a) => a.status === 'Absent').length;
  const late = attendances.filter((a) => a.status === 'Late').length;
  const presentPct = total > 0 ? Math.round(((present + late) / total) * 100) : 100;
  const isLowAttendance = presentPct < 75;

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Attendance Tracker & Percentage</h1>
          <p className="page-subtitle">Track daily lecture attendance, monitor percentage thresholds, and batch mark records</p>
        </div>
        {!isStudentRole && (
          <button className="btn btn-primary" onClick={() => setIsBatchOpen(true)}>
            <Users size={18} /> Batch Mark Class Attendance
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div>
            <div className="stat-label">RECORDED SESSIONS</div>
            <div className="stat-value">{total}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}>
            <Calendar size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">ATTENDANCE RATE</div>
            <div className="stat-value" style={{ color: isLowAttendance ? '#ef4444' : '#10b981' }}>
              {presentPct}%
            </div>
            {isLowAttendance && (
              <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <AlertTriangle size={14} /> Below 75% Mandate Warning!
              </div>
            )}
          </div>
          <div
            className="stat-icon-wrapper"
            style={{
              background: isLowAttendance
                ? 'linear-gradient(135deg, #ef4444, #f87171)'
                : 'linear-gradient(135deg, #10b981, #34d399)',
            }}
          >
            {isLowAttendance ? <AlertTriangle size={24} /> : <CheckCircle size={24} />}
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">ABSENT COUNT</div>
            <div className="stat-value" style={{ color: '#ef4444' }}>{absent}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #ef4444, #f87171)' }}>
            <XCircle size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">LATE ARRIVALS</div>
            <div className="stat-value" style={{ color: '#f59e0b' }}>{late}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}>
            <Clock size={24} />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <select
            className="form-control"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>

          <select
            className="form-control"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Late">Late</option>
            <option value="Excused">Excused</option>
          </select>
        </div>
      </div>

      {/* Attendance Logs Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="loading-spinner"></div>
            <p style={{ marginTop: '12px', color: '#64748b' }}>Loading attendance logs...</p>
          </div>
        ) : attendances.length > 0 ? (
          <>
            <div className="table-container" style={{ border: 'none' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Roll Number</th>
                    <th>Student Name</th>
                    <th>Course Code</th>
                    <th>Course Name</th>
                    <th>Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {attendances.map((a) => (
                    <tr key={a.id}>
                      <td><strong>{a.date}</strong></td>
                      <td>{a.student_roll}</td>
                      <td>{a.student_name}</td>
                      <td><strong>{a.course_code}</strong></td>
                      <td>{a.course_name}</td>
                      <td>
                        <span className={`badge ${a.status === 'Present' ? 'badge-success' : a.status === 'Absent' ? 'badge-danger' : 'badge-warning'}`}>
                          {a.status}
                        </span>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.85rem' }}>{a.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderTop: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
              }}
            >
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Showing Page <strong>{page}</strong> of Total <strong>{Math.ceil(count / 10) || 1}</strong> ({count} items)
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary"
                  disabled={!prevUrl}
                  onClick={() => handlePageChange(page - 1)}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <button
                  className="btn btn-secondary"
                  disabled={!nextUrl}
                  onClick={() => handlePageChange(page + 1)}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>No Attendance Records Found</h3>
            <p style={{ fontSize: '0.875rem' }}>No logs present for the selected filter.</p>
          </div>
        )}
      </div>

      {!isStudentRole && (
        <BatchAttendanceModal
          isOpen={isBatchOpen}
          onClose={() => setIsBatchOpen(false)}
          onSuccess={(msg) => {
            setToast({ message: msg, type: 'success' });
            fetchData(page);
          }}
        />
      )}
    </div>
  );
};

export default AttendancePage;
