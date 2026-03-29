import { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import axiosClient from '../../services/axiosClient';
import { toast } from 'sonner';
import { capitalizeFirstLetter } from '../../utils/helpers';
import { CircleNotchIcon, CreditCardIcon } from '@phosphor-icons/react';

const PaymentList = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/payments');
      setPayments(response.data);
    } catch (err) {
      setError(err);
      toast.error('Failed to load payment transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

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
