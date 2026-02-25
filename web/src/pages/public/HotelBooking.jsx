import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../../services/axiosClient";
import { toast } from "sonner";
import HotelInfoCard from "../../components/booking/HotelInfoCard";
import BookingFormCard from "../../components/booking/BookingFormCard";
import Reviews from "../../components/booking/Reviews";

const HotelBooking = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [user, setUser] = useState(null);
    
    // Hotel data
    const [hotel, setHotel] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [extraFees, setExtraFees] = useState([]);
    const [reviews, setReviews] = useState([]);
    
    // Form data
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        adult: 1,
        children: 0,
        baby: 0,
        checkIn: "",
        checkOut: "",
    });
    
    // Room selections
    const [roomSelections, setRoomSelections] = useState({});
    
    // Extra fee selections
    const [selectedExtras, setSelectedExtras] = useState([]);
    
    // Total amount
    const [totalAmount, setTotalAmount] = useState(0);

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
        } catch (error) {
            console.error('Error parsing user data:', error);
            toast.error("Invalid user session. Please login again");
            localStorage.removeItem('user');
            navigate('/login');
        }
    }, [navigate]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                // Fetch hotel details
                const hotelResponse = await axiosClient.get(`/hotels/${id}`);
                setHotel(hotelResponse.data);
                
                // Fetch rooms for this hotel
                const roomsResponse = await axiosClient.get(`/rooms?hotelId=${id}`);
                setRooms(roomsResponse.data);
                
                // Fetch extra fees for this hotel
                const extrasResponse = await axiosClient.get(`/extra-fees`);
                const hotelExtras = extrasResponse.data.filter(
                    extra => extra.hotelId._id === id || extra.hotelId === id
                );
                setExtraFees(hotelExtras);
                
                // Fetch reviews
                const reviewsResponse = await axiosClient.get(`/reviews?hotelId=${id}`);
                setReviews(reviewsResponse.data);
                
            } catch (err) {
                console.error("Error fetching data:", err);
                toast.error("Failed to load hotel details");
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [id]);
    
    // Set default dates
    useEffect(() => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        setFormData(prev => ({
            ...prev,
            checkIn: today.toISOString().split('T')[0],
            checkOut: tomorrow.toISOString().split('T')[0],
        }));
    }, []);
    
    // Calculate total amount
    useEffect(() => {
        let total = 0;
        
        // Calculate room costs
        Object.entries(roomSelections).forEach(([roomId, quantity]) => {
            if (quantity > 0) {
                const room = rooms.find(r => r._id === roomId);
                if (room) {
                    total += room.roomPrice * quantity;
                }
            }
        });
        
        // Calculate extra fees
        selectedExtras.forEach(extraId => {
            const extra = extraFees.find(e => e._id === extraId);
            if (extra) {
                total += parseFloat(extra.extraPrice);
            }
        });
        
        setTotalAmount(total);
    }, [roomSelections, selectedExtras, rooms, extraFees]);
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };
    
    const handleNumberChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: Math.max(0, parseInt(value) || 0),
        }));
    };
    
    const handleRoomQuantityChange = (roomId, quantity) => {
        const room = rooms.find(r => r._id === roomId);
        const maxQuantity = room ? room.quantity : 0;
        const validQuantity = Math.max(0, Math.min(quantity, maxQuantity));
        
        setRoomSelections(prev => ({
            ...prev,
            [roomId]: validQuantity,
        }));
    };
    
    const handleExtraToggle = (extraId) => {
        setSelectedExtras(prev => {
            if (prev.includes(extraId)) {
                return prev.filter(id => id !== extraId);
            } else {
                return [...prev, extraId];
            }
        });
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Check if user is logged in
        if (!user || !user._id) {
            toast.error("Please login to make a booking");
            navigate('/login');
            return;
        }
        
        // Validation
        if (!formData.name || !formData.phone || !formData.email) {
            toast.error("Please fill in all required fields");
            return;
        }
        
        // Check if at least one room is selected
        const selectedRooms = Object.entries(roomSelections)
            .filter(([_, quantity]) => quantity > 0)
            .map(([roomId, _]) => roomId);
            
        if (selectedRooms.length === 0) {
            toast.error("Please select at least one room");
            return;
        }
        
        try {
            setSubmitting(true);
            
            // Create room arrays based on quantities
            const roomIds = [];
            Object.entries(roomSelections).forEach(([roomId, quantity]) => {
                for (let i = 0; i < quantity; i++) {
                    roomIds.push(roomId);
                }
            });
            
            const bookingData = {
                userId: user._id,
                hotelId: id,
                roomIds: roomIds,
                extraIds: selectedExtras,
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                adult: formData.adult,
                children: formData.children,
                baby: formData.baby,
                checkIn: new Date(formData.checkIn),
                checkOut: new Date(formData.checkOut),
                totalAmount: totalAmount,
            };
            
            await axiosClient.post("/bookings", bookingData);
            
            toast.success("Booking created successfully!");
            navigate("/");
            
        } catch (err) {
            console.error("Error creating booking:", err);
            toast.error(err.response?.data?.message || "Failed to create booking");
        } finally {
            setSubmitting(false);
        }
    };
    
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }
    
    if (!hotel) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Hotel not found</h2>
                    <button className="btn btn-primary" onClick={() => navigate("/")}>
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-base-200 py-8">
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="grid lg:grid-cols-5 gap-6">
                    {/* Hotel Details Column */}
                    <div className="lg:col-span-2">
                        <HotelInfoCard hotel={hotel} reviews={reviews} />
                    </div>
                    
                    {/* Booking Form Column */}
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
                <div className="mt-8">
                    <Reviews hotelId={id} />
                </div>
            </div>
        </div>
    );
};

export default HotelBooking;
