import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
    Receipt,
    X,
    ArrowCounterClockwise,
    CheckCircle,
    CalendarCheck,
    Phone,
    Envelope,
    Users,
    CreditCard,
    MapPin,
    Clock
} from '@phosphor-icons/react';
import axiosClient from '../../services/axiosClient';

const MyBookings = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [processingBookingId, setProcessingBookingId] = useState(null);
    const [refundModal, setRefundModal] = useState({ isOpen: false, booking: null, payment: null });
    const [refundForm, setRefundForm] = useState({
        bankNumber: '',
        bankName: '',
        reasons: ''
    });
    const [bookingRefunds, setBookingRefunds] = useState({});

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            toast.error('Please login to view your bookings');
            navigate('/login');
            return;
        }

        try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            fetchBookings(userData._id);
        } catch (error) {
            console.error('Error parsing user data:', error);
            localStorage.removeItem('user');
            navigate('/login');
        }
    }, [navigate]);

    const fetchBookings = async (userId) => {
        try {
            setLoading(true);
            const response = await axiosClient.get(`/bookings/user/${userId}`);
            const bookingsData = response.data || [];
            setBookings(bookingsData);
            
            // Fetch refund status for each booking
            const refundPromises = bookingsData.map(async (booking) => {
                try {
                    const refundResponse = await axiosClient.get(`/refunds/booking/${booking._id}`);
                    return { bookingId: booking._id, refund: refundResponse.data };
                } catch (error) {
                    return { bookingId: booking._id, refund: null };
                }
            });
            
            const refundResults = await Promise.all(refundPromises);
            const refundsMap = {};
            refundResults.forEach(result => {
                refundsMap[result.bookingId] = result.refund;
            });
            setBookingRefunds(refundsMap);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            toast.error('Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) {
            return;
        }

        try {
            setProcessingBookingId(bookingId);
            await axiosClient.put(`/bookings/${bookingId}/cancel`);
            toast.success('Booking cancelled successfully');
            // Refresh bookings
            fetchBookings(user._id);
        } catch (error) {
            console.error('Error cancelling booking:', error);
            toast.error(error.response?.data?.message || 'Failed to cancel booking');
        } finally {
            setProcessingBookingId(null);
        }
    };

    const openRefundModal = async (booking) => {
        try {
            // Fetch payment for this booking
            const paymentResponse = await axiosClient.get(`/payments/booking/${booking._id}`);
            const payment = paymentResponse.data;
            
            if (!payment) {
                toast.error('No payment found for this booking');
                return;
            }
            
            setRefundModal({ isOpen: true, booking, payment });
            setRefundForm({ bankNumber: '', bankName: '', reasons: '' });
        } catch (error) {
            console.error('Error fetching payment:', error);
            toast.error('Failed to load payment information');
        }
    };

    const closeRefundModal = () => {
        setRefundModal({ isOpen: false, booking: null, payment: null });
        setRefundForm({ bankNumber: '', bankName: '', reasons: '' });
    };

    const handleRefundFormChange = (e) => {
        const { name, value } = e.target;
        setRefundForm(prev => ({ ...prev, [name]: value }));
    };

    const handleRefundSubmit = async (e) => {
        e.preventDefault();
        
        if (!refundForm.bankNumber || !refundForm.bankName || !refundForm.reasons) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            setProcessingBookingId(refundModal.booking._id);
            
            await axiosClient.post('/refunds', {
                paymentId: refundModal.payment._id,
                bankNumber: refundForm.bankNumber,
                bankName: refundForm.bankName,
                reasons: refundForm.reasons
            });
            
            toast.success('Refund request submitted successfully');
            closeRefundModal();
            // Refresh bookings to update refund status
            fetchBookings(user._id);
        } catch (error) {
            console.error('Error submitting refund:', error);
            toast.error(error.response?.data?.message || 'Failed to submit refund request');
        } finally {
            setProcessingBookingId(null);
        }
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            pending: { color: 'badge-warning', text: 'Pending', icon: <Clock size={14} weight="fill" /> },
            confirmed: { color: 'badge-success', text: 'Confirmed', icon: <CheckCircle size={14} weight="fill" /> },
            cancelled: { color: 'badge-error', text: 'Cancelled', icon: <X size={14} weight="fill" /> },
        };
        return statusMap[status] || { color: 'badge-ghost', text: status, icon: null };
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const isUpcoming = (checkInDate) => {
        return new Date(checkInDate) > new Date();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center">
                <div className="text-center">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                    <p className="mt-4 text-base-content/70">Loading your bookings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-300 py-8">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-base-content mb-2">My Bookings</h1>
                    <p className="text-base-content/70">Manage your hotel reservations</p>
                </div>

                {bookings.length === 0 ? (
                    <div className="card bg-base-100 shadow-2xl">
                        <div className="card-body text-center py-16">
                            <Receipt size={80} className="mx-auto text-base-content/30 mb-4" />
                            <h2 className="text-2xl font-bold mb-2">No Bookings Yet</h2>
                            <p className="text-base-content/70 mb-6">
                                You haven't made any bookings yet. Start exploring our hotels!
                            </p>
                            <button
                                onClick={() => navigate('/')}
                                className="btn btn-primary btn-lg mx-auto"
                            >
                                Browse Hotels
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {bookings.map((booking) => {
                            const statusInfo = getStatusBadge(booking.status);
                            const upcoming = isUpcoming(booking.checkIn);
                            const refund = bookingRefunds[booking._id];
                            const hasRefund = refund && refund !== null;
                            
                            return (
                                <div 
                                    key={booking._id} 
                                    className="card lg:card-side bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300"
                                >
                                    {/* Hotel Image */}
                                    {booking.hotelId?.image && (
                                        <figure className="lg:w-80">
                                            <img 
                                                src={booking.hotelId.image} 
                                                alt={booking.hotelId.name} 
                                                className="w-full h-full object-cover"
                                            />
                                        </figure>
                                    )}
                                    
                                    <div className="card-body flex-1">
                                        <div className="flex justify-between items-start flex-wrap gap-2 mb-4">
                                            <div>
                                                <h2 className="card-title text-2xl mb-2">
                                                    {booking.hotelId?.name || 'Hotel'}
                                                </h2>
                                                {booking.hotelId?.location && (
                                                    <div className="flex items-center gap-2 text-base-content/70">
                                                        <MapPin size={16} />
                                                        <span className="text-sm">{booking.hotelId.location}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-2 items-end">
                                                <span className={`badge ${statusInfo.color} badge-lg gap-1`}>
                                                    {statusInfo.icon}
                                                    {statusInfo.text}
                                                </span>
                                                {upcoming && booking.status !== 'cancelled' && (
                                                    <span className="badge badge-info badge-sm">Upcoming</span>
                                                )}
                                                {hasRefund && (
                                                    <span className="badge badge-warning badge-sm gap-1">
                                                        <ArrowCounterClockwise size={12} />
                                                        Refund Requested
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Booking Details Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <Users size={20} className="text-primary" />
                                                    <div>
                                                        <p className="text-xs text-base-content/60">Guest Name</p>
                                                        <p className="font-semibold">{booking.name}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Phone size={20} className="text-primary" />
                                                    <div>
                                                        <p className="text-xs text-base-content/60">Phone</p>
                                                        <p className="font-semibold">{booking.phone}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Envelope size={20} className="text-primary" />
                                                    <div>
                                                        <p className="text-xs text-base-content/60">Email</p>
                                                        <p className="font-semibold text-sm">{booking.email}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <CalendarCheck size={20} className="text-success" />
                                                    <div>
                                                        <p className="text-xs text-base-content/60">Check-in</p>
                                                        <p className="font-semibold">{formatDate(booking.checkIn)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <CalendarCheck size={20} className="text-error" />
                                                    <div>
                                                        <p className="text-xs text-base-content/60">Check-out</p>
                                                        <p className="font-semibold">{formatDate(booking.checkOut)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <CreditCard size={20} className="text-primary" />
                                                    <div>
                                                        <p className="text-xs text-base-content/60">Total Amount</p>
                                                        <p className="font-bold text-lg text-primary">
                                                            ${booking.totalAmount?.toFixed(2) || '0.00'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Guests Info */}
                                        <div className="flex gap-4 text-sm mb-4">
                                            <span className="badge badge-outline">
                                                {booking.adult} Adult{booking.adult !== 1 ? 's' : ''}
                                            </span>
                                            {booking.children > 0 && (
                                                <span className="badge badge-outline">
                                                    {booking.children} Child{booking.children !== 1 ? 'ren' : ''}
                                                </span>
                                            )}
                                            {booking.baby > 0 && (
                                                <span className="badge badge-outline">
                                                    {booking.baby} {booking.baby !== 1 ? 'Babies' : 'Baby'}
                                                </span>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="card-actions justify-end">
                                            {booking.status === 'cancelled' && !hasRefund && (
                                                <button 
                                                    className="btn btn-warning gap-2"
                                                    onClick={() => openRefundModal(booking)}
                                                    disabled={processingBookingId === booking._id}
                                                >
                                                    {processingBookingId === booking._id ? (
                                                        <>
                                                            <span className="loading loading-spinner loading-sm"></span>
                                                            Processing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ArrowCounterClockwise size={18} />
                                                            PROCESS REFUND
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                            
                                            {booking.status === 'cancelled' && hasRefund && (
                                                <button className="btn btn-success gap-2" disabled>
                                                    <CheckCircle size={18} weight="fill" />
                                                    REFUND PROCESSING
                                                </button>
                                            )}
                                            
                                            {booking.status === 'pending' && (
                                                <button 
                                                    className="btn btn-error gap-2"
                                                    onClick={() => handleCancelBooking(booking._id)}
                                                    disabled={processingBookingId === booking._id}
                                                >
                                                    {processingBookingId === booking._id ? (
                                                        <>
                                                            <span className="loading loading-spinner loading-sm"></span>
                                                            Cancelling...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <X size={18} />
                                                            Cancel Booking
                                                        </>
                                                    )}
                                                </button>
                                            )}

                                            {booking.status === 'confirmed' && (
                                                <button className="btn btn-success gap-2" disabled>
                                                    <CheckCircle size={18} weight="fill" />
                                                    CONFIRMED
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Refund Modal */}
            {refundModal.isOpen && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-md">
                        <h3 className="font-bold text-2xl mb-4">Process Refund</h3>
                        <p className="text-sm text-base-content/70 mb-6">
                            Please provide your bank details to process the refund for your cancelled booking.
                        </p>
                        
                        <form onSubmit={handleRefundSubmit} className="space-y-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold">Bank Name</span>
                                </label>
                                <input 
                                    type="text"
                                    name="bankName"
                                    placeholder="Enter your bank name"
                                    className="input input-bordered w-full"
                                    value={refundForm.bankName}
                                    onChange={handleRefundFormChange}
                                    required
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold">Bank Account Number</span>
                                </label>
                                <input 
                                    type="text"
                                    name="bankNumber"
                                    placeholder="Enter your account number"
                                    className="input input-bordered w-full"
                                    value={refundForm.bankNumber}
                                    onChange={handleRefundFormChange}
                                    required
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold">Reason for Refund</span>
                                </label>
                                <textarea 
                                    name="reasons"
                                    placeholder="Please explain why you're requesting a refund"
                                    className="textarea textarea-bordered h-24"
                                    value={refundForm.reasons}
                                    onChange={handleRefundFormChange}
                                    required
                                ></textarea>
                            </div>

                            <div className="alert alert-info">
                                <div className="text-sm">
                                    <p className="font-semibold">Refund Amount:</p>
                                    <p className="text-lg font-bold">${refundModal.booking?.totalAmount?.toFixed(2) || '0.00'}</p>
                                </div>
                            </div>

                            <div className="modal-action">
                                <button 
                                    type="button" 
                                    className="btn btn-ghost"
                                    onClick={closeRefundModal}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    disabled={processingBookingId === refundModal.booking?._id}
                                >
                                    {processingBookingId === refundModal.booking?._id ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm"></span>
                                            Submitting...
                                        </>
                                    ) : (
                                        'Submit Refund Request'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                    <div className="modal-backdrop" onClick={closeRefundModal}></div>
                </div>
            )}
        </div>
    );
};

export default MyBookings;
