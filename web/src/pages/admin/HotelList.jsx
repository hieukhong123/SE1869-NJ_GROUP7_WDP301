import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Table from '../../components/common/Table';
import axiosClient from '../../services/axiosClient';
import { toast } from 'sonner';
import { PencilSimple, Trash, Plus, CircleNotch, Buildings } from '@phosphor-icons/react';

const HotelList = () => {
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchHotels = async () => {
        try {
            setLoading(true);
            const response = await axiosClient.get('/hotels/admin-all');
            setHotels(response.data);
        } catch (err) {
            toast.error('Failed to load properties.');
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHotels();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to remove this property from the portfolio?')) {
            try {
                await axiosClient.delete(`/hotels/${id}`);
                toast.success('Property removed successfully.');
                setHotels(hotels.filter((hotel) => hotel._id !== id));
            } catch (err) {
                toast.error(
                    'Failed to delete property: ' +
                    (err.response?.data?.message || err.message)
                );
            }
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            await axiosClient.put(`/hotels/${id}/toggle-status`);
            toast.success('Hotel status updated successfully.');
            fetchHotels();
        } catch (err) {
            toast.error('Failed to update hotel status: ' + (err.response?.data?.message || err.message));
        }
    };

    const columns = [
        { 
            accessorKey: 'name', 
            header: 'Property Name',
            cell: (info) => <span className="font-medium text-gray-900">{info.getValue()}</span>
        },
        { 
            accessorKey: 'address', 
            header: 'Address',
            cell: (info) => <span className="text-gray-600 font-light line-clamp-1">{info.getValue()}</span>
        },
        { 
            accessorKey: 'hotelPhone', 
            header: 'Contact',
            cell: (info) => <span className="text-gray-500 font-light">{info.getValue() || '-'}</span>
        },
        {
            accessorKey: 'hotelEmail',
            header: 'Email',
            cell: (info) => <span className="text-gray-500 font-light">{info.getValue() || '-'}</span>
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.original.status;
                return (
                    <button
                        onClick={() => handleToggleStatus(row.original._id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-sm transition-colors border text-[10px] uppercase tracking-widest font-medium ${
                            status
                                ? 'border-gray-200 bg-white hover:bg-gray-50 text-gray-900'
                                : 'border-gray-200 bg-gray-50 hover:bg-white text-gray-400'
                        }`}
                        title="Click to toggle status"
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${status ? 'bg-green-500' : 'bg-red-400'}`}></span>
                        {status ? 'Active' : 'Inactive'}
                    </button>
                );
            },
        },
        {
            accessorKey: 'actions',
            header: 'Actions',
            enableGlobalFilter: false,
            cell: ({ row }) => (
                <div className="flex items-center gap-1">
                    <Link
                        to={`/admin/hotels/${row.original._id}/edit`}
                        className="p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-50"
                        title="Edit Property"
                    >
                        <PencilSimple size={18} weight="light" />
                    </Link>
                    <button
                        onClick={() => handleDelete(row.original._id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                        title="Remove Property"
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
                    Loading Portfolio...
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
                            Hotel Portfolio
                        </h1>
                        <p className="text-xs font-light text-gray-500 uppercase tracking-[0.2em]">
                            Manage your collection of hotels
                        </p>
                    </div>
                    <Link 
                        to="/admin/hotels/new" 
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-black text-white text-xs tracking-widest uppercase transition-colors rounded-sm"
                    >
                        <Plus size={16} weight="light" />
                        <span>Add Hotel</span>
                    </Link>
                </div>

                {hotels.length === 0 ? (
                    <div className="bg-white border border-gray-200 border-dashed rounded-sm py-32 flex flex-col items-center justify-center text-center px-4">
                        <Buildings size={48} weight="light" className="text-gray-300 mb-6" />
                        <h3 className="text-xl font-serif text-gray-900 mb-2">No Properties Found</h3>
                        <p className="text-gray-500 font-light max-w-md mx-auto mb-8">
                            Your portfolio is currently empty. Start building your collection by adding a new property.
                        </p>
                        <Link 
                            to="/admin/hotels/new" 
                            className="inline-flex items-center gap-2 px-6 py-3 bg-transparent border border-gray-300 hover:border-gray-900 text-gray-900 text-xs tracking-widest uppercase transition-colors rounded-sm"
                        >
                            Create First Property
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
                        <Table data={hotels} columns={columns} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default HotelList;