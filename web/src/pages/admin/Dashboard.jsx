import { useState, useEffect } from 'react';
import axiosClient from '../../services/axiosClient';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
);

const Dashboard = () => {
	const [stats, setStats] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchStats = async () => {
			try {
				setLoading(true);
				const response = await axiosClient.get('/dashboard');
				setStats(response.data);
			} catch (err) {
				setError(err);
			} finally {
				setLoading(false);
			}
		};
		fetchStats();
	}, []);

	if (loading)
		return <div className="text-center py-8">Loading dashboard...</div>;
	if (error)
		return (
			<div className="text-center py-8 text-error">
				Error: {error.message}
			</div>
		);

	const monthlyRevenueData = {
		labels: stats.monthlyRevenue.map(
			(item) => `${item._id.year}-${item._id.month}`,
		),
		datasets: [
			{
				label: 'Monthly Revenue',
				data: stats.monthlyRevenue.map((item) => item.revenue),
				backgroundColor: 'rgba(75, 192, 192, 0.6)',
			},
		],
	};

	const bookingsByStatusData = {
		labels: stats.bookingsByStatus.map((item) => item._id),
		datasets: [
			{
				label: 'Bookings by Status',
				data: stats.bookingsByStatus.map((item) => item.count),
				backgroundColor: [
					'rgba(255, 99, 132, 0.6)',
					'rgba(54, 162, 235, 0.6)',
					'rgba(255, 206, 86, 0.6)',
				],
			},
		],
	};

	return (
		<div>
			<h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
				<div className="card bg-base-100 shadow-xl">
					<div className="card-body">
						<h2 className="card-title">Total Users</h2>
						<p className="text-4xl">{stats.totalUsers}</p>
					</div>
				</div>
				<div className="card bg-base-100 shadow-xl">
					<div className="card-body">
						<h2 className="card-title">Total Hotels</h2>
						<p className="text-4xl">{stats.totalHotels}</p>
					</div>
				</div>
				<div className="card bg-base-100 shadow-xl">
					<div className="card-body">
						<h2 className="card-title">Total Bookings</h2>
						<p className="text-4xl">{stats.totalBookings}</p>
					</div>
				</div>
				<div className="card bg-base-100 shadow-xl">
					<div className="card-body">
						<h2 className="card-title">Total Revenue</h2>
						<p className="text-4xl">
							${stats.totalRevenue.toLocaleString()}
						</p>
					</div>
				</div>
			</div>
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div className="card bg-base-100 shadow-xl">
					<div className="card-body">
						<h2 className="card-title">Monthly Revenue</h2>
						<Bar data={monthlyRevenueData} />
					</div>
				</div>
				<div className="card bg-base-100 shadow-xl">
					<div className="card-body">
						<h2 className="card-title">Bookings by Status</h2>
						<Bar data={bookingsByStatusData} />
					</div>
				</div>
			</div>
		</div>
	);
};

export default Dashboard;
