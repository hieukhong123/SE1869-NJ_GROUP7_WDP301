import { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import axiosClient from '../../services/axiosClient';
import { toast } from 'sonner';
import {
  CircleNotchIcon,
  CalendarCheckIcon,
  ArrowRightIcon,
} from '@phosphor-icons/react';

const BookingStatusLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/bookings/logs/booking-status');
      setLogs(response.data);
    } catch (err) {
      toast.error('Failed to load booking logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const columns = [
    {
      accessorKey: 'bookingId._id',
      header: 'Booking ID',
      cell: (info) => (
        <span className="text-[10px] text-gray-400 uppercase tracking-widest">
          {info.getValue()?.substring(0, 12)}...
        </span>
      ),
    },
    {
      accessorKey: 'bookingId.hotelId.name',
      header: 'Hotel',
      cell: (info) => (
        <span className="font-medium text-gray-900">
          {info.getValue() || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Status Change',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <span className="px-2 py-1 text-[10px] uppercase tracking-widest font-medium border rounded-sm bg-blue-50 text-blue-700 border-blue-100">
            {row.original.oldStatus}
          </span>
          <ArrowRightIcon size={14} className="text-gray-300" />
          <span className="px-2 py-1 text-[10px] uppercase tracking-widest font-medium border rounded-sm bg-green-50 text-green-700 border-green-100">
            {row.original.newStatus}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'staffId.fullName',
      header: 'Confirmed By',
      cell: (info) => (
        <span className="text-gray-700 font-medium">{info.getValue()}</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Time',
      cell: (info) => (
        <span className="text-gray-500 text-xs">
          {new Date(info.getValue()).toLocaleString()}
        </span>
      ),
    },
  ];

  if (loading)
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <CircleNotchIcon
          size={32}
          weight="light"
          className="text-orange-800 animate-spin"
        />
        <p className="text-gray-500 font-light text-sm tracking-widest uppercase">
          Loading logs...
        </p>
      </div>
    );

  return (
    <div className="p-6 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 pb-6 border-b border-gray-200">
          <h1 className="text-3xl md:text-4xl font-serif text-gray-900 mb-2">
            Booking Status Logs
          </h1>
          <p className="text-xs font-light text-gray-500 uppercase tracking-[0.2em]">
            Audit trail of manual booking confirmations (Paid to Confirmed)
          </p>
        </div>

        {logs.length === 0 ? (
          <div className="bg-white border border-gray-200 border-dashed rounded-sm py-32 flex flex-col items-center justify-center text-center px-4">
            <CalendarCheckIcon
              size={48}
              weight="light"
              className="text-gray-300 mb-6"
            />
            <h3 className="text-xl font-serif text-gray-900 mb-2">
              No Status Logs
            </h3>
          </div>
        ) : (
          <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
            <Table data={logs} columns={columns} />
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingStatusLog;
