import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';
import { toast } from 'sonner';

const RoomForm = () => {
	const { id } = useParams(); // For edit mode
	const navigate = useNavigate();

	const [roomData, setRoomData] = useState({
		roomName: '',
		roomPrice: 0,
		maxOccupancy: 0,
		quantity: 0,
		hotelId: '',
		description: '',
		photo: '',
		status: 'available', // Added status field
	});
	const [hotels, setHotels] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [selectedFile, setSelectedFile] = useState(null);
	const [isUploading, setIsUploading] = useState(false);

	// Fetch hotels for dropdown
	useEffect(() => {
		const fetchHotels = async () => {
			try {
				const response = await axiosClient.get('/hotels');
				setHotels(response.data);
			} catch (err) {
				toast.error('Failed to load hotels.');
				setError(err);
			}
		};
		fetchHotels();
	}, []);

	// Fetch room data if in edit mode
	useEffect(() => {
		if (id) {
			const fetchRoom = async () => {
				try {
					setLoading(true);
					const response = await axiosClient.get(`/rooms/${id}`);
					setRoomData(response.data);
				} catch (err) {
					toast.error('Failed to load room data.');
					setError(err);
				} finally {
					setLoading(false);
				}
			};
			fetchRoom();
		}
	}, [id]);

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;
		setRoomData((prevData) => ({
			...prevData,
			[name]:
				type === 'checkbox'
					? checked
						? 'available'
						: 'unavailable'
					: name === 'roomPrice' ||
					  name === 'maxOccupancy' ||
					  name === 'quantity'
					? Number(value)
					: value,
		}));
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
			setRoomData((prevData) => ({
				...prevData,
				photo: response.url,
			}));
			toast.success('Image uploaded successfully!');
		} catch (err) {
			toast.error('Image upload failed: ' + (err.response?.data?.message || err.message));
			setError(err);
		} finally {
			setIsUploading(false);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		try {
			if (id) {
				// Update room
				await axiosClient.put(`/rooms/${id}`, roomData);
				toast.success('Room updated successfully!');
			} else {
				// Create room
				await axiosClient.post('/rooms', roomData);
				toast.success('Room created successfully!');
			}
			navigate('/admin/rooms'); // Redirect to room list
		} catch (err) {
			toast.error('Operation failed: ' + (err.response?.data?.message || err.message));
			setError(err);
		} finally {
			setLoading(false);
		}
	};

	if (loading && id) {
		return <div className="text-center py-8">Loading room data...</div>;
	}
	if (error && id) {
		return <div className="text-center py-8 text-error">Error: {error.message}</div>;
	}

	return (
		<div className="container mx-auto p-4">
			<h1 className="text-2xl font-bold mb-4">{id ? 'Edit Room' : 'Create New Room'}</h1>
			<form onSubmit={handleSubmit} className="form-control gap-4">
				{/* Hotel Dropdown */}
				<div className="mb-4">
					<label className="label">
						<span className="label-text">Hotel</span>
					</label>
					<select
						name="hotelId"
						value={roomData.hotelId}
						onChange={handleChange}
						className="select select-bordered w-full"
						required
					>
						<option value="" disabled>Select a Hotel</option>
						{hotels.map((hotel) => (
							<option key={hotel._id} value={hotel._id}>
								{hotel.name}
							</option>
						))}
					</select>
				</div>

				{/* Room Name */}
				<div className="mb-4">
					<label className="label">
						<span className="label-text">Room Name</span>
					</label>
					<input
						type="text"
						name="roomName"
						value={roomData.roomName}
						onChange={handleChange}
						placeholder="Deluxe King"
						className="input input-bordered w-full"
						required
					/>
				</div>

				{/* Room Price */}
				<div className="mb-4">
					<label className="label">
						<span className="label-text">Room Price</span>
					</label>
					<input
						type="number"
						name="roomPrice"
						value={roomData.roomPrice}
						onChange={handleChange}
						placeholder="100"
						className="input input-bordered w-full"
						required
						min="1"
					/>
				</div>

				{/* Max Occupancy */}
				<div className="mb-4">
					<label className="label">
						<span className="label-text">Max Occupancy</span>
					</label>
					<input
						type="number"
						name="maxOccupancy"
						value={roomData.maxOccupancy}
						onChange={handleChange}
						placeholder="2"
						className="input input-bordered w-full"
						required
						min="1"
					/>
				</div>

				{/* Quantity */}
				<div className="mb-4">
					<label className="label">
						<span className="label-text">Quantity</span>
					</label>
					<input
						type="number"
						name="quantity"
						value={roomData.quantity}
						onChange={handleChange}
						placeholder="1"
						className="input input-bordered w-full"
						required
						min="0"
					/>
				</div>

				{/* Description */}
				<div className="mb-4">
					<label className="label">
						<span className="label-text">Description</span>
					</label>
					<textarea
						name="description"
						value={roomData.description}
						onChange={handleChange}
						placeholder="Brief description of the room"
						className="textarea textarea-bordered w-full"
					></textarea>
				</div>

				{/* Photo Upload */}
				<div className="mb-4">
					<label className="label">
						<span className="label-text">Room Image</span>
					</label>
					<input
						type="file"
						className="file-input file-input-bordered w-full mb-2"
						onChange={handleFileChange}
					/>
					<button
						type="button"
						onClick={handleUpload}
						className="btn btn-primary w-full"
						disabled={!selectedFile || isUploading}
					>
						{isUploading ? 'Uploading...' : 'Upload Image'}
					</button>
					{roomData.photo && (
						<div className="mt-4">
							<img
								src={roomData.photo}
								alt="Room"
								className="max-w-xs h-auto rounded-lg shadow-md"
							/>
							<p className="text-sm text-gray-500 mt-2">
								{roomData.photo.split('/').pop()}
							</p>
						</div>
					)}
				</div>

				{/* Status Toggle */}
				<div className="form-control mb-4">
					<label className="label cursor-pointer">
						<span className="label-text">Available</span>
						<input
							type="checkbox"
							name="status"
							className="toggle toggle-primary"
							checked={roomData.status === 'available'}
							onChange={handleChange}
						/>
					</label>
				</div>

				<div className="flex gap-2 mt-4">
					<button type="submit" className="btn btn-primary" disabled={loading || isUploading}>
						{loading ? 'Saving...' : (id ? 'Update Room' : 'Create Room')}
					</button>
					<button type="button" className="btn btn-ghost" onClick={() => navigate('/admin/rooms')} disabled={loading || isUploading}>
						Cancel
					</button>
				</div>
			</form>
		</div>
	);
};

export default RoomForm;
