import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import axiosClient from '../../services/axiosClient';
import { UserCircleIcon } from '@phosphor-icons/react';

const ForgotPassword = () => {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		email: '',
	});
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState({});
	const [emailSent, setEmailSent] = useState(false);

	useEffect(() => {
		// Check if user is already logged in
		const storedUser = localStorage.getItem('user');
		if (storedUser) {
			try {
				const user = JSON.parse(storedUser);
				// Redirect based on role
				if (user.role === 'admin' || user.role === 'staff') {
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

		// Email validation
		const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		if (!formData.email.trim()) {
			newErrors.email = 'Email is required';
		} else if (!emailRegex.test(formData.email.trim())) {
			newErrors.email = 'Email is invalid';
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
			const response = await axiosClient.post('/users/forgot-password', {
				email: formData.email,
			});

			toast.success(response.message || 'Verification code sent to your email!');
			setEmailSent(true);

			// Redirect to reset password page after 2 seconds
			setTimeout(() => {
				navigate('/reset-password');
			}, 2000);
		} catch (error) {
			const errorMessage =
				error.response?.data?.message ||
				error.message ||
				'Failed to send verification code. Please try again.';
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
							alt="Forgot Password"
							className="w-full max-w-lg"
						/>
					</div>

					{/* Right side - Forgot Password Form */}
					<div className="w-full max-w-md mx-auto">
						<div className="bg-warning rounded-3xl shadow-2xl p-8">
							{/* Icon */}
							<div className="flex justify-center mb-6">
								<div className="bg-white rounded-full p-4">
									<UserCircleIcon size={64} weight="fill" className="text-warning" />
								</div>
							</div>

							{/* Title */}
							<h2 className="text-3xl font-bold text-white text-center mb-4">
								Forgot Password
							</h2>

							{/* Description */}
							<p className="text-white text-center text-sm mb-8">
								{emailSent 
									? 'Verification code sent! Please check your email.'
									: 'Enter your email address and we will send you a verification code.'}
							</p>

							{/* Form */}
							<form onSubmit={handleSubmit} className="space-y-4">
								{/* Email */}
								<div className="form-control">
									<input
										type="email"
										name="email"
										value={formData.email}
										onChange={handleChange}
										className={`input bg-white w-full ${
											errors.email ? 'input-error' : ''
										}`}
										placeholder="Email"
										disabled={emailSent}
									/>
									{errors.email && (
										<label className="label">
											<span className="label-text-alt text-white bg-error/80 px-2 py-1 rounded mt-1">
												{errors.email}
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
										disabled={loading || emailSent}
									>
										{loading ? 'SENDING CODE...' : emailSent ? 'CODE SENT!' : 'SEND VERIFICATION CODE'}
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

export default ForgotPassword;
