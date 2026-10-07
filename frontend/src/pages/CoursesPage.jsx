import React, { useState, useEffect } from 'react';
import { courseService, departmentService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Building, Plus, Edit, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

const CoursesPage = () => {
  const { role } = useAuth();
  const isStudentRole = role === 'STUDENT';

  const [activeTab, setActiveTab] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modals
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [editingDeptId, setEditingDeptId] = useState(null);

  // Form states
  const [courseForm, setCourseForm] = useState({
    code: '',
    name: '',
    department: '',
    credits: 3,
    semester: 1,
    description: '',
    is_active: true,
  });

  const [deptForm, setDeptForm] = useState({
    code: '',
    name: '',
    description: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const cRes = await courseService.getAll();
      const dRes = await departmentService.getAll();
      setCourses(cRes.results || cRes);
      setDepartments(dRes.results || dRes);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Course Handlers
  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...courseForm,
        department: courseForm.department ? parseInt(courseForm.department) : null,
      };
      if (editingCourseId) {
        await courseService.update(editingCourseId, payload);
        setToast({ message: 'Course updated successfully!', type: 'success' });
      } else {
        await courseService.create(payload);
        setToast({ message: 'Course created successfully!', type: 'success' });
      }
      setIsCourseModalOpen(false);
      fetchData();
    } catch (err) {
      setToast({ message: err.response?.data?.detail || 'Failed to save course.', type: 'error' });
    }
  };

  const handleDeleteCourse = async (id) => {
    if (window.confirm('Delete this course?')) {
      try {
        await courseService.delete(id);
        setToast({ message: 'Course deleted.', type: 'success' });
        fetchData();
      } catch (err) {
        setToast({ message: err.response?.data?.detail || 'Failed to delete course.', type: 'error' });
      }
    }
  };

  // Dept Handlers
  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDeptId) {
        await departmentService.update(editingDeptId, deptForm);
        setToast({ message: 'Department updated!', type: 'success' });
      } else {
        await departmentService.create(deptForm);
        setToast({ message: 'Department created!', type: 'success' });
      }
      setIsDeptModalOpen(false);
      fetchData();
    } catch (err) {
      setToast({ message: err.response?.data?.detail || 'Failed to save department.', type: 'error' });
    }
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Courses & Academic Departments</h1>
          <p className="page-subtitle">Configure curriculum, degree courses, credit units, and faculties</p>
        </div>
        {!isStudentRole && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setDeptForm({ code: '', name: '', description: '' });
                setEditingDeptId(null);
                setIsDeptModalOpen(true);
              }}
            >
              <Building size={16} /> Add Department
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                setCourseForm({ code: '', name: '', department: '', credits: 3, semester: 1, description: '', is_active: true });
                setEditingCourseId(null);
                setIsCourseModalOpen(true);
              }}
            >
              <Plus size={16} /> Add Course
            </button>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
        <button
          className={`btn ${activeTab === 'courses' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('courses')}
        >
          <BookOpen size={16} /> Academic Courses ({courses.length})
        </button>
        <button
          className={`btn ${activeTab === 'departments' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('departments')}
        >
          <Building size={16} /> Departments ({departments.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '12px', color: '#64748b' }}>Loading courses & departments...</p>
        </div>
      ) : activeTab === 'courses' ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Course Title</th>
                  <th>Department</th>
                  <th>Credits</th>
                  <th>Semester</th>
                  <th>Status</th>
                  {!isStudentRole && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.code}</strong></td>
                    <td>{c.name}</td>
                    <td>{c.department_name || 'General'}</td>
                    <td>{c.credits} Credits</td>
                    <td>Semester {c.semester}</td>
                    <td>
                      {c.is_active ? (
                        <span className="badge badge-success"><CheckCircle2 size={12} /> Active</span>
                      ) : (
                        <span className="badge badge-danger"><XCircle size={12} /> Inactive</span>
                      )}
                    </td>
                    {!isStudentRole && (
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-secondary btn-icon"
                          onClick={() => {
                            setEditingCourseId(c.id);
                            setCourseForm({
                              code: c.code,
                              name: c.name,
                              department: c.department || '',
                              credits: c.credits,
                              semester: c.semester,
                              description: c.description || '',
                              is_active: c.is_active,
                            });
                            setIsCourseModalOpen(true);
                          }}
                        >
                          <Edit size={16} color="#0ea5e9" />
                        </button>
                        <button
                          className="btn btn-secondary btn-icon"
                          style={{ marginLeft: 6 }}
                          onClick={() => handleDeleteCourse(c.id)}
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
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {departments.map((d) => (
            <div key={d.id} className="card" style={{ margin: 0 }}>
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="brand-logo" style={{ width: 40, height: 40, fontSize: '0.9rem' }}>
                    {d.code}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{d.name}</h3>
                    <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Dept Code: {d.code}</p>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '16px' }}>
                {d.description || 'No description provided.'}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b' }}>
                <span>Courses: <strong>{d.courses_count || 0}</strong></span>
                <span>Enrolled Students: <strong>{d.students_count || 0}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Course Modal */}
      <Modal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        title={editingCourseId ? "Edit Course" : "Create New Academic Course"}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsCourseModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCourseSubmit}>Save Course</button>
          </>
        }
      >
        <form className="form-row">
          <div className="form-group">
            <label className="form-label">Course Code</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. CS101"
              value={courseForm.code}
              onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Course Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Data Structures & Algorithms"
              value={courseForm.name}
              onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Department</label>
            <select
              className="form-control"
              value={courseForm.department}
              onChange={(e) => setCourseForm({ ...courseForm, department: e.target.value })}
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Credits</label>
            <input
              type="number"
              min="1"
              max="6"
              className="form-control"
              value={courseForm.credits}
              onChange={(e) => setCourseForm({ ...courseForm, credits: parseInt(e.target.value) })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Semester</label>
            <input
              type="number"
              min="1"
              max="8"
              className="form-control"
              value={courseForm.semester}
              onChange={(e) => setCourseForm({ ...courseForm, semester: parseInt(e.target.value) })}
            />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Course Description</label>
            <textarea
              className="form-control"
              rows={2}
              value={courseForm.description}
              onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Dept Modal */}
      <Modal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        title="Add Academic Department"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsDeptModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleDeptSubmit}>Save Department</button>
          </>
        }
      >
        <form>
          <div className="form-group">
            <label className="form-label">Department Code</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. CS"
              value={deptForm.code}
              onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Department Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Computer Science & Engineering"
              value={deptForm.name}
              onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              rows={3}
              value={deptForm.description}
              onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CoursesPage;
