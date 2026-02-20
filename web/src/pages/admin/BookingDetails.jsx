import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';
import { capitalizeFirstLetter } from '../../utils/helpers';

const BookingDetails = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const [booking, setBooking] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	useEffect(() => {
		if (id) {
			const fetchBooking = async () => {
				setLoading(true);
				try {
					const response = await axiosClient.get(`/bookings/${id}`);
					setBooking(response.data);
				} catch (err) {
					setError(err);
				} finally {
					setLoading(false);
				}
			};
			fetchBooking();
		}
	}, [id]);

	if (loading)
		return <div className="text-center py-8">Loading booking data...</div>;
	if (error)
		return (
			<div className="text-center py-8 text-error">
				Error: {error.message}
			</div>
		);

	if (!booking) return null;

	const getStatusBadgeClass = (status) => {
		switch (status) {
			case 'confirmed':
				return 'badge-success';
			case 'pending':
				return 'badge-warning';
			case 'cancelled':
				return 'badge-error';
			default:
				return 'badge-ghost';
		}
	};

	return (
		<div className="container mx-auto p-4">
			<h1 className="text-2xl font-bold mb-4">Booking Details</h1>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
				<div>
					<label className="label">
						<span className="label-text font-semibold">
							Guest Name
						</span>
					</label>
					<p className="pl-4">{booking.userId?.fullName}</p>
				</div>
				<div>
					<label className="label">
						<span className="label-text font-semibold">Hotel</span>
					</label>
					<p className="pl-4">{booking.hotelId?.name}</p>
				</div>
				<div>
					<label className="label">
						<span className="label-text font-semibold">
							Check-in
						</span>
					</label>
					<p className="pl-4">
						{new Date(booking.checkIn).toDateString()}
					</p>
				</div>
				<div>
					<label className="label">
						<span className="label-text font-semibold">
							Check-out
						</span>
					</label>
					<p className="pl-4">
						{new Date(booking.checkOut).toDateString()}
					</p>
				</div>
				<div>
					<label className="label">
						<span className="label-text font-semibold">
							Total Amount
						</span>
					</label>
					<p className="pl-4 font-bold text-lg text-primary">
						${booking.totalAmount}
					</p>
				</div>
				<div>
					<label className="label">
						<span className="label-text font-semibold">Status</span>
					</label>
					<div className="pl-4">
						<span
							className={`badge ${getStatusBadgeClass(
								booking.status,
							)}`}
						>
							{capitalizeFirstLetter(booking.status)}
						</span>
					</div>
				</div>
				<div className="divider md:col-span-2"></div>
				<div className="md:col-span-1">
					<label className="label">
						<span className="label-text font-semibold">Rooms</span>
					</label>
					{booking.roomIds && booking.roomIds.length > 0 ? (
						<ul className="list-disc pl-8">
							{booking.roomIds.map((room) => (
								<li key={room._id}>{room.roomName}</li>
							))}
						</ul>
					) : (
						<p className="pl-4">None</p>
					)}
				</div>
				<div className="md:col-span-1">
					<label className="label">
						<span className="label-text font-semibold">
							Extra Services
						</span>
					</label>
					{booking.extraIds && booking.extraIds.length > 0 ? (
						<ul className="list-disc pl-8">
							{booking.extraIds.map((extra) => (
								<li key={extra._id}>{extra.extraName}</li>
							))}
						</ul>
					) : (
						<p className="pl-4">None</p>
					)}
				</div>
			</div>
			<div className="flex justify-end mt-6">
				<button
					type="button"
					className="btn btn-ghost"
					onClick={() => navigate('/admin/bookings')}
				>
					Back
				</button>
			</div>
		</div>
	);
};

export default BookingDetails;
