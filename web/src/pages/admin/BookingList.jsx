import { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import axiosClient from '../../services/axiosClient';
import { capitalizeFirstLetter } from '../../utils/helpers';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { CircleNotch, Trash, Eye, Receipt, CaretDown } from '@phosphor-icons/react';

const BookingList = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                
                // Group identical rooms for cleaner display
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
            accessorKey: 'totalAmount',
            header: 'Total',
            cell: ({ row }) => (
                <span className="font-serif text-gray-900">
                    ${row.original.totalAmount?.toLocaleString()}
                </span>
            )
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.original.status;
                const id = row.original._id;

                if (status === 'pending') {
                    return (
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
                    <span className={`inline-block px-3 py-1.5 text-[10px] uppercase tracking-widest font-medium border rounded-sm ${styles}`}>
                        {capitalizeFirstLetter(status)}
                    </span>
                );
            },
        },
        {
            accessorKey: 'actions',
            header: 'Actions',
            enableGlobalFilter: false,
            enableSorting: false,
            cell: ({ row }) => (
                <div className="flex items-center gap-1">
                    <Link
                        to={`/admin/bookings/${row.original._id}/view`}
                        className="p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-50"
                        title="View Details"
                    >
                        <Eye size={18} weight="light" />
                    </Link>
                    <button
                        onClick={() => handleDelete(row.original._id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                        title="Delete Record"
                    >
                        <Trash size={18} weight="light" />
                    </button>
                </div>
            ),
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
        <div className="p-6 md:p-8 lg:p-12">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 pb-6 border-b border-gray-200 gap-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-serif text-gray-900 mb-2">
                            Reservations
                        </h1>
                        <p className="text-xs font-light text-gray-500 uppercase tracking-[0.2em]">
                            Manage Guest Bookings
                        </p>
                    </div>
                </div>

                {/* Table Section or Empty State */}
                {bookings.length === 0 ? (
                    <div className="bg-white border border-gray-200 border-dashed rounded-sm py-32 flex flex-col items-center justify-center text-center px-4">
                        <Receipt size={48} weight="light" className="text-gray-300 mb-6" />
                        <h3 className="text-xl font-serif text-gray-900 mb-2">No Reservations Found</h3>
                        <p className="text-gray-500 font-light max-w-md mx-auto">
                            There are currently no booking records in the system.
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
                        <Table data={bookings} columns={columns} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingList;