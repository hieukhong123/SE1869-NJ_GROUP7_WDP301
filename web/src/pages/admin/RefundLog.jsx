import { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import axiosClient from '../../services/axiosClient';
import { toast } from 'sonner';
import {
  CircleNotchIcon,
  ReceiptIcon,
  EyeIcon,
  ArrowClockwiseIcon,
} from '@phosphor-icons/react';

const RefundLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImg, setSelectedImg] = useState('');
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

      const response = await axiosClient.get('/bookings/logs/refund', { params });
      setLogs(response.data);
    } catch (err) {
      toast.error('Failed to load refund logs.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterData = async () => {
    try {
      const [hotelResponse, userResponse] = await Promise.all([
        axiosClient.get('/hotels/admin-all'),
        axiosClient.get('/users'),
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
      accessorKey: 'bookingId.hotelId.name',
      header: 'Hotel',
      cell: (info) => (
        <span className="font-medium text-gray-900">
          {info.getValue() || 'N/A'}
        </span>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: (info) => (
        <span className="text-gray-900">
          ${info.getValue()?.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'reason',
      header: 'Reason',
      cell: (info) => (
        <span className="text-gray-600 font-light italic truncate max-w-xs block">
          {info.getValue()}
        </span>
      ),
    },
    {
      accessorKey: 'staffId.fullName',
      header: 'Staff',
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
      accessorKey: 'transfer_img',
      header: 'Proof',
      cell: (info) => (
        <button
          onClick={() => {
            setSelectedImg(info.getValue());
            setShowImageModal(true);
          }}
          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
        >
          <EyeIcon size={18} weight="light" />
        </button>
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
            Refund History
          </h1>
          <p className="text-xs font-light text-gray-500 uppercase tracking-[0.2em]">
            Audit trail of booking refunds
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
              Performed By
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
            <ReceiptIcon
              size={48}
              weight="light"
              className="text-gray-300 mb-6"
            />
            <h3 className="text-xl font-serif text-gray-900 mb-2">
              No Refund Logs
            </h3>
          </div>
        ) : (
          <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
            <Table data={logs} columns={columns} />
          </div>
        )}

        {showImageModal && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-100 flex items-center justify-center p-4"
            onClick={() => setShowImageModal(false)}
          >
            <div className="max-w-3xl w-full flex flex-col items-center gap-4">
              <img
                src={selectedImg}
                alt="Refund proof"
                className="max-w-full max-h-[80vh] object-contain shadow-2xl"
              />
              <p className="text-white text-xs tracking-widest uppercase font-light">
                Click anywhere to close
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RefundLog;
