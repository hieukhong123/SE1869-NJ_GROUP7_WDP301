import { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import axiosClient from '../../services/axiosClient';
import { Link } from 'react-router-dom';

const ReviewList = () => {
	const [reviews, setReviews] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchReviews = async () => {
			try {
				setLoading(true);
				const response = await axiosClient.get('/reviews');
				setReviews(response);
			} catch (err) {
				setError(err);
			} finally {
				setLoading(false);
			}
		};
		fetchReviews();
	}, []);

	const handleDelete = async (id) => {
		if (window.confirm('Are you sure you want to delete this review?')) {
			try {
				await axiosClient.delete(`/reviews/${id}`);
				setReviews(reviews.filter((review) => review._id !== id));
			} catch (err) {
				setError(err);
			}
		}
	};

	const columns = [
		{ accessorKey: 'hotelId.name', header: 'Hotel' },
		{ accessorKey: 'userId.fullName', header: 'User' },
		{ accessorKey: 'rating', header: 'Rating' },
		{ accessorKey: 'reviewText', header: 'Review' },
		{
			accessorKey: 'actions',
			header: 'Actions',
			cell: ({ row }) => (
				<div className="flex space-x-2">
					<Link
						to={`/admin/reviews/${row.original._id}/view`}
						className="btn btn-sm btn-info"
					>
						View
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
		return <div className="text-center py-8">Loading reviews...</div>;
	if (error)
		return (
			<div className="text-center py-8 text-error">
				Error: {error.message}
			</div>
		);

	return (
		<div>
			<div className="flex justify-between items-center mb-4">
			        <h1 className="text-2xl font-bold">Review List</h1>
			      </div>
			<Table data={reviews} columns={columns} />
		</div>
	);
};

export default ReviewList;
