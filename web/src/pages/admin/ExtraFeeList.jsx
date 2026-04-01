import { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import axiosClient from '../../services/axiosClient';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import ConfirmModal from '../../components/common/ConfirmModal';
import { PencilSimple, Trash, Plus, CircleNotch, Sparkle } from '@phosphor-icons/react';

const ExtraFeeList = () => {
    const [extraFees, setExtraFees] = useState([]);
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        hotelId: 'all',
        minPrice: '',
        maxPrice: '',
    });
    const [priceDraft, setPriceDraft] = useState({
        minPrice: '',
        maxPrice: '',
    });
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        service: null,
        loading: false,
    });

    const fetchExtraFees = async (activeFilters = filters) => {
        try {
            setLoading(true);
            const params = {};
            if (activeFilters.hotelId !== 'all') {
                params.hotelId = activeFilters.hotelId;
            }
            if (activeFilters.minPrice !== '') {
                params.minPrice = activeFilters.minPrice;
            }
            if (activeFilters.maxPrice !== '') {
                params.maxPrice = activeFilters.maxPrice;
            }

            const response = await axiosClient.get('/extra-fees', { params });
            setExtraFees(response.data);
            setError(null);
        } catch (err) {
            setError(err);
            toast.error('Failed to load additional services.');
        } finally {
            setLoading(false);
        }
    };

    const fetchHotels = async () => {
        try {
            const response = await axiosClient.get('/hotels/admin-all');
            setHotels(response.data || []);
        } catch (err) {
            setHotels([]);
        }
    };

    useEffect(() => {
        fetchHotels();
    }, []);

    useEffect(() => {
        fetchExtraFees(filters);
    }, [filters]);

    const handleFilterChange = (event) => {
        const { name, value } = event.target;

        if (name === 'minPrice' || name === 'maxPrice') {
            setPriceDraft((prev) => ({ ...prev, [name]: value }));
            return;
        }

        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const applyPriceFilters = () => {
        setFilters((prev) => ({
            ...prev,
            minPrice: priceDraft.minPrice,
            maxPrice: priceDraft.maxPrice,
        }));
    };

    const clearPriceFilters = () => {
        setPriceDraft({ minPrice: '', maxPrice: '' });
        setFilters((prev) => ({
            ...prev,
            minPrice: '',
            maxPrice: '',
        }));
    };

    const isPriceDirty =
        priceDraft.minPrice !== filters.minPrice ||
        priceDraft.maxPrice !== filters.maxPrice;

    const openDeleteModal = (service) => {
        setConfirmModal({ isOpen: true, service, loading: false });
    };

    const closeDeleteModal = () => {
        setConfirmModal({ isOpen: false, service: null, loading: false });
    };

    const confirmDelete = async () => {
        if (!confirmModal.service) {
            return;
        }

        setConfirmModal((prev) => ({ ...prev, loading: true }));

        try {
            await axiosClient.delete(`/extra-fees/${confirmModal.service._id}`);
            toast.success('Service archived successfully.');
            await fetchExtraFees(filters);
            closeDeleteModal();
        } catch (err) {
            toast.error(
                'Failed to delete service: ' +
                (err.response?.data?.message || err.message)
            );
            setConfirmModal((prev) => ({ ...prev, loading: false }));
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
                        onClick={() => openDeleteModal(row.original)}
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

                <div className="bg-white border border-gray-100 rounded-sm p-4 sm:p-6 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-2">
                            Property
                        </label>
                        <select
                            name="hotelId"
                            value={filters.hotelId}
                            onChange={handleFilterChange}
                            className="w-full border border-gray-200 text-sm py-2.5 px-3 rounded-sm focus:ring-0 focus:border-gray-900"
                        >
                            <option value="all">All Properties</option>
                            {hotels.map((hotel) => (
                                <option key={hotel._id} value={hotel._id}>
                                    {hotel.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-2">
                            Min Price
                        </label>
                        <input
                            type="number"
                            min="0"
                            name="minPrice"
                            value={priceDraft.minPrice}
                            onChange={handleFilterChange}
                            placeholder="0"
                            className="w-full border border-gray-200 text-sm py-2.5 px-3 rounded-sm focus:ring-0 focus:border-gray-900"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-2">
                            Max Price
                        </label>
                        <input
                            type="number"
                            min="0"
                            name="maxPrice"
                            value={priceDraft.maxPrice}
                            onChange={handleFilterChange}
                            placeholder="No limit"
                            className="w-full border border-gray-200 text-sm py-2.5 px-3 rounded-sm focus:ring-0 focus:border-gray-900"
                        />
                    </div>

                    <div className="md:col-span-3 flex justify-end gap-2 pt-1">
                        <button
                            type="button"
                            onClick={clearPriceFilters}
                            disabled={
                                !priceDraft.minPrice &&
                                !priceDraft.maxPrice &&
                                !filters.minPrice &&
                                !filters.maxPrice
                            }
                            className="px-4 py-2 border border-gray-300 text-gray-700 text-[11px] uppercase tracking-widest rounded-sm hover:border-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Clear Price
                        </button>
                        <button
                            type="button"
                            onClick={applyPriceFilters}
                            disabled={!isPriceDirty}
                            className="px-4 py-2 bg-gray-900 text-white text-[11px] uppercase tracking-widest rounded-sm hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Apply Price
                        </button>
                    </div>
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

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title="Archive Service"
                message={`Archive ${confirmModal.service?.extraName}? Guests will no longer be able to add this service to new bookings.`}
                confirmText="Archive Service"
                onCancel={closeDeleteModal}
                onConfirm={confirmDelete}
                loading={confirmModal.loading}
                variant="danger"
            />
        </div>
    );
};

export default ExtraFeeList;