import { useState, useEffect, useMemo } from 'react';
import Table from '../../components/common/Table';
import axiosClient from '../../services/axiosClient';
import { capitalizeFirstLetter } from '../../utils/helpers';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { 
    CircleNotch, 
    Trash, 
    Eye, 
    Receipt, 
    CaretDown, 
    WarningCircle, 
    Check, 
    X,
    XCircle
} from '@phosphor-icons/react';

const BookingList = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('all');

    // Admin Action Modals State
    const [acceptModalOpen, setAcceptModalOpen] = useState(false);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [processingAdminAction, setProcessingAdminAction] = useState(false);

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
        return bookings.filter(b => b.cancellationRequest?.status === 'Pending').length;
    }, [bookings]);

    const filteredBookings = useMemo(() => {
        if (activeTab === 'pending_cancel') {
            return bookings.filter(b => b.cancellationRequest?.status === 'Pending');
        }
        return bookings;
    }, [bookings, activeTab]);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this booking record? This action cannot be undone.')) {
            try {
                await axiosClient.delete(`/bookings/${id}`);
                setBookings(bookings.filter((booking) => booking._id !== id));
                toast.success('Reservation record removed.');
            } catch (err) {
                toast.error('Failed to remove record: ' + (err.response?.data?.message || err.message));
            }
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await axiosClient.put(`/bookings/${id}`, { status: newStatus });
            setBookings(
                bookings.map((booking) =>
                    booking._id === id ? { ...booking, status: newStatus } : booking
                )
            );
            toast.success(`Status updated to ${capitalizeFirstLetter(newStatus)}`);
        } catch (err) {
            toast.error(`Failed to update status: ${err.message}`);
        }
    };

    const submitCancelResponse = async (action, reason = '') => {
        setProcessingAdminAction(true);
        try {
            await axiosClient.put(`/bookings/${selectedBooking._id}/cancel-request/answer`, {
                action, 
                adminReplyReason: reason
            });

            toast.success(`Cancellation request ${action.toLowerCase()}ed successfully.`);
            setAcceptModalOpen(false);
            setRejectModalOpen(false);
            setRejectReason('');
            fetchBookings();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to process request.');
        } finally {
            setProcessingAdminAction(false);
        }
    };

    const columns = [
        {
            accessorKey: 'userId.fullName',
            header: 'Guest',
            cell: (info) => (
                <div>
                    <span className="font-medium text-gray-900 block">{info.getValue() || 'Guest'}</span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest">{info.row.original._id.substring(0, 8)}</span>
                </div>
            )
        },
        {
            accessorKey: 'hotelId.name',
            header: 'Property',
            cell: (info) => <span className="text-gray-700 font-medium">{info.getValue()}</span>
        },
        {
            accessorKey: 'roomIds',
            header: 'Accommodation',
            enableSorting: false,
            cell: ({ row }) => {
                const rooms = row.original.roomIds || [];
                if (rooms.length === 0) return <span className="text-gray-400 italic">No rooms</span>;

                const roomCounts = rooms.reduce((acc, room) => {
                    acc[room.roomName] = (acc[room.roomName] || 0) + 1;
                    return acc;
                }, {});

                return (
                    <div className="flex flex-col gap-1">
                        {Object.entries(roomCounts).map(([name, count], index) => (
                            <span key={index} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-sm border border-gray-100 w-fit">
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
                        {new Date(row.original.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        <span className="mx-1 text-gray-400">→</span>
                        {new Date(row.original.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-0.5">
                        {Math.ceil((new Date(row.original.checkOut) - new Date(row.original.checkIn)) / (1000 * 60 * 60 * 24))} Nights
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

                const pendingCancelBadge = cancelReq?.status === 'Pending' ? (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold border rounded-sm bg-red-50 text-red-700 border-red-200 w-fit mb-2">
                        <WarningCircle size={14} weight="fill" /> Cancel Requested
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
                                    <option value="pending" disabled>Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                                <CaretDown size={12} weight="bold" className="absolute right-2 top-1/2 -translate-y-1/2 text-orange-800 pointer-events-none" />
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
                    default:
                        styles = 'bg-gray-100 text-gray-600 border-gray-200';
                }

                return (
                    <div className="flex flex-col gap-2">
                        {pendingCancelBadge}
                        <span className={`inline-block px-3 py-1.5 text-[10px] uppercase tracking-widest font-medium border rounded-sm w-fit ${styles}`}>
                            {capitalizeFirstLetter(status)}
                        </span>
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
                const isPendingCancel = booking.cancellationRequest?.status === 'Pending' && booking.status === 'confirmed';

                return (
                    <div className="flex items-center gap-2">
                        {isPendingCancel ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => { setSelectedBooking(booking); setAcceptModalOpen(true); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-widest font-medium border border-gray-200 rounded-sm text-gray-600 hover:border-green-600 hover:text-green-600 hover:bg-green-50 transition-colors"
                                    title="Approve Cancellation"
                                >
                                    <Check size={14} weight="bold" /> Approve
                                </button>
                                <button
                                    onClick={() => { setSelectedBooking(booking); setRejectModalOpen(true); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-widest font-medium border border-gray-200 rounded-sm text-gray-600 hover:border-red-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                                    title="Reject Cancellation"
                                >
                                    <X size={14} weight="bold" /> Decline
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1">
                                <Link
                                    to={`/admin/bookings/${booking._id}/view`}
                                    className="p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-50"
                                    title="View Details"
                                >
                                    <Eye size={18} weight="light" />
                                </Link>
                                <button
                                    onClick={() => handleDelete(booking._id)}
                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                                    title="Delete Record"
                                >
                                    <Trash size={18} weight="light" />
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
                <CircleNotch size={32} weight="light" className="text-orange-800 animate-spin" />
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
                {/* Header Section */}
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

                {/* Tabs */}
                <div className="flex gap-6 border-b border-gray-200 mb-8 overflow-x-auto hide-scrollbar">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`pb-3 text-xs uppercase tracking-widest whitespace-nowrap transition-colors relative ${activeTab === 'all' ? 'text-gray-900 font-medium' : 'text-gray-400 hover:text-gray-900'}`}
                    >
                        All Reservations
                        {activeTab === 'all' && <span className="absolute bottom-[-1px] left-0 w-full h-[1px] bg-gray-900"></span>}
                    </button>
                    <button
                        onClick={() => setActiveTab('pending_cancel')}
                        className={`pb-3 text-xs uppercase tracking-widest whitespace-nowrap transition-colors relative flex items-center gap-2 ${activeTab === 'pending_cancel' ? 'text-red-600 font-medium' : 'text-gray-400 hover:text-red-500'}`}
                    >
                        Cancel Requests
                        {pendingCancelCount > 0 && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'pending_cancel' ? 'bg-red-100 text-red-700' : 'bg-red-500 text-white'}`}>
                                {pendingCancelCount}
                            </span>
                        )}
                        {activeTab === 'pending_cancel' && <span className="absolute bottom-[-1px] left-0 w-full h-[1px] bg-red-600"></span>}
                    </button>
                </div>

                {/* Table Section or Empty State */}
                {filteredBookings.length === 0 ? (
                    <div className="bg-white border border-gray-200 border-dashed rounded-sm py-32 flex flex-col items-center justify-center text-center px-4">
                        <Receipt size={48} weight="light" className="text-gray-300 mb-6" />
                        <h3 className="text-xl font-serif text-gray-900 mb-2">No Reservations Found</h3>
                        <p className="text-gray-500 font-light max-w-md mx-auto">
                            {activeTab === 'pending_cancel' ? 'There are no pending cancellation requests to review.' : 'There are currently no booking records in the system.'}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
                        <Table data={filteredBookings} columns={columns} />
                    </div>
                )}
            </div>

            {/* Accept Cancellation Modal */}
            {acceptModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white rounded-sm shadow-2xl p-8 animate-fade-in text-center">
                        <div className="flex justify-end mb-2">
                            <button onClick={() => setAcceptModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                                <XCircle size={24} weight="light" />
                            </button>
                        </div>
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <WarningCircle size={32} weight="light" className="text-gray-900" />
                        </div>
                        <h3 className="text-xl font-serif text-gray-900 mb-3">Approve Cancellation</h3>
                        <p className="text-sm font-light text-gray-500 mb-8 leading-relaxed">
                            Are you sure you want to approve this request? The booking status will be changed to <strong className="font-medium text-gray-900">Cancelled</strong> and guests may need to be refunded according to your policy.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setAcceptModalOpen(false)}
                                className="px-6 py-3 border border-gray-300 text-gray-700 text-xs uppercase tracking-widest hover:border-gray-900 transition-colors rounded-sm w-full"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => submitCancelResponse('Accept')}
                                disabled={processingAdminAction}
                                className="px-6 py-3 bg-gray-900 text-white text-xs uppercase tracking-widest hover:bg-black transition-colors rounded-sm w-full flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {processingAdminAction ? <CircleNotch size={14} className="animate-spin" /> : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Cancellation Modal */}
            {rejectModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white rounded-sm shadow-2xl p-8 animate-fade-in">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <h3 className="text-xl font-serif text-gray-900">Decline Request</h3>
                            <button onClick={() => setRejectModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                                <XCircle size={24} weight="light" />
                            </button>
                        </div>
                        <p className="text-sm font-light text-gray-500 mb-6">
                            Provide a reason to the guest explaining why their cancellation request cannot be approved.
                        </p>
                        
                        <div className="relative group mb-8">
                            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Reason for rejection *</label>
                            <textarea
                                className="w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-gray-900 font-light text-sm focus:ring-0 focus:border-gray-900 transition-colors resize-none h-20 placeholder-gray-300"
                                placeholder="e.g. This is a non-refundable rate..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                            ></textarea>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setRejectModalOpen(false)}
                                className="px-6 py-2.5 border border-gray-300 text-gray-700 text-xs uppercase tracking-widest hover:border-gray-900 transition-colors rounded-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => submitCancelResponse('Reject', rejectReason)}
                                disabled={processingAdminAction || !rejectReason.trim()}
                                className="px-6 py-2.5 bg-gray-900 text-white text-xs uppercase tracking-widest hover:bg-black transition-colors rounded-sm flex items-center gap-2 disabled:opacity-50"
                            >
                                {processingAdminAction ? <CircleNotch size={14} className="animate-spin" /> : 'Decline Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default BookingList;