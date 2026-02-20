import { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import axiosClient from '../../services/axiosClient';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { capitalizeFirstLetter } from '../../utils/helpers';

const UserList = () => {
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const fetchUsers = async () => {
		try {
			setLoading(true);
			const response = await axiosClient.get('/users');
			setUsers(response);
		} catch (err) {
			setError(err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchUsers();
	}, []);

	const handleDelete = async (id) => {
		if (window.confirm('Are you sure you want to delete this user?')) {
			try {
				await axiosClient.delete(`/users/${id}`);
				setUsers(users.filter((user) => user._id !== id));
				toast.success('User deleted successfully');
			} catch (err) {
				setError(err);
				toast.error('Failed to delete user');
			}
		}
	};

	const handleToggleStatus = async (id) => {
		try {
			await axiosClient.put(`/users/${id}/toggle-status`);
			fetchUsers();
			toast.success('User status updated');
		} catch (err) {
			setError(err);
			toast.error('Failed to update user status');
		}
	};

	const columns = [
		{ accessorKey: 'userName', header: 'Username' },
		{ accessorKey: 'email', header: 'Email' },
		{ accessorKey: 'fullName', header: 'Full Name' },
		{
			accessorKey: 'role',
			header: 'Role',
			cell: ({ row }) => capitalizeFirstLetter(row.original.role),
		},
		{
			accessorKey: 'status',
			header: 'Status',
			cell: ({ row }) => {
				const status = row.original.status;
				const badgeClass = status ? 'badge-success' : 'badge-error';
				return (
					<div className="flex justify-center">
						<button
							onClick={() => handleToggleStatus(row.original._id)}
							className={`badge ${badgeClass} btn btn-sm`}
						>
							{status ? 'Active' : 'Inactive'}
						</button>
					</div>
				);
			},
		},
		{
			accessorKey: 'actions',
			header: 'Actions',
			cell: ({ row }) => (
				<div className="flex space-x-2">
					<Link
						to={`/admin/users/${row.original._id}/edit`}
						className="btn btn-sm btn-warning"
					>
						Edit
					</Link>
					<button
						onClick={() => handleDelete(row.original._id)}
						className="btn btn-sm btn-error"
					>
						Delete
					</button>
				</div>
			),
		},
	];

	if (loading)
		return <div className="text-center py-8">Loading users...</div>;
	if (error)
		return (
			<div className="text-center py-8 text-error">
				Error: {error.message}
			</div>
		);

	return (
		<div>
			<div className="flex justify-between items-center mb-4">
				<h1 className="text-2xl font-bold">User List</h1>
				<Link to="/admin/users/new" className="btn btn-primary">
					Add User
				</Link>
			</div>
			<Table data={users} columns={columns} />
		</div>
	);
};

export default UserList;

