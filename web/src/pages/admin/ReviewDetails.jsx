import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';

const ReviewDetails = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const [review, setReview] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	useEffect(() => {
		if (id) {
			const fetchReview = async () => {
				setLoading(true);
				try {
					const response = await axiosClient.get(`/reviews/${id}`);
					setReview(response.data);
				} catch (err) {
					setError(err);
				} finally {
					setLoading(false);
				}
			};
			fetchReview();
		}
	}, [id]);

	if (loading)
		return <div className="text-center py-8">Loading review data...</div>;
	if (error)
		return (
			<div className="text-center py-8 text-error">
				Error: {error.message}
			</div>
		);

	if (!review) return null;

	return (
		<div className="container mx-auto p-4">
			<h1 className="text-2xl font-bold mb-4">Review Details</h1>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
				<div>
					<label className="label">
						<span className="label-text font-semibold">Hotel</span>
					</label>
					<p className="pl-4">{review.hotelId?.name}</p>
				</div>
				<div>
					<label className="label">
						<span className="label-text font-semibold">User</span>
					</label>
					<p className="pl-4">{review.userId?.fullName}</p>
				</div>
				<div className="col-span-2">
					<label className="label">
						<span className="label-text font-semibold">Rating</span>
					</label>
					<div className="rating pl-4">
						{[...Array(5)].map((_, i) => (
							<span
								key={i}
								className={`mask mask-star-2 ${
									i < review.rating
										? 'bg-yellow-400'
										: 'bg-gray-300'
								}`}
							></span>
						))}
					</div>
				</div>
				<div className="col-span-2">
					<label className="label">
						<span className="label-text font-semibold">Review</span>
					</label>
					<p className="pl-4 whitespace-pre-wrap">
						{review.reviewText}
					</p>
				</div>
			</div>
			<div className="flex justify-end mt-6">
				<button
					type="button"
					className="btn btn-ghost"
					onClick={() => navigate('/admin/reviews')}
				>
					Back
				</button>
			</div>
		</div>
	);
};

export default ReviewDetails;
