import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Receipt,
  X,
  CheckCircle,
  CalendarCheck,
  Users,
  MapPin,
  Clock,
  Wallet,
  CaretDown,
  Buildings,
  CircleNotch,
  WarningCircle,
  XCircle
} from '@phosphor-icons/react';
import axiosClient from '../../services/axiosClient';

const PaymentTimer = ({ expiresAt, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!expiresAt) return '00:00';
      const expiryTime = new Date(expiresAt).getTime();
      const now = new Date().getTime();
      const difference = expiryTime - now;

      if (difference <= 0) {
        onExpire();
        return '00:00';
      }

      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const initialTime = calculateTimeLeft();
    setTimeLeft(initialTime);

    if (initialTime === '00:00') return;

    const timer = setInterval(() => {
      const newTime = calculateTimeLeft();
      setTimeLeft(newTime);
      if (newTime === '00:00') clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  return <span className="font-mono tabular-nums text-red-500 font-medium ml-2">{timeLeft}</span>;
};

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [processingBookingId, setProcessingBookingId] = useState(null);

  const [activeTab, setActiveTab] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      toast.error('Please login to view your reservations');
      navigate('/login');
      return;
    }

    try {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      fetchBookings(userData._id);
    } catch (error) {
      localStorage.removeItem('user');
      navigate('/login');
    }
  }, [navigate]);

  const fetchBookings = async (userId) => {
    try {
      setLoading(true);
      const response = await axiosClient.get(`/bookings/user/${userId}`);
      setBookings(response.data || []);
    } catch (error) {
      toast.error('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelUnpaidBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this unpaid reservation?')) return;
    try {
      setProcessingBookingId(bookingId);
      await axiosClient.put(`/bookings/${bookingId}/cancel`);
      toast.success('Reservation cancelled successfully');
      fetchBookings(user._id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel reservation');
    } finally {
      setProcessingBookingId(null);
    }
  };

  const submitCancelRequest = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation.");
      return;
    }
    try {
      setProcessingBookingId(bookingToCancel);

      await axiosClient.put(`/bookings/${bookingToCancel}/cancel-request`, {
        reason: cancelReason,
      });

      toast.success("Cancellation request submitted to property.");
      setCancelModalOpen(false);
      setCancelReason("");
      fetchBookings(user._id);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Failed to submit cancellation request",
      );
    } finally {
      setProcessingBookingId(null);
    }
  };

  const handleExpireBooking = (bookingId) => {
    setBookings((prev) => prev.map((b) => b._id === bookingId ? { ...b, status: 'expired' } : b));
    if (user) {
      axiosClient.get(`/bookings/user/${user._id}`).then((res) => {
        setBookings(res.data.data || []);
      }).catch(() => { });
    }
  };

  const handlePayment = async (booking) => {
    try {
      setProcessingBookingId(booking._id);
      const response = await axiosClient.post('/payments/sepay/create', {
        bookingId: booking._id,
        amount: booking.totalAmount,
      });
      if (response?.paymentUrl) {
        window.location.href = response.paymentUrl;
      } else {
        toast.error('Failed to generate payment link');
      }
    } catch (error) {
      toast.error('Failed to initiate payment');
    } finally {
      setProcessingBookingId(null);
    }
  };

  const filteredAndSortedBookings = useMemo(() => {
    let result = [...bookings];
    if (activeTab !== 'all') {
      result = result.filter((b) => b.status === activeTab);
    }
    result.sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortOrder === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortOrder === 'checkin') return new Date(a.checkIn) - new Date(b.checkIn);
      return 0;
    });
    return result;
  }, [bookings, activeTab, sortOrder]);

  const getStatusUI = (status) => {
    const maps = {
      pending: { color: 'text-orange-800 bg-orange-50 border-orange-100', text: 'Awaiting Payment', icon: <Clock size={14} /> },
      paid: { color: 'text-blue-800 bg-blue-50 border-blue-100', text: 'Paid', icon: <Wallet size={14} /> },
      confirmed: { color: 'text-green-800 bg-green-50 border-green-100', text: 'Confirmed', icon: <CheckCircle size={14} /> },
      checked_in: { color: 'text-indigo-800 bg-indigo-50 border-indigo-100', text: 'Checked In', icon: <CheckCircle size={14} /> },
      checked_out: { color: 'text-purple-800 bg-purple-50 border-purple-100', text: 'Checked Out', icon: <CheckCircle size={14} /> },
      no_show: { color: 'text-red-800 bg-red-50 border-red-200', text: 'No Show', icon: <XCircle size={14} /> },
      cancelled: { color: 'text-gray-500 bg-gray-50 border-gray-200', text: 'Cancelled', icon: <X size={14} /> },
      expired: { color: 'text-red-800 bg-red-50 border-red-200', text: 'Expired', icon: <X size={14} /> },
    };
    return maps[status] || { color: 'text-gray-500 bg-gray-100 border-gray-200', text: status, icon: null };
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFFCFA] gap-4">
        <CircleNotch size={32} weight="light" className="text-orange-800 animate-spin" />
        <p className="text-gray-500 font-light text-sm tracking-widest uppercase">Retrieving your portfolio...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFCFA] pb-24">
      {/* Header Section */}
      <section className="bg-white pt-24 pb-12 border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <span className="text-xs uppercase tracking-[0.2em] font-medium text-orange-800 mb-3 block">Guest Portal</span>
              <h1 className="text-4xl md:text-5xl font-serif text-gray-900">My Reservations</h1>
            </div>
            <button onClick={() => navigate('/location')} className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-gray-900 border-b border-gray-900 pb-1 hover:text-orange-800 hover:border-orange-800 transition-colors">
              <Buildings size={16} weight="light" /> New Reservation
            </button>
          </div>
        </div>
      </section>

      {/* Tabs & Sorting */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl mt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          
          {/* Tabs */}
          <div className="flex gap-6 md:gap-8 overflow-x-auto w-full md:w-auto hide-scrollbar border-b border-gray-200">
            {[
              { key: 'all', label: 'All' },
              { key: 'pending', label: 'Pending' },
              { key: 'paid', label: 'Paid' },
              { key: 'confirmed', label: 'Confirmed' },
              { key: 'checked_in', label: 'Checked In' },
              { key: 'checked_out', label: 'Checked Out' },
              { key: 'no_show', label: 'No Show' },
              { key: 'cancelled', label: 'Cancelled' },
              { key: 'expired', label: 'Expired' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`pb-3 text-xs uppercase tracking-widest whitespace-nowrap transition-colors relative ${
                  activeTab === key ? 'text-orange-800 font-medium' : 'text-gray-400 hover:text-gray-900 font-light'
                }`}
              >
                {label}
                {activeTab === key && (
                    <span className="absolute bottom-[-1px] left-0 w-full h-[1px] bg-orange-800"></span>
                )}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="relative group shrink-0">
            <div className="flex items-center gap-2 border-b border-gray-300 pb-2">
              <span className="text-[10px] uppercase tracking-widest text-gray-400">Sort by:</span>
              <select
                className="bg-transparent border-none text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer appearance-none pr-6 pl-2"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="checkin">Check-in Date</option>
              </select>
              <CaretDown size={14} weight="light" className="absolute right-0 top-1/2 -translate-y-[60%] text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {filteredAndSortedBookings.length === 0 ? (
          <div className="text-center py-32 border border-gray-100 rounded-sm bg-white shadow-sm">
            <Receipt size={48} weight="light" className="mx-auto text-gray-300 mb-6" />
            <h2 className="text-2xl font-serif text-gray-900 mb-2">No reservations found</h2>
            <p className="text-gray-500 font-light mb-8 max-w-sm mx-auto">
                You have no {activeTab !== 'all' ? activeTab : ''} reservations at the moment.
            </p>
            <button 
                onClick={() => navigate('/location')} 
                className="px-8 py-3 bg-gray-900 hover:bg-black text-white text-xs tracking-widest uppercase transition-colors rounded-sm"
            >
              Explore Properties
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {filteredAndSortedBookings.map((booking) => {
              const ui = getStatusUI(booking.status);
              const cancelReq = booking.cancellationRequest;
              
              const canRequestCancel = 
                  ['paid', 'confirmed'].includes(booking.status) && 
                  !cancelReq && 
                  new Date(booking.checkIn) > new Date();

              // For unpaid pending bookings, show pay/cancel buttons
              const isPending = booking.status === 'pending';
              // For paid/confirmed, show request cancel
              const isPaidOrConfirmed = ['paid', 'confirmed'].includes(booking.status);

              return (
                <div key={booking._id} className="bg-white border border-gray-200 hover:shadow-xl transition-all duration-500 rounded-sm overflow-hidden flex flex-col md:flex-row group">
                  
                  {/* Image */}
                  <div className="w-full md:w-72 lg:w-80 h-56 md:h-auto relative bg-gray-50 overflow-hidden shrink-0">
                    <img
                      src={booking.hotelId?.image || booking.hotelId?.photos?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out" alt={booking.hotelId?.name}
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
                    <div>
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                            <div>
                                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-2 font-medium">
                                    <MapPin size={12} weight="light" className="text-orange-800" /> 
                                    {booking.hotelId?.city}
                                </div>
                                <h2 className="text-2xl font-serif text-gray-900 group-hover:text-orange-800 transition-colors">
                                    {booking.hotelId?.name}
                                </h2>
                            </div>
                            
                            <div className="flex flex-col items-end gap-2">
                                <div className={`px-3 py-1.5 flex items-center gap-1.5 border rounded-sm text-[10px] uppercase tracking-widest font-medium shrink-0 w-fit ${ui.color}`}>
                                    {ui.icon} {ui.text}
                                </div>
                                {cancelReq?.status === 'Pending' && (
                                    <span className="text-[9px] text-red-600 font-medium uppercase tracking-widest flex items-center gap-1">
                                        <WarningCircle size={12} weight="fill"/> Cancel Pending
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-light text-gray-600 mb-6">
                            <div className="flex items-center gap-2">
                                <CalendarCheck size={16} weight="light" className="text-gray-400" /> 
                                <span>{formatDate(booking.checkIn)} <span className="mx-1 text-gray-300">—</span> {formatDate(booking.checkOut)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users size={16} weight="light" className="text-gray-400" /> 
                                <span>{booking.adult + (booking.children || 0)} Guests</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-6 pt-6 border-t border-gray-100">
                        {/* ID & Price */}
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">
                                Ref: {booking._id.substring(0, 8)}
                            </p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-serif text-gray-900">${Number(booking.totalAmount).toLocaleString()}</span>
                                <span className="text-[10px] uppercase tracking-widest text-gray-400">Total</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap justify-end items-center gap-3 w-full sm:w-auto">
                            <button 
                                className="px-6 py-2.5 bg-transparent border border-gray-300 text-gray-600 hover:border-gray-900 hover:text-gray-900 text-xs tracking-widest uppercase transition-colors rounded-sm flex items-center gap-2" 
                                onClick={() => navigate(`/my-bookings/${booking._id}`)} 
                            >
                                View Details
                            </button>

                            {booking.status === 'pending' && (
                                <>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest flex flex-col items-end mr-2">
                                        <span>Expires in:</span>
                                        <PaymentTimer 
                                            expiresAt={booking.expiresAt} 
                                            onExpire={() => handleExpireBooking(booking._id)} 
                                        />
                                    </div>
                                    <button 
                                        className="px-6 py-2.5 bg-transparent border border-gray-300 text-gray-600 hover:border-gray-900 hover:text-gray-900 text-xs tracking-widest uppercase transition-colors rounded-sm flex items-center gap-2" 
                                        onClick={() => handleCancelUnpaidBooking(booking._id)} 
                                        disabled={processingBookingId === booking._id}
                                    >
                                        {processingBookingId === booking._id ? <CircleNotch size={14} className="animate-spin" /> : 'Cancel'}
                                    </button>
                                    <button 
                                        className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white border border-transparent text-xs tracking-widest uppercase transition-colors rounded-sm flex items-center gap-2" 
                                        onClick={() => handlePayment(booking)} 
                                        disabled={processingBookingId === booking._id}
                                    >
                                        {processingBookingId === booking._id ? <CircleNotch size={14} className="animate-spin" /> : <Wallet size={14} weight="light" />} Complete Payment
                                    </button>
                                </>
                            )}
                            
                            {canRequestCancel && (
                                <button 
                                    className="px-6 py-2.5 bg-transparent border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 text-xs tracking-widest uppercase transition-colors rounded-sm flex items-center gap-2" 
                                    onClick={() => {
                                        setBookingToCancel(booking._id);
                                        setCancelModalOpen(true);
                                    }}
                                >
                                    Request Cancellation
                                </button>
                            )}
                        </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Cancel Request Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-sm shadow-2xl p-8 animate-fade-in">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h3 className="text-xl font-serif text-gray-900">Cancel Reservation</h3>
              <button onClick={() => setCancelModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                <XCircle size={24} weight="light" />
              </button>
            </div>
            <p className="text-sm font-light text-gray-500 mb-6">
              Please note that cancellations may be subject to property policies. Tell us why you need to cancel this booking.
            </p>
            <form onSubmit={submitCancelRequest}>
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
                  onClick={() => setCancelModalOpen(false)}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 text-xs uppercase tracking-widest hover:border-gray-900 transition-colors rounded-sm"
                >
                  Keep Booking
                </button>
                <button
                  type="submit"
                  disabled={processingBookingId === bookingToCancel || !cancelReason.trim()}
                  className="px-6 py-2.5 bg-red-600 text-white text-xs uppercase tracking-widest hover:bg-red-700 transition-colors rounded-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {processingBookingId === bookingToCancel ? <CircleNotch size={14} className="animate-spin" /> : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;