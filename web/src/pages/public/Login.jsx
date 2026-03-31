import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import axiosClient from '../../services/axiosClient';
import { CaretLeft, CircleNotch, WarningCircle } from '@phosphor-icons/react';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
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
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.username.trim()) {
            newErrors.username = 'Username or Email is required';
        }
        if (!formData.password) {
            newErrors.password = 'Password is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const response = await axiosClient.post('/users/login', formData);

            toast.success(response.message || 'Authentication successful');

            if (response.data) {
                localStorage.setItem('user', JSON.stringify(response.data));
                if (response.token) {
                    localStorage.setItem('token', response.token);
                }
                window.dispatchEvent(new Event('userLogin'));
            }

            setFormData({ username: '', password: '' });

            setTimeout(() => {
                if (response.data.role === 'admin' || response.data.role === 'staff') {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/');
                }
            }, 1000);
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                error.message ||
                'Authentication failed. Please check your credentials.';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-[#FFFCFA]">
            
            {/* Left Side - Luxury Editorial Image (Hidden on mobile) */}
            <div className="hidden lg:block lg:w-1/2 relative bg-gray-900 overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1564501049412-61c2a3083791?q=80&w=2000"
                    alt="Luxury Hotel Lobby"
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-16 left-16 right-16">
                    <span className="text-[10px] text-white/70 uppercase tracking-[0.3em] mb-4 block">
                        Members Portal
                    </span>
                    <h2 className="text-4xl md:text-5xl font-serif text-white leading-tight mb-4">
                        Curated experiences await.
                    </h2>
                    <p className="text-white/80 font-light text-sm tracking-wide max-w-md">
                        Sign in to access your personalized portfolio, manage reservations, and explore exclusive privileges.
                    </p>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-16 md:px-24 lg:px-32 py-12 relative">
                
                {/* Back to Home Link */}
                <Link 
                    to="/" 
                    className="absolute top-8 left-6 sm:left-16 md:left-24 lg:left-32 flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
                >
                    <CaretLeft size={14} /> Return to Homepage
                </Link>

                <div className="w-full max-w-md mx-auto mt-12 lg:mt-0">
                    <div className="mb-12">
                        <h1 className="text-3xl md:text-4xl font-serif text-gray-900 mb-3">
                            Sign In
                        </h1>
                        <p className="text-sm font-light text-gray-500">
                            Enter your credentials to access your account.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        
                        {/* Username/Email Field */}
                        <div className="relative group">
                            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">
                                Username or Email
                            </label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className={`w-full bg-transparent border-0 border-b px-0 py-2 text-gray-900 font-light focus:ring-0 transition-colors placeholder-gray-300 ${
                                    errors.username ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-gray-900'
                                }`}
                                placeholder="Enter your identity"
                            />
                            {errors.username && (
                                <p className="absolute -bottom-5 left-0 text-[10px] text-red-500 flex items-center gap-1">
                                    <WarningCircle size={12} weight="fill" /> {errors.username}
                                </p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div className="relative group">
                            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`w-full bg-transparent border-0 border-b px-0 py-2 text-gray-900 font-light focus:ring-0 transition-colors placeholder-gray-300 ${
                                    errors.password ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-gray-900'
                                }`}
                                placeholder="Enter your password"
                            />
                            {errors.password && (
                                <p className="absolute -bottom-5 left-0 text-[10px] text-red-500 flex items-center gap-1">
                                    <WarningCircle size={12} weight="fill" /> {errors.password}
                                </p>
                            )}
                        </div>

                        {/* Forgot Password Link */}
                        <div className="flex justify-end pt-2">
                            <Link
                                to="/forgot-password"
                                className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gray-900 hover:bg-black text-white text-xs tracking-widest uppercase transition-colors rounded-sm flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <><CircleNotch size={16} className="animate-spin" /> Authenticating</>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Registration Link */}
                    <div className="mt-12 text-center border-t border-gray-100 pt-8">
                        <p className="text-sm font-light text-gray-500">
                            Don't have an account yet?{' '}
                            <Link
                                to="/register"
                                className="font-medium text-gray-900 border-b border-gray-900 pb-0.5 hover:text-orange-800 hover:border-orange-800 transition-colors"
                            >
                                Create an account
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
            
        </div>
    );
};

export default Login;