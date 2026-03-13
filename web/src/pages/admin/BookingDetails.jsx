import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
    Receipt
} from '@phosphor-icons/react';

const BookingDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (id) {
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
            fetchBooking();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-transparent">
                <CircleNotch size={32} weight="light" className="text-orange-800 animate-spin" />
                <p className="text-gray-500 font-light text-sm tracking-widest uppercase">
                    Loading Record...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-transparent">
                <p className="text-red-500 font-serif text-xl">Unable to load data</p>
                <p className="text-gray-500 font-light">{error.message}</p>
                <button onClick={() => navigate('/admin/bookings')} className="mt-4 text-xs uppercase tracking-widest border-b border-gray-900 pb-1">Return to List</button>
            </div>
        );
    }

    if (!booking) return null;

    const getStatusUI = (status) => {
        switch (status) {
            case 'confirmed':
                return { styles: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircle weight="fill" /> };
            case 'pending':
                return { styles: 'bg-orange-50 text-orange-800 border-orange-200', icon: <Clock weight="fill" /> };
            case 'cancelled':
                return { styles: 'bg-gray-50 text-gray-500 border-gray-200', icon: <XCircle weight="fill" /> };
            default:
                return { styles: 'bg-gray-50 text-gray-500 border-gray-200', icon: null };
        }
    };

    const statusUI = getStatusUI(booking.status);

    // Group rooms for clean display
    const roomCounts = (booking.roomIds || []).reduce((acc, room) => {
        acc[room.roomName] = (acc[room.roomName] || 0) + 1;
        return acc;
    }, {});

    // Calculate Nights
    const checkInDate = new Date(booking.checkIn);
    const checkOutDate = new Date(booking.checkOut);
    const nights = Math.max(1, Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)));

    return (
        <div className="p-6 md:p-8 lg:p-12 max-w-6xl mx-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-10 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/admin/bookings')} 
                        className="p-2 text-gray-400 hover:text-gray-900 transition-colors border border-gray-200 rounded-sm hover:bg-white bg-gray-50"
                        title="Back to Reservations"
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
                <div className={`px-4 py-2 flex items-center gap-2 border rounded-sm text-xs uppercase tracking-widest font-medium ${statusUI.styles}`}>
                    {statusUI.icon} {capitalizeFirstLetter(booking.status)}
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
                                <p className="text-lg font-serif text-gray-900">{booking.userId?.fullName || "Guest"}</p>
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
                                                <span className="text-xs font-light text-gray-500">+${extra.extraPrice}</span>
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

                {/* Right Column: Financial Summary */}
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

                        {/* Quick action based on status could go here if needed in the future */}
                        {booking.status === 'pending' && (
                            <div className="bg-orange-900/40 p-4 border-t border-orange-900/50 text-center">
                                <p className="text-xs font-light text-orange-200">Awaiting payment verification</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default BookingDetails;