import axios from 'axios';

const axiosClient = axios.create({
	baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1',
	headers: {
		'Content-Type': 'application/json',
	},
});

axiosClient.interceptors.request.use(
    (config) => {
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
		return Promise.reject(error);
	}
);

export default axiosClient;

