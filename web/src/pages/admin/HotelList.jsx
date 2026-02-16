import { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import axiosClient from '../../services/axiosClient';

const HotelList = () => {
	const [hotels, setHotels] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchHotels = async () => {
			try {
				setLoading(true);
				const response = await axiosClient.get('/hotels'); // Adjust API endpoint
				setHotels(response);
			} catch (err) {
				setError(err);
			} finally {
				setLoading(false);
			}
		};
		fetchHotels();
	}, []);

	const columns = [
		{ accessorKey: '_id', header: 'ID' },
		{ accessorKey: 'name', header: 'Name' },
		{ accessorKey: 'location', header: 'Location' },
		{ accessorKey: 'rating', header: 'Rating' },
		{ accessorKey: 'roomsAvailable', header: 'Rooms Available' },
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
			<Table data={hotels} columns={columns} />
		</>
	);
};

export default HotelList;
