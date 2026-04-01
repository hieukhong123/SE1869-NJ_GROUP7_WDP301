import { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import axiosClient from '../../services/axiosClient';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { capitalizeFirstLetter } from '../../utils/helpers';
import ConfirmModal from '../../components/common/ConfirmModal';
import {
  PencilSimpleIcon,
  TrashIcon,
  PlusIcon,
  CircleNotchIcon,
  UsersIcon,
} from '@phosphor-icons/react';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [filters, setFilters] = useState({ role: 'all', hotelId: 'all' });

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    user: null,
    loading: false,
  });

  const fetchUsers = async (activeFilters = filters) => {
    try {
      setLoading(true);
      const params = {};
      if (activeFilters.role !== 'all') {
        params.role = activeFilters.role;
      }
      if (activeFilters.hotelId !== 'all') {
        params.hotelId = activeFilters.hotelId;
      }

      const response = await axiosClient.get('/users', { params });
      setUsers(response.data);
    } catch (err) {
      setError(err);
      toast.error('Failed to load guest directory.');
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
    fetchUsers(filters);
  }, [filters]);

  const openDeleteModal = (user) => {
    setConfirmModal({
      isOpen: true,
      type: 'delete',
      user,
      loading: false,
    });
  };

  const openStatusModal = (user) => {
    if (user.role === 'admin') {
      toast.error('Admin status cannot be changed.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      type: 'status',
      user,
      loading: false,
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      type: null,
      user: null,
      loading: false,
    });
  };

  const confirmAction = async () => {
    if (!confirmModal.user) {
      return;
    }

    setConfirmModal((prev) => ({ ...prev, loading: true }));

    try {
      if (confirmModal.type === 'status') {
        await axiosClient.put(`/users/${confirmModal.user._id}/toggle-status`);
        toast.success('User access status updated.');
      }

      if (confirmModal.type === 'delete') {
        await axiosClient.delete(`/users/${confirmModal.user._id}`);
        toast.success('User removed successfully.');
      }

      await fetchUsers(filters);
      closeConfirmModal();
    } catch (err) {
      setError(err);
      if (confirmModal.type === 'status') {
        toast.error(
          'Failed to update user status: ' +
            (err.response?.data?.message || err.message),
        );
      } else {
        toast.error(
          'Failed to delete user: ' +
            (err.response?.data?.message || err.message),
        );
      }
      setConfirmModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const getRoleStyles = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-orange-50 border-orange-100 text-orange-800';
      case 'staff':
        return 'bg-blue-50 border-blue-100 text-blue-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };

  const columns = [
    {
      accessorKey: 'fullName',
      header: 'Full Name',
      cell: (info) => (
        <div>
          <span className="font-medium text-gray-900 block">
            {info.getValue() || 'Not Provided'}
          </span>
          <span className="text-[10px] text-gray-400 uppercase tracking-widest">
            {info.row.original.userName}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email Address',
      cell: (info) => (
        <span className="text-gray-600 font-light">{info.getValue()}</span>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.original.role;
        return (
          <span
            className={`text-[10px] uppercase tracking-widest font-medium px-2.5 py-1 rounded-sm border ${getRoleStyles(
              role,
            )}`}
          >
            {capitalizeFirstLetter(role)}
          </span>
        );
      },
    },
    {
      accessorKey: 'hotelId.name',
      header: 'Managed Property',
      accessorFn: (row) => row.hotelId?.name || '-',
      cell: ({ row }) => (
        <span className="text-gray-500 font-light">
          {row.original.role === 'staff' ? row.original.hotelId?.name || '-' : 'N/A'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Access Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const isAdmin = row.original.role === 'admin';

        return (
          <button
            onClick={() => openStatusModal(row.original)}
            disabled={isAdmin}
            className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-sm transition-colors border text-[10px] uppercase tracking-widest font-medium w-28 ${
              status
                ? 'border-green-100 bg-green-50 hover:bg-green-100 text-green-700'
                : 'border-red-100 bg-red-50 hover:bg-red-100 text-red-700'
            } ${isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={status ? 'Click to suspend user' : 'Click to activate user'}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                status ? 'bg-green-500' : 'bg-red-500'
              }`}
            ></span>
            {status ? 'Active' : 'Suspended'}
          </button>
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
            to={`/admin/users/${row.original._id}/edit`}
            className="p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-50"
            title="Edit User Details"
          >
            <PencilSimpleIcon size={18} weight="light" />
          </Link>
          <button
            onClick={() => openDeleteModal(row.original)}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
            title="Remove User"
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
          Loading Directory...
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
              User Directory
            </h1>
            <p className="text-xs font-light text-gray-500 uppercase tracking-[0.2em]">
              Manage System Users & Guests
            </p>
          </div>
          <Link
            to="/admin/users/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-black text-white text-xs tracking-widest uppercase transition-colors rounded-sm"
          >
            <PlusIcon size={16} weight="light" />
            Add User
          </Link>
        </div>

        <div className="bg-white border border-gray-100 rounded-sm p-4 sm:p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-2">
              Filter By Role
            </label>
            <select
              name="role"
              value={filters.role}
              onChange={handleFilterChange}
              className="w-full border border-gray-200 text-sm py-2.5 px-3 rounded-sm focus:ring-0 focus:border-gray-900"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="user">User</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-2">
              Filter By Hotel
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
        </div>

        {/* Table Section or Empty State */}
        {users.length === 0 ? (
          <div className="bg-white border border-gray-200 border-dashed rounded-sm py-32 flex flex-col items-center justify-center text-center px-4">
            <UsersIcon size={48} weight="light" className="text-gray-300 mb-6" />
            <h3 className="text-xl font-serif text-gray-900 mb-2">
              Directory is Empty
            </h3>
            <p className="text-gray-500 font-light max-w-md mx-auto mb-8">
              There are currently no users registered in the system.
            </p>
            <Link
              to="/admin/users/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-transparent border border-gray-300 hover:border-gray-900 text-gray-900 text-xs tracking-widest uppercase transition-colors rounded-sm"
            >
              Create First User
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
            <Table data={users} columns={columns} />
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={
          confirmModal.type === 'delete'
            ? 'Remove User'
            : 'Update User Status'
        }
        message={
          confirmModal.type === 'delete'
            ? `Are you sure you want to remove ${confirmModal.user?.fullName || confirmModal.user?.userName}? This action cannot be undone.`
            : `Are you sure you want to ${confirmModal.user?.status ? 'suspend' : 'activate'} ${confirmModal.user?.fullName || confirmModal.user?.userName}?`
        }
        confirmText={
          confirmModal.type === 'delete' ? 'Delete User' : 'Confirm Status'
        }
        onCancel={closeConfirmModal}
        onConfirm={confirmAction}
        loading={confirmModal.loading}
        variant={confirmModal.type === 'delete' ? 'danger' : 'warning'}
      />
    </div>
  );
};

export default UserList;