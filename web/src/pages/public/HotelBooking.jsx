import { useState, useEffect } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import axiosClient from "../../services/axiosClient";
import { toast } from "sonner";
import { 
    UsersIcon, 
    ShieldCheck, 
    Info, 
    House,
    WifiHigh,
    Users,
    ProhibitInset,
    Door,
    Wind,
    Bathtub,
    Eye,
    Oven,
    Shower,
    Clock,
    SignOut,
    CreditCard,
    Baby
} from '@phosphor-icons/react';
import HotelInfoCard from "../../components/booking/HotelInfoCard";
import BookingFormCard from "../../components/booking/BookingFormCard";
import Reviews from "../../components/booking/Reviews";

const parseLocalDateInput = (dateValue) => {
    if (!dateValue) return null;
    const [year, month, day] = dateValue.split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const calculateStayNights = (checkInValue, checkOutValue) => {
    const checkInDate = parseLocalDateInput(checkInValue);
    const checkOutDate = parseLocalDateInput(checkOutValue);

    if (!checkInDate || !checkOutDate) {
        return 1;
    }

    const diffMs = checkOutDate.getTime() - checkInDate.getTime();
    if (diffMs <= 0) {
        return 1;
    }

    return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
};

const HotelBooking = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [user, setUser] = useState(null);
    
    // Hotel data
    const [hotel, setHotel] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [extraFees, setExtraFees] = useState([]);
    const [reviews, setReviews] = useState([]);
    
    // Initial counts from URL
    const guestsFromUrl = parseInt(searchParams.get("guests")) || 2;

    // Form data
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        adult: guestsFromUrl,
        children: 0,
        baby: 0,
        checkIn: searchParams.get("checkIn") || "",
        checkOut: searchParams.get("checkOut") || "",
    });
    
    // Room selections
    const [roomSelections, setRoomSelections] = useState({});
    const [selectedExtras, setSelectedExtras] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const [showRoomRequirementModal, setShowRoomRequirementModal] = useState(false);

    // Confirmation & reservation hold
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [reservation, setReservation] = useState(null);
    const [countdown, setCountdown] = useState(null);
    const [reserving, setReserving] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [termsError, setTermsError] = useState("");

    // Derived requirements
    const currentTotalGuests = formData.adult + formData.children + formData.baby;
    const currentChildGuests = formData.children + formData.baby;
    const roomsForAdults = Math.ceil(formData.adult / 2);
    const remainingChildGuests = Math.max(0, currentChildGuests - roomsForAdults);
    const currentRoomsNeeded = roomsForAdults + remainingChildGuests;
    const totalSelectedRooms = Object.values(roomSelections).reduce((a, b) => a + b, 0);
    const stayNights = calculateStayNights(formData.checkIn, formData.checkOut);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            toast.error("Please log in to continue your reservation");
            navigate('/login');
            return;
        }
        try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setFormData(prev => ({
                ...prev,
                name: parsedUser.fullName || "",
                email: parsedUser.email || "",
                phone: parsedUser.phone || "",
            }));
        } catch (error) {
            localStorage.removeItem('user');
            navigate('/login');
        }
    }, [navigate]);

    useEffect(() => {
        const fetchHotelBaseData = async () => {
            try {
                const [hotelRes, extraRes, reviewsRes] = await Promise.all([
                    axiosClient.get(`/hotels/${id}`),
                    axiosClient.get(`/extra-fees/public`),
                    axiosClient.get(`/reviews?hotelId=${id}`)
                ]);
                setHotel(hotelRes.data);
                setExtraFees(extraRes.data.filter(e => e.hotelId._id === id || e.hotelId === id) || []);
                setReviews(reviewsRes.data || []);
            } catch (error) {
                toast.error("Failed to load property information");
            }
        };
        fetchHotelBaseData();
    }, [id]);

    useEffect(() => {
        const fetchRoomAvailability = async () => {
            if (!formData.checkIn || !formData.checkOut) {
                try {
                    const roomsRes = await axiosClient.get(`/rooms?hotelId=${id}`);
                    setRooms(roomsRes.data || []);
                } catch (err) {}
                return;
            }

            try {
                const roomsRes = await axiosClient.get(`/rooms?hotelId=${id}&checkIn=${formData.checkIn}&checkOut=${formData.checkOut}`);
                setRooms(roomsRes.data || []);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching room availability:", error);
            }
        };
        fetchRoomAvailability();
    }, [id, formData.checkIn, formData.checkOut]);

    useEffect(() => {
        let roomSubtotalPerNight = 0;
        Object.entries(roomSelections).forEach(([roomId, quantity]) => {
            const room = rooms.find(r => r._id === roomId);
            if (room) {
                roomSubtotalPerNight += Number(room.roomPrice || 0) * quantity;
            }
        });

        let extrasTotal = 0;
        selectedExtras.forEach(extraId => {
            const extra = extraFees.find(e => e._id === extraId);
            if (extra) {
                // Extra services are charged once per booking, not per night.
                extrasTotal += Number(extra.extraPrice || 0);
            }
        });

        const calculatedTotal = roomSubtotalPerNight * stayNights + extrasTotal;
        setTotalAmount(Number(calculatedTotal.toFixed(2)));
    }, [roomSelections, selectedExtras, rooms, extraFees, stayNights]);

    // Countdown timer — auto-releases hold when it reaches 0
    useEffect(() => {
        if (countdown === null) return;
        if (countdown <= 0) {
            if (reservation) {
                axiosClient.delete(`/reservations/${reservation._id}`).catch(() => {});
            }
            setReservation(null);
            setCountdown(null);
            setShowConfirmModal(false);
            toast.error('Your room hold has expired. Please try again.');
            return;
        }
        
        // Recalculate accurately based on expiresAt instead of blind interval if possible
        const timer = setTimeout(() => {
            if (reservation?.expiresAt) {
                const diff = Math.max(0, Math.floor((new Date(reservation.expiresAt).getTime() - Date.now()) / 1000));
                setCountdown(diff);
            } else {
                setCountdown((c) => c - 1);
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [countdown, reservation]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setShowRoomRequirementModal(false);
        if (name === "checkIn" || name === "checkOut") {
            setRoomSelections({});
        }
    };

    const handleNumberChange = (name, value) => {
        setShowRoomRequirementModal(false);
        setFormData(prev => ({ ...prev, [name]: Math.max(0, parseInt(value) || 0) }));
    };

    const handleRoomQuantityChange = (roomId, quantity) => {
        const room = rooms.find(r => r._id === roomId);
        const maxAvailable = room ? (room.availableQuantity !== undefined ? room.availableQuantity : room.quantity) : 0;
        const safeQty = Math.max(0, Math.min(quantity, maxAvailable));
        setShowRoomRequirementModal(false);
        setRoomSelections(prev => ({ ...prev, [roomId]: safeQty }));
    };

    const handleExtraToggle = (extraId) => {
        setSelectedExtras(prev =>
            prev.includes(extraId) ? prev.filter(id => id !== extraId) : [...prev, extraId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (totalSelectedRooms < currentRoomsNeeded) {
            setShowRoomRequirementModal(true);
            return;
        }
        setAgreedToTerms(false);
        setTermsError("");
        setShowConfirmModal(true);
    };

    const handleConfirmReservation = async () => {
        setReserving(true);
        try {
            const roomIds = [];
            Object.entries(roomSelections).forEach(([roomId, qty]) => {
                for (let i = 0; i < qty; i++) roomIds.push(roomId);
            });
            const res = await axiosClient.post('/reservations', {
                userId: user._id,
                hotelId: id,
                roomIds,
                checkIn: formData.checkIn,
                checkOut: formData.checkOut,
            });
            // axiosClient interceptor returns response.data, so res is { success, data: reservation }
            const reservationDoc = res.data || res;
            setReservation(reservationDoc);
            
            // Calculate exact seconds from the actual reservation document
            const diff = Math.max(0, Math.floor((new Date(reservationDoc.expiresAt).getTime() - Date.now()) / 1000));
            setCountdown(diff);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to hold rooms. Please try again.');
            setShowConfirmModal(false);
        } finally {
            setReserving(false);
        }
    };

    const handleProceedToPayment = async () => {
        if (!agreedToTerms) {
            setTermsError("Please accept the Terms & Conditions to continue payment.");
            toast.error("Please accept the Terms & Conditions before payment.");
            return;
        }

        if (!formData.name.trim() || !formData.phone.trim() || !formData.email.trim()) {
            toast.error("Please provide guest contact details (Name, Phone, Email).");
            return;
        }

        // Name: letters only
        if (!/^[a-zA-Z\s\u00C0-\u1EF9]+$/.test(formData.name.trim())) {
            toast.error("Full name should only contain letters.");
            return;
        }

        // Email: strict
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email.trim())) {
            toast.error("Please enter a valid email address.");
            return;
        }

        // Phone: 10-11 digits
        if (!/^[0-9]{10,11}$/.test(formData.phone.trim())) {
            toast.error("Phone number must be 10 or 11 digits.");
            return;
        }

        setTermsError("");
        setSubmitting(true);
        try {
            const roomIds = [];
            Object.entries(roomSelections).forEach(([roomId, qty]) => {
                for (let i = 0; i < qty; i++) roomIds.push(roomId);
            });
            const bookingData = {
                ...formData,
                hotelId: id,
                userId: user._id,
                roomIds,
                extraIds: selectedExtras,
                totalAmount,
                status: 'pending',
                reservationId: reservation?._id,
            };
            const response = await axiosClient.post('/bookings', bookingData);
            const newBooking = response.data;
            const paymentResponse = await axiosClient.post('/payments/sepay/create', {
                bookingId: newBooking._id,
                amount: totalAmount,
            });
            if (paymentResponse?.paymentUrl) {
                window.location.href = paymentResponse.paymentUrl;
            } else {
                navigate('/my-bookings');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Reservation failed to process.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelConfirm = () => {
        if (reservation) {
            axiosClient.delete(`/reservations/${reservation._id}`).catch(() => {});
        }
        setReservation(null);
        setCountdown(null);
        setAgreedToTerms(false);
        setTermsError("");
        setShowConfirmModal(false);
    };

    const formatCountdown = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    if (loading && !hotel) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFFCFA] gap-4">
                <div className="w-8 h-8 border-2 border-orange-100 border-t-orange-800 rounded-full animate-spin"></div>
                <p className="text-gray-500 font-light text-sm tracking-widest uppercase">
                    Preparing your reservation...
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFFCFA] pb-24">
            
            <div className="bg-white border-b border-gray-200 py-6 shadow-sm mb-12">
                <div className="container mx-auto px-6 max-w-7xl flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <ShieldCheck size={20} weight="light" className="text-orange-800" />
                        <span className="text-xs font-medium uppercase tracking-[0.2em] text-gray-900">Secure Reservation</span>
                    </div>
                    <div className="flex items-center gap-6 text-[10px] uppercase tracking-widest">
                        <span className="flex items-center gap-2 border-b-2 border-orange-800 pb-1 text-gray-900 font-medium">1. Details</span>
                        <span className="flex items-center gap-2 text-gray-400">2. Payment</span>
                        <span className="flex items-center gap-2 text-gray-400">3. Confirm</span>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                
                <div className="grid lg:grid-cols-12 gap-12 items-start mb-24">
                    <div className="lg:col-span-5 relative z-10">
                        <HotelInfoCard hotel={hotel} reviews={reviews} />
                    </div>
                    
                    <div className="lg:col-span-7 relative z-10 space-y-6">
                        
                        <div className="bg-white border border-gray-200 rounded-sm p-6 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gray-50 rounded-full text-gray-900">
                                    <UsersIcon size={24} weight="light" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Your Party</p>
                                    <p className="font-serif text-xl text-gray-900">{currentTotalGuests} Guests</p>
                                </div>
                            </div>
                            
                            <div className="h-10 w-[1px] bg-gray-200 hidden sm:block"></div>
                            
                            <div className="flex items-center gap-4">
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1 text-right">Required Rooms</p>
                                    <p className="font-serif text-xl text-orange-800 text-right"> Min {currentRoomsNeeded} Rooms</p>
                                    <p className="text-[11px] font-light text-gray-400 text-right mt-1">
                                        1 room max 2 adults and 1 child
                                    </p>
                                </div>
                                <div className="p-3 bg-orange-50 rounded-full text-orange-800">
                                    <Door size={24} weight="light" />
                                </div>
                            </div>
                        </div>

                        {/* Booking Form Card */}
                        <BookingFormCard 
                            hotel={hotel} 
                            formData={formData} 
                            rooms={rooms} 
                            extraFees={extraFees} 
                            roomSelections={roomSelections} 
                            selectedExtras={selectedExtras} 
                            totalAmount={totalAmount} 
                            submitting={submitting} 
                            onInputChange={handleInputChange} 
                            onNumberChange={handleNumberChange} 
                            onRoomQuantityChange={handleRoomQuantityChange} 
                            onExtraToggle={handleExtraToggle} 
                            onSubmit={handleSubmit} 
                        />
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-20 mb-24">
                    <div className="grid lg:grid-cols-2 gap-16">
                        
                        <div>
                            <span className="text-xs uppercase tracking-[0.2em] font-medium text-orange-800 mb-3 block">
                                Property Details
                            </span>
                            <h2 className="text-3xl font-serif text-gray-900 mb-8">
                                Most Popular Facilities
                            </h2>
                            
                            <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-10">
                                <div className="flex items-center gap-3">
                                    <House size={22} weight="light" className="text-gray-400 shrink-0" />
                                    <span className="text-sm font-light text-gray-700">Căn hộ</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <WifiHigh size={22} weight="light" className="text-gray-400 shrink-0" />
                                    <span className="text-sm font-light text-gray-700">WiFi miễn phí</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Users size={22} weight="light" className="text-gray-400 shrink-0" />
                                    <span className="text-sm font-light text-gray-700">Phòng gia đình</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <ProhibitInset size={22} weight="light" className="text-gray-400 shrink-0" />
                                    <span className="text-sm font-light text-gray-700">Phòng không hút thuốc</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Door size={22} weight="light" className="text-gray-400 shrink-0" />
                                    <span className="text-sm font-light text-gray-700">Ban công</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Wind size={22} weight="light" className="text-gray-400 shrink-0" />
                                    <span className="text-sm font-light text-gray-700">Điều hòa không khí</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Bathtub size={22} weight="light" className="text-gray-400 shrink-0" />
                                    <span className="text-sm font-light text-gray-700">Phòng tắm riêng</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Oven size={22} weight="light" className="text-gray-400 shrink-0" />
                                    <span className="text-sm font-light text-gray-700">Bếp</span>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-gray-100">
                                <p className="text-sm font-light text-gray-600 leading-loose mb-4">
                                    {hotel?.description || "No description available for this accommodation."}
                                </p>
                            </div>
                        </div>

                        {/* House Rules */}
                        <div>
                            <span className="text-xs uppercase tracking-[0.2em] font-medium text-orange-800 mb-3 block">
                                Good to know
                            </span>
                            <h2 className="text-3xl font-serif text-gray-900 mb-8">
                                House Rules
                            </h2>

                            <div className="bg-white border border-gray-200 rounded-sm p-8 shadow-sm">
                                <p className="text-xs font-light text-gray-500 mb-8 italic">
                                    {hotel?.name} nhận yêu cầu đặc biệt - gửi yêu cầu trong bước kế tiếp!
                                </p>

                                <div className="space-y-8">
                                    {/* Check-in */}
                                    <div className="flex gap-5">
                                        <Clock size={24} weight="light" className="text-gray-400 shrink-0" />
                                        <div className="flex-1 border-b border-gray-100 pb-6">
                                            <h4 className="text-sm font-medium text-gray-900 mb-1">Nhận phòng</h4>
                                            <p className="text-sm font-light text-gray-600">Từ 14:00 - 23:30</p>
                                            <p className="text-[11px] font-light text-gray-400 mt-2">Trước đó bạn sẽ cần cho chúng tôi biết giờ bạn sẽ đến nơi.</p>
                                        </div>
                                    </div>

                                    {/* Check-out */}
                                    <div className="flex gap-5">
                                        <SignOut size={24} weight="light" className="text-gray-400 shrink-0" />
                                        <div className="flex-1 border-b border-gray-100 pb-6">
                                            <h4 className="text-sm font-medium text-gray-900 mb-1">Trả phòng</h4>
                                            <p className="text-sm font-light text-gray-600">Từ 12:00 - 12:30</p>
                                        </div>
                                    </div>

                                    {/* Cancellation Policy */}
                                    <div className="flex gap-5">
                                        <Info size={24} weight="light" className="text-gray-400 shrink-0" />
                                        <div className="flex-1 border-b border-gray-100 pb-6">
                                            <h4 className="text-sm font-medium text-gray-900 mb-1">Hủy đặt phòng/ Trả trước</h4>
                                            <p className="text-sm font-light text-gray-600 leading-relaxed">
                                                Các chính sách hủy và thanh toán trước sẽ khác nhau tùy vào từng loại chỗ nghỉ. 
                                                Vui lòng kiểm tra <span className="text-orange-800 underline cursor-pointer">các điều kiện</span> có thể áp dụng cho mỗi lựa chọn của bạn.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Children Policy */}
                                    <div className="flex gap-5">
                                        <Baby size={24} weight="light" className="text-gray-400 shrink-0" />
                                        <div className="flex-1 border-b border-gray-100 pb-6">
                                            <h4 className="text-sm font-medium text-gray-900 mb-4">Trẻ em và giường phụ</h4>
                                            
                                            <div className="bg-gray-50 border border-gray-100 rounded-sm p-4 mb-3">
                                                <p className="text-xs uppercase tracking-widest font-medium text-gray-900 mb-1">Chính sách trẻ em</p>
                                                <p className="text-xs font-light text-gray-600 leading-relaxed">
                                                    Phù hợp cho tất cả trẻ em. Để xem thông tin giá và tình trạng phòng trống chính xác, vui lòng thêm số lượng và độ tuổi của trẻ em trong nhóm của bạn khi tìm kiếm.
                                                </p>
                                            </div>
                                            <div className="bg-gray-50 border border-gray-100 rounded-sm p-4">
                                                <p className="text-xs uppercase tracking-widest font-medium text-gray-900 mb-1">Chính sách nôi (cũi) và giường phụ</p>
                                                <p className="text-xs font-light text-gray-600">
                                                    Chỗ nghỉ này không có nôi cũi và giường phụ.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Methods */}
                                    <div className="flex gap-5">
                                        <CreditCard size={24} weight="light" className="text-gray-400 shrink-0" />
                                        <div className="flex-1">
                                            <h4 className="text-sm font-medium text-gray-900 mb-3">Các phương thức thanh toán</h4>
                                            <div className="flex gap-3">
                                                <span className="px-4 py-2 border border-gray-200 rounded-sm text-xs font-light text-gray-700">
                                                    Bankcard
                                                </span>
                                                <span className="px-4 py-2 border border-gray-200 rounded-sm text-xs font-light text-gray-700">
                                                    Tiền mặt
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <div className="border-t border-gray-200 pt-20">
                    <Reviews hotelId={id} />
                </div>
            </div>

            {showRoomRequirementModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-md bg-white border border-gray-200 rounded-sm shadow-2xl p-6 sm:p-7">
                        <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-orange-800 block mb-2">
                            Room Selection Required
                        </span>
                        <h3 className="text-2xl font-serif text-gray-900 mb-3">
                            Please adjust your room quantity
                        </h3>
                        <p className="text-sm font-light text-gray-600 leading-relaxed mb-3">
                            You selected <span className="font-medium text-gray-900">{totalSelectedRooms}</span> room(s),
                            but your party requires at least <span className="font-medium text-gray-900">{currentRoomsNeeded}</span> room(s).
                        </p>
                        <p className="text-sm font-light text-gray-500 leading-relaxed mb-6">
                            Rule: 1 room can accommodate a maximum of 2 adults and 1 child.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                className="px-4 py-2 border border-gray-300 text-gray-700 text-xs uppercase tracking-widest hover:border-gray-400 transition-colors rounded-sm"
                                onClick={() => setShowRoomRequirementModal(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Booking Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-lg bg-white border border-gray-200 rounded-sm shadow-2xl p-6 sm:p-8">

                        {!reservation ? (
                            /* Phase 1: Booking Summary */
                            <>
                                <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-gray-500 block mb-2">
                                    Confirm Reservation
                                </span>
                                <h3 className="text-2xl font-serif text-gray-900 mb-5">
                                    Review your booking
                                </h3>

                                {/* Hotel & Dates */}
                                <div className="border border-gray-100 rounded-sm p-4 mb-4 space-y-2 text-sm font-light text-gray-600">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 uppercase tracking-widest text-[10px]">Property</span>
                                        <span className="text-gray-900 font-medium">{hotel?.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 uppercase tracking-widest text-[10px]">Check-in</span>
                                        <span>{formData.checkIn}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 uppercase tracking-widest text-[10px]">Check-out</span>
                                        <span>{formData.checkOut}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 uppercase tracking-widest text-[10px]">Guests</span>
                                        <span>
                                            {formData.adult} adult{formData.adult !== 1 ? 's' : ''}
                                            {formData.children > 0 ? `, ${formData.children} child` : ''}
                                        </span>
                                    </div>
                                </div>

                                {/* Selected Rooms */}
                                <div className="border border-gray-100 rounded-sm p-4 mb-4 space-y-1 text-sm font-light text-gray-600">
                                    <span className="text-gray-400 uppercase tracking-widest text-[10px] block mb-2">Selected Rooms</span>
                                    {Object.entries(roomSelections).filter(([, qty]) => qty > 0).map(([roomId, qty]) => {
                                        const room = rooms.find((r) => r._id === roomId);
                                        return room ? (
                                            <div key={roomId} className="flex justify-between">
                                                <span>{room.roomName}</span>
                                                    <span className="text-gray-900 font-medium">
                                                        ${Number(room.roomPrice || 0).toLocaleString()} × {qty}
                                                        {stayNights > 1 ? ` × ${stayNights} nights` : ''}
                                                    </span>
                                            </div>
                                        ) : null;
                                    })}
                                </div>

                                {/* Selected Extras */}
                                {selectedExtras.length > 0 && (
                                    <div className="border border-gray-100 rounded-sm p-4 mb-4 space-y-1 text-sm font-light text-gray-600">
                                        <span className="text-gray-400 uppercase tracking-widest text-[10px] block mb-2">Selected Extras</span>
                                        {selectedExtras.map((extraId) => {
                                            const extra = extraFees.find((e) => e._id === extraId);
                                            return extra ? (
                                                <div key={extraId} className="flex justify-between">
                                                    <span>{extra.extraName}</span>
                                                    <span className="text-gray-900 font-medium">${extra.extraPrice}</span>
                                                </div>
                                            ) : null;
                                        })}
                                    </div>
                                )}

                                {/* Total */}
                                <div className="flex justify-between items-center mb-6 pt-2 border-t border-gray-100">
                                    <span className="text-[10px] uppercase tracking-widest text-gray-400">Total Amount</span>
                                    <span className="text-xl font-serif text-gray-900">${totalAmount?.toLocaleString()}</span>
                                </div>

                                <div className="flex gap-3 justify-end">
                                    <button
                                        type="button"
                                        onClick={handleCancelConfirm}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 text-xs uppercase tracking-widest hover:border-gray-400 transition-colors rounded-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleConfirmReservation}
                                        disabled={reserving}
                                        className="px-5 py-2 bg-gray-900 text-white text-xs uppercase tracking-widest hover:bg-gray-700 transition-colors rounded-sm disabled:opacity-50"
                                    >
                                        {reserving ? 'Holding...' : 'Confirm & Hold Room'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            /* Phase 2: Room Held — Countdown */
                            <>
                                <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-green-600 block mb-2">
                                    Room Reserved
                                </span>
                                <h3 className="text-2xl font-serif text-gray-900 mb-2">
                                    Your room is held!
                                </h3>
                                <p className="text-sm font-light text-gray-500 mb-6">
                                    Complete your payment before the timer expires or your hold will be automatically released.
                                </p>

                                {/* Countdown */}
                                <div className="flex flex-col items-center justify-center py-6 mb-6 border border-gray-100 rounded-sm bg-gray-50">
                                    <span className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Time Remaining</span>
                                    <span className={`text-5xl font-mono font-light tabular-nums ${countdown <= 60 ? 'text-red-500' : 'text-gray-900'}`}>
                                        {formatCountdown(countdown)}
                                    </span>
                                    <div className="w-full mt-4 px-8">
                                        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${countdown <= 60 ? 'bg-red-400' : 'bg-green-500'}`}
                                                style={{ width: `${(countdown / 300) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-6 border border-gray-200 rounded-sm p-4 bg-white">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-sm mt-0.5"
                                            checked={agreedToTerms}
                                            onChange={(e) => {
                                                setAgreedToTerms(e.target.checked);
                                                if (e.target.checked) {
                                                    setTermsError("");
                                                }
                                            }}
                                        />
                                        <span className="text-xs font-light text-gray-600 leading-relaxed">
                                            I have read and agree to the{' '}
                                            <Link
                                                to="/terms"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-medium text-orange-800 underline hover:no-underline"
                                            >
                                                Terms & Conditions
                                            </Link>
                                            .
                                        </span>
                                    </label>
                                    {termsError && (
                                        <p className="text-[11px] text-red-500 mt-2 ml-7">{termsError}</p>
                                    )}
                                </div>

                                <div className="flex gap-3 justify-end">
                                    <button
                                        type="button"
                                        onClick={handleCancelConfirm}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 text-xs uppercase tracking-widest hover:border-gray-400 transition-colors rounded-sm"
                                    >
                                        Release Hold
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleProceedToPayment}
                                        disabled={submitting || !agreedToTerms}
                                        className="px-5 py-2 bg-gray-900 text-white text-xs uppercase tracking-widest hover:bg-gray-700 transition-colors rounded-sm disabled:opacity-50"
                                    >
                                        {submitting ? 'Processing...' : 'Proceed to Payment →'}
                                    </button>
                                </div>
                            </>
                        )}

                    </div>
                </div>
            )}
        </div>
    );
};

export default HotelBooking;