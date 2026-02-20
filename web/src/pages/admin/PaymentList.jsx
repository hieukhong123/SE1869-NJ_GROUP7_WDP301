import { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import axiosClient from '../../services/axiosClient';
import { CheckCircle, XCircle } from '@phosphor-icons/react';
import { capitalizeFirstLetter } from '../../utils/helpers';

const PaymentList = () => {
	const [payments, setPayments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchPayments = async () => {
			try {
				setLoading(true);
				const response = await axiosClient.get('/payments');
				setPayments(response);
			} catch (err) {
				setError(err);
			} finally {
				setLoading(false);
			}
		};
		fetchPayments();
	}, []);

	const columns = [
		{ accessorKey: 'bookingId.hotelId.name', header: 'Hotel' },
		{ accessorKey: 'bookingId.userId.fullName', header: 'User' },
		{ accessorKey: 'amount', header: 'Amount' },
		{
			accessorKey: 'paymentDate',
			header: 'Date',
			cell: ({ row }) =>
				new Date(row.original.paymentDate).toLocaleDateString(),
		},
		{
			accessorKey: 'status',
			header: 'Status',
			cell: ({ row }) => {
				const status = row.original.status;
				let badgeClass = '';
				switch (status) {
					case 'confirmed':
						badgeClass = 'badge-success';
						break;
					case 'pending':
						badgeClass = 'badge-warning';
						break;
					case 'cancel':
						badgeClass = 'badge-error';
						break;
					default:
						badgeClass = 'badge-ghost';
				}
				return (
					<div className="flex justify-center">
						<span className={`badge ${badgeClass}`}>
							{capitalizeFirstLetter(status)}
						</span>
					</div>
				);
			},
		},
		{
			accessorKey: 'isRefund',
			header: 'Refunded',
			cell: ({ row }) => (
				<div className="flex justify-center">
					{row.original.isRefund ? (
						<CheckCircle size={24} className="text-success" />
					) : (
						<XCircle size={24} className="text-error" />
					)}
				</div>
			),
		},
	];

	if (loading)
		return <div className="text-center py-8">Loading payments...</div>;
	if (error)
		return (
			<div className="text-center py-8 text-error">
				Error: {error.message}
			</div>
		);

	return (
		<div>
			<div className="flex justify-between items-center mb-4">
				<h1 className="text-2xl font-bold">Payment List</h1>
			</div>
			<Table data={payments} columns={columns} />
		</div>
	);
};

export default PaymentList;
