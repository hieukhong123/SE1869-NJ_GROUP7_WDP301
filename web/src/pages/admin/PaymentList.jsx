import { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import axiosClient from '../../services/axiosClient';
import { toast } from 'sonner';
import { capitalizeFirstLetter } from '../../utils/helpers';
import { CircleNotchIcon, CreditCardIcon } from '@phosphor-icons/react';

const PaymentList = () => {
  const [payments, setPayments] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    hotelId: 'all',
    status: 'all',
    startDate: '',
    endDate: '',
    minPrice: '',
    maxPrice: '',
  });
  const [amountDraft, setAmountDraft] = useState({
    minPrice: '',
    maxPrice: '',
  });

  const fetchPayments = async (activeFilters = filters) => {
    try {
      setLoading(true);
      const params = {};
      if (activeFilters.hotelId !== 'all') {
        params.hotelId = activeFilters.hotelId;
      }
      if (activeFilters.status !== 'all') {
        params.status = activeFilters.status;
      }
      if (activeFilters.startDate) {
        params.startDate = activeFilters.startDate;
      }
      if (activeFilters.endDate) {
        params.endDate = activeFilters.endDate;
      }
      if (activeFilters.minPrice !== '') {
        params.minPrice = activeFilters.minPrice;
      }
      if (activeFilters.maxPrice !== '') {
        params.maxPrice = activeFilters.maxPrice;
      }

      const response = await axiosClient.get('/payments', { params });
      setPayments(response.data);
    } catch (err) {
      setError(err);
      toast.error('Failed to load payment transactions.');
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
    fetchPayments(filters);
  }, [filters]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    if (name === 'minPrice' || name === 'maxPrice') {
      setAmountDraft((prev) => ({ ...prev, [name]: value }));
      return;
    }

    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyAmountFilters = () => {
    setFilters((prev) => ({
      ...prev,
      minPrice: amountDraft.minPrice,
      maxPrice: amountDraft.maxPrice,
    }));
  };

  const clearAmountFilters = () => {
    setAmountDraft({ minPrice: '', maxPrice: '' });
    setFilters((prev) => ({
      ...prev,
      minPrice: '',
      maxPrice: '',
    }));
  };

  const isAmountDirty =
    amountDraft.minPrice !== filters.minPrice ||
    amountDraft.maxPrice !== filters.maxPrice;

  const columns = [
    {
      accessorKey: 'bookingId.hotelId.name',
      header: 'Property',
      cell: ({ row }) => {
        const hotel = row.original.bookingId?.hotelId;
        return (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">
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
      accessorFn: (row) => row.bookingId?.hotelId?.name || '-',
    },
    {
      accessorKey: 'bookingId.userId.fullName',
      header: 'Guest Name',
      cell: (info) => (
        <div>
          <span className="text-gray-900 block">{info.getValue() || '-'}</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-widest">
            {info.row.original._id.substring(0, 8)}
          </span>
        </div>
      ),
      accessorFn: (row) => row.bookingId?.userId?.fullName || '-',
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: (info) => (
        <span className="font-serif text-gray-900 tracking-wide">
          ${Number(info.getValue())?.toLocaleString() || '0'}
        </span>
      ),
    },
    {
      accessorKey: 'paymentDate',
      header: 'Transaction Date',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm text-gray-900">
            {new Date(row.original.paymentDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <span className="text-[10px] text-gray-400">
            {new Date(row.original.paymentDate).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        let styles = '';

        switch (status) {
          case 'confirmed':
            styles = 'bg-green-50 text-green-700 border-green-200';
            break;
          case 'pending':
            styles = 'bg-orange-50 text-orange-800 border-orange-200';
            break;
          case 'cancel':
          case 'cancelled':
            styles = 'bg-gray-50 text-gray-500 border-gray-200';
            break;
          default:
            styles = 'bg-gray-100 text-gray-600 border-gray-200';
        }

        return (
          <span
            className={`inline-block px-3 py-1.5 text-[10px] uppercase tracking-widest font-medium border rounded-sm ${styles}`}
          >
            {status === 'cancel' ? 'Cancelled' : capitalizeFirstLetter(status)}
          </span>
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
          Loading Transactions...
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
              Transaction Ledger
            </h1>
            <p className="text-xs font-light text-gray-500 uppercase tracking-[0.2em]">
              Monitor Guest Payments
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-sm p-4 sm:p-6 mb-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
              Status
            </label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full border border-gray-200 text-sm py-2.5 px-3 rounded-sm focus:ring-0 focus:border-gray-900"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancel">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-2">
              Date From
            </label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full border border-gray-200 text-sm py-2.5 px-3 rounded-sm focus:ring-0 focus:border-gray-900"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-2">
              Date To
            </label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full border border-gray-200 text-sm py-2.5 px-3 rounded-sm focus:ring-0 focus:border-gray-900"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-2">
              Min Amount
            </label>
            <input
              type="number"
              min="0"
              name="minPrice"
              value={amountDraft.minPrice}
              onChange={handleFilterChange}
              className="w-full border border-gray-200 text-sm py-2.5 px-3 rounded-sm focus:ring-0 focus:border-gray-900"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-2">
              Max Amount
            </label>
            <input
              type="number"
              min="0"
              name="maxPrice"
              value={amountDraft.maxPrice}
              onChange={handleFilterChange}
              className="w-full border border-gray-200 text-sm py-2.5 px-3 rounded-sm focus:ring-0 focus:border-gray-900"
            />
          </div>

          <div className="md:col-span-2 xl:col-span-3 flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={clearAmountFilters}
              disabled={
                !amountDraft.minPrice &&
                !amountDraft.maxPrice &&
                !filters.minPrice &&
                !filters.maxPrice
              }
              className="px-4 py-2 border border-gray-300 text-gray-700 text-[11px] uppercase tracking-widest rounded-sm hover:border-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Clear Amount
            </button>
            <button
              type="button"
              onClick={applyAmountFilters}
              disabled={!isAmountDirty}
              className="px-4 py-2 bg-gray-900 text-white text-[11px] uppercase tracking-widest rounded-sm hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Apply Amount
            </button>
          </div>
        </div>

        {/* Table Section or Empty State */}
        {payments.length === 0 ? (
          <div className="bg-white border border-gray-200 border-dashed rounded-sm py-32 flex flex-col items-center justify-center text-center px-4">
            <CreditCardIcon
              size={48}
              weight="light"
              className="text-gray-300 mb-6"
            />
            <h3 className="text-xl font-serif text-gray-900 mb-2">
              No Transactions Found
            </h3>
            <p className="text-gray-500 font-light max-w-md mx-auto">
              There are currently no payment records in the system.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
            <Table data={payments} columns={columns} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentList;
