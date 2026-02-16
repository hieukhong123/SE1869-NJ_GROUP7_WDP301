import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Table from '../../components/common/Table';
import axiosClient from '../../services/axiosClient';
import { toast } from 'sonner';
import { capitalizeFirstLetter } from '../../utils/helpers';

const RoomList = () => {
	const [rooms, setRooms] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const navigate = useNavigate();

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
		if (window.confirm('Are you sure you want to delete this room?')) {
			try {
				await axiosClient.delete(`/rooms/${roomId}`);
				toast.success('Room deleted successfully!');
				fetchRooms(); // Refresh the list
			} catch (err) {
				toast.error('Failed to delete room: ' + (err.response?.data?.message || err.message));
			}
		}
	};

	const handleToggleStatus = async (roomId) => {
		try {
			await axiosClient.put(`/rooms/${roomId}/toggleStatus`);
			toast.success('Room status updated successfully!');
			fetchRooms(); // Refresh the list
		} catch (err) {
			toast.error('Failed to toggle room status: ' + (err.response?.data?.message || err.message));
		}
	};

	const columns = [
		{ accessorKey: 'hotelId.name', header: 'Hotel', cell: info => info.getValue()},
		{ accessorKey: 'roomName', header: 'Room Name' },
		{ accessorKey: 'roomPrice', header: 'Room Price' },
		{ accessorKey: 'maxOccupancy', header: 'Max Occupancy' },
		{ accessorKey: 'quantity', header: 'Quantity' },
		{
			accessorKey: 'status',
			header: 'Status',
			cell: ({ row }) => {
				const status = row.original.status;
				const badgeClass =
					status === 'available' ? 'badge-success' : 'badge-error';
				return (
					<button
						onClick={() => handleToggleStatus(row.original._id)}
						className={`badge ${badgeClass} btn btn-sm`}
					>
						{capitalizeFirstLetter(status)}
					</button>
				);
			},
		},
		{
			accessorKey: 'actions',
			header: 'Actions',
			cell: ({ row }) => (
				<div className="flex space-x-2">
					<Link to={`/admin/rooms/${row.original._id}/edit`} className="btn btn-sm btn-warning">
						Edit
					</Link>
					<button onClick={() => handleDelete(row.original._id)} className="btn btn-sm btn-error">
						Delete
					</button>
				</div>
			),
		},
	];

	if (loading)
		return (
			<>
				<div className="text-center py-8">Loading rooms...</div>
			</>
		);
	if (error)
		return (
			<>
				<div className="text-center py-8 text-error">
					Error: {error.message}
				</div>
			</>
		);

	return (
		<>
			<div className="flex justify-between items-center mb-4">
				<h1 className="text-2xl font-bold">Room List</h1>
				<Link to="/admin/rooms/new" className="btn btn-primary">
					Create New Room
				</Link>
			</div>
			<Table data={rooms} columns={columns} />
		</>
	);
};

export default RoomList;
