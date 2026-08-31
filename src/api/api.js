import axios from 'axios';

// Automatically uses your backend URL (change if deployed)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Automatically inject JWT token into headers for protected requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// --- AUTH API ---
export const loginUser = async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
};

export const registerUser = async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
};

// --- PRODUCT API ---
export const fetchProducts = async (category = '') => {
    const query = category && category.toLowerCase() !== 'all' ? `?category=${category}` : '';
    const response = await api.get(`/products${query}`);
    return response.data;
};

export const createProduct = async (productData) => {
    const response = await api.post('/products', productData);
    return response.data;
};

// --- ADMIN & MERCHANT API ---
export const fetchAdminDashboard = async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
};

export const fetchMerchantDashboard = async () => {
    const response = await api.get('/merchant/dashboard');
    return response.data;
};

export default api;