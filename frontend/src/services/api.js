import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to request headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh or handling errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE}/auth/token/refresh/`, { refresh: refreshToken });
          localStorage.setItem('access_token', res.data.access);
          originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
          return api(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_info');
        }
      }
    }
    return Promise.reject(error);
  }
);

// API Service Methods
export const authService = {
  login: async (username, password) => {
    const res = await api.post('/auth/login/', { username, password });
    if (res.data.access) {
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      localStorage.setItem('user_info', JSON.stringify(res.data.user));
    }
    return res.data;
  },
  register: async (userData) => {
    const res = await api.post('/auth/register/', userData);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me/');
    return res.data;
  },
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
  },
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user_info');
    return userStr ? JSON.parse(userStr) : null;
  }
};

export const dashboardService = {
  getStats: async () => {
    const res = await api.get('/dashboard/stats/');
    return res.data;
  }
};

export const studentService = {
  getAll: async (params = {}) => {
    const res = await api.get('/students/', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/students/${id}/`);
    return res.data;
  },
  getProfile: async (id) => {
    const res = await api.get(`/students/${id}/profile/`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/students/', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/students/${id}/`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/students/${id}/`);
    return res.data;
  }
};

export const departmentService = {
  getAll: async (params = {}) => {
    const res = await api.get('/departments/', { params });
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/departments/', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/departments/${id}/`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/departments/${id}/`);
    return res.data;
  }
};

export const courseService = {
  getAll: async (params = {}) => {
    const res = await api.get('/courses/', { params });
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/courses/', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/courses/${id}/`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/courses/${id}/`);
    return res.data;
  }
};

export const enrollmentService = {
  getAll: async (params = {}) => {
    const res = await api.get('/enrollments/', { params });
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/enrollments/', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/enrollments/${id}/`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/enrollments/${id}/`);
    return res.data;
  }
};

export const attendanceService = {
  getAll: async (params = {}) => {
    const res = await api.get('/attendance/', { params });
    return res.data;
  },
  batchMark: async (batchData) => {
    const res = await api.post('/attendance/batch_mark/', batchData);
    return res.data;
  },
  getReport: async (params = {}) => {
    const res = await api.get('/attendance/report/', { params });
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/attendance/', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/attendance/${id}/`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/attendance/${id}/`);
    return res.data;
  }
};

export const markService = {
  getAll: async (params = {}) => {
    const res = await api.get('/marks/', { params });
    return res.data;
  },
  getTranscript: async (studentId) => {
    const res = await api.get(`/marks/transcript/`, { params: { student: studentId } });
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/marks/', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/marks/${id}/`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/marks/${id}/`);
    return res.data;
  }
};

export const notificationService = {
  getAll: async () => {
    const res = await api.get('/notifications/');
    return res.data;
  },
  markRead: async (id) => {
    const res = await api.post(`/notifications/${id}/mark_read/`);
    return res.data;
  },
  markAllRead: async () => {
    const res = await api.post('/notifications/mark_all_read/');
    return res.data;
  }
};

export const reportService = {
  getExportUrl: (type) => `${API_BASE}/reports/${type}/csv/`
};

export default api;
