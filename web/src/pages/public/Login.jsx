import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import axiosClient from '../../services/axiosClient';
import { UserCircleIcon } from '@phosphor-icons/react';

const Login = () => {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		username: '',
		password: '',
	});
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState({});

	useEffect(() => {
		// Check if user is already logged in
		const storedUser = localStorage.getItem('user');
		if (storedUser) {
			try {
				const user = JSON.parse(storedUser);
				// Redirect based on role
				if (user.role === 'admin') {
					navigate('/admin/dashboard');
				} else {
					navigate('/');
				}
			} catch (error) {
				console.error('Error parsing user data:', error);
				localStorage.removeItem('user');
			}
		}
	}, [navigate]);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
		// Clear error for this field when user types
		if (errors[name]) {
			setErrors((prev) => ({
				...prev,
				[name]: '',
			}));
		}
	};

	const validateForm = () => {
		const newErrors = {};

		// Username/Email validation
		if (!formData.username.trim()) {
			newErrors.username = 'Username or Email is required';
		}

		// Password validation
		if (!formData.password) {
			newErrors.password = 'Password is required';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!validateForm()) {
			toast.error('Please fix the errors in the form');
			return;
		}

		setLoading(true);

		try {
			const response = await axiosClient.post('/users/login', formData);

			toast.success(response.message || 'Login successful!');

			// Store user data in localStorage
			if (response.data) {
				localStorage.setItem('user', JSON.stringify(response.data));
				// Dispatch custom event to update navbar
				window.dispatchEvent(new Event('userLogin'));
			}

			// Reset form
			setFormData({
				username: '',
				password: '',
			});

			// Redirect based on user role
			setTimeout(() => {
				if (response.data.role === 'admin') {
					navigate('/admin/dashboard');
				} else {
					navigate('/');
				}
			}, 1000);
		} catch (error) {
			const errorMessage =
				error.response?.data?.message ||
				error.message ||
				'Login failed. Please try again.';
			toast.error(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-base-200 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-7xl mx-auto">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
					{/* Left side - Illustration */}
					<div className="hidden lg:flex items-center justify-center">
						<img
							src="https://www.propero.in/cdn/shop/files/Frame_35_1500x.png?v=1703917854"
							alt="Login"
							className="w-full max-w-lg"
						/>
					</div>

					{/* Right side - Login Form */}
					<div className="w-full max-w-md mx-auto">
						<div className="bg-warning rounded-3xl shadow-2xl p-8">
							{/* Icon */}
							<div className="flex justify-center mb-6">
								<div className="bg-white rounded-full p-4">
									<UserCircleIcon size={64} weight="fill" className="text-warning" />
								</div>
							</div>

							{/* Title */}
							<h2 className="text-3xl font-bold text-white text-center mb-8">
								Login
							</h2>

							{/* Form */}
							<form onSubmit={handleSubmit} className="space-y-4">
					{/* Username or Email */}
					<div className="form-control">
						<input
							type="text"
							name="username"
							value={formData.username}
							onChange={handleChange}
							className={`input bg-white w-full ${
								errors.username ? 'input-error' : ''
							}`}
							placeholder="Username or Email"
						/>
						{errors.username && (
							<label className="label">
								<span className="label-text-alt text-white bg-error/80 px-2 py-1 rounded mt-1">
									{errors.username}
											</span>
										</label>
									)}
								</div>

								{/* Password */}
								<div className="form-control">
									<input
										type="password"
										name="password"
										value={formData.password}
										onChange={handleChange}
										className={`input bg-white w-full ${
											errors.password ? 'input-error' : ''
										}`}
										placeholder="Password"
									/>
									{errors.password && (
										<label className="label">
											<span className="label-text-alt text-white bg-error/80 px-2 py-1 rounded mt-1">
												{errors.password}
											</span>
										</label>
									)}
								</div>

								{/* Submit Button */}
								<div className="form-control mt-6">
									<button
										type="submit"
										className={`btn bg-black hover:bg-black/80 text-white border-none w-full ${
											loading ? 'loading' : ''
										}`}
										disabled={loading}
									>
										{loading ? 'LOGGING IN...' : 'LOGIN'}
									</button>
								</div>
							</form>

							{/* Forgot password link */}
							<div className="text-center mt-4">
								<p className="text-white text-sm">
									Forgot password?{' '}
									<Link
										to="/forgot-password"
										className="font-bold underline hover:no-underline"
									>
										Reset password
									</Link>
								</p>
							</div>

							{/* Don't have account link */}
							<div className="text-center mt-2">
								<p className="text-white text-sm">
									Don't have an account?{' '}
									<Link
										to="/register"
										className="font-bold underline hover:no-underline"
									>
										Create
									</Link>
								</p>
							</div>
						</div>

						{/* Back to home */}
						<div className="text-center mt-6">
							<Link to="/" className="link link-hover text-base-content/60 text-sm">
								← Back to home
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Login;
