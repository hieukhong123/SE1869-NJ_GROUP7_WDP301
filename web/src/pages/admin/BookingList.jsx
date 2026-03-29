import { useState, useEffect, useMemo } from 'react';
import Table from '../../components/common/Table';
import axiosClient from '../../services/axiosClient';
import { capitalizeFirstLetter } from '../../utils/helpers';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  CircleNotchIcon,
  TrashIcon,
  EyeIcon,
  ReceiptIcon,
  CaretDownIcon,
  WarningCircleIcon,
  XCircleIcon,
  ArrowClockwiseIcon,
} from '@phosphor-icons/react';

const BookingList = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  // Refund Modal State
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundImg, setRefundImg] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/bookings');
      setBookings(response.data);
    } catch (err) {
      setError(err);
      toast.error('Failed to load reservations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const pendingCancelCount = useMemo(() => {
    return bookings.filter((b) => b.cancellationRequest?.status === 'Pending')
      .length;
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    if (activeTab === 'pending_cancel') {
      return bookings.filter(
        (b) => b.cancellationRequest?.status === 'Pending',
      );
    }
    return bookings;
  }, [bookings, activeTab]);

  const handleDelete = async (id) => {
    if (
      window.confirm(
        'Are you sure you want to delete this booking record? This action cannot be undone.',
      )
    ) {
      try {
        await axiosClient.delete(`/bookings/${id}`);
        setBookings(bookings.filter((booking) => booking._id !== id));
        toast.success('Reservation record removed.');
      } catch (err) {
        toast.error(
          'Failed to remove record: ' +
            (err.response?.data?.message || err.message),
        );
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await axiosClient.put(`/bookings/${id}`, {
        status: newStatus,
        staffId: user._id,
      });
      setBookings(
        bookings.map((booking) =>
          booking._id === id ? { ...booking, status: newStatus } : booking,
        ),
      );
      toast.success(`Status updated to ${capitalizeFirstLetter(newStatus)}`);
    } catch (err) {
      toast.error(`Failed to update status: ${err.message}`);
    }
  };

  const handleRefundClick = (booking) => {
    setSelectedBooking(booking);
    setShowRefundModal(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      setUploading(true);
      const response = await axiosClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploadedUrl = response?.url || response?.data?.url;
        if (!uploadedUrl) throw new Error('Upload succeeded but no image URL was returned.');
        setRefundImg(uploadedUrl);
      toast.success('Image uploaded successfully');
    } catch (err) {
      toast.error('Failed to upload image: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleRefundSubmit = async () => {
    if (!refundReason || !refundImg) {
      toast.error('Please provide a reason and upload a transfer image');
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await axiosClient.post(`/bookings/${selectedBooking._id}/refund`, {
        reason: refundReason,
        transfer_img: refundImg,
        staffId: user._id,
      });
      toast.success('Refund processed successfully');
      setShowRefundModal(false);
      setRefundReason('');
      setRefundImg('');
      fetchBookings();
    } catch (err) {
      toast.error(
        'Failed to process refund: ' +
          (err.response?.data?.message || err.message),
      );
    }
  };

  const columns = [
    {
      accessorKey: 'userId.fullName',
      header: 'Guest',
      cell: (info) => (
        <div>
          <span className="font-medium text-gray-900 block">
            {info.getValue() || 'Guest'}
          </span>
          <span className="text-[10px] text-gray-400 uppercase tracking-widest">
            {info.row.original._id.substring(0, 8)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'hotelId.name',
      header: 'Property',
      cell: ({ row }) => {
        const hotel = row.original.hotelId;
        return (
          <div className="flex flex-col">
            <span className="text-gray-700 font-medium">
              {hotel?.name || '-'}
            </span>
            {hotel?.status && hotel.status !== 'active' && (
              <span
                className={`text-[8px] uppercase tracking-tighter font-bold px-1.5 py-0.5 rounded-full w-fit mt-1 ${
                  hotel.status === 'inactive'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-orange-100 text-orange-600'
                }`}
              >
                {hotel.status}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'roomIds',
      header: 'Accommodation',
      enableSorting: false,
      cell: ({ row }) => {
        const rooms = row.original.roomIds || [];
        if (rooms.length === 0)
          return <span className="text-gray-400 italic">No rooms</span>;

        const roomCounts = rooms.reduce((acc, room) => {
          acc[room.roomName] = (acc[room.roomName] || 0) + 1;
          return acc;
        }, {});

        return (
          <div className="flex flex-col gap-1">
            {Object.entries(roomCounts).map(([name, count], index) => (
              <span
                key={index}
                className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-sm border border-gray-100 w-fit"
              >
                {count}x {name}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: 'checkIn',
      header: 'Stay Period',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm text-gray-900">
            {new Date(row.original.checkIn).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
            <span className="mx-1 text-gray-400">→</span>
            {new Date(row.original.checkOut).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <span className="text-[10px] text-gray-400 mt-0.5">
            {Math.ceil(
              (new Date(row.original.checkOut) -
                new Date(row.original.checkIn)) /
                (1000 * 60 * 60 * 24),
            )}{' '}
            Nights
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const id = row.original._id;
        const cancelReq = row.original.cancellationRequest;

        const pendingCancelBadge =
          cancelReq?.status === 'Pending' ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold border rounded-sm bg-red-50 text-red-700 border-red-200 w-fit mb-2">
              <WarningCircleIcon size={14} weight="fill" /> Cancel Requested
            </span>
          ) : null;

        if (status === 'pending') {
          return (
            <div className="flex flex-col">
              {pendingCancelBadge}
              <div className="relative w-fit">
                <select
                  className="appearance-none bg-orange-50 border border-orange-200 text-orange-800 text-[10px] uppercase tracking-widest py-1.5 pl-3 pr-8 rounded-sm cursor-pointer focus:ring-0 focus:border-orange-400 transition-colors font-medium"
                  value={status}
                  onChange={(e) => handleStatusChange(id, e.target.value)}
                >
                  <option value="pending" disabled>
                    Pending
                  </option>
                  <option value="paid">Paid</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <CaretDownIcon
                  size={12}
                  weight="bold"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-orange-800 pointer-events-none"
                />
              </div>
            </div>
          );
        }

        if (status === 'paid') {
          return (
            <div className="flex flex-col gap-2">
              {pendingCancelBadge}
              <div className="relative w-fit">
                <select
                  className="appearance-none bg-blue-50 border border-blue-200 text-blue-800 text-[10px] uppercase tracking-widest py-1.5 pl-3 pr-8 rounded-sm cursor-pointer focus:ring-0 focus:border-blue-400 transition-colors font-medium"
                  value={status}
                  onChange={(e) => handleStatusChange(id, e.target.value)}
                >
                  <option value="paid" disabled>
                    Paid
                  </option>
                  <option value="confirmed">Confirm Payment</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <CaretDownIcon
                  size={12}
                  weight="bold"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-800 pointer-events-none"
                />
              </div>
            </div>
          );
        }

        let styles = '';
        switch (status) {
          case 'confirmed':
            styles = 'bg-green-50 text-green-700 border-green-200';
            break;
          case 'cancelled':
            styles = 'bg-gray-50 text-gray-500 border-gray-200';
            break;
          case 'checked_in':
            styles = 'bg-indigo-50 text-indigo-700 border-indigo-200';
            break;
          case 'checked_out':
            styles = 'bg-purple-50 text-purple-700 border-purple-200';
            break;
          case 'no_show':
            styles = 'bg-red-50 text-red-700 border-red-200';
            break;
          default:
            styles = 'bg-gray-100 text-gray-600 border-gray-200';
        }

        return (
          <div className="flex flex-col gap-2">
            {pendingCancelBadge}
            <div className="relative w-fit">
              <select
                className={`appearance-none px-3 py-1.5 text-[10px] uppercase tracking-widest font-medium border rounded-sm w-fit pr-8 cursor-pointer focus:ring-0 transition-colors ${styles}`}
                value={status}
                onChange={(e) => handleStatusChange(id, e.target.value)}
              >
                <option value="confirmed">Confirmed</option>
                <option value="checked_in">Checked In</option>
                <option value="checked_out">Checked Out</option>
                <option value="no_show">No Show</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <CaretDownIcon
                size={12}
                weight="bold"
                className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
              />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      enableGlobalFilter: false,
      enableSorting: false,
      cell: ({ row }) => {
        const booking = row.original;
        const isPendingCancel =
          booking.cancellationRequest?.status === 'Pending' &&
          booking.status === 'confirmed';
        const canRefund = ['paid', 'confirmed'].includes(booking.status);

        return (
          <div className="flex items-center gap-2">
            {isPendingCancel ? (
              <Link
                to={`/admin/bookings/${booking._id}/view`}
                className="px-4 py-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-colors rounded-sm text-[10px] uppercase tracking-widest font-medium whitespace-nowrap"
              >
                Review Request
              </Link>
            ) : (
              <div className="flex items-center gap-1">
                {canRefund && (
                  <button
                    onClick={() => handleRefundClick(booking)}
                    className="p-2 text-gray-400 hover:text-orange-600 transition-colors rounded-full hover:bg-orange-50"
                    title="Refund Booking"
                  >
                    <ArrowClockwiseIcon size={18} weight="light" />
                  </button>
                )}
                <Link
                  to={`/admin/bookings/${booking._id}/view`}
                  className="p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-50"
                  title="View Details"
                >
                  <EyeIcon size={18} weight="light" />
                </Link>
                <button
                  onClick={() => handleDelete(booking._id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                  title="Delete Record"
                >
                  <TrashIcon size={18} weight="light" />
                </button>
              </div>
            )}
          </div>
        );
      },
    },
  ];

  if (loading)
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-transparent">
        <CircleNotchIcon
          size={32}
          weight="light"
          className="text-orange-800 animate-spin"
        />
        <p className="text-gray-500 font-light text-sm tracking-widest uppercase">
          Loading Reservations...
        </p>
      </div>
    );

  if (error)
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-transparent">
        <p className="text-red-500 font-serif text-xl">Unable to load data</p>
        <p className="text-gray-500 font-light">{error.message}</p>
      </div>
    );

  return (
    <div className="p-6 md:p-8 lg:p-12 relative">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif text-gray-900 mb-2">
              Reservations
            </h1>
            <p className="text-xs font-light text-gray-500 uppercase tracking-[0.2em]">
              Manage Guest Bookings
            </p>
          </div>
        </div>

        <div className="flex gap-6 border-b border-gray-200 mb-8 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 text-xs uppercase tracking-widest whitespace-nowrap transition-colors relative ${activeTab === 'all' ? 'text-gray-900 font-medium' : 'text-gray-400 hover:text-gray-900'}`}
          >
            All Reservations
            {activeTab === 'all' && (
              <span className="absolute -bottom-px left-0 w-full h-px bg-gray-900"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('pending_cancel')}
            className={`pb-3 text-xs uppercase tracking-widest whitespace-nowrap transition-colors relative flex items-center gap-2 ${activeTab === 'pending_cancel' ? 'text-red-600 font-medium' : 'text-gray-400 hover:text-red-500'}`}
          >
            Cancel Requests
            {pendingCancelCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'pending_cancel' ? 'bg-red-100 text-red-700' : 'bg-red-500 text-white'}`}
              >
                {pendingCancelCount}
              </span>
            )}
            {activeTab === 'pending_cancel' && (
              <span className="absolute -bottom-px left-0 w-full h-px bg-red-600"></span>
            )}
          </button>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="bg-white border border-gray-200 border-dashed rounded-sm py-32 flex flex-col items-center justify-center text-center px-4">
            <ReceiptIcon
              size={48}
              weight="light"
              className="text-gray-300 mb-6"
            />
            <h3 className="text-xl font-serif text-gray-900 mb-2">
              No Reservations Found
            </h3>
            <p className="text-gray-500 font-light max-w-md mx-auto">
              {activeTab === 'pending_cancel'
                ? 'There are no pending cancellation requests to review.'
                : 'There are currently no booking records in the system.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
            <Table data={filteredBookings} columns={columns} />
          </div>
        )}

        {/* Refund Modal */}
        {showRefundModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-sm max-w-lg w-full p-8 shadow-2xl">
              <h2 className="text-2xl font-serif text-gray-900 mb-6">
                Process Refund
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-2">
                    Refund Reason
                  </label>
                  <textarea
                    className="w-full border border-gray-200 p-3 text-sm focus:ring-0 focus:border-gray-900 rounded-sm min-h-25"
                    placeholder="Explain why this booking is being refunded..."
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-2">
                    Transfer Image (Screenshot)
                  </label>
                  <div className="flex flex-col gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                    />
                    {uploading && (
                      <div className="text-xs text-orange-600 flex items-center gap-2">
                        <CircleNotchIcon className="animate-spin" />{' '}
                        Uploading...
                      </div>
                    )}
                    {refundImg && (
                      <div className="relative w-40 h-40 border border-gray-200 p-1">
                        <img
                          src={refundImg}
                          alt="Refund proof"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => setRefundImg('')}
                          className="absolute -top-2 -right-2 bg-white rounded-full shadow-md text-red-500"
                        >
                          <XCircleIcon size={20} weight="fill" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-10">
                <button
                  onClick={() => setShowRefundModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 text-xs tracking-widest uppercase hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRefundSubmit}
                  disabled={uploading}
                  className="flex-1 px-6 py-3 bg-gray-900 text-white text-xs tracking-widest uppercase hover:bg-black transition-colors disabled:opacity-50"
                >
                  Submit Refund
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingList;




