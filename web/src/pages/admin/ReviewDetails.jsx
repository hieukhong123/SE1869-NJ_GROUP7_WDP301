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
					setReview(response);
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
			<div className="form-control gap-4">
				<div className="mb-4">
					<label className="label">
						<span className="label-text">Hotel</span>
					</label>
					<p>{review.hotelId?.name}</p>
				</div>
				<div className="mb-4">
					<label className="label">
						<span className="label-text">User</span>
					</label>
					<p>{review.userId?.fullName}</p>
				</div>
				<div className="mb-4">
					<label className="label">
						<span className="label-text">Rating</span>
					</label>
					<div className="rating">
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
				<div className="mb-4">
					<label className="label">
						<span className="label-text">Review</span>
					</label>
					<p>{review.reviewText}</p>
				</div>
			</div>
			<div className="flex justify-end mt-4">
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
