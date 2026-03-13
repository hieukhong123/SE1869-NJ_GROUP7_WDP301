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
  CircleNotch
} from '@phosphor-icons/react';
import axiosClient from '../../services/axiosClient';

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [processingBookingId, setProcessingBookingId] = useState(null);
  // UI State
  const [activeTab, setActiveTab] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

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

    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    try {
      setProcessingBookingId(bookingId);
      await axiosClient.put(`/bookings/${bookingId}/cancel`);
      toast.success('Reservation cancelled successfully');
      fetchBookings(user._id);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel reservation');
    } finally {
      setProcessingBookingId(null);
    }
  };

  const handlePayment = async (booking) => {
    try {
      setProcessingBookingId(booking._id);
      const response = await axiosClient.post('/payments/vnpay/create', {
        bookingId: booking._id,
        amount: booking.totalAmount,
      });

      if (response?.paymentUrl) {
        window.location.href = response.paymentUrl;
      } else {
        toast.error('Failed to generate payment link');
      }
    } catch (error) {
      console.error('Payment error:', error);
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
      pending: {
        color: 'text-orange-800 bg-orange-50 border-orange-100',
        text: 'Awaiting Payment',
        icon: <Clock size={14} weight="light" />,
      },
      confirmed: {
        color: 'text-green-800 bg-green-50 border-green-100',
        text: 'Confirmed',
        icon: <CheckCircle size={14} weight="light" />,
      },
      cancelled: {
        color: 'text-gray-500 bg-gray-50 border-gray-200',
        text: 'Cancelled',
        icon: <X size={14} weight="light" />,
      },
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
            <button 
                onClick={() => navigate('/location')} 
                className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-gray-900 border-b border-gray-900 pb-1 hover:text-orange-800 hover:border-orange-800 transition-colors"
            >
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
            {['all', 'pending', 'confirmed', 'cancelled'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-xs uppercase tracking-widest whitespace-nowrap transition-colors relative ${
                  activeTab === tab ? 'text-orange-800 font-medium' : 'text-gray-400 hover:text-gray-900 font-light'
                }`}
              >
                {tab}
                {activeTab === tab && (
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
                            
                            {/* Status Badge */}
                            <div className={`px-3 py-1.5 flex items-center gap-1.5 border rounded-sm text-[10px] uppercase tracking-widest font-medium shrink-0 w-fit ${ui.color}`}>
                                {ui.icon} {ui.text}
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
                        <div className="flex flex-wrap justify-end gap-3 w-full sm:w-auto">
                            {booking.status === 'pending' && (
                                <>
                                    <button 
                                        className="px-6 py-2.5 bg-transparent border border-gray-300 text-gray-600 hover:border-gray-900 hover:text-gray-900 text-xs tracking-widest uppercase transition-colors rounded-sm flex items-center gap-2" 
                                        onClick={() => handleCancelBooking(booking._id)} 
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
                            
                        </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
};

export default MyBookings;