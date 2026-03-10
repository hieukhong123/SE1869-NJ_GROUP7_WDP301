import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';
import { CheckCircle, XCircle, Clock, Receipt, House, ShieldCheck } from '@phosphor-icons/react';
import { toast } from 'sonner';

const PaymentReturn = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('processing'); 
    const [bookingId, setBookingId] = useState(null);
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
                    toast.success('Payment successful!');
                } else {
                    setStatus('fail');
                    setBookingId(response.bookingId);
                    toast.error('Payment failed');
                }
            } catch (error) {
                console.error('Verification error:', error);
                setStatus('fail');
                toast.error('Payment verification failed');
            } finally {
                setLoading(false);
            }
        };

        verifyPayment();
    }, [searchParams]);

    if (loading) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center bg-base-100">
                <span className="loading loading-spinner loading-lg text-primary mb-4"></span>
                <p className="text-sm font-black text-primary animate-pulse tracking-widest uppercase">Finishing your reservation...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-200/30 pb-20">
            {/* Unified Progress Bar */}
            <div className="bg-primary text-primary-content py-3 shadow-lg mb-12">
                <div className="container mx-auto px-6 max-w-7xl flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <ShieldCheck size={24} weight="fill" />
                        <span className="text-sm font-bold uppercase tracking-tight">Secure Booking Platform</span>
                    </div>
                    <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest">
                        <span className="flex items-center gap-2 opacity-40">1. Details</span>
                        <span className="flex items-center gap-2 opacity-40">2. Payment</span>
                        <span className="flex items-center gap-2 border-b-2 border-white pb-1">3. Confirm</span>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 max-w-7xl">
                <div className="max-w-md w-full bg-base-100 rounded-3xl shadow-2xl overflow-hidden border border-base-300 mx-auto">
                    <div className={`py-12 text-center ${status === 'success' ? 'bg-success/5' : 'bg-error/5'}`}>
                        {status === 'success' ? (
                            <div className="inline-flex items-center justify-center w-24 h-24 bg-success rounded-full text-success-content mb-6 shadow-xl shadow-success/20">
                                <CheckCircle size={56} weight="bold" />
                            </div>
                        ) : (
                            <div className="inline-flex items-center justify-center w-24 h-24 bg-error rounded-full text-error-content mb-6 shadow-xl shadow-error/20">
                                <XCircle size={56} weight="bold" />
                            </div>
                        )}
                        
                        <h1 className={`text-4xl font-black mb-2 tracking-tight ${status === 'success' ? 'text-success' : 'text-error'}`}>
                            {status === 'success' ? 'Payment Success!' : 'Payment Failed'}
                        </h1>
                        <p className="text-sm font-bold opacity-50 uppercase tracking-widest px-6">
                            {status === 'success' 
                                ? 'Your reservation is now active' 
                                : 'There was an error processing your card'}
                        </p>
                    </div>

                    <div className="p-10 space-y-8">
                        {bookingId && (
                            <div className="bg-base-200 rounded-2xl p-6 border border-base-300">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-[10px] font-black text-base-content/40 uppercase tracking-widest">Booking Ref</span>
                                    <span className="text-sm font-black text-primary">{bookingId.substring(0, 12).toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-base-content/40 uppercase tracking-widest">Status</span>
                                    <span className={`badge badge-sm font-black ${status === 'success' ? 'badge-success' : 'badge-error'}`}>
                                        {status === 'success' ? 'VERIFIED' : 'REJECTED'}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <button 
                                onClick={() => navigate('/my-bookings')}
                                className="btn btn-primary w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20 gap-3"
                            >
                                <Receipt size={22} weight="bold" />
                                Go to My Bookings
                            </button>
                            
                            <button 
                                onClick={() => navigate('/')}
                                className="btn btn-ghost w-full h-14 rounded-2xl font-black uppercase tracking-widest gap-3 opacity-60"
                            >
                                <House size={22} weight="bold" />
                                Return Home
                            </button>
                        </div>

                        <p className="text-[10px] text-center font-bold opacity-30 leading-relaxed uppercase tracking-tighter">
                            Processed via VNPay Secure Gateway.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentReturn;
