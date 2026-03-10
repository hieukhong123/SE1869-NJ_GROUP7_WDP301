import { useState, useEffect, useMemo } from 'react';
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
  Clock,
  Wallet,
  Info,
  SortAscending,
  Buildings,
} from '@phosphor-icons/react';
import axiosClient from '../../services/axiosClient';

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [processingBookingId, setProcessingBookingId] = useState(null);
  const [refundModal, setRefundModal] = useState({
    isOpen: false,
    booking: null,
    payment: null,
  });
  const [refundForm, setRefundForm] = useState({
    bankNumber: '',
    bankName: '',
    reasons: '',
  });
  const [bookingRefunds, setBookingRefunds] = useState({});

  // UI State
  const [activeTab, setActiveTab] = useState('all'); // all, pending, confirmed, cancelled
  const [sortOrder, setSortOrder] = useState('newest'); // newest, oldest, checkin

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

      // Fetch refund status
      const refundPromises = bookingsData.map(async (booking) => {
        try {
          const refundRes = await axiosClient.get(`/refunds/booking/${booking._id}`);
          return { bookingId: booking._id, refund: refundRes.data };
        } catch (error) {
          return { bookingId: booking._id, refund: null };
        }
      });

      const refundResults = await Promise.all(refundPromises);
      const refundsMap = {};
      refundResults.forEach((result) => {
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
      fetchBookings(user._id);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setProcessingBookingId(null);
    }
  };

  const handlePayment = async (booking) => {
    try {
      setProcessingBookingId(booking._id);
      // Send totalAmount (USD) directly to backend, backend will convert to unit
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

  const openRefundModal = async (booking) => {
    try {
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
        reasons: refundForm.reasons,
      });
      toast.success('Refund request submitted successfully');
      closeRefundModal();
      fetchBookings(user._id);
    } catch (error) {
      console.error('Error submitting refund:', error);
      toast.error(error.response?.data?.message || 'Failed to submit refund request');
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
        color: 'text-warning bg-warning/10 border-warning/20',
        text: 'Waiting for Payment',
        icon: <Clock size={16} weight="fill" />,
      },
      confirmed: {
        color: 'text-success bg-success/10 border-success/20',
        text: 'Confirmed & Paid',
        icon: <CheckCircle size={16} weight="fill" />,
      },
      cancelled: {
        color: 'text-error bg-error/10 border-error/20',
        text: 'Cancelled',
        icon: <X size={16} weight="fill" />,
      },
    };
    return maps[status] || { color: 'text-slate-500 bg-slate-100', text: status, icon: null };
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-sm font-bold text-primary animate-pulse tracking-widest uppercase">Fetching your trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200/30 pb-20">
      <div className="bg-primary text-primary-content pt-12 pb-20 shadow-xl">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-4xl font-black mb-2 tracking-tight">My Trips</h1>
              <p className="opacity-80 font-medium">Manage your reservations and payment status</p>
            </div>
            <div className="flex items-center gap-3 bg-white/10 p-2 rounded-2xl backdrop-blur-md border border-white/10">
              <button onClick={() => navigate('/')} className="btn btn-sm btn-ghost text-white gap-2">
                <Buildings size={18} /> New Booking
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-7xl -mt-10">
        <div className="card bg-base-100 shadow-xl mb-8 overflow-visible">
          <div className="card-body p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="tabs tabs-boxed bg-base-200/50 p-1 rounded-xl w-full md:w-auto">
              {['all', 'pending', 'confirmed', 'cancelled'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`tab tab-sm md:tab-md transition-all duration-300 font-bold uppercase tracking-widest ${activeTab === tab ? 'tab-active bg-primary text-white shadow-lg' : 'opacity-60 hover:opacity-100'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="flex items-center gap-2 text-xs font-bold text-base-content/40 uppercase tracking-widest">
                <SortAscending size={18} /> Sort By
              </div>
              <select
                className="select select-bordered select-sm font-bold bg-base-200/50 border-none rounded-xl"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="checkin">Check-in Date</option>
              </select>
            </div>
          </div>
        </div>

        {filteredAndSortedBookings.length === 0 ? (
          <div className="card bg-base-100 shadow-xl border-2 border-dashed border-base-300">
            <div className="card-body text-center py-20">
              <div className="w-20 h-20 bg-base-200 rounded-3xl flex items-center justify-center mx-auto mb-6 text-base-content/20">
                <Receipt size={40} weight="duotone" />
              </div>
              <h2 className="text-2xl font-black mb-2 uppercase tracking-tight">No bookings found</h2>
              <p className="text-base-content/50 font-medium mb-8 max-w-sm mx-auto">Try selecting "All" or browse for a new stay.</p>
              <button onClick={() => navigate('/')} className="btn btn-primary px-10 rounded-2xl font-bold shadow-lg shadow-primary/20">
                Explore Hotels
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredAndSortedBookings.map((booking) => {
              const ui = getStatusUI(booking.status);
              const refund = bookingRefunds[booking._id];
              return (
                <div key={booking._id} className="card bg-base-100 shadow-xl border border-base-200 hover:border-primary/30 transition-all duration-500 overflow-hidden group">
                  <div className="flex flex-col lg:flex-row">
                    <div className="lg:w-72 h-48 lg:h-auto bg-base-200 relative overflow-hidden">
                      <img
                        src={booking.hotelId?.image || booking.hotelId?.photos?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500'}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Hotel"
                      />
                      <div className="absolute top-4 left-4">
                        <div className={`badge h-auto py-1.5 px-3 font-bold border flex items-center gap-2 shadow-lg backdrop-blur-md ${ui.color}`}>
                          {ui.icon} {ui.text}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 p-6 md:p-8">
                      <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest mb-2">
                            <MapPin size={14} weight="bold" /> {booking.hotelId?.city}
                          </div>
                          <h2 className="text-2xl font-black tracking-tight mb-4 group-hover:text-primary transition-colors">{booking.hotelId?.name}</h2>
                          <div className="flex flex-wrap gap-6 text-sm font-bold text-base-content/60">
                            <div className="flex items-center gap-2">
                              <CalendarCheck size={18} className="text-primary" /> {formatDate(booking.checkIn)} — {formatDate(booking.checkOut)}
                            </div>
                            <div className="flex items-center gap-2">
                              <Users size={18} className="text-primary" /> {booking.adult + (booking.children || 0)} Guests
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <div className="text-[10px] font-black text-base-content/30 uppercase tracking-widest mb-1">Total Payment</div>
                          <div className="text-3xl font-black text-primary tracking-tighter">${booking.totalAmount?.toFixed(2)}</div>
                        </div>
                      </div>
                      <div className="divider opacity-50"></div>
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="text-xs font-bold opacity-40 italic">ID: {booking._id.substring(0, 12)}...</div>
                        <div className="flex gap-3 w-full sm:w-auto">
                          {booking.status === 'pending' && (
                            <>
                              <button className="btn btn-ghost btn-sm text-error font-black uppercase tracking-widest px-6" onClick={() => handleCancelBooking(booking._id)} disabled={processingBookingId === booking._id}>
                                {processingBookingId === booking._id ? '...' : 'Cancel'}
                              </button>
                              <button className="btn btn-primary btn-sm rounded-xl px-8 font-black uppercase tracking-widest shadow-lg shadow-primary/20 gap-2" onClick={() => handlePayment(booking)} disabled={processingBookingId === booking._id}>
                                {processingBookingId === booking._id ? <span className="loading loading-spinner loading-xs"></span> : <Wallet size={18} weight="fill" />} Pay Now
                              </button>
                            </>
                          )}
                          {booking.status === 'confirmed' && (
                            <div className="flex items-center gap-2 text-success font-black text-xs uppercase tracking-widest py-2 px-4 bg-success/10 rounded-xl">
                              <CheckCircle size={18} weight="fill" /> Payment Verified
                            </div>
                          )}
                          {booking.status === 'cancelled' && !refund && (
                            <button className="btn btn-warning btn-sm rounded-xl font-black uppercase tracking-widest gap-2" onClick={() => openRefundModal(booking)} disabled={processingBookingId === booking._id}>
                              <ArrowCounterClockwise size={18} weight="bold" /> Request Refund
                            </button>
                          )}
                          {refund && (
                            <div className="flex items-center gap-2 text-warning font-black text-xs uppercase tracking-widest py-2 px-4 bg-warning/10 rounded-xl">
                              <Clock size={18} weight="fill" /> Refund Processing
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {refundModal.isOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg rounded-3xl p-8 border-t-8 border-warning">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-black tracking-tight mb-1">Refund Request</h3>
                <p className="text-sm font-medium opacity-50 uppercase tracking-widest">Bank Details Required</p>
              </div>
              <button onClick={closeRefundModal} className="btn btn-sm btn-circle btn-ghost"><X size={24} /></button>
            </div>
            <form onSubmit={handleRefundSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-control">
                  <label className="label text-[10px] font-black uppercase tracking-widest opacity-40">Bank Name</label>
                  <input type="text" placeholder="e.g. Vietcombank" className="input input-bordered w-full font-bold bg-base-200/50 border-none rounded-xl h-12" value={refundForm.bankName} onChange={(e) => setRefundForm({ ...refundForm, bankName: e.target.value })} required />
                </div>
                <div className="form-control">
                  <label className="label text-[10px] font-black uppercase tracking-widest opacity-40">Account Number</label>
                  <input type="text" placeholder="Enter number" className="input input-bordered w-full font-bold bg-base-200/50 border-none rounded-xl h-12" value={refundForm.bankNumber} onChange={(e) => setRefundForm({ ...refundForm, bankNumber: e.target.value })} required />
                </div>
              </div>
              <div className="form-control">
                <label className="label text-[10px] font-black uppercase tracking-widest opacity-40">Reason for Request</label>
                <textarea className="textarea textarea-bordered h-28 font-medium bg-base-200/50 border-none rounded-2xl resize-none" placeholder="Please provide a brief reason for cancellation..." value={refundForm.reasons} onChange={(e) => setRefundForm({ ...refundForm, reasons: e.target.value })} required></textarea>
              </div>
              <div className="bg-warning/5 rounded-2xl p-4 flex items-start gap-4 border border-warning/10">
                <Info size={24} className="text-warning shrink-0" />
                <div className="text-[11px] font-bold text-warning/80 leading-relaxed uppercase tracking-wide">
                  Our finance team will process this request within 3-5 business days. You will be refunded the full amount of ${refundModal.booking?.totalAmount?.toFixed(2)}.
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={closeRefundModal} className="btn btn-ghost flex-1 font-black uppercase tracking-widest">Cancel</button>
                <button type="submit" className="btn btn-warning flex-1 font-black uppercase tracking-widest shadow-lg shadow-warning/20" disabled={processingBookingId === refundModal.booking?._id}>
                  {processingBookingId === refundModal.booking?._id ? <span className="loading loading-spinner loading-xs"></span> : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop bg-primary/20 backdrop-blur-sm" onClick={closeRefundModal}></div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
