import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import axiosClient from '../../services/axiosClient';
import { UserCircle } from '@phosphor-icons/react';

const ResetPassword = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const tokenFromUrl = searchParams.get('token');

	const [formData, setFormData] = useState({
		token: tokenFromUrl || '',
		newPassword: '',
		confirmPassword: '',
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

		// Token validation
		if (!formData.token.trim()) {
			newErrors.token = 'Verification code is required';
		} else if (formData.token.length !== 6 || !/^\d+$/.test(formData.token)) {
			newErrors.token = 'Verification code must be 6 digits';
		}

		// Password validation
		if (!formData.newPassword) {
			newErrors.newPassword = 'New password is required';
		} else if (formData.newPassword.length < 6) {
			newErrors.newPassword = 'Password must be at least 6 characters';
		}

		// Confirm password validation
		if (!formData.confirmPassword) {
			newErrors.confirmPassword = 'Please confirm your password';
		} else if (formData.newPassword !== formData.confirmPassword) {
			newErrors.confirmPassword = 'Passwords do not match';
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
			const response = await axiosClient.post('/users/reset-password', {
				token: formData.token,
				newPassword: formData.newPassword,
			});

			toast.success(response.message || 'Password reset successful!');

			// Reset form
			setFormData({
				token: '',
				newPassword: '',
				confirmPassword: '',
			});

			// Redirect to login page after 1.5 seconds
			setTimeout(() => {
				navigate('/login');
			}, 1500);
		} catch (error) {
			const errorMessage =
				error.response?.data?.message ||
				error.message ||
				'Password reset failed. Please try again.';
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
							src="https://img.freepik.com/free-vector/forgot-password-concept-illustration_114360-1123.jpg"
							alt="Reset Password"
							className="w-full max-w-lg"
						/>
					</div>

					{/* Right side - Reset Password Form */}
					<div className="w-full max-w-md mx-auto">
						<div className="bg-warning rounded-3xl shadow-2xl p-8">
							{/* Icon */}
							<div className="flex justify-center mb-6">
								<div className="bg-white rounded-full p-4">
									<UserCircle size={64} weight="fill" className="text-warning" />
								</div>
							</div>

							{/* Title */}
							<h2 className="text-3xl font-bold text-white text-center mb-4">
								Reset Password
							</h2>

							{/* Description */}
							<p className="text-white text-center text-sm mb-8">
								Please enter your email and new password to reset your password.
							</p>

							{/* Form */}
							<form onSubmit={handleSubmit} className="space-y-4">
								{/* Verification Code */}
								<div className="form-control">
									<input
										type="text"
										name="token"
										value={formData.token}
										onChange={handleChange}
										className={`input bg-white w-full text-center text-2xl tracking-widest ${
											errors.token ? 'input-error' : ''
										}`}
										placeholder="000000"
										maxLength={6}
									/>
									{errors.token && (
										<label className="label">
											<span className="label-text-alt text-white bg-error/80 px-2 py-1 rounded mt-1">
												{errors.token}
											</span>
										</label>
									)}
								</div>

								{/* New Password */}
								<div className="form-control">
									<input
										type="password"
										name="newPassword"
										value={formData.newPassword}
										onChange={handleChange}
										className={`input bg-white w-full ${
											errors.newPassword ? 'input-error' : ''
										}`}
										placeholder="New Password"
									/>
									{errors.newPassword && (
										<label className="label">
											<span className="label-text-alt text-white bg-error/80 px-2 py-1 rounded mt-1">
												{errors.newPassword}
											</span>
										</label>
									)}
								</div>

								{/* Confirm Password */}
								<div className="form-control">
									<input
										type="password"
										name="confirmPassword"
										value={formData.confirmPassword}
										onChange={handleChange}
										className={`input bg-white w-full ${
											errors.confirmPassword ? 'input-error' : ''
										}`}
										placeholder="Confirm Password"
									/>
									{errors.confirmPassword && (
										<label className="label">
											<span className="label-text-alt text-white bg-error/80 px-2 py-1 rounded mt-1">
												{errors.confirmPassword}
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
										{loading ? 'RESETTING PASSWORD...' : 'RESET PASSWORD'}
									</button>
								</div>
							</form>

							{/* Remember password link */}
							<div className="text-center mt-6">
								<p className="text-white text-sm">
									Remember your password?{' '}
									<Link
										to="/login"
										className="font-bold underline hover:no-underline"
									>
										Login
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

export default ResetPassword;
