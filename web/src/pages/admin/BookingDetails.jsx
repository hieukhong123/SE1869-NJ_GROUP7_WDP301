import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axiosClient from '../../services/axiosClient';
import { capitalizeFirstLetter } from '../../utils/helpers';
import ConfirmModal from '../../components/common/ConfirmModal';
import { 
    CaretLeft, 
    CircleNotch, 
    User, 
    Buildings, 
    CalendarCheck, 
    Door, 
    Sparkle,
    CheckCircle,
    Clock,
    XCircle,
    Receipt,
    WarningCircle
} from '@phosphor-icons/react';

const BookingDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Admin Action Modals State
    const [acceptModalOpen, setAcceptModalOpen] = useState(false);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [processingAdminAction, setProcessingAdminAction] = useState(false);
    const [refundTransferImg, setRefundTransferImg] = useState('');
    const [refundApproveStep, setRefundApproveStep] = useState(1);
    const [uploadingRefundProof, setUploadingRefundProof] = useState(false);
    const [refundPreviewMeta, setRefundPreviewMeta] = useState({
        referenceNo: '',
        timestamp: '',
    });
    const [processingStatusAction, setProcessingStatusAction] = useState(false);
    const [statusModal, setStatusModal] = useState({
        isOpen: false,
        nextStatus: null,
        title: '',
        message: '',
        confirmText: 'Confirm',
        variant: 'default',
    });

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

    useEffect(() => {
        if (id) {
            fetchBooking();
        }
    }, [id]);

    const handleStatusChange = async (id, newStatus) => {
        try {
            await axiosClient.put(`/bookings/${id}`, { status: newStatus });
            toast.success(`Booking status updated to ${capitalizeFirstLetter(newStatus).replace('_', ' ')}`);
            fetchBooking(); // Tải lại data để cập nhật UI
            return true;
        } catch (err) {
            toast.error(`Failed to update status: ${err.response?.data?.message || err.message}`);
            return false;
        }
    };

    const openStatusModal = (nextStatus) => {
        const statusMap = {
            checked_in: {
                title: 'Confirm Check-in',
                message: 'Are you sure you want to mark this guest as checked in?',
                confirmText: 'Check In',
                variant: 'default',
            },
            checked_out: {
                title: 'Confirm Check-out',
                message: 'Are you sure you want to complete check-out for this booking?',
                confirmText: 'Check Out',
                variant: 'warning',
            },
            no_show: {
                title: 'Mark As No Show',
                message: 'This will release the room and apply no-show policies. Do you want to continue?',
                confirmText: 'Confirm No Show',
                variant: 'danger',
            },
        };

        const modalConfig = statusMap[nextStatus];
        if (!modalConfig) {
            return;
        }

        setStatusModal({
            isOpen: true,
            nextStatus,
            title: modalConfig.title,
            message: modalConfig.message,
            confirmText: modalConfig.confirmText,
            variant: modalConfig.variant,
        });
    };

    const closeStatusModal = () => {
        if (processingStatusAction) {
            return;
        }

        setStatusModal({
            isOpen: false,
            nextStatus: null,
            title: '',
            message: '',
            confirmText: 'Confirm',
            variant: 'default',
        });
    };

    const handleConfirmStatusChange = async () => {
        if (!statusModal.nextStatus) {
            return;
        }

        setProcessingStatusAction(true);
        const isSuccess = await handleStatusChange(booking._id, statusModal.nextStatus);
        setProcessingStatusAction(false);

        if (isSuccess) {
            closeStatusModal();
        }
    };

    const buildRefundPreviewMeta = (targetBooking) => {
        const now = new Date();
        const refTail = String(targetBooking?._id || '').slice(-6).toUpperCase();
        const randomTail = String(now.getTime()).slice(-6);

        return {
            referenceNo: `RF-${refTail}-${randomTail}`,
            timestamp: now.toLocaleString('en-GB', { hour12: false }),
        };
    };

    const openAcceptModal = () => {
        if (!booking) {
            return;
        }

        if (['paid', 'confirmed'].includes(booking.status)) {
            setRefundApproveStep(1);
            setRefundTransferImg('');
            setRefundPreviewMeta(buildRefundPreviewMeta(booking));
        }

        setAcceptModalOpen(true);
    };

    const closeAcceptModal = () => {
        if (processingAdminAction || uploadingRefundProof) {
            return;
        }

        setAcceptModalOpen(false);
        setRefundTransferImg('');
        setRefundApproveStep(1);
    };

    const handleAnswerCancellation = async (action) => {
        const requiresTransferProof = action === 'Accept' && ['paid', 'confirmed'].includes(booking?.status);

        if (requiresTransferProof && !refundTransferImg) {
            toast.error('Please upload transfer proof before approving this refund request.');
            return;
        }

        setProcessingAdminAction(true);
        try {
            let config = { action };
            if (action === 'Reject') {
                config.adminReplyReason = rejectReason;
            }
            if (requiresTransferProof) {
                config.transfer_img = refundTransferImg;
            }
            
            await axiosClient.put(`/bookings/${id}/cancel-request/answer`, config);
            toast.success(`Cancellation request ${action.toLowerCase()}ed successfully.`);

            await fetchBooking();

            if (action === 'Accept' && requiresTransferProof) {
                setRefundApproveStep(3);
            } else {
                setAcceptModalOpen(false);
                setRejectModalOpen(false);
            }

            setRejectReason('');
            if (action === 'Accept' && !requiresTransferProof) {
                setRefundTransferImg('');
                setRefundApproveStep(1);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || `Failed to process cancellation request`);
        } finally {
            setProcessingAdminAction(false);
        }
    };

    const handleTransferProofUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        const formData = new FormData();
        formData.append('image', file);

        try {
            setUploadingRefundProof(true);
            const response = await axiosClient.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const uploadedUrl = response?.url || response?.data?.url;
            if (!uploadedUrl) {
                throw new Error('Upload succeeded but no image URL was returned.');
            }

            setRefundTransferImg(uploadedUrl);
            toast.success('Transfer proof uploaded successfully.');
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Failed to upload transfer proof.');
        } finally {
            setUploadingRefundProof(false);
            event.target.value = '';
        }
    };

    if (loading && !booking) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-transparent">
                <CircleNotch size={32} weight="light" className="text-orange-800 animate-spin" />
                <p className="text-gray-500 font-light text-sm tracking-widest uppercase">
                    Loading Record...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-transparent">
                <p className="text-red-500 font-serif text-xl">Unable to load data</p>
                <p className="text-gray-500 font-light">{error.message}</p>
                <button onClick={() => navigate('/admin/bookings')} className="mt-4 text-xs uppercase tracking-widest border-b border-gray-900 pb-1">Return to List</button>
            </div>
        );
    }

    if (!booking) return null;

    const getStatusUI = (status) => {
        switch (status) {
            case 'confirmed':
                return { styles: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircle weight="fill" /> };
            case 'pending':
                return { styles: 'bg-orange-50 text-orange-800 border-orange-200', icon: <Clock weight="fill" /> };
            case 'cancelled':
                return { styles: 'bg-gray-50 text-gray-500 border-gray-200', icon: <XCircle weight="fill" /> };
            default:
                return { styles: 'bg-gray-50 text-gray-500 border-gray-200', icon: null };
        }
    };

    const statusUI = getStatusUI(booking.status);

    // Group rooms for clean display
    const roomCounts = (booking.roomIds || []).reduce((acc, room) => {
        acc[room.roomName] = (acc[room.roomName] || 0) + 1;
        return acc;
    }, {});

    const checkInDate = new Date(booking.checkIn);
    const checkOutDate = new Date(booking.checkOut);
    const nights = Math.max(1, Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)));

    return (
        <div className="p-6 md:p-8 lg:p-12 max-w-6xl mx-auto relative">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-10 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/admin/bookings')} 
                        className="p-2 text-gray-400 hover:text-gray-900 transition-colors border border-gray-200 rounded-sm hover:bg-white bg-gray-50"
                        title="Back to Reservations"
                    >
                        <CaretLeft size={20} weight="light" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-serif text-gray-900 mb-1">
                            Reservation Details
                        </h1>
                        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-[0.2em]">
                            REF: {booking._id}
                        </p>
                    </div>
                </div>
                
                {/* Status Badge */}
                <div className={`px-4 py-2 flex items-center gap-2 border rounded-sm text-xs uppercase tracking-widest font-medium ${statusUI.styles}`}>
                    {statusUI.icon} {capitalizeFirstLetter(booking.status)}
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                
                {/* Left Column: Details (Takes up 2/3) */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Core Information */}
                    <div className="bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                            <User size={20} weight="light" className="text-gray-400" />
                            <h2 className="text-sm uppercase tracking-widest text-gray-900 font-medium">Guest & Property</h2>
                        </div>
                        <div className="p-6 grid sm:grid-cols-2 gap-8">
                            <div>
                                <span className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Primary Guest</span>
                                <p className="text-lg font-serif text-gray-900">{booking.userId?.fullName || "Guest"}</p>
                                <p className="text-sm font-light text-gray-500 mt-1">{booking.email || booking.userId?.email}</p>
                                <p className="text-sm font-light text-gray-500">{booking.phone || booking.userId?.phone}</p>
                            </div>
                            <div>
                                <span className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Reserved Property</span>
                                <div className="flex items-start gap-2">
                                    <Buildings size={18} weight="light" className="text-orange-800 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-lg font-serif text-gray-900">{booking.hotelId?.name}</p>
                                        <p className="text-sm font-light text-gray-500 mt-1">{booking.hotelId?.city}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stay Period */}
                    <div className="bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                            <CalendarCheck size={20} weight="light" className="text-gray-400" />
                            <h2 className="text-sm uppercase tracking-widest text-gray-900 font-medium">Stay Period</h2>
                        </div>
                        <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="text-center sm:text-left w-full sm:w-auto">
                                <span className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Check-in</span>
                                <p className="text-xl font-serif text-gray-900">{checkInDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                <p className="text-sm font-light text-gray-500 mt-1">From 14:00</p>
                            </div>
                            
                            <div className="flex flex-col items-center px-8 border-x border-gray-100 w-full sm:w-auto">
                                <span className="text-2xl font-light text-orange-800">{nights}</span>
                                <span className="text-[10px] uppercase tracking-widest text-gray-400">Nights</span>
                            </div>

                            <div className="text-center sm:text-right w-full sm:w-auto">
                                <span className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Check-out</span>
                                <p className="text-xl font-serif text-gray-900">{checkOutDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                <p className="text-sm font-light text-gray-500 mt-1">Until 12:00</p>
                            </div>
                        </div>
                    </div>

                    {/* Accommodation & Extras */}
                    <div className="grid sm:grid-cols-2 gap-8">
                        <div className="bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                                <Door size={18} weight="light" className="text-gray-400" />
                                <h2 className="text-xs uppercase tracking-widest text-gray-900 font-medium">Accommodations</h2>
                            </div>
                            <div className="p-5">
                                {Object.keys(roomCounts).length > 0 ? (
                                    <ul className="space-y-3">
                                        {Object.entries(roomCounts).map(([name, count], index) => (
                                            <li key={index} className="flex items-center justify-between">
                                                <span className="text-sm font-light text-gray-700">{name}</span>
                                                <span className="text-xs font-medium text-gray-900 bg-gray-50 px-2 py-1 rounded-sm border border-gray-100">x{count}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm font-light text-gray-400 italic">No rooms recorded.</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                                <Sparkle size={18} weight="light" className="text-gray-400" />
                                <h2 className="text-xs uppercase tracking-widest text-gray-900 font-medium">Extra Services</h2>
                            </div>
                            <div className="p-5">
                                {booking.extraIds && booking.extraIds.length > 0 ? (
                                    <ul className="space-y-3">
                                        {booking.extraIds.map((extra) => (
                                            <li key={extra._id} className="flex items-center justify-between">
                                                <span className="text-sm font-light text-gray-700">{extra.extraName}</span>
                                                <span className="text-[10px] font-light text-gray-500">+${extra.extraPrice}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm font-light text-gray-400 italic">No extra services requested.</p>
                                )}
                            </div>
                        </div>
                    </div>

                </div>

                {/* Right Column: Financial Summary & Actions */}
                <div className="lg:col-span-1 space-y-8 sticky top-24 h-fit">
                    
                    {/* Operational Actions (Lễ tân thao tác) */}
                    <div className="bg-white border border-gray-200 rounded-sm shadow-xl shadow-gray-200/30 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-xs uppercase tracking-widest text-gray-900 font-bold">Front Desk Operations</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            {booking.status === 'confirmed' && (
                                <>
                                    <p className="text-sm font-light text-gray-500 mb-4">Guest is scheduled to arrive. Proceed with check-in upon arrival.</p>
                                    <button 
                                        onClick={() => openStatusModal('checked_in')}
                                        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white text-xs uppercase tracking-widest font-medium transition-colors rounded-sm shadow-sm"
                                    >
                                        Check In Guest
                                    </button>
                                    <button 
                                        onClick={() => openStatusModal('no_show')}
                                        className="w-full py-3 bg-transparent border border-gray-300 text-gray-600 hover:border-gray-900 hover:text-gray-900 text-xs uppercase tracking-widest transition-colors rounded-sm"
                                    >
                                        Mark as No Show
                                    </button>
                                </>
                            )}

                            {booking.status === 'checked_in' && (
                                <>
                                    <p className="text-sm font-light text-gray-500 mb-4">Guest is currently staying at the property.</p>
                                    <button 
                                        onClick={() => openStatusModal('checked_out')}
                                        className="w-full py-3 bg-gray-900 hover:bg-black text-white text-xs uppercase tracking-widest font-medium transition-colors rounded-sm shadow-sm"
                                    >
                                        Complete Check Out
                                    </button>
                                </>
                            )}

                            {['pending', 'cancelled', 'expired', 'checked_out', 'no_show'].includes(booking.status) && (
                                <p className="text-sm font-light text-gray-500 italic text-center">
                                    No front desk actions available now.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="bg-gray-900 text-white rounded-sm shadow-lg">
                        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
                            <Receipt size={20} weight="light" className="text-gray-400" />
                            <h2 className="text-sm uppercase tracking-widest text-white font-medium">Financial Summary</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-center text-sm font-light text-gray-400">
                                <span>Guest Party</span>
                                <span>{booking.adult} Adults, {booking.children || 0} Children</span>
                            </div>
                            <div className="w-full h-[1px] bg-gray-800 my-4"></div>
                            <div className="flex justify-between items-end">
                                <span className="text-xs uppercase tracking-widest text-gray-400">Total Amount</span>
                                <div className="text-right">
                                    <p className="text-3xl font-serif tracking-tight text-white">
                                        ${booking.totalAmount?.toLocaleString()}
                                    </p>
                                    <p className="text-[10px] text-gray-500 font-light mt-1">Taxes & fees included</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cancellation Request Block */}
                    {booking.cancellationRequest && (
                        <div className="bg-white border border-gray-200 rounded-sm shadow-xl shadow-gray-200/30 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-red-50/30">
                                <WarningCircle size={20} weight="light" className="text-red-600" />
                                <h2 className="text-xs uppercase tracking-widest text-gray-900 font-medium">Cancellation Request</h2>
                            </div>
                            
                            <div className="p-6 space-y-6">
                                <div>
                                    <span className="block text-[10px] uppercase tracking-widest text-gray-400 mb-3">Reason Provided by Guest</span>
                                    <div className="bg-gray-50/50 p-4 border-l-2 border-red-200 rounded-r-sm">
                                        <p className="text-sm font-light text-gray-700 italic leading-relaxed">
                                            "{booking.cancellationRequest.reason}"
                                        </p>
                                    </div>
                                </div>
                                
                                {booking.cancellationRequest.status === 'Pending' ? (
                                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                                        <button 
                                            onClick={() => setRejectModalOpen(true)}
                                            className="flex-1 bg-transparent hover:bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-900 text-xs uppercase tracking-widest py-3 rounded-sm transition-colors"
                                        >
                                            Decline
                                        </button>
                                        <button 
                                            onClick={openAcceptModal}
                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs uppercase tracking-widest py-3 rounded-sm transition-colors flex items-center justify-center gap-2"
                                        >
                                            Approve
                                        </button>
                                    </div>
                                ) : (
                                    <div className="pt-4 border-t border-gray-100 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] uppercase tracking-widest text-gray-400">Resolution Status</span>
                                            <span className={`text-[10px] uppercase tracking-widest font-medium px-2.5 py-1 rounded-sm ${
                                                booking.cancellationRequest.status === 'Accepted' 
                                                    ? 'bg-green-50 text-green-700 border border-green-100' 
                                                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                                            }`}>
                                                {booking.cancellationRequest.status}
                                            </span>
                                        </div>
                                        
                                        {booking.cancellationRequest.adminReplyReason && (
                                            <div>
                                                <span className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2 mt-4">Message to Guest</span>
                                                <p className="text-sm font-light text-gray-600 italic bg-gray-50 p-3 rounded-sm border border-gray-100">
                                                    "{booking.cancellationRequest.adminReplyReason}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* Accept Cancellation Modal */}
            {acceptModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-2xl bg-white rounded-sm shadow-2xl p-8 animate-fade-in">
                        <div className="flex justify-end mb-2">
                            <button onClick={closeAcceptModal} className="text-gray-400 hover:text-gray-900 transition-colors">
                                <XCircle size={24} weight="light" />
                            </button>
                        </div>

                        {!['paid', 'confirmed'].includes(booking.status) && (
                            <div className="text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <WarningCircle size={32} weight="light" className="text-gray-900" />
                                </div>
                                <h3 className="text-xl font-serif text-gray-900 mb-3">Approve Cancellation</h3>
                                <p className="text-sm font-light text-gray-500 mb-8 leading-relaxed">
                                    Are you sure you want to approve this request? The booking status will be changed to <strong className="font-medium text-gray-900">Cancelled</strong>.
                                </p>

                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={closeAcceptModal}
                                        className="px-6 py-3 border border-gray-300 text-gray-700 text-xs uppercase tracking-widest hover:border-gray-900 transition-colors rounded-sm w-full"
                                    >
                                        Close
                                    </button>
                                    <button
                                        onClick={() => handleAnswerCancellation('Accept')}
                                        disabled={processingAdminAction}
                                        className="px-6 py-3 bg-gray-900 text-white text-xs uppercase tracking-widest hover:bg-black transition-colors rounded-sm w-full flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {processingAdminAction ? <CircleNotch size={14} className="animate-spin" /> : 'Confirm'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {['paid', 'confirmed'].includes(booking.status) && (
                            <div>
                                <h3 className="text-2xl font-serif text-gray-900 mb-6 text-center">
                                    Approve Cancellation & Refund
                                </h3>

                                <div className="flex items-center justify-center gap-3 mb-8">
                                    {[1, 2, 3].map((step) => (
                                        <div key={step} className="flex items-center gap-2">
                                            <div
                                                className={`w-7 h-7 rounded-full text-[10px] font-medium flex items-center justify-center border ${
                                                    refundApproveStep >= step
                                                        ? 'bg-gray-900 text-white border-gray-900'
                                                        : 'bg-white text-gray-400 border-gray-300'
                                                }`}
                                            >
                                                {step}
                                            </div>
                                            {step < 3 && <div className="w-8 h-px bg-gray-300" />}
                                        </div>
                                    ))}
                                </div>

                                {refundApproveStep === 1 && (
                                    <div>
                                        <div className="flex flex-col items-center text-center">
                                            <CheckCircle size={54} weight="fill" className="text-green-600" />
                                            <h4 className="mt-4 text-xl font-serif text-gray-900">Payment Result</h4>
                                            <p className="mt-1 text-[10px] uppercase tracking-widest text-gray-500">
                                                Reference {refundPreviewMeta.referenceNo}
                                            </p>
                                        </div>

                                        <div className="mt-6 border border-gray-200 rounded-sm p-4 grid grid-cols-2 gap-y-3 text-sm">
                                            <span className="text-gray-500">Amount</span>
                                            <span className="text-right font-semibold text-green-700">
                                                ${Number(booking.totalAmount || 0).toLocaleString()}
                                            </span>
                                            <span className="text-gray-500">Booking Ref</span>
                                            <span className="text-right text-gray-900">
                                                {String(booking._id).slice(-8).toUpperCase()}
                                            </span>
                                            <span className="text-gray-500">Transfer Time</span>
                                            <span className="text-right text-gray-900">{refundPreviewMeta.timestamp}</span>
                                            <span className="text-gray-500">Status</span>
                                            <span className="text-right text-green-700 uppercase tracking-wide font-medium">Success</span>
                                        </div>

                                        <p className="mt-4 text-xs text-gray-500 text-center">
                                            Capture this screen as transfer confirmation, then continue to upload proof.
                                        </p>

                                        <div className="flex gap-3 mt-8">
                                            <button
                                                onClick={closeAcceptModal}
                                                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 text-xs uppercase tracking-widest hover:border-gray-900 transition-colors rounded-sm"
                                            >
                                                Close
                                            </button>
                                            <button
                                                onClick={() => setRefundApproveStep(2)}
                                                className="flex-1 px-6 py-3 bg-gray-900 text-white text-xs uppercase tracking-widest hover:bg-black transition-colors rounded-sm"
                                            >
                                                Next: Upload Proof
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {refundApproveStep === 2 && (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">
                                                Transfer Proof *
                                            </label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleTransferProofUpload}
                                                disabled={uploadingRefundProof || processingAdminAction}
                                                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 disabled:opacity-70"
                                            />

                                            {uploadingRefundProof && (
                                                <p className="mt-2 text-xs text-orange-700 flex items-center gap-2">
                                                    <CircleNotch size={14} className="animate-spin" /> Uploading proof...
                                                </p>
                                            )}

                                            {refundTransferImg && (
                                                <div className="mt-3 relative w-32 h-32 border border-gray-200 p-1">
                                                    <img
                                                        src={refundTransferImg}
                                                        alt="Refund transfer proof"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setRefundTransferImg('')}
                                                        disabled={processingAdminAction}
                                                        className="absolute -top-2 -right-2 bg-white rounded-full shadow text-red-500 disabled:opacity-50"
                                                    >
                                                        <XCircle size={18} weight="fill" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-3 justify-center">
                                            <button
                                                onClick={() => setRefundApproveStep(1)}
                                                className="px-6 py-3 border border-gray-300 text-gray-700 text-xs uppercase tracking-widest hover:border-gray-900 transition-colors rounded-sm w-full"
                                            >
                                                Back
                                            </button>
                                            <button
                                                onClick={() => handleAnswerCancellation('Accept')}
                                                disabled={processingAdminAction || uploadingRefundProof}
                                                className="px-6 py-3 bg-gray-900 text-white text-xs uppercase tracking-widest hover:bg-black transition-colors rounded-sm w-full flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                {processingAdminAction ? <CircleNotch size={14} className="animate-spin" /> : 'Confirm Refund'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {refundApproveStep === 3 && (
                                    <div className="py-6 text-center">
                                        <CheckCircle size={58} weight="fill" className="text-green-600 mx-auto" />
                                        <h4 className="mt-4 text-2xl font-serif text-gray-900">Refund Completed</h4>
                                        <p className="mt-2 text-sm text-gray-500">
                                            Cancellation is approved and refund proof has been saved successfully.
                                        </p>
                                        <button
                                            onClick={closeAcceptModal}
                                            className="mt-8 px-8 py-3 bg-gray-900 text-white text-xs tracking-widest uppercase hover:bg-black transition-colors rounded-sm"
                                        >
                                            Done
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Reject Cancellation Modal */}
            {rejectModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white rounded-sm shadow-2xl p-8 animate-fade-in">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <h3 className="text-xl font-serif text-gray-900">Decline Request</h3>
                            <button onClick={() => setRejectModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                                <XCircle size={24} weight="light" />
                            </button>
                        </div>
                        <p className="text-sm font-light text-gray-500 mb-6">
                            Provide a reason to the guest explaining why their cancellation request cannot be approved.
                        </p>
                        
                        <div className="relative group mb-8">
                            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Reason for rejection *</label>
                            <textarea
                                className="w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-gray-900 font-light text-sm focus:ring-0 focus:border-gray-900 transition-colors resize-none h-20 placeholder-gray-300"
                                placeholder="e.g. This is a non-refundable rate..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                            ></textarea>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setRejectModalOpen(false)}
                                className="px-6 py-2.5 border border-gray-300 text-gray-700 text-xs uppercase tracking-widest hover:border-gray-900 transition-colors rounded-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleAnswerCancellation('Reject')}
                                disabled={processingAdminAction || !rejectReason.trim()}
                                className="px-6 py-2.5 bg-gray-900 text-white text-xs uppercase tracking-widest hover:bg-black transition-colors rounded-sm flex items-center gap-2 disabled:opacity-50"
                            >
                                {processingAdminAction ? <CircleNotch size={14} className="animate-spin" /> : 'Decline Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={statusModal.isOpen}
                title={statusModal.title}
                message={statusModal.message}
                confirmText={statusModal.confirmText}
                cancelText="Cancel"
                onCancel={closeStatusModal}
                onConfirm={handleConfirmStatusChange}
                loading={processingStatusAction}
                variant={statusModal.variant}
            />

        </div>
    );
};

export default BookingDetails;
