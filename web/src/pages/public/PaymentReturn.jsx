import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';
import { CheckCircle, XCircle, CircleNotch, Receipt, House, ShieldCheck } from '@phosphor-icons/react';
import { toast } from 'sonner';

const PaymentReturn = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('processing'); 
    const [bookingId, setBookingId] = useState(null);
    const [amount, setAmount] = useState(null);
    const [isRetrying, setIsRetrying] = useState(false);
    const hasExecuted = useRef(false);

    useEffect(() => {
        const verifyPayment = async () => {
            // Guard against duplicate execution (React StrictMode)
            if (hasExecuted.current) return;
            hasExecuted.current = true;

            try {
                const queryStr = searchParams.toString();
                const response = await axiosClient.get(`/payments/vnpay/return?${queryStr}`);
                
                if (response.success) {
                    setStatus('success');
                    setBookingId(response.bookingId);
                    setAmount(response.amount);
                    toast.success('Payment verified successfully.');
                } else {
                    setStatus('fail');
                    setBookingId(response.bookingId);
                    setAmount(response.amount);
                    toast.error('Payment declined or cancelled.');
                }
            } catch (error) {
                console.error('Verification error:', error);
                setStatus('fail');
                toast.error('Payment verification failed.');
            } finally {
                setLoading(false);
            }
        };

        verifyPayment();
    }, [searchParams]);

    const handleRetryPayment = async () => {
        if (!bookingId || !amount) {
            toast.error("Unable to retry payment directly. Please complete payment from 'My Bookings'.");
            navigate('/my-bookings');
            return;
        }

        try {
            setIsRetrying(true);
            const response = await axiosClient.post('/payments/vnpay/create', {
                bookingId,
                amount,
            });

            if (response?.paymentUrl) {
                window.location.href = response.paymentUrl;
            } else {
                toast.error('Failed to generate payment link');
            }
        } catch (error) {
            console.error('Payment error:', error);
            // It could be that the lock has expired, so default them back to their bookings to verify.
            if (error.response?.data?.message?.includes('valid for payment')) {
                toast.error("Your room reservation hold has ended. Please make a new reservation.");
                navigate('/my-bookings');
            } else {
                toast.error(error.response?.data?.message || 'Failed to initiate payment');
            }
        } finally {
            setIsRetrying(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FFFCFA] flex flex-col items-center justify-center gap-6">
                <div className="relative flex items-center justify-center">
                    <CircleNotch size={40} weight="light" className="text-orange-800 animate-spin" />
                    <ShieldCheck size={16} weight="fill" className="absolute text-orange-800" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-serif text-gray-900 mb-1">Securing your reservation</p>
                    <p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">
                        Verifying transaction with VNPay...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFFCFA] pt-24 pb-20 flex flex-col items-center">
            
            {/* Minimalist Progress Indicator */}
            <div className="w-full max-w-3xl px-6 mb-12 flex items-center justify-center gap-4 text-[10px] uppercase tracking-widest font-medium text-gray-400">
                <span>1. Details</span>
                <span className="w-8 h-[1px] bg-gray-200"></span>
                <span>2. Payment</span>
                <span className="w-8 h-[1px] bg-gray-200"></span>
                <span className="text-gray-900 border-b border-gray-900 pb-0.5">3. Confirmation</span>
            </div>

            {/* Confirmation Card */}
            <div className="w-full max-w-lg px-4 sm:px-6">
                <div className="bg-white border border-gray-100 shadow-2xl shadow-gray-200/50 rounded-sm overflow-hidden animate-fade-in">
                    
                    {/* Status Header */}
                    <div className="pt-12 pb-8 text-center px-8">
                        <div className="flex justify-center mb-6">
                            {status === 'success' ? (
                                <CheckCircle size={64} weight="light" className="text-green-600" />
                            ) : (
                                <XCircle size={64} weight="light" className="text-red-500" />
                            )}
                        </div>
                        
                        <h1 className="text-3xl md:text-4xl font-serif text-gray-900 mb-3">
                            {status === 'success' ? 'Reservation Confirmed' : 'Transaction Failed'}
                        </h1>
                        <p className="text-sm font-light text-gray-500">
                            {status === 'success' 
                                ? 'Thank you for choosing our property. Your booking is now secure.' 
                                : 'We were unable to process your payment. No charges were made.'}
                        </p>
                    </div>

                    <div className="px-8 pb-12">
                        {/* Booking Reference Block */}
                        {bookingId && (
                            <div className="bg-gray-50/50 border border-gray-100 p-6 mb-10 flex flex-col gap-4 rounded-sm">
                                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
                                        Reference No.
                                    </span>
                                    <span className="text-sm font-serif text-gray-900 tracking-wider">
                                        {bookingId.substring(0, 8).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
                                        Payment Status
                                    </span>
                                    <span className={`text-[10px] uppercase tracking-widest font-medium flex items-center gap-1.5 ${
                                        status === 'success' ? 'text-green-600' : 'text-red-500'
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${status === 'success' ? 'bg-green-600' : 'bg-red-500'}`}></span>
                                        {status === 'success' ? 'Verified' : 'Declined'}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-4">
                            {status === 'success' ? (
                                <button 
                                    onClick={() => navigate('/my-bookings')}
                                    className="w-full py-4 bg-gray-900 hover:bg-black text-white text-xs tracking-widest uppercase transition-colors rounded-sm flex items-center justify-center gap-2"
                                >
                                    <Receipt size={16} weight="light" /> View Itinerary
                                </button>
                            ) : (
                                <button 
                                    onClick={handleRetryPayment}
                                    disabled={isRetrying}
                                    className="w-full py-4 bg-gray-900 hover:bg-black text-white text-xs tracking-widest uppercase transition-colors rounded-sm flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isRetrying ? <CircleNotch size={16} className="animate-spin" /> : <ShieldCheck size={16} weight="light" />} Try Again
                                </button>
                            )}
                            
                            <button 
                                onClick={() => navigate('/')}
                                className="w-full py-4 bg-transparent border border-gray-300 text-gray-700 hover:border-gray-900 hover:text-gray-900 text-xs tracking-widest uppercase transition-colors rounded-sm flex items-center justify-center gap-2"
                            >
                                <House size={16} weight="light" /> Return to Homepage
                            </button>
                        </div>

                        {/* Security Footer */}
                        <div className="mt-10 text-center flex flex-col items-center justify-center gap-2 border-t border-gray-100 pt-6">
                            <ShieldCheck size={20} weight="light" className="text-gray-300" />
                            <p className="text-[9px] font-medium text-gray-400 uppercase tracking-[0.2em]">
                                Processed securely via VNPay Gateway
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentReturn;