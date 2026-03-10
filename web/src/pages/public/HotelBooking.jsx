import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axiosClient from "../../services/axiosClient";
import { toast } from "sonner";
import { UsersIcon, Info, ShieldCheck } from '@phosphor-icons/react';
import HotelInfoCard from "../../components/booking/HotelInfoCard";
import BookingFormCard from "../../components/booking/BookingFormCard";
import Reviews from "../../components/booking/Reviews";

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

    // Derived requirements
    const currentTotalGuests = formData.adult + formData.children + formData.baby;
    const currentRoomsNeeded = Math.ceil(currentTotalGuests / 2);
    const totalSelectedRooms = Object.values(roomSelections).reduce((a, b) => a + b, 0);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            toast.error("Please login to make a booking");
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

    // Fetch initial hotel data once
    useEffect(() => {
        const fetchHotelBaseData = async () => {
            try {
                const [hotelRes, extraRes, reviewsRes] = await Promise.all([
                    axiosClient.get(`/hotels/${id}`),
                    axiosClient.get(`/extra-fees`),
                    axiosClient.get(`/reviews?hotelId=${id}`)
                ]);
                setHotel(hotelRes.data);
                setExtraFees(extraRes.data.filter(e => e.hotelId._id === id || e.hotelId === id) || []);
                setReviews(reviewsRes.data || []);
            } catch (error) {
                toast.error("Failed to load hotel information");
            }
        };
        fetchHotelBaseData();
    }, [id]);

    // Fetch rooms whenever dates change to get updated availability
    useEffect(() => {
        const fetchRoomAvailability = async () => {
            if (!formData.checkIn || !formData.checkOut) {
                // If dates are missing, just fetch all rooms (backend will return max quantity)
                try {
                    const roomsRes = await axiosClient.get(`/rooms?hotelId=${id}`);
                    setRooms(roomsRes.data || []);
                } catch (err) {}
                return;
            }

            try {
                // Pass dates to get actual availability counting overlapping bookings
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
        let total = 0;
        Object.entries(roomSelections).forEach(([roomId, quantity]) => {
            const room = rooms.find(r => r._id === roomId);
            if (room) total += room.roomPrice * quantity;
        });
        selectedExtras.forEach(extraId => {
            const extra = extraFees.find(e => e._id === extraId);
            if (extra) total += parseFloat(extra.extraPrice);
        });
        if (formData.checkIn && formData.checkOut) {
            const start = new Date(formData.checkIn);
            const end = new Date(formData.checkOut);
            const nights = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
            total *= nights;
        }
        setTotalAmount(total);
    }, [roomSelections, selectedExtras, rooms, extraFees, formData.checkIn, formData.checkOut]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Reset selections if dates change as availability might change
        if (name === "checkIn" || name === "checkOut") {
            setRoomSelections({});
        }
    };

    const handleNumberChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: Math.max(0, parseInt(value) || 0) }));
    };

    const handleRoomQuantityChange = (roomId, quantity) => {
        const room = rooms.find(r => r._id === roomId);
        // Use availableQuantity from the date-filtered response
        const maxAvailable = room ? (room.availableQuantity !== undefined ? room.availableQuantity : room.quantity) : 0;
        const safeQty = Math.max(0, Math.min(quantity, maxAvailable));
        setRoomSelections(prev => ({ ...prev, [roomId]: safeQty }));
    };

    const handleExtraToggle = (extraId) => {
        setSelectedExtras(prev =>
            prev.includes(extraId) ? prev.filter(id => id !== extraId) : [...prev, extraId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (totalSelectedRooms !== currentRoomsNeeded) {
            toast.error(`Please select exactly ${currentRoomsNeeded} rooms.`);
            return;
        }
        setSubmitting(true);
        try {
            const roomIds = [];
            Object.entries(roomSelections).forEach(([roomId, qty]) => {
                for (let i = 0; i < qty; i++) roomIds.push(roomId);
            });

            const bookingData = { ...formData, hotelId: id, userId: user._id, roomIds, extraIds: selectedExtras, totalAmount, status: "pending" };
            const response = await axiosClient.post("/bookings", bookingData);
            const newBooking = response.data;

            const paymentResponse = await axiosClient.post('/payments/vnpay/create', {
                bookingId: newBooking._id,
                amount: totalAmount, 
            });

            if (paymentResponse?.paymentUrl) {
                window.location.href = paymentResponse.paymentUrl;
            } else {
                navigate("/my-bookings");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create booking");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading && !hotel) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-100">
                <div className="flex flex-col items-center gap-4">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                    <p className="text-sm font-bold text-primary animate-pulse tracking-widest uppercase">Preparing your stay...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-200/50 pb-20">
            {/* Unified Progress Bar */}
            <div className="bg-primary text-primary-content py-3 shadow-lg mb-8 sticky top-0 z-40">
                <div className="container mx-auto px-6 max-w-7xl flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <ShieldCheck size={24} weight="fill" />
                        <span className="text-sm font-bold uppercase tracking-tight">Secure Booking Platform</span>
                    </div>
                    <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest">
                        <span className="flex items-center gap-2 border-b-2 border-white pb-1">1. Details</span>
                        <span className="flex items-center gap-2 opacity-40">2. Payment</span>
                        <span className="flex items-center gap-2 opacity-40">3. Confirm</span>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 max-w-7xl">
                <div className="grid lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-4 lg:sticky lg:top-24 h-fit space-y-8">
                        <HotelInfoCard hotel={hotel} reviews={reviews} />
                        <div className="card bg-base-100 shadow-xl border-t-4 border-warning overflow-hidden">
                            <div className="card-body p-6">
                                <h3 className="text-lg font-black flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-warning/10 rounded-lg text-warning"><UsersIcon size={24} weight="bold" /></div>
                                    Booking Policy
                                </h3>
                                <div className="space-y-5">
                                    <div className="flex justify-between items-center bg-base-200/50 p-3 rounded-xl">
                                        <span className="text-xs font-bold opacity-40 uppercase">Travelers</span>
                                        <span className="font-black text-lg">{currentTotalGuests}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-base-200/50 p-3 rounded-xl">
                                        <span className="text-xs font-bold opacity-40 uppercase">Required Rooms</span>
                                        <span className="font-black text-lg text-primary">{currentRoomsNeeded}</span>
                                    </div>
                                    <div className="divider my-0 opacity-20"></div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold opacity-40 uppercase">Selection</span>
                                        <div className={`font-black text-xl ${totalSelectedRooms === currentRoomsNeeded ? 'text-success' : 'text-error'}`}>{totalSelectedRooms} / {currentRoomsNeeded}</div>
                                    </div>
                                    {totalSelectedRooms !== currentRoomsNeeded && (
                                        <div className="alert alert-warning rounded-2xl border-none shadow-inner text-[10px] font-black leading-relaxed py-2">
                                            <Info size={18} weight="fill" />
                                            <span>Please select exactly {currentRoomsNeeded} rooms.</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-8">
                        <BookingFormCard hotel={hotel} formData={formData} rooms={rooms} extraFees={extraFees} roomSelections={roomSelections} selectedExtras={selectedExtras} totalAmount={totalAmount} submitting={submitting} onInputChange={handleInputChange} onNumberChange={handleNumberChange} onRoomQuantityChange={handleRoomQuantityChange} onExtraToggle={handleExtraToggle} onSubmit={handleSubmit} />
                    </div>
                </div>
                <div className="mt-20 border-t border-base-300 pt-16">
                    <h2 className="text-3xl font-black mb-10 tracking-tight">Guest Reviews</h2>
                    <Reviews hotelId={id} />
                </div>
            </div>
        </div>
    );
};

export default HotelBooking;
