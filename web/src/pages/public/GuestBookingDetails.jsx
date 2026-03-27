import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axiosClient from '../../services/axiosClient';
import { capitalizeFirstLetter } from '../../utils/helpers';
import { 
    CaretLeft, 
    CircleNotch, 
    User, 
    Buildings, 
    CalendarCheck, 
    Door, 
    Sparkle,
    CheckCircle,
    Clock,
    XCircle,
    Receipt,
    WarningCircle,
    X
} from '@phosphor-icons/react';

const GuestBookingDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Cancel Request State
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelling, setCancelling] = useState(false);

    const fetchBooking = async () => {
        setLoading(true);
        try {
            const response = await axiosClient.get(`/bookings/${id}`);
            setBooking(response.data);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchBooking();
        }
    }, [id]);

    const handleCancelRequest = async (e) => {
        e.preventDefault();
        if (!cancelReason.trim()) {
            toast.error('Please provide a reason for cancellation');
            return;
        }

        setCancelling(true);
        try {
            await axiosClient.put(`/bookings/${id}/cancel-request`, {
                reason: cancelReason
            });
            toast.success('Cancellation request submitted successfully.');
            setIsCancelModalOpen(false);
            setCancelReason('');
            fetchBooking();
        } catch (err) {
            console.error('Cancel request error:', err);
            toast.error(err.response?.data?.message || 'Failed to submit cancellation request');
        } finally {
            setCancelling(false);
        }
    };

    if (loading && !booking) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-[#FFFCFA]">
                <CircleNotch size={32} weight="light" className="text-orange-800 animate-spin" />
                <p className="text-gray-500 font-light text-sm tracking-widest uppercase">
                    Loading Itinerary...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-[#FFFCFA]">
                <p className="text-red-500 font-serif text-xl">Unable to load data</p>
                <p className="text-gray-500 font-light">{error.message}</p>
                <button onClick={() => navigate('/my-bookings')} className="mt-4 text-[10px] uppercase tracking-widest border-b border-gray-900 pb-1">Return to My Bookings</button>
            </div>
        );
    }

    if (!booking) return null;

    const getStatusUI = (status) => {
        switch (status) {
            case 'confirmed':
                return { styles: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircle size={14} weight="fill" /> };
            case 'pending':
                return { styles: 'bg-orange-50 text-orange-800 border-orange-200', icon: <Clock size={14} weight="fill" /> };
            case 'cancelled':
                return { styles: 'bg-gray-50 text-gray-500 border-gray-200', icon: <XCircle size={14} weight="fill" /> };
            default:
                return { styles: 'bg-gray-50 text-gray-500 border-gray-200', icon: null };
        }
    };

    const statusUI = getStatusUI(booking.status);

    const roomCounts = (booking.roomIds || []).reduce((acc, room) => {
        const roomName = room.roomName || room.name || 'Room';
        acc[roomName] = (acc[roomName] || 0) + 1;
        return acc;
    }, {});

    const checkInDate = new Date(booking.checkIn);
    const checkOutDate = new Date(booking.checkOut);
    const nights = Math.max(1, Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)));

    const canRequestCancel = 
        booking.status === 'confirmed' && 
        new Date(booking.checkIn) > new Date() &&
        (!booking.cancellationRequest || booking.cancellationRequest.status !== 'Pending');

    return (
        <div className="min-h-screen bg-[#FFFCFA] pt-24 pb-24">
            <div className="p-6 md:p-8 lg:p-12 max-w-6xl mx-auto">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 pb-6 border-b border-gray-200 gap-6">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/my-bookings')} 
                            className="p-2 text-gray-400 hover:text-gray-900 transition-colors border border-gray-200 rounded-sm hover:bg-white bg-gray-50"
                            title="Back to My Bookings"
                        >
                            <CaretLeft size={20} weight="light" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-serif text-gray-900 mb-1">
                                Reservation Details
                            </h1>
                            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-[0.2em]">
                                REF: {booking._id}
                            </p>
                        </div>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="flex items-center gap-3">
                        {booking.cancellationRequest && (
                            <div className="px-3 py-1.5 flex items-center gap-1.5 border rounded-sm text-[10px] uppercase tracking-widest font-bold bg-red-50 text-red-700 border-red-200">
                                <WarningCircle size={14} weight="fill" />
                                Cancel Request: {booking.cancellationRequest.status}
                            </div>
                        )}
                        <div className={`px-4 py-2 flex items-center gap-2 border rounded-sm text-xs uppercase tracking-widest font-medium ${statusUI.styles}`}>
                            {statusUI.icon} {capitalizeFirstLetter(booking.status)}
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Details (Takes up 2/3) */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Core Information */}
                        <div className="bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                                <User size={20} weight="light" className="text-gray-400" />
                                <h2 className="text-sm uppercase tracking-widest text-gray-900 font-medium">Guest & Property</h2>
                            </div>
                            <div className="p-6 grid sm:grid-cols-2 gap-8">
                                <div>
                                    <span className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Primary Guest</span>
                                    <p className="text-lg font-serif text-gray-900">{booking.userId?.fullName || booking.fullName || "Guest"}</p>
                                    <p className="text-sm font-light text-gray-500 mt-1">{booking.email || booking.userId?.email}</p>
                                    <p className="text-sm font-light text-gray-500">{booking.phone || booking.userId?.phone}</p>
                                </div>
                                <div>
                                    <span className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Reserved Property</span>
                                    <div className="flex items-start gap-2">
                                        <Buildings size={18} weight="light" className="text-orange-800 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-lg font-serif text-gray-900">{booking.hotelId?.name}</p>
                                            <p className="text-sm font-light text-gray-500 mt-1">{booking.hotelId?.city}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stay Period */}
                        <div className="bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                                <CalendarCheck size={20} weight="light" className="text-gray-400" />
                                <h2 className="text-sm uppercase tracking-widest text-gray-900 font-medium">Stay Period</h2>
                            </div>
                            <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div className="text-center sm:text-left w-full sm:w-auto">
                                    <span className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Check-in</span>
                                    <p className="text-xl font-serif text-gray-900">{checkInDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                    <p className="text-sm font-light text-gray-500 mt-1">From 14:00</p>
                                </div>
                                
                                <div className="flex flex-col items-center px-8 border-x border-gray-100 w-full sm:w-auto">
                                    <span className="text-2xl font-light text-orange-800">{nights}</span>
                                    <span className="text-[10px] uppercase tracking-widest text-gray-400">Nights</span>
                                </div>

                                <div className="text-center sm:text-right w-full sm:w-auto">
                                    <span className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Check-out</span>
                                    <p className="text-xl font-serif text-gray-900">{checkOutDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                    <p className="text-sm font-light text-gray-500 mt-1">Until 12:00</p>
                                </div>
                            </div>
                        </div>

                        {/* Accommodation & Extras */}
                        <div className="grid sm:grid-cols-2 gap-8">
                            <div className="bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden">
                                <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                                    <Door size={18} weight="light" className="text-gray-400" />
                                    <h2 className="text-xs uppercase tracking-widest text-gray-900 font-medium">Accommodations</h2>
                                </div>
                                <div className="p-5">
                                    {Object.keys(roomCounts).length > 0 ? (
                                        <ul className="space-y-3">
                                            {Object.entries(roomCounts).map(([name, count], index) => (
                                                <li key={index} className="flex items-center justify-between">
                                                    <span className="text-sm font-light text-gray-700">{name}</span>
                                                    <span className="text-xs font-medium text-gray-900 bg-gray-50 px-2 py-1 rounded-sm border border-gray-100">x{count}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm font-light text-gray-400 italic">No rooms recorded.</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden">
                                <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                                    <Sparkle size={18} weight="light" className="text-gray-400" />
                                    <h2 className="text-xs uppercase tracking-widest text-gray-900 font-medium">Extra Services</h2>
                                </div>
                                <div className="p-5">
                                    {booking.extraIds && booking.extraIds.length > 0 ? (
                                        <ul className="space-y-3">
                                            {booking.extraIds.map((extra) => (
                                                <li key={extra._id} className="flex items-center justify-between">
                                                    <span className="text-sm font-light text-gray-700">{extra.extraName}</span>
                                                    <span className="text-[10px] font-medium text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded-sm border border-gray-100">+${extra.extraPrice}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm font-light text-gray-400 italic">No extra services requested.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Financial Summary & Actions */}
                    <div className="lg:col-span-1">
                        <div className="bg-gray-900 text-white rounded-sm shadow-lg sticky top-24">
                            <div className="p-6 border-b border-gray-800 flex items-center gap-3">
                                <Receipt size={20} weight="light" className="text-gray-400" />
                                <h2 className="text-sm uppercase tracking-widest text-white font-medium">Financial Summary</h2>
                            </div>
                            
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-center text-sm font-light text-gray-400">
                                    <span>Guest Party</span>
                                    <span>{booking.adult} Adults, {booking.children || 0} Children</span>
                                </div>
                                
                                <div className="w-full h-[1px] bg-gray-800 my-4"></div>
                                
                                <div className="flex justify-between items-end">
                                    <span className="text-xs uppercase tracking-widest text-gray-400">Total Amount</span>
                                    <div className="text-right">
                                        <p className="text-3xl font-serif tracking-tight text-white">
                                            ${booking.totalAmount?.toLocaleString()}
                                        </p>
                                        <p className="text-[10px] text-gray-500 font-light mt-1">Taxes & fees included</p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            {canRequestCancel && (
                                <div className="p-6 border-t border-gray-800">
                                    <button 
                                        onClick={() => setIsCancelModalOpen(true)}
                                        className="w-full py-3 px-4 bg-transparent border border-red-500/50 text-red-400 hover:bg-red-500 text-xs uppercase tracking-widest hover:text-white transition-all rounded-sm flex items-center justify-center gap-2"
                                    >
                                        Request Cancellation
                                    </button>
                                </div>
                            )}

                            {/* Show Admin Reply if Rejected */}
                            {booking.cancellationRequest?.status === 'Rejected' && booking.cancellationRequest?.adminReplyReason && (
                                <div className="p-6 border-t border-gray-800 bg-red-950/20">
                                    <p className="text-[10px] uppercase tracking-widest text-red-400 mb-2 font-medium flex items-center gap-1.5">
                                        <WarningCircle size={14} weight="fill"/> Cancellation Declined
                                    </p>
                                    <p className="text-sm font-light text-gray-300 italic leading-relaxed">
                                        "{booking.cancellationRequest.adminReplyReason}"
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* Cancel Request Modal */}
            {isCancelModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white rounded-sm shadow-2xl p-8 animate-fade-in">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <h3 className="text-xl font-serif text-gray-900">Cancel Reservation</h3>
                            <button onClick={() => setIsCancelModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                                <X size={20} weight="light" />
                            </button>
                        </div>
                        <p className="text-sm font-light text-gray-500 mb-6">
                            Please provide a reason for cancelling your reservation. Our team will review your request shortly.
                        </p>
                        
                        <form onSubmit={handleCancelRequest}>
                            <div className="relative group mb-8">
                                <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Reason for cancellation *</label>
                                <textarea
                                    className="w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-gray-900 font-light text-sm focus:ring-0 focus:border-gray-900 transition-colors resize-none h-20 placeholder-gray-300"
                                    placeholder="e.g. Unexpected schedule change..."
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    required
                                ></textarea>
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsCancelModalOpen(false)}
                                    className="px-6 py-2.5 border border-gray-300 text-gray-700 text-xs uppercase tracking-widest hover:border-gray-900 transition-colors rounded-sm"
                                    disabled={cancelling}
                                >
                                    Keep Booking
                                </button>
                                <button
                                    type="submit"
                                    disabled={cancelling || !cancelReason.trim()}
                                    className="px-6 py-2.5 bg-red-600 text-white text-xs uppercase tracking-widest hover:bg-red-700 transition-colors rounded-sm flex items-center gap-2 disabled:opacity-50"
                                >
                                    {cancelling ? <CircleNotch size={14} className="animate-spin" /> : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GuestBookingDetails;