import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import axiosClient from '../../services/axiosClient';
import { CaretLeft, CircleNotch } from '@phosphor-icons/react';

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
    const [agreedToTerms, setAgreedToTerms] = useState(false);

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

    const normalizeFormData = (data) => ({
        ...data,
        userName: data.userName.trim(),
        email: data.email.trim().toLowerCase(),
        fullName: data.fullName.trim(),
        phone: data.phone.trim(),
        address: data.address.trim(),
    });

    const focusFieldByErrorKey = (errorKey) => {
        if (errorKey === 'agreedToTerms') {
            document.getElementById('register-terms-checkbox')?.focus();
            return;
        }

        const input = document.querySelector(`input[name="${errorKey}"]`);
        input?.focus();
    };

    const validateForm = (data) => {
        const newErrors = {};

        if (!data.userName) {
            newErrors.userName = 'Username is required';
        } else if (data.userName.length < 3) {
            newErrors.userName = 'Username must be at least 3 characters';
        }

        if (!data.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(data.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!data.password) {
            newErrors.password = 'Password is required';
        } else if (data.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (data.phone && !/^[0-9]{10,11}$/.test(data.phone)) {
            newErrors.phone = 'Phone number must be 10-11 digits';
        }

        if (!agreedToTerms) {
            newErrors.agreedToTerms = 'You must accept the Terms & Conditions';
        }

        setErrors(newErrors);
        return newErrors;
    };

    const handleTermsChange = (e) => {
        setAgreedToTerms(e.target.checked);
        if (errors.agreedToTerms) {
            setErrors((prev) => ({
                ...prev,
                agreedToTerms: '',
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const normalizedFormData = normalizeFormData(formData);
        setFormData(normalizedFormData);

        const validationErrors = validateForm(normalizedFormData);
        const errorKeys = Object.keys(validationErrors);

        if (errorKeys.length > 0) {
            const firstErrorKey = errorKeys[0];
            toast.error(validationErrors[firstErrorKey]);
            focusFieldByErrorKey(firstErrorKey);
            return;
        }

        setLoading(true);

        try {
            const registeredEmail = normalizedFormData.email;
            const response = await axiosClient.post('/users/register', normalizedFormData);

            toast.success(
                response.message ||
                    'Registration successful. Please verify your email before login.',
            );
            
            // Reset form
            setFormData({
                userName: '',
                email: '',
                password: '',
                fullName: '',
                phone: '',
                address: '',
            });
            setAgreedToTerms(false);

            // Redirect to verify-email page after 1 second
            setTimeout(() => {
                navigate('/verify-email', {
                    state: { email: response?.data?.email || registeredEmail },
                });
            }, 1000);
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                error.message ||
                'Registration failed. Please try again.';

            const normalizedMessage = errorMessage.toLowerCase();
            const serverFieldErrors = {};

            if (normalizedMessage.includes('email')) {
                serverFieldErrors.email = 'This email may already be in use.';
            }
            if (normalizedMessage.includes('username') || normalizedMessage.includes('user name')) {
                serverFieldErrors.userName = 'This username may already be in use.';
            }

            if (Object.keys(serverFieldErrors).length > 0) {
                setErrors((prev) => ({
                    ...prev,
                    ...serverFieldErrors,
                }));
                focusFieldByErrorKey(Object.keys(serverFieldErrors)[0]);
            }

            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FFFCFA] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl w-full mx-auto">
                <div className="bg-white rounded-sm shadow-2xl shadow-gray-200/40 flex flex-col lg:flex-row overflow-hidden border border-gray-100">
                    
                    {/* Left side - Illustration */}
                    <div className="hidden lg:block lg:w-5/12 relative bg-gray-50">
                        <img
                            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop"
                            alt="Luxury Hotel"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20"></div>
                        <div className="absolute inset-0 flex flex-col justify-between p-12">
                            <Link to="/" className="text-white font-serif text-2xl tracking-wide">
                                Roomerang
                            </Link>
                            <div className="text-white">
                                <h2 className="text-3xl font-serif mb-4 leading-snug">Experience the art of fine living.</h2>
                                <p className="font-light text-white/80 text-sm">Join our exclusive guest list to unlock seamless reservations and personalized stays.</p>
                            </div>
                        </div>
                    </div>

                    {/* Right side - Registration Form */}
                    <div className="w-full lg:w-7/12 p-8 md:p-12 lg:p-16 flex flex-col justify-center">
                        <div className="w-full max-w-md mx-auto">
                            
                            {/* Navigation Back */}
                            <Link 
                                to="/" 
                                className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors mb-8"
                            >
                                <CaretLeft size={14} /> Back to Home
                            </Link>

                            <div className="mb-10">
                                <h1 className="text-3xl font-serif text-gray-900 mb-2">Create Account</h1>
                                <p className="text-sm font-light text-gray-500">Please fill in your details to register.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {/* Username */}
                                    <div className="relative group">
                                        <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Username *</label>
                                        <input
                                            type="text"
                                            name="userName"
                                            value={formData.userName}
                                            onChange={handleChange}
                                            aria-invalid={Boolean(errors.userName)}
                                            aria-describedby={errors.userName ? 'register-userName-error' : undefined}
                                            className={`w-full bg-transparent border-0 border-b ${errors.userName ? 'border-red-500' : 'border-gray-300'} px-0 py-2 text-gray-900 font-light focus:ring-0 focus:border-gray-900 transition-colors placeholder-gray-300`}
                                            placeholder=""
                                        />
                                        {errors.userName && <p id="register-userName-error" className="text-[10px] text-red-500 mt-1.5">{errors.userName}</p>}
                                    </div>

                                    {/* Full Name */}
                                    <div className="relative group">
                                        <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Full Name</label>
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            className="w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-gray-900 font-light focus:ring-0 focus:border-gray-900 transition-colors placeholder-gray-300"
                                            placeholder=""
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="relative group">
                                    <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Email Address *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        aria-invalid={Boolean(errors.email)}
                                        aria-describedby={errors.email ? 'register-email-error' : undefined}
                                        className={`w-full bg-transparent border-0 border-b ${errors.email ? 'border-red-500' : 'border-gray-300'} px-0 py-2 text-gray-900 font-light focus:ring-0 focus:border-gray-900 transition-colors placeholder-gray-300`}
                                        placeholder=""
                                    />
                                    {errors.email && <p id="register-email-error" className="text-[10px] text-red-500 mt-1.5">{errors.email}</p>}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {/* Phone */}
                                    <div className="relative group">
                                        <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Phone Number</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            aria-invalid={Boolean(errors.phone)}
                                            aria-describedby={errors.phone ? 'register-phone-error' : undefined}
                                            className={`w-full bg-transparent border-0 border-b ${errors.phone ? 'border-red-500' : 'border-gray-300'} px-0 py-2 text-gray-900 font-light focus:ring-0 focus:border-gray-900 transition-colors placeholder-gray-300`}
                                            placeholder="+1 234 567 890"
                                        />
                                        {errors.phone && <p id="register-phone-error" className="text-[10px] text-red-500 mt-1.5">{errors.phone}</p>}
                                    </div>

                                    {/* Password */}
                                    <div className="relative group">
                                        <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Password *</label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            aria-invalid={Boolean(errors.password)}
                                            aria-describedby={errors.password ? 'register-password-error' : undefined}
                                            className={`w-full bg-transparent border-0 border-b ${errors.password ? 'border-red-500' : 'border-gray-300'} px-0 py-2 text-gray-900 font-light focus:ring-0 focus:border-gray-900 transition-colors placeholder-gray-300`}
                                            placeholder="••••••••"
                                        />
                                        {errors.password && <p id="register-password-error" className="text-[10px] text-red-500 mt-1.5">{errors.password}</p>}
                                    </div>
                                </div>

                                {/* Address */}
                                <div className="relative group">
                                    <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Home Address</label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-gray-900 font-light focus:ring-0 focus:border-gray-900 transition-colors placeholder-gray-300"
                                        placeholder="123 Luxury Avenue, NY"
                                    />
                                </div>

                                {/* Terms acceptance */}
                                <div className="pt-2">
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <div className="relative flex items-center justify-center mt-0.5">
                                            <input
                                                type="checkbox"
                                                id="register-terms-checkbox"
                                                className="peer appearance-none w-4 h-4 border border-gray-300 rounded-sm bg-white checked:bg-gray-900 checked:border-gray-900 transition-colors cursor-pointer focus:ring-0 focus:ring-offset-0"
                                                checked={agreedToTerms}
                                                onChange={handleTermsChange}
                                                aria-invalid={Boolean(errors.agreedToTerms)}
                                                aria-describedby={errors.agreedToTerms ? 'register-terms-error' : undefined}
                                            />
                                            <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        </div>
                                        <span className="text-xs text-gray-500 font-light leading-relaxed">
                                            I have read and agree to the{' '}
                                            <Link
                                                to="/terms"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-orange-800 hover:text-orange-900 border-b border-transparent hover:border-orange-900 transition-colors font-medium"
                                            >
                                                Terms & Conditions
                                            </Link>
                                        </span>
                                    </label>
                                    {errors.agreedToTerms && <p id="register-terms-error" className="text-[10px] text-red-500 mt-2">{errors.agreedToTerms}</p>}
                                </div>

                                {/* Submit Button */}
                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        className="w-full py-3.5 bg-gray-900 hover:bg-black text-white text-xs uppercase tracking-widest font-medium transition-colors rounded-sm flex justify-center items-center gap-2 disabled:opacity-70"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <><CircleNotch size={16} className="animate-spin" /> Processing...</>
                                        ) : (
                                            'Create Account'
                                        )}
                                    </button>
                                </div>
                            </form>

                            {/* Already have account link */}
                            <div className="text-center mt-8 pt-6 border-t border-gray-100">
                                <p className="text-sm font-light text-gray-500">
                                    Already a member?{' '}
                                    <Link to="/login" className="text-gray-900 font-medium hover:text-orange-800 transition-colors">
                                        Sign in here
                                    </Link>
                                </p>
                            </div>
                            
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;