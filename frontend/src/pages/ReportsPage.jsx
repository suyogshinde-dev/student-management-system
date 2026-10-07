import React, { useState } from 'react';
import { reportService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Download, Users, Calendar, Award, ShieldAlert } from 'lucide-react';
import Toast from '../components/Toast';

const ReportsPage = () => {
  const { role } = useAuth();
  const isStudentRole = role === 'STUDENT';
  const [toast, setToast] = useState(null);

  const handleDownload = (type) => {
    if (isStudentRole) {
      setToast({ message: 'CSV exports are restricted to Admin & Staff users only.', type: 'error' });
      return;
    }
    const url = reportService.getExportUrl(type);
    window.open(url, '_blank');
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ marginBottom: '28px' }}>
        <h1 className="page-title">Reports & Data Exports</h1>
        <p className="page-subtitle">Generate and download official CSV spreadsheets for audit and academic records</p>
      </div>

      {isStudentRole ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
            }}
          >
            <ShieldAlert size={32} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>Access Restricted</h3>
          <p style={{ fontSize: '0.9rem', color: '#64748b', maxWidth: '480px', margin: '8px auto 0 auto' }}>
            Administrative CSV reports and institution-wide data dumps are restricted to faculty and system administrators only.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Student Master Report */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <Users size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Student Directory Report</h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5 }}>
                Export complete list of enrolled students including roll numbers, contact numbers, email addresses, department, current semester, status, cumulative GPA, and attendance percentages.
              </p>
            </div>

            <button
              className="btn btn-primary"
              style={{ marginTop: '24px', width: '100%' }}
              onClick={() => handleDownload('students')}
            >
              <Download size={18} /> Download Students CSV
            </button>
          </div>

          {/* Attendance Log Report */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10b981, #34d399)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <Calendar size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Attendance Log Report</h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5 }}>
                Export full historical lecture attendance records per student and course, specifying status (Present, Absent, Late, Excused), date timestamps, and remarks.
              </p>
            </div>

            <button
              className="btn btn-primary"
              style={{ marginTop: '24px', width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)' }}
              onClick={() => handleDownload('attendance')}
            >
              <Download size={18} /> Download Attendance CSV
            </button>
          </div>

          {/* Academic Marks Report */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <Award size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Academic Marks & Grades</h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5 }}>
                Export comprehensive exam marks, midterm results, final grades, max score breakdowns, letter grades, and academic transcript data for all students.
              </p>
            </div>

            <button
              className="btn btn-primary"
              style={{ marginTop: '24px', width: '100%', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}
              onClick={() => handleDownload('marks')}
            >
              <Download size={18} /> Download Academic Marks CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
