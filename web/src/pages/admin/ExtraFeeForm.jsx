import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';

const ExtraFeeForm = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const [extraFee, setExtraFee] = useState({
		extraName: '',
		extraPrice: '',
		hotelId: '',
	});
	const [hotels, setHotels] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchHotels = async () => {
			try {
				const response = await axiosClient.get('/hotels');
				setHotels(response.data);
			} catch (err) {
				console.error('Failed to fetch hotels:', err);
			}
		};
		fetchHotels();
	}, []);

	useEffect(() => {
		if (id) {
			const fetchExtraFee = async () => {
				setLoading(true);
				try {
					const response = await axiosClient.get(`/extra-fees/${id}`);
					setExtraFee(response);
				} catch (err) {
					setError(err);
				} finally {
					setLoading(false);
				}
			};
			fetchExtraFee();
		}
	}, [id]);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setExtraFee({
			...extraFee,
			[name]: value,
		});
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		try {
			if (id) {
				await axiosClient.put(`/extra-fees/${id}`, extraFee);
			} else {
				await axiosClient.post('/extra-fees', extraFee);
			}
			navigate('/admin/extra-fees');
		} catch (err) {
			setError(err);
		} finally {
			setLoading(false);
		}
	};

	if (loading && id)
		return (
			<div className="text-center py-8">Loading extra fee data...</div>
		);
	if (error)
		return (
			<div className="text-center py-8 text-error">
				Error: {error.message}
			</div>
		);

	return (
		<div className="container mx-auto p-4">
			<h1 className="text-2xl font-bold mb-4">
				{id ? 'Edit Extra Fee' : 'Add Extra Fee'}
			</h1>
			<form onSubmit={handleSubmit} className="form-control gap-4">
				<div className="mb-4">
					<label className="label">
						<span className="label-text">Name</span>
					</label>
					<input
						type="text"
						name="extraName"
						value={extraFee.extraName}
						onChange={handleChange}
						className="input input-bordered w-full"
						required
					/>
				</div>
				<div className="mb-4">
					<label className="label">
						<span className="label-text">Price</span>
					</label>
					<input
						type="text"
						name="extraPrice"
						value={extraFee.extraPrice}
						onChange={handleChange}
						className="input input-bordered w-full"
						required
					/>
				</div>
				<div className="mb-4">
					<label className="label">
						<span className="label-text">Hotel</span>
					</label>
					<select
						name="hotelId"
						value={extraFee.hotelId}
						onChange={handleChange}
						className="select select-bordered w-full"
						required
					>
						<option value="" disabled>
							Select a Hotel
						</option>
						{hotels.map((hotel) => (
							<option key={hotel._id} value={hotel._id}>
								{hotel.name}
							</option>
						))}
					</select>
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
						onClick={() => navigate('/admin/extra-fees')}
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	);
};

export default ExtraFeeForm;
