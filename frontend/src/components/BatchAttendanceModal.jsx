import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { courseService, studentService, attendanceService } from '../services/api';

const BatchAttendanceModal = ({ isOpen, onClose, onSuccess }) => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      courseService.getAll().then((data) => {
        const list = data.results || data;
        setCourses(list);
        if (list.length > 0) {
          setSelectedCourse(list[0].id);
        }
      });
      studentService.getAll({ page_size: 100 }).then((data) => {
        const list = data.results || data;
        setStudents(list);
        const initialMap = {};
        list.forEach((s) => {
          initialMap[s.id] = 'Present';
        });
        setAttendanceMap(initialMap);
      });
    }
  }, [isOpen]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourse || !date) return;

    setSubmitting(true);
    const records = Object.keys(attendanceMap).map((stId) => ({
      student: parseInt(stId),
      status: attendanceMap[stId],
      remarks: 'Batch Recorded',
    }));

    try {
      await attendanceService.batchMark({
        course: parseInt(selectedCourse),
        date,
        records,
      });
      setSubmitting(false);
      onSuccess('Batch attendance recorded successfully!');
      onClose();
    } catch (err) {
      setSubmitting(false);
      console.error(err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Batch Mark Course Attendance"
      maxWidth="750px"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving...' : 'Submit Attendance'}
          </button>
        </>
      }
    >
      <div className="form-row" style={{ marginBottom: '20px' }}>
        <div className="form-group">
          <label className="form-label">Select Course</label>
          <select
            className="form-control"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Date</label>
          <input
            type="date"
            className="form-control"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px' }}>
        Enrolled Students ({students.length})
      </h4>

      <div className="table-container" style={{ maxHeight: '350px', overflowY: 'auto' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Roll No</th>
              <th>Student Name</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map((st) => (
              <tr key={st.id}>
                <td><strong>{st.roll_number}</strong></td>
                <td>{st.name}</td>
                <td>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {['Present', 'Absent', 'Late', 'Excused'].map((stVal) => (
                      <label
                        key={stVal}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                        }}
                      >
                        <input
                          type="radio"
                          name={`att_${st.id}`}
                          value={stVal}
                          checked={attendanceMap[st.id] === stVal}
                          onChange={() => handleStatusChange(st.id, stVal)}
                        />
                        {stVal}
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
};

export default BatchAttendanceModal;
