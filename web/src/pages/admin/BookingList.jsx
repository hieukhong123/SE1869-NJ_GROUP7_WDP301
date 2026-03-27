import { useState, useEffect, useMemo } from 'react';
import Table from '../../components/common/Table';
import axiosClient from '../../services/axiosClient';
import { capitalizeFirstLetter } from '../../utils/helpers';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { CircleNotch, Trash, Eye, Receipt, CaretDown, WarningCircle } from '@phosphor-icons/react';

const BookingList = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('all');

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
                            <Link
                                to={`/admin/bookings/${booking._id}/view`}
                                className="px-4 py-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-colors rounded-sm text-[10px] uppercase tracking-widest font-medium whitespace-nowrap"
                            >
                                Review Request
                            </Link>
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
        </div>
    );
};

export default BookingList;
