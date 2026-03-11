import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Table from '../../components/common/Table';
import axiosClient from '../../services/axiosClient';
import { toast } from 'sonner';
import { capitalizeFirstLetter } from '../../utils/helpers';
import { PencilSimple, Trash, Plus, CircleNotch } from '@phosphor-icons/react';

const RoomList = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchRooms = async () => {
        try {
            setLoading(true);
            const response = await axiosClient.get('/rooms');
            setRooms(response.data);
        } catch (err) {
            toast.error('Failed to load rooms.');
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    const handleDelete = async (roomId) => {
        if (window.confirm('Are you sure you want to remove this room from the portfolio?')) {
            try {
                await axiosClient.delete(`/rooms/${roomId}`);
                toast.success('Room removed successfully.');
                fetchRooms(); // Refresh the list
            } catch (err) {
                toast.error(
                    'Failed to delete room: ' +
                        (err.response?.data?.message || err.message)
                );
            }
        }
    };

    const handleToggleStatus = async (roomId) => {
        try {
            await axiosClient.put(`/rooms/${roomId}/toggleStatus`);
            toast.success('Room status updated.');
            fetchRooms(); // Refresh the list
        } catch (err) {
            toast.error(
                'Failed to update status: ' +
                    (err.response?.data?.message || err.message)
            );
        }
    };

    const columns = [
        {
            accessorKey: 'hotelId.name',
            header: 'Property',
            cell: (info) => (
                <span className="font-medium text-gray-900">{info.getValue()}</span>
            ),
            accessorFn: (row) => row.hotelId?.name || '-',
        },
        { 
            accessorKey: 'roomName', 
            header: 'Room Classification',
            cell: (info) => <span className="text-gray-600">{info.getValue()}</span>,
            accessorFn: (row) => row.roomName || '-',
        },
        { 
            accessorKey: 'roomPrice', 
            header: 'Rate (Night)',
            cell: (info) => (
                <span className="font-light tracking-wide text-gray-900">
                    ${info.getValue()?.toLocaleString()}
                </span>
            ),
        },
        { 
            accessorKey: 'maxOccupancy', 
            header: 'Capacity',
            cell: (info) => <span className="text-gray-500 font-light">{info.getValue()} Guests</span>,
        },
        { 
            accessorKey: 'quantity', 
            header: 'Units',
            cell: (info) => <span className="text-gray-500 font-light">{info.getValue()}</span>,
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.original.status;
                const isAvailable = status === 'available';
                
                return (
                    <button
                        onClick={() => handleToggleStatus(row.original._id)}
                        className={`text-xs uppercase tracking-widest px-3 py-1.5 rounded-sm transition-all duration-300 border ${
                            isAvailable
                                ? 'bg-white text-gray-900 border-gray-300 hover:border-gray-900'
                                : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-400'
                        }`}
                    >
                        {capitalizeFirstLetter(status)}
                    </button>
                );
            },
        },
        {
            accessorKey: 'actions',
            header: 'Actions',
            enableGlobalFilter: false,
            cell: ({ row }) => (
                <div className="flex items-center space-x-3">
                    <Link
                        to={`/admin/rooms/${row.original._id}/edit`}
                        className="p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-50"
                        title="Edit Room Details"
                    >
                        <PencilSimple size={18} weight="light" />
                    </Link>
                    <button
                        onClick={() => handleDelete(row.original._id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                        title="Remove Room"
                    >
                        <Trash size={18} weight="light" />
                    </button>
                </div>
            ),
        },
    ];

    if (loading)
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-[#FFFCFA]">
                <CircleNotch size={32} weight="light" className="text-orange-800 animate-spin" />
                <p className="text-gray-500 font-light text-sm tracking-widest uppercase">
                    Loading Portfolio...
                </p>
            </div>
        );

    if (error)
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-[#FFFCFA]">
                <p className="text-red-500 font-serif text-xl">Unable to load data</p>
                <p className="text-gray-500 font-light">{error.message}</p>
            </div>
        );

    return (
        <div className="min-h-screen bg-[#FFFCFA] p-6 md:p-12 lg:px-24">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 pb-6 border-b border-gray-200 gap-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-serif text-gray-900 mb-2">
                            Room Portfolio
                        </h1>
                        <p className="text-sm font-light text-gray-500 uppercase tracking-widest">
                            Manage Property Accommodations
                        </p>
                    </div>
                    <Link 
                        to="/admin/rooms/new" 
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-black text-white text-sm tracking-widest uppercase transition-colors rounded-sm"
                    >
                        <Plus size={16} weight="bold" />
                        Add Room
                    </Link>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
                    <Table data={rooms} columns={columns} />
                </div>
            </div>
        </div>
    );
};

export default RoomList;