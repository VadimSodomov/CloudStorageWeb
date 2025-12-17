import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8080/';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
});

api.interceptors.request.use(
  (config) => {
    const url = config.url || '';

    const isAuthRequest =
    url.includes('/api/login') || url.includes('/api/register');

    if (isAuthRequest) {
      return config;
    }
    const token = localStorage.getItem('jwt_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    }
    window.location.href = '/login-reg';
    return Promise.reject(new Error('No authentication token'));
  },
  (error) => Promise.reject(error)
);


api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403 || error.message === 'No authentication token') {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login-reg';
    }

    return Promise.reject(error);
  }
);

// тут можно методы прописывать
export const API = {
    getRootFolder: () => api.get('/api/folder/root'),
    getFolder: (id, code) => api.get(`/api/folder/${id}`, { params: code ? { code } : {} }),
    createFolder: (name, parent_id) => api.post('/api/folder', {name, parent_id}),
    renameFolder: (name, id) => api.put(`/api/folder/${id}`, {name}),
    deleteFolder: (id) => api.delete(`/api/folder/${id}`),

    shareFolderByCode: (folderId) => api.post(`/api/folder/share/${folderId}`),
    stopShareFolder: (folderId) => api.post(`/api/folder/stop/sharing/${folderId}`),

    uploadFiles: (folderId, formData) => api.post(`/api/files/upload/${folderId}`, formData, {headers: { 'Content-Type': 'multipart/form-data' },}),
    deleteFiles: (fileIds) => api.delete('/api/files/delete', { data: { file_ids: fileIds } }),
};

export default api;
