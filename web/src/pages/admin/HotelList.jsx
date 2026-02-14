import { useState, useEffect } from 'react';
import DataTable from '../../components/common/DataTable';
import axiosClient from '../../services/axiosClient';

const HotelList = () => {
	const [hotels, setHotels] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Mock data for development
	const mockHotels = [
		{
			id: 'H001',
			name: 'Grand Hotel',
			location: 'New York',
			rating: 5,
			roomsAvailable: 120,
		},
		{
			id: 'H002',
			name: 'City Inn',
			location: 'Los Angeles',
			rating: 4,
			roomsAvailable: 80,
		},
		{
			id: 'H003',
			name: 'Mountain View Resort',
			location: 'Colorado',
			rating: 4,
			roomsAvailable: 50,
		},
	];

	useEffect(() => {
		setHotels(mockHotels);
		setLoading(false);

		// const fetchHotels = async () => {
		//     try {
		//         setLoading(true);
		//         const response = await axiosClient.get('/hotels'); // Adjust API endpoint
		//         setHotels(response.data);
		//     } catch (err) {
		//         setError(err);
		//     } finally {
		//         setLoading(false);
		//     }
		// };
		// fetchHotels();
	}, []);

	const columns = [
		{ title: 'ID', data: 'id' },
		{ title: 'Name', data: 'name' },
		{ title: 'Location', data: 'location' },
		{ title: 'Rating', data: 'rating' },
		{ title: 'Rooms Available', data: 'roomsAvailable' },
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
				<div className="text-center py-8">Loading hotels...</div>
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
			<h1 className="text-2xl font-bold mb-4">Hotel List</h1>
			<DataTable data={hotels} columns={columns} />
		</>
	);
};

export default HotelList;
