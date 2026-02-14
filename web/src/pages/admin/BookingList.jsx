import { useState, useEffect } from 'react';
import DataTable from '../../components/common/DataTable';
import axiosClient from '../../services/axiosClient';

const BookingList = () => {
	const [bookings, setBookings] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Mock data for development
	const mockBookings = [
		{
			id: 'B001',
			guestName: 'Alice Smith',
			hotel: 'Grand Hotel',
			room: 'Deluxe Suite',
			checkIn: '2024-03-01',
			checkOut: '2024-03-05',
			status: 'Confirmed',
		},
		{
			id: 'B002',
			guestName: 'Bob Johnson',
			hotel: 'City Inn',
			room: 'Standard Room',
			checkIn: '2024-03-10',
			checkOut: '2024-03-12',
			status: 'Pending',
		},
		{
			id: 'B003',
			guestName: 'Charlie Brown',
			hotel: 'Grand Hotel',
			room: 'Standard Room',
			checkIn: '2024-03-15',
			checkOut: '2024-03-20',
			status: 'Cancelled',
		},
	];

	useEffect(() => {
		setBookings(mockBookings);
		setLoading(false);

		// const fetchBookings = async () => {
		//     try {
		//         setLoading(true);
		//         const response = await axiosClient.get('/bookings'); // Adjust API endpoint
		//         setBookings(response.data);
		//     } catch (err) {
		//         setError(err);
		//     } finally {
		//         setLoading(false);
		//     }
		// };
		// fetchBookings();
	}, []);

	const columns = [
		{ title: 'ID', data: 'id' },
		{ title: 'Guest Name', data: 'guestName' },
		{ title: 'Hotel', data: 'hotel' },
		{ title: 'Room', data: 'room' },
		{ title: 'Check-in', data: 'checkIn' },
		{ title: 'Check-out', data: 'checkOut' },
		{ title: 'Status', data: 'status' },
		{
			title: 'Actions',
			data: null,
			render: function (data, type, row) {
				return `
                    <div class="flex space-x-2">
                        <button class="btn btn-sm btn-info">View</button>
                        <button class="btn btn-sm btn-warning">Edit</button>
                        <button class="btn btn-sm btn-error">Delete</button>
                    </div>
                `;
			},
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
			<DataTable data={bookings} columns={columns} />
		</>
	);
};

export default BookingList;
