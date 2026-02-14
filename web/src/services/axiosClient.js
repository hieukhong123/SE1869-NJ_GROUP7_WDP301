import axios from 'axios';

const axiosClient = axios.create({
	baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1',
	headers: {
		'Content-Type': 'application/json',
	},
});

axiosClient.interceptors.response.use(
	(response) => response.data,
	(error) => {
		return Promise.reject(error);
	}
);

export default axiosClient;
