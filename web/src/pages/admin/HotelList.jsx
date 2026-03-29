import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Table from '../../components/common/Table';
import axiosClient from '../../services/axiosClient';
import { toast } from 'sonner';
import {
  PencilSimpleIcon,
  PlusIcon,
  CircleNotchIcon,
  BuildingsIcon,
  CaretDownIcon,
} from '@phosphor-icons/react';

const HotelList = () => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isStaff = user?.role === 'staff';
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

  const handleStatusChange = async (id, newStatus) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await axiosClient.put(`/hotels/${id}/status`, {
        status: newStatus,
        staffId: user._id,
      });
      toast.success(`Hotel status updated to ${newStatus}.`);
      fetchHotels();
    } catch (err) {
      toast.error(
        'Failed to update hotel status: ' +
          (err.response?.data?.message || err.message),
      );
    }
  };

  const columns = [
    {
      accessorKey: 'name',
      header: 'Hotel Name',
      cell: (info) => (
        <span className="font-medium text-gray-900">{info.getValue()}</span>
      ),
    },
    {
      accessorKey: 'address',
      header: 'Address',
      cell: (info) => (
        <span className="text-gray-500 font-light line-clamp-1 max-w-xs">
          {info.getValue()}
        </span>
      ),
    },
    {
      accessorKey: 'hotelPhone',
      header: 'Contact',
      cell: (info) => (
        <span className="text-gray-600 font-light">
          {info.getValue() || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'hotelEmail',
      header: 'Email',
      cell: (info) => (
        <span className="text-gray-600 font-light">
          {info.getValue() || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status || 'active';
        const id = row.original._id;

        let dotColor = 'bg-green-500';
        let selectStyles = 'border-green-200 bg-green-50 text-green-700 hover:border-green-300';
        
        if (status === 'inactive') {
            dotColor = 'bg-red-500';
            selectStyles = 'border-red-100 bg-red-50 text-red-700 hover:border-red-200';
        }
        if (status === 'suspended') {
            dotColor = 'bg-orange-500';
            selectStyles = 'border-orange-200 bg-orange-50 text-orange-800 hover:border-orange-300';
        }

        return (
          <div className="relative inline-flex items-center group">
            <div className={`absolute left-2.5 w-1.5 h-1.5 rounded-full ${dotColor} pointer-events-none`}></div>
            <select
              className={`appearance-none pl-6 pr-8 py-1.5 rounded-sm border text-[10px] uppercase tracking-widest font-medium cursor-pointer focus:ring-0 outline-none transition-colors ${selectStyles}`}
              value={status}
              onChange={(e) => handleStatusChange(id, e.target.value)}
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
            <CaretDownIcon
              size={12}
              weight="bold"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity"
            />
          </div>
        );
      },
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      enableGlobalFilter: false,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Link
            to={`/admin/hotels/${row.original._id}/edit`}
            className="p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-50"
            title="Edit Hotel Details"
          >
            <PencilSimpleIcon size={18} weight="light" />
          </Link>
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
    <div className="p-6 md:p-8 lg:p-12 relative">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 pb-6 border-b border-gray-200 gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif text-gray-900 mb-2">
              Hotel Portfolio
            </h1>
            <p className="text-xs font-light text-gray-500 uppercase tracking-[0.2em]">
              Manage your collection of properties
            </p>
          </div>
          {!isStaff && (
            <Link 
                to="/admin/hotels/new" 
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 hover:bg-black text-white text-xs tracking-widest uppercase transition-colors rounded-sm"
            >
                <PlusIcon size={16} weight="light" />
                <span>Add Hotel</span>
            </Link>
          )}
        </div>

        {hotels.length === 0 ? (
          <div className="bg-white border border-gray-200 border-dashed rounded-sm py-32 flex flex-col items-center justify-center text-center px-4">
            <BuildingsIcon
              size={48}
              weight="light"
              className="text-gray-300 mb-6"
            />
            <h3 className="text-xl font-serif text-gray-900 mb-2">
              No Hotels Found
            </h3>
            <p className="text-gray-500 font-light max-w-md mx-auto mb-8">
              Your portfolio is currently empty. Start building your collection
              by adding a new hotel.
            </p>
            {!isStaff && (
                <Link 
                    to="/admin/hotels/new" 
                    className="inline-flex items-center gap-2 px-6 py-3 bg-transparent border border-gray-300 hover:border-gray-900 text-gray-900 text-xs tracking-widest uppercase transition-colors rounded-sm"
                >
                    Create First Hotel
                </Link>
            )}
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