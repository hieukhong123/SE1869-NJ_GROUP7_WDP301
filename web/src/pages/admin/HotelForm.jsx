import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';
import { toast } from 'sonner';

const HotelForm = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const [hotel, setHotel] = useState({
		name: '',
		address: '',
		city: '',
		hotelPhone: '',
		hotelEmail: '',
		description: '',
		photos: [],
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [selectedFile, setSelectedFile] = useState(null);
	const [isUploading, setIsUploading] = useState(false);


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

	const handleFileChange = (e) => {
		setSelectedFile(e.target.files[0]);
	};

	const handleUpload = async () => {
		if (!selectedFile) {
			toast.error('Please select a file to upload.');
			return;
		}

		setIsUploading(true);
		const formData = new FormData();
		formData.append('image', selectedFile);

		try {
			const response = await axiosClient.post('/upload', formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			});
			setHotel((prevData) => ({
				...prevData,
				photos: [...(prevData.photos || []), response.data.url],
			}));
			setSelectedFile(null);
			toast.success('Image uploaded successfully!');
		} catch (err) {
			toast.error(
				'Image upload failed: ' +
					(err.response?.data?.message || err.message),
			);
		} finally {
			setIsUploading(false);
		}
	};

	const handleRemovePhoto = (index) => {
		setHotel((prevData) => ({
			...prevData,
			photos: prevData.photos.filter((_, i) => i !== index),
		}));
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
						<span className="label-text">City</span>
					</label>
					<input
						type="text"
						name="city"
						value={hotel.city || ''}
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
				
				{/* Photo Upload */}
				<div className="mb-4">
					<label className="label">
						<span className="label-text">Hotel Images</span>
					</label>
					<input
						type="file"
						className="file-input file-input-bordered w-full mb-2"
						onChange={handleFileChange}
					/>
					<button
						type="button"
						onClick={handleUpload}
						className="btn btn-secondary w-full"
						disabled={!selectedFile || isUploading}
					>
						{isUploading ? 'Uploading...' : 'Upload Image'}
					</button>
					{hotel.photos && hotel.photos.length > 0 && (
						<div className="mt-4 grid grid-cols-3 gap-4">
							{hotel.photos.map((photo, index) => (
								<div key={index} className="relative">
									<img
										src={photo}
										alt={`Hotel ${index + 1}`}
										className="w-full h-32 object-cover rounded-lg shadow-md"
									/>
									<button
										type="button"
										onClick={() => handleRemovePhoto(index)}
										className="btn btn-xs btn-error absolute top-2 right-2"
									>
										×
									</button>
								</div>
							))}
						</div>
					)}
				</div>
				
				<div className="flex gap-2 mt-4">
					<button
						type="submit"
						className="btn btn-primary"
						disabled={loading || isUploading}
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
