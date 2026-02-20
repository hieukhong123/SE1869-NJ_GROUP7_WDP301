import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';

const UserForm = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const [user, setUser] = useState({
		userName: '',
		email: '',
		password: '',
		fullName: '',
		role: 'user',
		status: true,
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	useEffect(() => {
		if (id) {
			const fetchUser = async () => {
				setLoading(true);
				try {
					const response = await axiosClient.get(`/users/${id}`);
					setUser(response.data);
				} catch (err) {
					setError(err);
				} finally {
					setLoading(false);
				}
			};
			fetchUser();
		}
	}, [id]);

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;
		setUser({
			...user,
			[name]: type === 'checkbox' ? checked : value,
		});
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		try {
			if (id) {
				await axiosClient.put(`/users/${id}`, user);
			} else {
				await axiosClient.post('/users', user);
			}
			navigate('/admin/users');
		} catch (err) {
			setError(err);
		} finally {
			setLoading(false);
		}
	};

	if (loading && id)
		return <div className="text-center py-8">Loading user data...</div>;
	if (error)
		return (
			<div className="text-center py-8 text-error">
				Error: {error.message}
			</div>
		);

	return (
		<div className="container mx-auto p-4">
			<h1 className="text-2xl font-bold mb-4">
				{id ? 'Edit User' : 'Add User'}
			</h1>
			<form onSubmit={handleSubmit} className="form-control gap-4">
				<div className="mb-4">
					<label className="label">
						<span className="label-text">Username</span>
					</label>
					<input
						type="text"
						name="userName"
						value={user.userName}
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
						name="email"
						value={user.email}
						onChange={handleChange}
						className="input input-bordered w-full"
						required
					/>
				</div>
				{!id && (
					<div className="mb-4">
						<label className="label">
							<span className="label-text">Password</span>
						</label>
						<input
							type="password"
							name="password"
							value={user.password}
							onChange={handleChange}
							className="input input-bordered w-full"
							required
						/>
					</div>
				)}
				<div className="mb-4">
					<label className="label">
						<span className="label-text">Full Name</span>
					</label>
					<input
						type="text"
						name="fullName"
						value={user.fullName}
						onChange={handleChange}
						className="input input-bordered w-full"
					/>
				</div>
				<div className="mb-4">
					<label className="label">
						<span className="label-text">Role</span>
					</label>
					<select
						name="role"
						value={user.role}
						onChange={handleChange}
						className="select select-bordered w-full"
					>
						<option value="user">User</option>
						<option value="admin">Admin</option>
					</select>
				</div>
				<div className="form-control mb-4">
					<label className="label cursor-pointer">
						<span className="label-text">Status</span>
						<input
							type="checkbox"
							name="status"
							checked={user.status}
							onChange={handleChange}
							className="toggle toggle-primary"
						/>
					</label>
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
						onClick={() => navigate('/admin/users')}
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	);
};

export default UserForm;
