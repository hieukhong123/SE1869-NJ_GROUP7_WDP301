import { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import axiosClient from '../../services/axiosClient';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { PencilSimple, Trash, Plus, CircleNotch, Sparkle } from '@phosphor-icons/react';

const ExtraFeeList = () => {
    const [extraFees, setExtraFees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchExtraFees = async () => {
        try {
            setLoading(true);
            const response = await axiosClient.get('/extra-fees');
            setExtraFees(response.data);
        } catch (err) {
            setError(err);
            toast.error('Failed to load additional services.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExtraFees();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to remove this service from the portfolio?')) {
            try {
                await axiosClient.delete(`/extra-fees/${id}`);
                setExtraFees(extraFees.filter((fee) => fee._id !== id));
                toast.success('Service removed successfully.');
            } catch (err) {
                toast.error(
                    'Failed to delete service: ' +
                    (err.response?.data?.message || err.message)
                );
            }
        }
    };

    const columns = [
        { 
            accessorKey: 'extraName', 
            header: 'Service Name',
            cell: (info) => <span className="font-medium text-gray-900">{info.getValue()}</span>
        },
        { 
            accessorKey: 'extraPrice', 
            header: 'Price',
            cell: (info) => (
                <span className="font-light tracking-wide text-gray-900">
                    ${Number(info.getValue())?.toLocaleString()}
                </span>
            )
        },
        { 
            accessorKey: 'hotelId.name', 
            header: 'Property',
            cell: (info) => <span className="text-gray-600 font-light line-clamp-1">{info.getValue()}</span>,
            accessorFn: (row) => row.hotelId?.name || '-'
        },
        {
            accessorKey: 'actions',
            header: 'Actions',
            enableGlobalFilter: false,
            enableSorting: false,
            cell: ({ row }) => (
                <div className="flex items-center gap-1">
                    <Link
                        to={`/admin/extra-fees/${row.original._id}/edit`}
                        className="p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-50"
                        title="Edit Service"
                    >
                        <PencilSimple size={18} weight="light" />
                    </Link>
                    <button
                        onClick={() => handleDelete(row.original._id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                        title="Remove Service"
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
                    Loading Services...
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
                            Additional Services
                        </h1>
                        <p className="text-xs font-light text-gray-500 uppercase tracking-[0.2em]">
                            Manage Amenities & Extra Fees
                        </p>
                    </div>
                    <Link 
                        to="/admin/extra-fees/new" 
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-black text-white text-xs tracking-widest uppercase transition-colors rounded-sm"
                    >
                        <Plus size={16} weight="light" />
                        Add Service
                    </Link>
                </div>

                {/* Table Section or Empty State */}
                {extraFees.length === 0 ? (
                    <div className="bg-white border border-gray-200 border-dashed rounded-sm py-32 flex flex-col items-center justify-center text-center px-4">
                        <Sparkle size={48} weight="light" className="text-gray-300 mb-6" />
                        <h3 className="text-xl font-serif text-gray-900 mb-2">No Services Found</h3>
                        <p className="text-gray-500 font-light max-w-md mx-auto mb-8">
                            Your system currently has no extra amenities or fees. Start by adding a new service like Airport Transfer or Spa Access.
                        </p>
                        <Link 
                            to="/admin/extra-fees/new" 
                            className="inline-flex items-center gap-2 px-6 py-3 bg-transparent border border-gray-300 hover:border-gray-900 text-gray-900 text-xs tracking-widest uppercase transition-colors rounded-sm"
                        >
                            Create First Service
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
                        <Table data={extraFees} columns={columns} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExtraFeeList;