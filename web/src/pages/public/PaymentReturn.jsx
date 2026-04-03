import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
	CheckCircle,
	CircleNotch,
	House,
	Receipt,
	ShieldCheck,
	Wallet,
	XCircle,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import axiosClient from '../../services/axiosClient';

const PaymentReturn = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const bookingId = searchParams.get('bookingId');
	const gateway = (searchParams.get('gateway') || 'sepay').toLowerCase();

	const [loading, setLoading] = useState(true);
	const [status, setStatus] = useState('processing');
	const [checkout, setCheckout] = useState(null);
	const [amount, setAmount] = useState(null);
	const [isRetrying, setIsRetrying] = useState(false);
	const [isChecking, setIsChecking] = useState(false);

	const hasExecuted = useRef(false);
	const pollerRef = useRef(null);

	const clearPoller = useCallback(() => {
		if (pollerRef.current) {
			clearInterval(pollerRef.current);
			pollerRef.current = null;
		}
	}, []);

	const checkPaymentStatus = useCallback(async (showToast = false) => {
		if (!bookingId) {
			setStatus('fail');
			return 'fail';
		}

		try {
			const response = await axiosClient.get(`/payments/sepay/status/${bookingId}`);
			const paymentStatus = response?.data?.status;
			setAmount(response?.data?.amount ?? null);

			if (paymentStatus === 'confirmed') {
				setStatus('success');
				clearPoller();
				if (showToast) {
					toast.success('Payment confirmed successfully.');
				}
				return 'success';
			}

			if (paymentStatus === 'failed') {
				setStatus('fail');
				clearPoller();
				if (showToast) {
					toast.error('Payment is no longer valid for this booking.');
				}
				return 'fail';
			}

			setStatus('pending');
			if (showToast) {
				toast.info('Payment has not been received yet.');
			}
			return 'pending';
		} catch (error) {
			setStatus('pending');
			if (showToast) {
				toast.error('Unable to check payment status right now.');
			}
			return 'pending';
		}
	}, [bookingId, clearPoller]);

	useEffect(() => {
		if (hasExecuted.current) {
			return () => {};
		}
		hasExecuted.current = true;

		const init = async () => {
			if (!bookingId || gateway !== 'sepay') {
				setStatus('fail');
				setLoading(false);
				return;
			}

			try {
				const checkoutResponse = await axiosClient.get(
					`/payments/sepay/checkout/${bookingId}`,
				);
				setCheckout(checkoutResponse?.data || null);

				const initialStatus = await checkPaymentStatus(false);
				if (initialStatus === 'pending') {
					pollerRef.current = setInterval(() => {
						checkPaymentStatus(false);
					}, 5000);
				}
			} catch (error) {
				setStatus('fail');
				toast.error(error.response?.data?.message || 'Unable to initialize SePay checkout.');
			} finally {
				setLoading(false);
			}
		};

		init();

		return () => {
			clearPoller();
		};
	}, [bookingId, checkPaymentStatus, clearPoller, gateway]);

	const handleRetryPayment = async () => {
		if (!bookingId) {
			toast.error('Booking reference is missing.');
			navigate('/my-bookings');
			return;
		}

		try {
			setIsRetrying(true);
			const response = await axiosClient.post('/payments/sepay/create', {
				bookingId,
				amount: amount || checkout?.amountUsd,
			});

			if (response?.paymentUrl) {
				window.location.href = response.paymentUrl;
				return;
			}

			toast.error('Failed to regenerate payment page.');
		} catch (error) {
			toast.error(error.response?.data?.message || 'Failed to initiate payment');
		} finally {
			setIsRetrying(false);
		}
	};

	const handleManualCheck = async () => {
		setIsChecking(true);
		await checkPaymentStatus(true);
		setIsChecking(false);
	};

	const handleCopy = async (value, label) => {
		if (!value) {
			return;
		}

		try {
			await navigator.clipboard.writeText(String(value));
			toast.success(`${label} copied`);
		} catch (error) {
			toast.error('Copy failed');
		}
	};

	const displayAmount = useMemo(() => {
		if (amount !== null && Number.isFinite(Number(amount))) {
			return Number(amount).toFixed(2);
		}
		if (checkout?.amountUsd !== undefined && checkout?.amountUsd !== null) {
			return Number(checkout.amountUsd).toFixed(2);
		}
		return null;
	}, [amount, checkout]);

	if (loading) {
		return (
			<div className="min-h-screen bg-[#FFFCFA] flex flex-col items-center justify-center gap-6">
				<div className="relative flex items-center justify-center">
					<CircleNotch size={40} weight="light" className="text-orange-800 animate-spin" />
					<ShieldCheck size={16} weight="fill" className="absolute text-orange-800" />
				</div>
				<div className="text-center">
					<p className="text-sm font-serif text-gray-900 mb-1">Preparing your SePay checkout</p>
					<p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">
						Loading payment instructions...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#FFFCFA] pt-24 pb-20 flex flex-col items-center">
			<div className="w-full max-w-3xl px-6 mb-12 flex items-center justify-center gap-4 text-[10px] uppercase tracking-widest font-medium text-gray-400">
				<span>1. Details</span>
				<span className="w-8 h-[1px] bg-gray-200"></span>
				<span>2. Payment</span>
				<span className="w-8 h-[1px] bg-gray-200"></span>
				<span className="text-gray-900 border-b border-gray-900 pb-0.5">3. Confirmation</span>
			</div>

			<div className="w-full max-w-lg px-4 sm:px-6">
				<div className="bg-white border border-gray-100 shadow-2xl shadow-gray-200/50 rounded-sm overflow-hidden">
					<div className="pt-12 pb-8 text-center px-8">
						<div className="flex justify-center mb-6">
							{status === 'success' ? (
								<CheckCircle size={64} weight="light" className="text-green-600" />
							) : status === 'fail' ? (
								<XCircle size={64} weight="light" className="text-red-500" />
							) : (
								<Wallet size={64} weight="light" className="text-orange-800" />
							)}
						</div>

						<h1 className="text-3xl md:text-4xl font-serif text-gray-900 mb-3">
							{status === 'success'
								? 'Reservation Confirmed'
								: status === 'fail'
									? 'Payment Unavailable'
									: 'Awaiting Transfer'}
						</h1>
						<p className="text-sm font-light text-gray-500">
							{status === 'success'
								? 'Your transfer has been verified and your booking is secured.'
								: status === 'fail'
									? 'This payment session is no longer valid. Please start a new payment attempt.'
									: 'Use the QR code below to transfer via your banking app. We will verify automatically.'}
						</p>
					</div>

					<div className="px-8 pb-12">
						{bookingId && (
							<div className="bg-gray-50/60 border border-gray-100 p-6 mb-8 rounded-sm">
								<div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
									<span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
										Reference No.
									</span>
									<span className="text-sm font-serif text-gray-900 tracking-wider">
										{bookingId.substring(0, 8).toUpperCase()}
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
										Amount (USD)
									</span>
									<span className="text-sm font-serif text-gray-900">
										{displayAmount ? `$${displayAmount}` : 'N/A'}
									</span>
								</div>
							</div>
						)}

						{status === 'pending' && checkout && (
							<div className="space-y-5 mb-8">
								<div className="border border-gray-200 rounded-sm p-4 flex justify-center">
									<img
										src={checkout.qrCodeUrl}
										alt="SePay QR"
										className="w-64 h-64 object-contain"
									/>
								</div>
								<div className="space-y-2 text-sm text-gray-700">
									<p>
										<strong>Bank:</strong> {checkout.bankCode}
									</p>
									<p>
										<strong>Account Number:</strong> {checkout.accountNumber}{' '}
										<button
											type="button"
											onClick={() => handleCopy(checkout.accountNumber, 'Account number')}
											className="text-xs text-orange-800 hover:underline"
										>
											Copy
										</button>
									</p>
									<p>
										<strong>Account Name:</strong> {checkout.accountName}
									</p>
									<p>
										<strong>Transfer Content:</strong> {checkout.paymentCode}{' '}
										<button
											type="button"
											onClick={() => handleCopy(checkout.paymentCode, 'Transfer content')}
											className="text-xs text-orange-800 hover:underline"
										>
											Copy
										</button>
									</p>
									<p>
										<strong>Amount (VND):</strong> {Number(checkout.amountVnd || 0).toLocaleString('vi-VN')} VND
									</p>
								</div>
							</div>
						)}

						<div className="space-y-4">
							{status === 'success' ? (
								<button
									onClick={() => navigate('/my-bookings')}
									className="w-full py-4 bg-gray-900 hover:bg-black text-white text-xs tracking-widest uppercase transition-colors rounded-sm flex items-center justify-center gap-2"
								>
									<Receipt size={16} weight="light" /> View Itinerary
								</button>
							) : (
								<>
									<button
										onClick={handleManualCheck}
										disabled={isChecking}
										className="w-full py-4 bg-gray-900 hover:bg-black text-white text-xs tracking-widest uppercase transition-colors rounded-sm flex items-center justify-center gap-2 disabled:opacity-50"
									>
										{isChecking ? (
											<CircleNotch size={16} className="animate-spin" />
										) : (
											<ShieldCheck size={16} weight="light" />
										)}
										I have transferred, check again
									</button>
									<button
										onClick={handleRetryPayment}
										disabled={isRetrying}
										className="w-full py-4 bg-transparent border border-gray-300 text-gray-700 hover:border-gray-900 hover:text-gray-900 text-xs tracking-widest uppercase transition-colors rounded-sm flex items-center justify-center gap-2 disabled:opacity-50"
									>
										{isRetrying ? (
											<CircleNotch size={16} className="animate-spin" />
										) : (
											<Wallet size={16} weight="light" />
										)}
										Retry Payment
									</button>
								</>
							)}

							<button
								onClick={() => navigate('/')}
								className="w-full py-4 bg-transparent border border-gray-300 text-gray-700 hover:border-gray-900 hover:text-gray-900 text-xs tracking-widest uppercase transition-colors rounded-sm flex items-center justify-center gap-2"
							>
								<House size={16} weight="light" /> Return to Homepage
							</button>
						</div>

						<div className="mt-10 text-center flex flex-col items-center justify-center gap-2 border-t border-gray-100 pt-6">
							<ShieldCheck size={20} weight="light" className="text-gray-300" />
							<p className="text-[9px] font-medium text-gray-400 uppercase tracking-[0.2em]">
								Processed securely via SePay Gateway
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default PaymentReturn;
