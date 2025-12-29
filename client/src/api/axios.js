import axios from 'axios';

// Use environment variable for API URL, default to localhost for development
// Set VITE_API_URL in .env file to switch between local and production
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';

const axiosInstance = axios.create({
	baseURL: API_URL,
	timeout: 10000,
	headers: {
		'Content-Type': 'application/json',
	},
});

// Add token to requests if it exists
axiosInstance.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem('token');
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

export default axiosInstance;
