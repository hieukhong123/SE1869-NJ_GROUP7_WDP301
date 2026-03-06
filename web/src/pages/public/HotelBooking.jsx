import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axiosClient from "../../services/axiosClient";
import { toast } from "sonner";
import { UsersIcon } from '@phosphor-icons/react';
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
    
    // Extra fee selections
    const [selectedExtras, setSelectedExtras] = useState([]);
    
    // Total amount
    const [totalAmount, setTotalAmount] = useState(0);

    // Derived requirements
    const currentTotalGuests = formData.adult + formData.children + formData.baby;
    const currentRoomsNeeded = Math.ceil(currentTotalGuests / 2);
    const totalSelectedRooms = Object.values(roomSelections).reduce((a, b) => a + b, 0);

    // Check if user is logged in
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
            console.error('Error parsing user data:', error);
            localStorage.removeItem('user');
            navigate('/login');
        }
    }, [navigate]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [hotelRes, roomsRes, extraRes, reviewsRes] = await Promise.all([
                    axiosClient.get(`/hotels/${id}`),
                    axiosClient.get(`/rooms?hotelId=${id}`),
                    axiosClient.get(`/extra-fees`),
                    axiosClient.get(`/reviews?hotelId=${id}`)
                ]);

                setHotel(hotelRes.data);
                setRooms(roomsRes.data || []);
                setExtraFees(extraRes.data.filter(e => e.hotelId._id === id || e.hotelId === id) || []);
                setReviews(reviewsRes.data || []);
            } catch (error) {
                console.error("Error fetching booking data:", error);
                toast.error("Failed to load booking information");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    // Update total amount whenever selections or dates change
    useEffect(() => {
        let total = 0;
        
        // Room costs
        Object.entries(roomSelections).forEach(([roomId, quantity]) => {
            const room = rooms.find(r => r._id === roomId);
            if (room) total += room.roomPrice * quantity;
        });
        
        // Extras cost
        selectedExtras.forEach(extraId => {
            const extra = extraFees.find(e => e._id === extraId);
            if (extra) total += parseFloat(extra.extraPrice);
        });

        // Multiplied by nights
        if (formData.checkIn && formData.checkOut) {
            const start = new Date(formData.checkIn);
            const end = new Date(formData.checkOut);
            const diffTime = end - start;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const nights = Math.max(1, diffDays);
            total *= nights;
        }
        
        setTotalAmount(total);
    }, [roomSelections, selectedExtras, rooms, extraFees, formData.checkIn, formData.checkOut]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNumberChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: Math.max(0, parseInt(value) || 0) }));
    };

    const handleRoomQuantityChange = (roomId, quantity) => {
        const room = rooms.find(r => r._id === roomId);
        const maxQty = room ? room.quantity : 0;
        const safeQty = Math.max(0, Math.min(quantity, maxQty));
        
        setRoomSelections(prev => ({
            ...prev,
            [roomId]: safeQty,
        }));
    };

    const handleExtraToggle = (extraId) => {
        setSelectedExtras(prev =>
            prev.includes(extraId)
                ? prev.filter(id => id !== extraId)
                : [...prev, extraId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (totalSelectedRooms !== currentRoomsNeeded) {
            toast.error(`Based on ${currentTotalGuests} travelers, you must select exactly ${currentRoomsNeeded} rooms (Max 2 per room).`);
            return;
        }

        if (!formData.name || !formData.phone || !formData.email) {
            toast.error("Please fill in all contact details");
            return;
        }

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
                roomIds: roomIds,
                extraIds: selectedExtras,
                totalAmount: totalAmount,
                status: "pending"
            };

            await axiosClient.post("/bookings", bookingData);
            toast.success("Booking created successfully!");
            navigate("/my-bookings");
        } catch (error) {
            console.error("Booking error:", error);
            toast.error(error.response?.data?.message || "Failed to create booking");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-200">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12">
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="grid lg:grid-cols-5 gap-8">
                    {/* Left: Hotel Details & Requirement Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <HotelInfoCard hotel={hotel} reviews={reviews} />
                        
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <UsersIcon size={24} className="text-primary" />
                                Booking Requirement
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Total Travelers:</span>
                                    <span className="font-bold">{currentTotalGuests}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Rooms Required (Max 2/room):</span>
                                    <span className="font-bold text-primary">{currentRoomsNeeded}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Currently Selected:</span>
                                    <span className={`font-bold ${totalSelectedRooms === currentRoomsNeeded ? 'text-success' : 'text-error'}`}>
                                        {totalSelectedRooms} / {currentRoomsNeeded}
                                    </span>
                                </div>
                                
                                {totalSelectedRooms !== currentRoomsNeeded && (
                                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 text-[11px] text-amber-800 leading-tight">
                                        Please adjust your room selection to exactly {currentRoomsNeeded} rooms.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Booking Form */}
                    <div className="lg:col-span-3">
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

                {/* Reviews Section */}
                <div className="mt-12">
                    <Reviews hotelId={id} />
                </div>
            </div>
        </div>
    );
};

export default HotelBooking;
