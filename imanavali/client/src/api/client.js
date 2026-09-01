import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export default api;

export const homeApi = {
  bookNow: (mobile, type) => api.post('/home/book-now', { mobile, type }),
  contact: (data) => api.post('/home/contact', data),
};

export const accountApi = {
  getSession: () => api.get('/account/register/session'),
  getAreas: () => api.get('/account/areas'),
  getPincode: (areaId) => api.get(`/account/pincode/${areaId}`),
  checkMobile: (mobileNo) => api.post('/account/check-mobile-registrations', { mobileNo }),
  register: (formData) => api.post('/account/register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  cancel: (data) => api.post('/account/cancel', data),
};

export const paymentApi = {
  getPayment: (params) => api.get('/payment/payment', { params }),
  verify: (data) => api.post('/payment/verify', data),
};

export const registerApi = {
  validateBulk: (token) => api.get(`/register/bulk/${token}`),
  submitBulk: (token, formData) => api.post(`/register/bulk/${token}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const playerApi = {
  getByQr: (code) => api.get(`/player/details/${code}`),
};

export const adminApi = {
  login: (username, password) => api.post('/admin/login', { username, password }),
  logout: () => api.post('/admin/logout'),
  dashboard: () => api.get('/admin/dashboard'),
  registrationsPaged: (body) => api.post('/admin/registrations/paged', body),
  exportCsv: () => '/api/admin/registrations/export',
  getPlayer: (id) => api.get(`/admin/players/${id}`),
  updatePlayer: (id, formData) => api.put(`/admin/players/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  approve: (playerId, status) => api.post('/admin/approve', { playerId, status }),
  qrUnassigned: () => api.get('/admin/qr/unassigned'),
  qrSearch: (term) => api.get('/admin/qr/search', { params: { term } }),
  qrAssign: (playerId, codeValue) => api.post('/admin/qr/assign', { playerId, codeValue }),
  bulkLinks: () => api.get('/admin/bulk-links'),
  generateBulkLink: () => api.post('/admin/bulk-links/generate'),
  expireBulkLink: (id) => api.post(`/admin/bulk-links/${id}/expire`),
  deleteBulkLink: (id) => api.delete(`/admin/bulk-links/${id}`),
};
