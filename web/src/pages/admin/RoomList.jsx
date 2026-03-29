import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Table from '../../components/common/Table';
import axiosClient from '../../services/axiosClient';
import { toast } from 'sonner';
import { capitalizeFirstLetter } from '../../utils/helpers';
import {
  PencilSimpleIcon,
  TrashIcon,
  PlusIcon,
  CircleNotchIcon,
  BedIcon,
} from '@phosphor-icons/react';

const RoomList = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    if (
      window.confirm(
        'Are you sure you want to remove this room from the portfolio?',
      )
    ) {
      try {
        await axiosClient.delete(`/rooms/${roomId}`);
        toast.success('Room removed successfully.');
        fetchRooms();
      } catch (err) {
        toast.error(
          'Failed to delete room: ' +
            (err.response?.data?.message || err.message),
        );
      }
    }
  };

  const handleToggleStatus = async (roomId) => {
    try {
      await axiosClient.put(`/rooms/${roomId}/toggleStatus`);
      toast.success('Room status updated.');
      fetchRooms();
    } catch (err) {
      toast.error(
        'Failed to update status: ' +
          (err.response?.data?.message || err.message),
      );
    }
  };

  const columns = [
    {
      accessorKey: 'hotelId.name',
      header: 'Property',
      cell: ({ row }) => {
        const hotel = row.original.hotelId;
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
      cell: (info) => (
        <span className="text-gray-500 font-light">
          {info.getValue()} Guests
        </span>
      ),
    },
    {
      accessorKey: 'quantity',
      header: 'Units',
      cell: (info) => (
        <span className="text-gray-500 font-light">{info.getValue()}</span>
      ),
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
            className={`text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-sm transition-all duration-300 border ${
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
        <div className="flex items-center gap-1">
          <Link
            to={`/admin/rooms/${row.original._id}/edit`}
            className="p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-50"
            title="Edit Room Details"
          >
            <PencilSimpleIcon size={18} weight="light" />
          </Link>
          <button
            onClick={() => handleDelete(row.original._id)}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
            title="Remove Room"
          >
            <TrashIcon size={18} weight="light" />
          </button>
        </div>
      ),
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
              Room Portfolio
            </h1>
            <p className="text-xs font-light text-gray-500 uppercase tracking-[0.2em]">
              Manage Property Accommodations
            </p>
          </div>
          <Link
            to="/admin/rooms/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-black text-white text-xs tracking-widest uppercase transition-colors rounded-sm"
          >
            <PlusIcon size={16} weight="light" />
            <span>Add Room</span>
          </Link>
        </div>

        {rooms.length === 0 ? (
          <div className="bg-white border border-gray-200 border-dashed rounded-sm py-32 flex flex-col items-center justify-center text-center px-4">
            <BedIcon size={48} weight="light" className="text-gray-300 mb-6" />
            <h3 className="text-xl font-serif text-gray-900 mb-2">
              No Accommodations Found
            </h3>
            <p className="text-gray-500 font-light max-w-md mx-auto mb-8">
              Your portfolio is currently empty. Start by adding your first room
              or suite to the system.
            </p>
            <Link
              to="/admin/rooms/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-transparent border border-gray-300 hover:border-gray-900 text-gray-900 text-xs tracking-widest uppercase transition-colors rounded-sm"
            >
              Create First Room
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
            <Table data={rooms} columns={columns} />
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomList;
