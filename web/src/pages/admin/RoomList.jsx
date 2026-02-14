import { useState, useEffect } from 'react';
import DataTable from '../../components/common/DataTable';
import axiosClient from '../../services/axiosClient';

const RoomList = () => {
	const [rooms, setRooms] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Mock data for development
	const mockRooms = [
		{
			id: 'R001',
			roomNumber: '101',
			category: 'Deluxe',
			hotel: 'Grand Hotel',
			price: 250,
			capacity: 2,
		},
		{
			id: 'R002',
			roomNumber: '205',
			category: 'Standard',
			hotel: 'City Inn',
			price: 120,
			capacity: 2,
		},
		{
			id: 'R003',
			roomNumber: '301',
			category: 'Suite',
			hotel: 'Grand Hotel',
			price: 500,
			capacity: 4,
		},
		{
			id: 'R004',
			roomNumber: '102',
			category: 'Standard',
			hotel: 'Mountain View Resort',
			price: 150,
			capacity: 3,
		},
	];

	useEffect(() => {
		setRooms(mockRooms);
		setLoading(false);

		// const fetchRooms = async () => {
		//     try {
		//         setLoading(true);
		//         const response = await axiosClient.get('/rooms');
		//         setRooms(response.data);
		//     } catch (err) {
		//         setError(err);
		//     } finally {
		//         setLoading(false);
		//     }
		// };
		// fetchRooms();
	}, []);

	const columns = [
		{ title: 'ID', data: 'id' },
		{ title: 'Room Number', data: 'roomNumber' },
		{ title: 'Category', data: 'category' },
		{ title: 'Hotel', data: 'hotel' },
		{ title: 'Price', data: 'price' },
		{ title: 'Capacity', data: 'capacity' },
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
			<h1 className="text-2xl font-bold mb-4">Room List</h1>
			<DataTable data={rooms} columns={columns} />
		</>
	);
};

export default RoomList;
