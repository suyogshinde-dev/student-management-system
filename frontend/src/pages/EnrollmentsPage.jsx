import React, { useState, useEffect } from 'react';
import { enrollmentService, studentService, courseService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UserCheck, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

const EnrollmentsPage = () => {
  const { role } = useAuth();
  const isStudentRole = role === 'STUDENT';

  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);

  const [form, setForm] = useState({
    student: '',
    course: '',
    academic_year: '2025-2026',
    semester: 1,
    status: 'Enrolled',
  });

  const fetchData = async (targetPage = page) => {
    setLoading(true);
    try {
      const eRes = await enrollmentService.getAll({ page: targetPage });
      if (eRes.results) {
        setEnrollments(eRes.results);
        setCount(eRes.count);
        setNextUrl(eRes.next);
        setPrevUrl(eRes.previous);
      } else {
        setEnrollments(eRes);
        setCount(eRes.length);
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
    fetchData(1);
    if (!isStudentRole) {
      studentService.getAll({ page_size: 100 }).then((data) => setStudents(data.results || data));
      courseService.getAll().then((data) => setCourses(data.results || data));
    }
  }, []);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchData(newPage);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.student || !form.course) {
      setToast({ message: 'Please select student and course.', type: 'warning' });
      return;
    }

    try {
      await enrollmentService.create({
        student: parseInt(form.student),
        course: parseInt(form.course),
        academic_year: form.academic_year,
        semester: parseInt(form.semester),
        status: form.status,
      });
      setIsModalOpen(false);
      setToast({ message: 'Student enrolled successfully!', type: 'success' });
      fetchData(page);
    } catch (err) {
      setToast({ message: err.response?.data?.non_field_errors?.[0] || err.response?.data?.detail || 'Enrollment failed.', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Remove this enrollment?')) {
      try {
        await enrollmentService.delete(id);
        setToast({ message: 'Enrollment removed.', type: 'success' });
        fetchData(page);
      } catch (err) {
        setToast({ message: err.response?.data?.detail || 'Failed to remove enrollment.', type: 'error' });
      }
    }
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Course Enrollments</h1>
          <p className="page-subtitle">Manage student registrations into active courses and academic terms</p>
        </div>
        {!isStudentRole && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> New Course Enrollment
          </button>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="loading-spinner"></div>
            <p style={{ marginTop: '12px', color: '#64748b' }}>Loading enrollments...</p>
          </div>
        ) : enrollments.length > 0 ? (
          <>
            <div className="table-container" style={{ border: 'none' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Student Name</th>
                    <th>Course Code</th>
                    <th>Course Name</th>
                    <th>Academic Year</th>
                    <th>Status</th>
                    {!isStudentRole && <th style={{ textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((e) => (
                    <tr key={e.id}>
                      <td><strong>{e.student_roll}</strong></td>
                      <td>{e.student_name}</td>
                      <td><strong>{e.course_code}</strong></td>
                      <td>{e.course_name}</td>
                      <td>{e.academic_year} (Sem {e.semester})</td>
                      <td>
                        <span className={`badge ${e.status === 'Enrolled' ? 'badge-info' : e.status === 'Completed' ? 'badge-success' : 'badge-danger'}`}>
                          {e.status}
                        </span>
                      </td>
                      {!isStudentRole && (
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-secondary btn-icon"
                            onClick={() => handleDelete(e.id)}
                          >
                            <Trash2 size={16} color="#ef4444" />
                          </button>
                        </td>
                      )}
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
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>No Course Enrollments Found</h3>
            <p style={{ fontSize: '0.875rem' }}>No enrollment records present for the current selection.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Enroll Student in Course"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit}>Save Enrollment</button>
          </>
        }
      >
        <form className="form-row">
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Select Student</label>
            <select
              className="form-control"
              value={form.student}
              onChange={(e) => setForm({ ...form, student: e.target.value })}
            >
              <option value="">Select Student</option>
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.roll_number} - {st.name} ({st.course || 'General'})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Select Course</label>
            <select
              className="form-control"
              value={form.course}
              onChange={(e) => setForm({ ...form, course: e.target.value })}
            >
              <option value="">Select Course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name} (Sem {c.semester})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Academic Year</label>
            <input
              type="text"
              className="form-control"
              value={form.academic_year}
              onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Semester</label>
            <input
              type="number"
              min="1"
              max="8"
              className="form-control"
              value={form.semester}
              onChange={(e) => setForm({ ...form, semester: parseInt(e.target.value) })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EnrollmentsPage;
