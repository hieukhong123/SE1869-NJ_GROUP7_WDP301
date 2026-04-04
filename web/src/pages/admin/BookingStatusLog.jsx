import { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import axiosClient from '../../services/axiosClient';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import {
  CircleNotchIcon,
  CalendarCheckIcon,
  ArrowRightIcon,
  ArrowClockwiseIcon,
  EyeIcon,
} from '@phosphor-icons/react';

const BookingStatusLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState([]);
  const [actors, setActors] = useState([]);
  const [filters, setFilters] = useState({
    hotelId: 'all',
    actorId: 'all',
  });

  const fetchLogs = async (activeFilters = filters) => {
    try {
      setLoading(true);
      const params = {};
      if (activeFilters.hotelId !== 'all') {
        params.hotelId = activeFilters.hotelId;
      }
      if (activeFilters.actorId !== 'all') {
        params.actorId = activeFilters.actorId;
      }

      const response = await axiosClient.get('/bookings/logs/booking-status', {
        params,
      });
      setLogs(response.data);
    } catch (err) {
      toast.error('Failed to load booking logs.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterData = async () => {
    try {
      const [hotelResponse, userResponse] = await Promise.all([
        axiosClient.get('/hotels/admin-all'),
        axiosClient.get('/users/staff-admins'),
      ]);

      setHotels(hotelResponse.data || []);
      setActors(
        (userResponse.data || []).filter((user) =>
          ['admin', 'staff'].includes(user.role),
        ),
      );
    } catch (err) {
      setHotels([]);
      setActors([]);
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    fetchFilterData();
  }, []);

  useEffect(() => {
    fetchLogs(filters);
  }, [filters]);

  const columns = [
    {
      header: 'Reservation',
      cell: ({ row }) => {
        const booking = row.original.bookingId;
        return (
          <div>
            <span className="font-medium text-gray-900 block">
              {booking?.userId?.fullName || booking?.name || 'Guest'}
            </span>
            <span className="text-[11px] text-gray-500 block">
              {booking?.userId?.email || booking?.email || '-'}
            </span>
          </div>
        );
      },
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
      header: 'Stay Period',
      cell: ({ row }) => {
        const booking = row.original.bookingId;

        if (!booking?.checkIn || !booking?.checkOut) {
          return <span className="text-gray-400">-</span>;
        }

        const checkIn = new Date(booking.checkIn).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        const checkOut = new Date(booking.checkOut).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });

        return (
          <span className="text-sm text-gray-700">
            {checkIn} <span className="text-gray-400">→</span> {checkOut}
          </span>
        );
      },
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
    {
      header: 'Details',
      enableSorting: false,
      enableGlobalFilter: false,
      cell: ({ row }) => {
        const bookingId = row.original.bookingId?._id;

        if (!bookingId) {
          return <span className="text-gray-400 text-xs">Unavailable</span>;
        }

        return (
          <Link
            to={`/admin/bookings/${bookingId}/view`}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] uppercase tracking-widest border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-900 rounded-sm transition-colors"
          >
            <EyeIcon size={12} /> View
          </Link>
        );
      },
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
            Audit trail of manual booking confirmations
          </p>
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
              Confirmed By
            </label>
            <select
              name="actorId"
              value={filters.actorId}
              onChange={handleFilterChange}
              className="w-full border border-gray-200 text-sm py-2.5 px-3 rounded-sm focus:ring-0 focus:border-gray-900"
            >
              <option value="all">All Admin/Staff</option>
              {actors.map((actor) => (
                <option key={actor._id} value={actor._id}>
                  {actor.fullName || actor.userName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => fetchLogs(filters)}
              className="w-full md:w-auto px-4 py-2.5 border border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-900 rounded-sm text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
            >
              <ArrowClockwiseIcon size={14} /> Refresh
            </button>
          </div>
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
