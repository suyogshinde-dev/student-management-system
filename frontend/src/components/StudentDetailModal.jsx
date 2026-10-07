import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { studentService } from '../services/api';
import { User, Mail, Phone, Calendar, BookOpen, Award, CheckCircle, Percent } from 'lucide-react';

const StudentDetailModal = ({ isOpen, onClose, studentId }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && studentId) {
      setLoading(true);
      studentService
        .getProfile(studentId)
        .then((data) => {
          setProfileData(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [isOpen, studentId]);

  if (!isOpen) return null;

  const { student, enrollments, recent_attendance, marks, attendance_percentage, gpa } = profileData || {};

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Student Academic Profile" maxWidth="800px">
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '12px', color: '#64748b' }}>Fetching academic profile...</p>
        </div>
      ) : student ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Profile Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              padding: '20px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #4f46e5, #0ea5e9)',
              color: '#ffffff',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                fontWeight: 800,
              }}
            >
              {student.name[0]}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{student.name}</h2>
              <p style={{ opacity: 0.9, fontSize: '0.9rem' }}>
                Roll Number: <strong>{student.roll_number}</strong> | Semester: <strong>{student.current_semester}</strong>
              </p>
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                <span className="badge badge-success" style={{ backgroundColor: 'rgba(255, 255, 255, 0.25)', color: '#fff' }}>
                  {student.department_name || student.course}
                </span>
                <span className="badge badge-info" style={{ backgroundColor: 'rgba(255, 255, 255, 0.25)', color: '#fff' }}>
                  {student.status}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="card" style={{ padding: '16px', margin: 0, display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#d1fae5', color: '#10b981' }}>
                <Percent size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>ATTENDANCE RATE</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{attendance_percentage}%</div>
              </div>
            </div>

            <div className="card" style={{ padding: '16px', margin: 0, display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#eef2ff', color: '#4f46e5' }}>
                <Award size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>ACADEMIC GPA</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{gpa} / 4.0</div>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="card" style={{ padding: '16px', margin: 0 }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', color: '#334155' }}>Contact & Personal Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.875rem' }}>
              <div><Mail size={14} style={{ marginRight: 6 }} /> Email: <strong>{student.email}</strong></div>
              <div><Phone size={14} style={{ marginRight: 6 }} /> Phone: <strong>{student.mobile_number}</strong></div>
              <div><Calendar size={14} style={{ marginRight: 6 }} /> DOB: <strong>{student.date_of_birth}</strong></div>
              <div><User size={14} style={{ marginRight: 6 }} /> Gender: <strong>{student.gender}</strong></div>
            </div>
          </div>

          {/* Academic Transcripts */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '10px', color: '#334155' }}>Academic Transcripts & Exam Marks</h4>
            {marks && marks.length > 0 ? (
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
                    {marks.map((m) => (
                      <tr key={m.id}>
                        <td><strong>{m.course_code}</strong> - {m.course_name}</td>
                        <td>{m.exam_type}</td>
                        <td>{m.marks_obtained} / {m.max_marks}</td>
                        <td><span className="badge badge-success">{m.grade}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No exam marks recorded yet.</p>
            )}
          </div>
        </div>
      ) : (
        <p>Student profile not found.</p>
      )}
    </Modal>
  );
};

export default StudentDetailModal;
