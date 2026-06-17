const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server returned an empty response. Check if the backend is running.`);
  }
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const authApi = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/auth/me'),
  getPendingRegistrations: () => request('/auth/pending-registrations'),
  getUsers: () => request('/auth/users'),
  approveRegistration: (id) => request(`/auth/approve-registration/${id}`, { method: 'PUT' }),
  rejectRegistration: (id) => request(`/auth/reject-registration/${id}`, { method: 'PUT' }),
  deleteUser: (id) => request(`/auth/users/${id}`, { method: 'DELETE' }),
};

export const leaveApi = {
  getAll: () => request('/leaves'),
  getPending: () => request('/leaves/pending'),
  create: (data) => request('/leaves', { method: 'POST', body: JSON.stringify(data) }),
  approve: (id, comment) => request(`/leaves/${id}/approve`, { method: 'PUT', body: JSON.stringify({ comment }) }),
  reject: (id, comment) => request(`/leaves/${id}/reject`, { method: 'PUT', body: JSON.stringify({ comment }) }),
  bulkAction: (ids, action, comment) => request('/leaves/bulk-action', { method: 'PUT', body: JSON.stringify({ ids, action, comment }) }),
};

export const aiApi = {
  getAttendanceImpact: (start_date, end_date) => request('/ai/attendance-impact', { method: 'POST', body: JSON.stringify({ start_date, end_date }) }),
  getFacultyWorkload: () => request('/ai/faculty-workload'),
  getTodaysAbsentees: () => request('/ai/todays-absentees'),
  getHolidays: (limit) => request(`/ai/holidays${limit ? `?limit=${limit}` : ''}`),
  getNotifications: () => request('/ai/notifications'),
  getReasonTemplates: () => request('/ai/reason-templates'),
  getDepartmentStats: () => request('/ai/department-stats'),
  getYearStats: () => request('/ai/year-stats'),
};
