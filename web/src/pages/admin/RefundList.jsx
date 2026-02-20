import { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import axiosClient from '../../services/axiosClient';

const RefundList = () => {
	const [refunds, setRefunds] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchRefunds = async () => {
			try {
				setLoading(true);
				const response = await axiosClient.get('/refunds');
				setRefunds(response);
			} catch (err) {
				setError(err);
			} finally {
				setLoading(false);
			}
		};
		fetchRefunds();
	}, []);

	const columns = [
		{ accessorKey: 'paymentId.bookingId.hotelId.name', header: 'Hotel' },
		{ accessorKey: 'paymentId.bookingId.userId.fullName', header: 'User' },
		{ accessorKey: 'paymentId.amount', header: 'Amount' },
		{ accessorKey: 'bankName', header: 'Bank Name' },
		{ accessorKey: 'bankNumber', header: 'Bank Number' },
		{ accessorKey: 'reasons', header: 'Reasons' },
	];

	if (loading)
		return <div className="text-center py-8">Loading refunds...</div>;
	if (error)
		return (
			<div className="text-center py-8 text-error">
				Error: {error.message}
			</div>
		);

	return (
		<div>
			<div className="flex justify-between items-center mb-4">
				<h1 className="text-2xl font-bold">Refund List</h1>
			</div>
			<Table data={refunds} columns={columns} />
		</div>
	);
};

export default RefundList;
