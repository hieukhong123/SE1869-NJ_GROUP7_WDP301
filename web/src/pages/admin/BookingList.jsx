import { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import axiosClient from '../../services/axiosClient';

const BookingList = () => {
	const [bookings, setBookings] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchBookings = async () => {
			try {
				setLoading(true);
				const response = await axiosClient.get('/bookings'); // Adjust API endpoint
				setBookings(response);
			} catch (err) {
				setError(err);
			} finally {
				setLoading(false);
			}
		};
		fetchBookings();
	}, []);

	const columns = [
		{ accessorKey: '_id', header: 'ID' },
		{ accessorKey: 'userId.fullName', header: 'Guest Name' },
		{ accessorKey: 'hotelId.name', header: 'Hotel' },
		{ accessorKey: 'roomIds', header: 'Rooms',
			cell: ({ row }) => (
				<div>
					{row.original.roomIds.map((room) => (
						<div key={room._id}>{room.roomName}</div>
					))}
				</div>
			)
		},
		{ accessorKey: 'checkIn', header: 'Check-in' },
		{ accessorKey: 'checkOut', header: 'Check-out' },
		{ accessorKey: 'status', header: 'Status' },
		{
			accessorKey: 'actions',
			header: 'Actions',
			cell: ({ row }) => (
				<div className="flex space-x-2">
					<button className="btn btn-sm btn-info">View</button>
					<button className="btn btn-sm btn-warning">Edit</button>
					<button className="btn btn-sm btn-error">Delete</button>
				</div>
			),
		},
	];

	if (loading)
		return (
			<>
				<div className="text-center py-8">Loading bookings...</div>
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
			<h1 className="text-2xl font-bold mb-4">Booking List</h1>
			<Table data={bookings} columns={columns} />
		</>
	);
};

export default BookingList;
