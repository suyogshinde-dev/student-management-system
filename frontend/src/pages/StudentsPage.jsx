import React, { useState, useEffect } from 'react';
import { studentService, departmentService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, Eye, Edit, Trash2, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import StudentDetailModal from '../components/StudentDetailModal';

const StudentsPage = () => {
  const { role } = useAuth();
  const isStudentRole = role === 'STUDENT';

  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Pagination states
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);

  // Modals & States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    roll_number: '',
    email: '',
    mobile_number: '',
    gender: 'Male',
    date_of_birth: '2003-01-01',
    department: '',
    current_semester: 1,
    status: 'Active',
    address: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [toast, setToast] = useState(null);

  const fetchStudents = async (targetPage = page) => {
    setLoading(true);
    try {
      const params = { page: targetPage };
      if (search) params.search = search;
      if (selectedDept) params.department = selectedDept;
      if (selectedStatus) params.status = selectedStatus;

      const res = await studentService.getAll(params);
      if (res.results) {
        setStudents(res.results);
        setCount(res.count);
        setNextUrl(res.next);
        setPrevUrl(res.previous);
      } else {
        setStudents(res);
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
    departmentService.getAll().then((data) => setDepartments(data.results || data));
  }, []);

  useEffect(() => {
    setPage(1);
    fetchStudents(1);
  }, [search, selectedDept, selectedStatus]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchStudents(newPage);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.roll_number.trim()) errors.roll_number = 'Roll Number is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!formData.mobile_number || !/^\d{10}$/.test(formData.mobile_number)) {
      errors.mobile_number = 'Mobile number must be exactly 10 digits';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await studentService.create({
        ...formData,
        department: formData.department ? parseInt(formData.department) : null,
      });
      setIsAddOpen(false);
      setToast({ message: 'Student added successfully!', type: 'success' });
      fetchStudents(page);
      resetForm();
    } catch (err) {
      setToast({ message: err.response?.data?.error || err.response?.data?.detail || 'Failed to save student.', type: 'error' });
    }
  };

  const handleEditOpen = (student) => {
    setSelectedStudentId(student.id);
    setFormData({
      name: student.name,
      roll_number: student.roll_number,
      email: student.email,
      mobile_number: student.mobile_number,
      gender: student.gender,
      date_of_birth: student.date_of_birth,
      department: student.department || '',
      current_semester: student.current_semester,
      status: student.status,
      address: student.address,
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await studentService.update(selectedStudentId, {
        ...formData,
        department: formData.department ? parseInt(formData.department) : null,
      });
      setIsEditOpen(false);
      setToast({ message: 'Student updated successfully!', type: 'success' });
      fetchStudents(page);
    } catch (err) {
      setToast({ message: 'Failed to update student.', type: 'error' });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await studentService.delete(selectedStudentId);
      setIsDeleteOpen(false);
      setToast({ message: 'Student deleted successfully!', type: 'success' });
      fetchStudents(page);
    } catch (err) {
      setToast({ message: 'Failed to delete student.', type: 'error' });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      roll_number: '',
      email: '',
      mobile_number: '',
      gender: 'Male',
      date_of_birth: '2003-01-01',
      department: '',
      current_semester: 1,
      status: 'Active',
      address: '',
    });
    setFormErrors({});
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 className="page-title">Student Directory</h1>
          <p className="page-subtitle">Manage student enrollment records, profiles, and academic status</p>
        </div>
        {!isStudentRole && (
          <button className="btn btn-primary" onClick={() => { resetForm(); setIsAddOpen(true); }}>
            <Plus size={18} /> Add New Student
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ padding: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by Name, Roll No, or Email..."
              className="form-control"
              style={{ paddingLeft: '38px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-control"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} - {d.name}
              </option>
            ))}
          </select>

          <select
            className="form-control"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Graduated">Graduated</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="loading-spinner"></div>
            <p style={{ marginTop: '12px', color: '#64748b' }}>Loading students list...</p>
          </div>
        ) : students.length > 0 ? (
          <>
            <div className="table-container" style={{ border: 'none' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Roll Number</th>
                    <th>Student Name</th>
                    <th>Department</th>
                    <th>Sem</th>
                    <th>Attendance %</th>
                    <th>GPA</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((st) => {
                    const isLowAttendance = st.attendance_percentage < 75;
                    return (
                      <tr key={st.id}>
                        <td><strong>{st.roll_number}</strong></td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{st.name}</div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{st.email}</div>
                        </td>
                        <td>{st.department_name || st.course || 'General'}</td>
                        <td>Sem {st.current_semester}</td>
                        <td>
                          <span
                            className={`badge ${isLowAttendance ? 'badge-danger' : 'badge-success'}`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            {isLowAttendance && <AlertTriangle size={12} />}
                            {st.attendance_percentage}%
                          </span>
                        </td>
                        <td><strong>{st.gpa}</strong></td>
                        <td>
                          <span className={`badge ${st.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                            {st.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              className="btn btn-secondary btn-icon"
                              title="View Academic Profile"
                              onClick={() => {
                                setSelectedStudentId(st.id);
                                setIsDetailOpen(true);
                              }}
                            >
                              <Eye size={16} color="#4f46e5" />
                            </button>
                            {!isStudentRole && (
                              <>
                                <button
                                  className="btn btn-secondary btn-icon"
                                  title="Edit Student"
                                  onClick={() => handleEditOpen(st)}
                                >
                                  <Edit size={16} color="#0ea5e9" />
                                </button>
                                <button
                                  className="btn btn-secondary btn-icon"
                                  title="Delete Student"
                                  onClick={() => {
                                    setSelectedStudentId(st.id);
                                    setIsDeleteOpen(true);
                                  }}
                                >
                                  <Trash2 size={16} color="#ef4444" />
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
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>No Students Found</h3>
            <p style={{ fontSize: '0.875rem' }}>No student records match your query.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={isAddOpen || isEditOpen}
        onClose={() => { setIsAddOpen(false); setIsEditOpen(false); }}
        title={isEditOpen ? "Edit Student Details" : "Add New Student"}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={isEditOpen ? handleEditSubmit : handleCreateSubmit}>
              {isEditOpen ? 'Save Changes' : 'Create Student'}
            </button>
          </>
        }
      >
        <form className="form-row">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Alex Johnson"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            {formErrors.name && <span style={{ color: '#ef4444', fontSize: '0.78rem' }}>{formErrors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Roll Number</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. STU2025099"
              value={formData.roll_number}
              onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
            />
            {formErrors.roll_number && <span style={{ color: '#ef4444', fontSize: '0.78rem' }}>{formErrors.roll_number}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="e.g. alex@college.edu"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            {formErrors.email && <span style={{ color: '#ef4444', fontSize: '0.78rem' }}>{formErrors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Mobile Number (10 Digits)</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. 9876543210"
              value={formData.mobile_number}
              onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
            />
            {formErrors.mobile_number && <span style={{ color: '#ef4444', fontSize: '0.78rem' }}>{formErrors.mobile_number}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Department</label>
            <select
              className="form-control"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Current Semester</label>
            <input
              type="number"
              min="1"
              max="8"
              className="form-control"
              value={formData.current_semester}
              onChange={(e) => setFormData({ ...formData, current_semester: parseInt(e.target.value) })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Gender</label>
            <select
              className="form-control"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Date of Birth</label>
            <input
              type="date"
              className="form-control"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Residential Address</label>
            <textarea
              className="form-control"
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirm Student Deletion"
        maxWidth="450px"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsDeleteOpen(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDeleteConfirm}>Delete Student</button>
          </>
        }
      >
        <p style={{ color: '#475569' }}>
          Are you sure you want to permanently delete this student record? This action will remove all associated enrollment and attendance history.
        </p>
      </Modal>

      {/* Profile Detail Drawer */}
      <StudentDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        studentId={selectedStudentId}
      />
    </div>
  );
};

export default StudentsPage;
