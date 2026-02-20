import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';

const HotelForm = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const [hotel, setHotel] = useState({
		name: '',
		address: '',
		hotelPhone: '',
		hotelEmail: '',
		description: '',
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	useEffect(() => {
		if (id) {
			const fetchHotel = async () => {
				setLoading(true);
				try {
					const response = await axiosClient.get(`/hotels/${id}`);
					setHotel(response.data);
				} catch (err) {
					setError(err);
				} finally {
					setLoading(false);
				}
			};
			fetchHotel();
		}
	}, [id]);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setHotel({
			...hotel,
			[name]: value,
		});
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		try {
			if (id) {
				await axiosClient.put(`/hotels/${id}`, hotel);
			} else {
				await axiosClient.post('/hotels', hotel);
			}
			navigate('/admin/hotels');
		} catch (err) {
			setError(err);
		} finally {
			setLoading(false);
		}
	};

	if (loading && id)
		return <div className="text-center py-8">Loading hotel data...</div>;
	if (error)
		return (
			<div className="text-center py-8 text-error">
				Error: {error.message}
			</div>
		);

	return (
		<div className="container mx-auto p-4">
			<h1 className="text-2xl font-bold mb-4">
				{id ? 'Edit Hotel' : 'Add Hotel'}
			</h1>
			<form onSubmit={handleSubmit} className="form-control gap-4">
				<div className="mb-4">
					<label className="label">
						<span className="label-text">Name</span>
					</label>
					<input
						type="text"
						name="name"
						value={hotel.name}
						onChange={handleChange}
						className="input input-bordered w-full"
						required
					/>
				</div>
				<div className="mb-4">
					<label className="label">
						<span className="label-text">Address</span>
					</label>
					<input
						type="text"
						name="address"
						value={hotel.address}
						onChange={handleChange}
						className="input input-bordered w-full"
						required
					/>
				</div>
				<div className="mb-4">
					<label className="label">
						<span className="label-text">Phone</span>
					</label>
					<input
						type="text"
						name="hotelPhone"
						value={hotel.hotelPhone}
						onChange={handleChange}
						className="input input-bordered w-full"
						required
					/>
				</div>
				<div className="mb-4">
					<label className="label">
						<span className="label-text">Email</span>
					</label>
					<input
						type="email"
						name="hotelEmail"
						value={hotel.hotelEmail}
						onChange={handleChange}
						className="input input-bordered w-full"
						required
					/>
				</div>
				<div className="mb-4">
					<label className="label">
						<span className="label-text">Description</span>
					</label>
					<textarea
						name="description"
						value={hotel.description}
						onChange={handleChange}
						className="textarea textarea-bordered w-full"
					></textarea>
				</div>
				<div className="flex gap-2 mt-4">
					<button
						type="submit"
						className="btn btn-primary"
						disabled={loading}
					>
						{loading ? 'Saving...' : 'Save'}
					</button>
					<button
						type="button"
						className="btn btn-ghost"
						onClick={() => navigate('/admin/hotels')}
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	);
};

export default HotelForm;
