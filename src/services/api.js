import axios from 'axios';

// Create base axios instance pointing to the FastAPI backend
const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 Unauthorized errors automatically
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
      
      // If unauthorized on a protected endpoint, clear stale auth data and redirect to login
      if (!isAuthEndpoint) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
        
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Document Collection Browser Automation API
export const startDocumentCollection = (document_type, open_browser = true) =>
  api.post('/agent/documents/collect/start', { document_type, open_browser });

export const confirmHumanVerification = (document_type) =>
  api.post('/agent/documents/collect/verify-human', { document_type });

export const getDocumentCollectionStatus = (document_type) =>
  api.get('/agent/documents/collect/status', { params: { document_type } });

export const recordManualDocumentAccess = (document_type) =>
  api.post('/agent/documents/collect/manual', { document_type });

export const verifyDocument = (document_type) =>
  api.post(`/documents/${document_type}/verify`);

export default api;

