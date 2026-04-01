import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import axiosClient from '../../services/axiosClient';
import { CaretLeft, CircleNotch, WarningCircle, EnvelopeSimple } from '@phosphor-icons/react';

const VerifyEmail = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [resending, setResending] = useState(false);
    const [errors, setErrors] = useState({});

    const queryEmail = useMemo(() => {
        const params = new URLSearchParams(location.search);
        return params.get('email') || '';
    }, [location.search]);

    useEffect(() => {
        const stateEmail = location.state?.email || '';
        const presetEmail = stateEmail || queryEmail;
        if (presetEmail) {
            setEmail(presetEmail);
        }
    }, [location.state, queryEmail]);

    const validate = () => {
        const nextErrors = {};
        if (!email.trim()) {
            nextErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            nextErrors.email = 'Invalid email format';
        }

        if (!code.trim()) {
            nextErrors.code = 'Verification code is required';
        } else if (!/^\d{6}$/.test(code.trim())) {
            nextErrors.code = 'Code must be exactly 6 digits';
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleVerify = async (event) => {
        event.preventDefault();

        if (!validate()) {
            return;
        }

        setSubmitting(true);
        try {
            const response = await axiosClient.post('/users/verify-email', {
                email: email.trim(),
                code: code.trim(),
            });

            toast.success(response.message || 'Email verified successfully');
            setCode('');
            setTimeout(() => navigate('/login'), 800);
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                    error.message ||
                    'Failed to verify email. Please try again.',
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleResend = async () => {
        if (!email.trim()) {
            setErrors((prev) => ({ ...prev, email: 'Email is required to resend code' }));
            return;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            setErrors((prev) => ({ ...prev, email: 'Invalid email format' }));
            return;
        }

        setResending(true);
        try {
            const response = await axiosClient.post('/users/resend-verification', {
                email: email.trim(),
            });
            toast.success(response.message || 'Verification code resent successfully');
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                    error.message ||
                    'Failed to resend verification code.',
            );
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-[#FFFCFA]">
            <div className="hidden lg:block lg:w-1/2 relative bg-gray-900 overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1564501049412-61c2a3083791?q=80&w=2000"
                    alt="Hotel Lobby"
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-16 left-16 right-16">
                    <span className="text-[10px] text-white/70 uppercase tracking-[0.3em] mb-4 block">
                        Account Security
                    </span>
                    <h2 className="text-4xl md:text-5xl font-serif text-white leading-tight mb-4">
                        One last step.
                    </h2>
                    <p className="text-white/80 font-light text-sm tracking-wide max-w-md">
                        Enter your 6-digit verification code to activate your account and continue.
                    </p>
                </div>
            </div>

            <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-16 md:px-24 lg:px-32 py-12 relative">
                <Link
                    to="/"
                    className="absolute top-8 left-6 sm:left-16 md:left-24 lg:left-32 flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
                >
                    <CaretLeft size={14} /> Return to Homepage
                </Link>

                <div className="w-full max-w-md mx-auto mt-12 lg:mt-0">
                    <div className="mb-12">
                        <h1 className="text-3xl md:text-4xl font-serif text-gray-900 mb-3">
                            Verify Email
                        </h1>
                        <p className="text-sm font-light text-gray-500">
                            We sent a 6-digit code to your email. Enter it below.
                        </p>
                    </div>

                    <form onSubmit={handleVerify} className="space-y-8">
                        <div className="relative group">
                            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (errors.email) {
                                        setErrors((prev) => ({ ...prev, email: '' }));
                                    }
                                }}
                                className={`w-full bg-transparent border-0 border-b px-0 py-2 text-gray-900 font-light focus:ring-0 transition-colors placeholder-gray-300 ${
                                    errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-gray-900'
                                }`}
                                placeholder="name@example.com"
                            />
                            {errors.email && (
                                <p className="absolute -bottom-5 left-0 text-[10px] text-red-500 flex items-center gap-1">
                                    <WarningCircle size={12} weight="fill" /> {errors.email}
                                </p>
                            )}
                        </div>

                        <div className="relative group">
                            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">
                                Verification Code
                            </label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => {
                                    const numericCode = e.target.value.replace(/\D/g, '').slice(0, 6);
                                    setCode(numericCode);
                                    if (errors.code) {
                                        setErrors((prev) => ({ ...prev, code: '' }));
                                    }
                                }}
                                className={`w-full bg-transparent border-0 border-b px-0 py-2 text-gray-900 font-light tracking-[0.25em] focus:ring-0 transition-colors placeholder-gray-300 ${
                                    errors.code ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-gray-900'
                                }`}
                                placeholder="000000"
                                inputMode="numeric"
                            />
                            {errors.code && (
                                <p className="absolute -bottom-5 left-0 text-[10px] text-red-500 flex items-center gap-1">
                                    <WarningCircle size={12} weight="fill" /> {errors.code}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-4 bg-gray-900 hover:bg-black text-white text-xs tracking-widest uppercase transition-colors rounded-sm flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <><CircleNotch size={16} className="animate-spin" /> Verifying</>
                            ) : (
                                <><EnvelopeSimple size={16} /> Verify Email</>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                        <p className="text-sm font-light text-gray-500 mb-3">Did not receive the code?</p>
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={resending}
                            className="text-[10px] uppercase tracking-widest text-gray-700 hover:text-gray-900 border-b border-gray-400 hover:border-gray-900 pb-0.5 transition-colors disabled:opacity-50"
                        >
                            {resending ? 'Sending New Code...' : 'Resend Verification Code'}
                        </button>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-sm font-light text-gray-500">
                            Already verified?{' '}
                            <Link
                                to="/login"
                                className="font-medium text-gray-900 border-b border-gray-900 pb-0.5 hover:text-orange-800 hover:border-orange-800 transition-colors"
                            >
                                Back to Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
