import { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import axiosClient from '../../services/axiosClient';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { capitalizeFirstLetter } from '../../utils/helpers';
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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/users');
      setUsers(response.data);
    } catch (err) {
      setError(err);
      toast.error('Failed to load guest directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (
      window.confirm(
        'Are you sure you want to remove this user from the directory? This action cannot be undone.',
      )
    ) {
      try {
        await axiosClient.delete(`/users/${id}`);
        setUsers(users.filter((user) => user._id !== id));
        toast.success('User removed successfully.');
      } catch (err) {
        toast.error(
          'Failed to delete user: ' +
            (err.response?.data?.message || err.message),
        );
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await axiosClient.put(`/users/${id}/toggle-status`);
      fetchUsers();
      toast.success('User access status updated.');
    } catch (err) {
      setError(err);
      toast.error('Failed to update user status.');
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
            className={`text-[10px] uppercase tracking-widest font-medium px-2 py-1 rounded-sm border ${
              role === 'admin'
                ? 'bg-orange-50 border-orange-200 text-orange-800'
                : 'bg-gray-50 border-gray-200 text-gray-600'
            }`}
          >
            {capitalizeFirstLetter(role)}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Access Status',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <button
            onClick={() => handleToggleStatus(row.original._id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-sm transition-colors border text-[10px] uppercase tracking-widest font-medium ${
              status
                ? 'border-gray-200 bg-white hover:bg-gray-50 text-gray-900'
                : 'border-gray-200 bg-gray-50 hover:bg-white text-gray-400'
            }`}
            title="Click to toggle access"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${status ? 'bg-green-500' : 'bg-red-400'}`}
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
            onClick={() => handleDelete(row.original._id)}
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
    <div className="p-6 md:p-8 lg:p-12">
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

        {/* Table Section or Empty State */}
        {users.length === 0 ? (
          <div className="bg-white border border-gray-200 border-dashed rounded-sm py-32 flex flex-col items-center justify-center text-center px-4">
            <UsersIcon
              size={48}
              weight="light"
              className="text-gray-300 mb-6"
            />
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
    </div>
  );
};

export default UserList;
