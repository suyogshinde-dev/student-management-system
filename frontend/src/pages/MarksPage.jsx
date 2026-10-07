import React, { useState, useEffect } from 'react';
import { markService, studentService, courseService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Award, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

const MarksPage = () => {
  const { role } = useAuth();
  const isStudentRole = role === 'STUDENT';

  const [marks, setMarks] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedExamType, setSelectedExamType] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);

  const [form, setForm] = useState({
    student: '',
    course: '',
    exam_type: 'Final',
    marks_obtained: '',
    max_marks: 100,
    remarks: '',
  });

  const fetchData = async (targetPage = page) => {
    setLoading(true);
    try {
      const params = { page: targetPage };
      if (selectedStudent) params.student = selectedStudent;
      if (selectedExamType) params.exam_type = selectedExamType;

      const res = await markService.getAll(params);
      if (res.results) {
        setMarks(res.results);
        setCount(res.count);
        setNextUrl(res.next);
        setPrevUrl(res.previous);
      } else {
        setMarks(res);
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
    fetchData(1);
    if (!isStudentRole) {
      studentService.getAll({ page_size: 100 }).then((data) => setStudents(data.results || data));
      courseService.getAll().then((data) => setCourses(data.results || data));
    }
  }, []);

  useEffect(() => {
    setPage(1);
    fetchData(1);
  }, [selectedStudent, selectedExamType]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchData(newPage);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.student || !form.course || !form.marks_obtained) {
      setToast({ message: 'Student, course, and marks are required.', type: 'warning' });
      return;
    }

    try {
      await markService.create({
        student: parseInt(form.student),
        course: parseInt(form.course),
        exam_type: form.exam_type,
        marks_obtained: parseFloat(form.marks_obtained),
        max_marks: parseFloat(form.max_marks),
        remarks: form.remarks,
      });
      setIsModalOpen(false);
      setToast({ message: 'Exam mark saved & grade calculated!', type: 'success' });
      fetchData(page);
    } catch (err) {
      setToast({ message: err.response?.data?.detail || 'Failed to record mark.', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this mark entry?')) {
      try {
        await markService.delete(id);
        setToast({ message: 'Mark entry deleted.', type: 'success' });
        fetchData(page);
      } catch (err) {
        setToast({ message: err.response?.data?.detail || 'Failed to delete mark.', type: 'error' });
      }
    }
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Marks, Grades & Transcripts</h1>
          <p className="page-subtitle">Record exam scores, view automatic grade assignments, and monitor GPA calculations</p>
        </div>
        {!isStudentRole && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Record New Exam Mark
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isStudentRole ? '1fr' : '1.5fr 1fr', gap: '16px' }}>
          {!isStudentRole && (
            <select
              className="form-control"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              <option value="">All Enrolled Students</option>
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.roll_number} - {st.name}
                </option>
              ))}
            </select>
          )}

          <select
            className="form-control"
            value={selectedExamType}
            onChange={(e) => setSelectedExamType(e.target.value)}
          >
            <option value="">All Exam Types</option>
            <option value="Midterm">Midterm Examination</option>
            <option value="Final">Final Examination</option>
            <option value="Quiz">Quiz / Test</option>
            <option value="Assignment">Assignment / Project</option>
            <option value="Lab">Practical / Lab</option>
          </select>
        </div>
      </div>

      {/* Marks Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="loading-spinner"></div>
            <p style={{ marginTop: '12px', color: '#64748b' }}>Loading academic marks...</p>
          </div>
        ) : marks.length > 0 ? (
          <>
            <div className="table-container" style={{ border: 'none' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Roll Number</th>
                    <th>Student Name</th>
                    <th>Course Code</th>
                    <th>Exam Type</th>
                    <th>Marks Obtained</th>
                    <th>Grade</th>
                    <th>Remarks</th>
                    {!isStudentRole && <th style={{ textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {marks.map((m) => (
                    <tr key={m.id}>
                      <td><strong>{m.student_roll}</strong></td>
                      <td>{m.student_name}</td>
                      <td><strong>{m.course_code}</strong></td>
                      <td>{m.exam_type}</td>
                      <td>
                        <strong>{m.marks_obtained}</strong> / {m.max_marks}
                      </td>
                      <td>
                        <span className="badge badge-success" style={{ fontSize: '0.85rem', fontWeight: 800 }}>
                          {m.grade}
                        </span>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.85rem' }}>{m.remarks || '—'}</td>
                      {!isStudentRole && (
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-secondary btn-icon"
                            onClick={() => handleDelete(m.id)}
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
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>No Academic Marks Found</h3>
            <p style={{ fontSize: '0.875rem' }}>No exam marks present for the selected selection.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Exam Score & Grade"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit}>Save Exam Score</button>
          </>
        }
      >
        <form className="form-row">
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Student</label>
            <select
              className="form-control"
              value={form.student}
              onChange={(e) => setForm({ ...form, student: e.target.value })}
            >
              <option value="">Select Student</option>
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.roll_number} - {st.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Course</label>
            <select
              className="form-control"
              value={form.course}
              onChange={(e) => setForm({ ...form, course: e.target.value })}
            >
              <option value="">Select Course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Exam Type</label>
            <select
              className="form-control"
              value={form.exam_type}
              onChange={(e) => setForm({ ...form, exam_type: e.target.value })}
            >
              <option value="Midterm">Midterm Examination</option>
              <option value="Final">Final Examination</option>
              <option value="Quiz">Quiz / Test</option>
              <option value="Assignment">Assignment / Project</option>
              <option value="Lab">Practical / Lab</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Marks Obtained</label>
            <input
              type="number"
              step="0.01"
              max="100"
              className="form-control"
              placeholder="e.g. 85.5"
              value={form.marks_obtained}
              onChange={(e) => setForm({ ...form, marks_obtained: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Remarks</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Excellent performance"
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MarksPage;
