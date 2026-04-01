import axios from 'axios';

let isRedirectingToLogin = false;

const axiosClient = axios.create({
	baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1',
	headers: {
		'Content-Type': 'application/json',
	},
});

axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.role === 'staff' && user.hotelId) {
                    if (config.method === 'get') {
                        config.params = config.params || {};
                        config.params.hotelId = user.hotelId;
                    }
                }
            } catch(e) {}
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
	(response) => response.data,
	(error) => {
        const statusCode = error?.response?.status;
        const message = String(error?.response?.data?.message || '').toLowerCase();
        const isAuthError =
            statusCode === 401 ||
            message.includes('session expired') ||
            message.includes('invalid token') ||
            message.includes('jwt expired') ||
            message.includes('not logged in');

        if (isAuthError) {
            const hasSession = !!localStorage.getItem('token') || !!localStorage.getItem('user');

            if (hasSession) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.dispatchEvent(new Event('userLogout'));

                if (!isRedirectingToLogin) {
                    isRedirectingToLogin = true;
                    const currentPath = `${window.location.pathname}${window.location.search}`;
                    const onAuthPage = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'].includes(window.location.pathname);
                    sessionStorage.setItem('authExpiredMessage', 'Your session has expired. Please sign in again.');

                    if (!onAuthPage) {
                        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
                    }
                }
            }
        }

		return Promise.reject(error);
	}
);

export default axiosClient;

