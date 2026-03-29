import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import axiosClient from '../../services/axiosClient';
import { UserCircleIcon } from '@phosphor-icons/react';

const Register = () => {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		userName: '',
		email: '',
		password: '',
		fullName: '',
		phone: '',
		address: '',
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

		// Username validation
		if (!formData.userName.trim()) {
			newErrors.userName = 'Username is required';
		} else if (formData.userName.length < 3) {
			newErrors.userName = 'Username must be at least 3 characters';
		}

		// Email validation
		if (!formData.email.trim()) {
			newErrors.email = 'Email is required';
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			newErrors.email = 'Email is invalid';
		}

		// Password validation
		if (!formData.password) {
			newErrors.password = 'Password is required';
		} else if (formData.password.length < 6) {
			newErrors.password = 'Password must be at least 6 characters';
		}

		// Phone validation (optional but if provided must be valid)
		if (formData.phone && !/^[0-9]{10,11}$/.test(formData.phone)) {
			newErrors.phone = 'Phone number must be 10-11 digits';
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
			const response = await axiosClient.post('/users/register', formData);

			toast.success(response.message || 'Registration successful!');
			
			// Reset form
			setFormData({
				userName: '',
				email: '',
				password: '',
				fullName: '',
				phone: '',
				address: '',
			});

			// Redirect to home page after 1 second
			setTimeout(() => {
				navigate('/');
			}, 1000);
		} catch (error) {
			const errorMessage =
				error.response?.data?.message ||
				error.message ||
				'Registration failed. Please try again.';
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
							alt="Registration"
							className="w-full max-w-lg"
						/>
					</div>

					{/* Right side - Registration Form */}
					<div className="w-full max-w-md mx-auto">
						<div className="bg-warning rounded-3xl shadow-2xl p-8">
							{/* Icon */}
							<div className="flex justify-center mb-6">
								<div className="bg-white rounded-full p-4">
									<UserCircleIcon size={64} weight="fill" className="text-warning" />
								</div>
							</div>

							{/* Form */}
							<form onSubmit={handleSubmit} className="space-y-4">
								{/* Username */}
								<div className="form-control">
									<input
										type="text"
										name="userName"
										value={formData.userName}
										onChange={handleChange}
										className={`input bg-white w-full ${
											errors.userName ? 'input-error' : ''
										}`}
										placeholder="Username"
									/>
									{errors.userName && (
										<label className="label">
											<span className="label-text-alt text-white bg-error/80 px-2 py-1 rounded mt-1">
												{errors.userName}
											</span>
										</label>
									)}
								</div>

								{/* Full Name */}
								<div className="form-control">
									<input
										type="text"
										name="fullName"
										value={formData.fullName}
										onChange={handleChange}
										className="input bg-white w-full"
										placeholder="Full Name"
									/>
								</div>

								{/* Address */}
								<div className="form-control">
									<input
										type="text"
										name="address"
										value={formData.address}
										onChange={handleChange}
										className="input bg-white w-full"
										placeholder="Address"
									/>
								</div>

								{/* Phone */}
								<div className="form-control">
									<input
										type="tel"
										name="phone"
										value={formData.phone}
										onChange={handleChange}
										className={`input bg-white w-full ${
											errors.phone ? 'input-error' : ''
										}`}
										placeholder="Phone"
									/>
									{errors.phone && (
										<label className="label">
											<span className="label-text-alt text-white bg-error/80 px-2 py-1 rounded mt-1">
												{errors.phone}
											</span>
										</label>
									)}
								</div>

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
									/>
									{errors.email && (
										<label className="label">
											<span className="label-text-alt text-white bg-error/80 px-2 py-1 rounded mt-1">
												{errors.email}
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
										{loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
									</button>
								</div>
							</form>

							{/* Already have account link */}
							<div className="text-center mt-6">
								<p className="text-white text-sm">
									Already have an account?{' '}
									<Link to="/login" className="font-bold underline hover:no-underline">
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

export default Register;
