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
  XIcon,
} from '@phosphor-icons/react';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await axiosClient.delete(`/users/${userToDelete._id}`);
      setUsers(users.filter((u) => u._id !== userToDelete._id));
      toast.success('User removed successfully.');
      setDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (err) {
      toast.error(
        'Failed to delete user: ' +
          (err.response?.data?.message || err.message),
      );
    } finally {
      setIsDeleting(false);
    }
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
      accessorKey: 'status',
      header: 'Access Status',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <button
            onClick={() => handleToggleStatus(row.original._id)}
            className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-sm transition-colors border text-[10px] uppercase tracking-widest font-medium w-28 ${
              status
                ? 'border-green-100 bg-green-50 hover:bg-green-100 text-green-700'
                : 'border-red-100 bg-red-50 hover:bg-red-100 text-red-700'
            }`}
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
            onClick={() => handleDeleteClick(row.original)}
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

      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-sm shadow-2xl p-8 animate-fade-in">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <TrashIcon size={20} weight="light" className="text-black-600" />
                <h3 className="text-xl font-serif text-gray-900">Remove User</h3>
              </div>
              <button 
                onClick={() => { setDeleteModalOpen(false); setUserToDelete(null); }} 
                className="text-gray-400 hover:text-gray-900 transition-colors"
              >
                <XIcon size={20} weight="light" />
              </button>
            </div>
            
            <p className="text-sm font-light text-gray-500 mb-8 leading-relaxed">
              Are you sure you want to remove <strong className="font-medium text-gray-900">{userToDelete?.fullName || userToDelete?.userName}</strong> from the directory? This action cannot be undone.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setUserToDelete(null);
                }}
                disabled={isDeleting}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 text-xs uppercase tracking-widest hover:border-gray-900 transition-colors rounded-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-6 py-2.5 bg-black text-white text-xs uppercase tracking-widest hover:bg-red-700 transition-colors rounded-sm flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? <CircleNotchIcon size={14} className="animate-spin" /> : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;