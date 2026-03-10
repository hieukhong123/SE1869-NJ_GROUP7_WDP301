import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axiosClient from "../../services/axiosClient";
import {
    UsersIcon,
    BedIcon,
    MapPinIcon,
    StarIcon,
    MagnifyingGlassIcon,
    CheckCircleIcon,
    FunnelIcon,
    CalendarIcon,
    InfoIcon
} from "@phosphor-icons/react";
import { toast } from "sonner";

const RoomCatalog = () => {
    const [rooms, setRooms] = useState([]);
    const [allHotels, setAllHotels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Filters State from URL
    const [selectedCity, setSelectedCity] = useState(searchParams.get("city") || "");
    const [selectedHotel, setSelectedHotel] = useState(searchParams.get("hotelId") || "");
    const [searchQuery, setSearchQuery] = useState(searchParams.get("query") || "");
    const [priceRange, setPriceRange] = useState(5000); 
    const [checkIn, setCheckIn] = useState(searchParams.get("checkIn") || "");
    const [checkOut, setCheckOut] = useState(searchParams.get("checkOut") || "");
    const [guests, setGuests] = useState(parseInt(searchParams.get("guests")) || 2);
    const [sortBy, setSortBy] = useState("Best Match");

    const navigate = useNavigate();

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const dateParams = {};
            if (checkIn) dateParams.checkIn = checkIn;
            if (checkOut) dateParams.checkOut = checkOut;
            const queryStr = new URLSearchParams(dateParams).toString();

            const [hotelsResponse, roomsResponse] = await Promise.all([
                axiosClient.get("/hotels"),
                axiosClient.get(`/rooms?${queryStr}`)
            ]);
            setAllHotels(hotelsResponse.data || []);
            setRooms(roomsResponse.data || []);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load search results");
        } finally {
            setLoading(false);
        }
    }, [checkIn, checkOut]);

    useEffect(() => {
        fetchData();
    }, [fetchData]); // Refetch when fetchData changes (which depends on dates)

    const cities = [...new Set(allHotels.map(hotel => hotel.city).filter(Boolean))];

    const handleSearchClick = () => {
        const params = new URLSearchParams();
        if (searchQuery) params.append("query", searchQuery);
        if (selectedCity) params.append("city", selectedCity);
        if (selectedHotel) params.append("hotelId", selectedHotel);
        if (checkIn) params.append("checkIn", checkIn);
        if (checkOut) params.append("checkOut", checkOut);
        if (guests) params.append("guests", guests);
        setSearchParams(params);
    };

    // Calculate rooms needed: Max 2 guests per room
    const roomsNeeded = Math.ceil(guests / 2);

    // Group rooms by Hotel and apply search requirements
    const displayedHotels = useMemo(() => {
        const hotelsMap = {};
        
        rooms.forEach(room => {
            const hotelId = room.hotelId?._id || room.hotelId;
            if (!hotelsMap[hotelId]) {
                const hotelData = allHotels.find(h => h._id === hotelId);
                if (hotelData) {
                    hotelsMap[hotelId] = {
                        ...hotelData,
                        rooms: [],
                        totalAvailableQuantity: 0,
                        minPrice: Infinity
                    };
                }
            }
            
            // Use availableQuantity from backend (which accounts for dates)
            const available = room.availableQuantity !== undefined ? room.availableQuantity : room.quantity;

            if (hotelsMap[hotelId] && room.status === "available" && available > 0) {
                hotelsMap[hotelId].rooms.push(room);
                hotelsMap[hotelId].totalAvailableQuantity += available;
                if (room.roomPrice < hotelsMap[hotelId].minPrice) {
                    hotelsMap[hotelId].minPrice = room.roomPrice;
                }
            }
        });

        let result = Object.values(hotelsMap).filter(hotel => {
            const matchesSearch = searchQuery === "" ||
                hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                hotel.city.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesCity = !selectedCity || hotel.city === selectedCity;
            const matchesHotelFilter = !selectedHotel || hotel._id === selectedHotel;
            const matchesPrice = hotel.minPrice <= priceRange;
            const hasEnoughRooms = hotel.totalAvailableQuantity >= roomsNeeded;

            return matchesSearch && matchesCity && matchesHotelFilter && matchesPrice && hasEnoughRooms;
        });

        if (sortBy === "Lowest Price First") {
            result.sort((a, b) => a.minPrice - b.minPrice);
        } else if (sortBy === "Highest Price First") {
            result.sort((a, b) => b.minPrice - a.minPrice);
        } else if (sortBy === "Highest Rating") {
            result.sort((a, b) => (parseFloat(b.averageRating) || 0) - (parseFloat(a.averageRating) || 0));
        }

        return result;
    }, [rooms, allHotels, searchQuery, selectedCity, selectedHotel, priceRange, sortBy, roomsNeeded]);

    const handleViewHotel = (hotelId) => {
        const params = new URLSearchParams();
        if (checkIn) params.append("checkIn", checkIn);
        if (checkOut) params.append("checkOut", checkOut);
        if (guests) params.append("guests", guests);
        navigate(`/hotels/${hotelId}/book?${params.toString()}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-base-200 flex items-center justify-center">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-200/50">
            {/* Top Search Bar */}
            <div className="bg-base-100 border-b border-base-300 sticky top-0 z-20 shadow-sm py-4">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-50 relative">
                            <label className="text-[10px] font-black text-base-content/60 uppercase ml-1 tracking-widest">Destination</label>
                            <div className="relative mt-1">
                                <input
                                    type="text"
                                    placeholder="Hotel or city"
                                    className="input input-bordered input-sm w-full pl-10 focus:outline-primary bg-base-200/50 border-none"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none" size={18} />
                            </div>
                        </div>
                        
                        <div className="w-full md:w-32">
                            <label className="text-[10px] font-black text-base-content/60 uppercase ml-1 tracking-widest">Check-in</label>
                            <div className="relative mt-1">
                                <input
                                    type="date"
                                    className="input input-bordered input-sm w-full pl-9 focus:outline-primary bg-base-200/50 border-none"
                                    value={checkIn}
                                    onChange={(e) => setCheckIn(e.target.value)}
                                />
                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none" size={16} />
                            </div>
                        </div>

                        <div className="w-full md:w-32">
                            <label className="text-[10px] font-black text-base-content/60 uppercase ml-1 tracking-widest">Check-out</label>
                            <div className="relative mt-1">
                                <input
                                    type="date"
                                    className="input input-bordered input-sm w-full pl-9 focus:outline-primary bg-base-200/50 border-none"
                                    value={checkOut}
                                    onChange={(e) => setCheckOut(e.target.value)}
                                />
                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none" size={16} />
                            </div>
                        </div>

                        <div className="w-full md:w-24">
                            <label className="text-[10px] font-black text-base-content/60 uppercase ml-1 tracking-widest">Guests</label>
                            <div className="relative mt-1">
                                <input
                                    type="number"
                                    min="1"
                                    className="input input-bordered input-sm w-full pl-9 focus:outline-primary bg-base-200/50 border-none"
                                    value={guests}
                                    onChange={(e) => setGuests(parseInt(e.target.value))}
                                />
                                <UsersIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none" size={16} />
                            </div>
                        </div>

                        <button 
                            className="btn btn-primary btn-sm px-8 font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                            onClick={handleSearchClick}
                        >
                            SEARCH
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-7xl py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filters */}
                    <aside className="w-full lg:w-72 shrink-0 space-y-6">
                        <div className="bg-base-100 rounded-2xl shadow-xl border border-base-300 p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <FunnelIcon size={20} weight="bold" className="text-primary" />
                                <span className="font-black uppercase tracking-widest text-sm">Filters</span>
                            </div>
                            
                            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 mb-8">
                                <div className="flex items-start gap-3">
                                    <InfoIcon size={20} className="text-primary shrink-0" />
                                    <p className="text-[11px] text-primary/80 font-bold uppercase leading-relaxed">
                                        Booking for {guests} travelers requires {roomsNeeded} rooms.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="space-y-8">
                                <div>
                                    <h3 className="font-black text-[10px] uppercase tracking-widest text-base-content/40 mb-4">Max Price: ${priceRange}</h3>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="5000" 
                                        step="100"
                                        value={priceRange} 
                                        onChange={(e) => setPriceRange(Number(e.target.value))}
                                        className="range range-primary range-xs" 
                                    />
                                </div>

                                <div>
                                    <h3 className="font-black text-[10px] uppercase tracking-widest text-base-content/40 mb-4">Cities</h3>
                                    <div className="space-y-3">
                                        {cities.slice(0, 8).map(city => (
                                            <label key={city} className="flex items-center gap-3 cursor-pointer group">
                                                <input 
                                                    type="checkbox" 
                                                    className="checkbox checkbox-sm checkbox-primary rounded-lg"
                                                    checked={selectedCity === city}
                                                    onChange={() => setSelectedCity(selectedCity === city ? "" : city)}
                                                />
                                                <span className="text-sm font-bold opacity-70 group-hover:opacity-100 transition-opacity">{city}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Main Results Area */}
                    <main className="flex-1">
                        <div className="bg-base-100 rounded-2xl shadow-xl border border-base-300 p-4 mb-6 flex justify-between items-center">
                            <h2 className="text-lg font-black tracking-tight uppercase ml-2">
                                {displayedHotels.length} hotels found
                            </h2>
                            <select 
                                className="select select-sm font-black bg-base-200/50 border-none rounded-xl"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option>Best Match</option>
                                <option>Lowest Price First</option>
                                <option>Highest Price First</option>
                                <option>Highest Rating</option>
                            </select>
                        </div>

                        {displayedHotels.length === 0 ? (
                            <div className="bg-base-100 rounded-3xl shadow-xl border border-base-300 py-32 text-center">
                                <div className="w-20 h-20 bg-base-200 rounded-3xl flex items-center justify-center mx-auto mb-6 text-base-content/20">
                                    <BedIcon size={40} weight="duotone" />
                                </div>
                                <h3 className="text-2xl font-black uppercase tracking-tight mb-2">No hotels available</h3>
                                <p className="text-base-content/40 font-medium max-w-xs mx-auto">Try adjusting your filters or changing your travel dates.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {displayedHotels.map((hotel) => (
                                    <div
                                        key={hotel._id}
                                        className="bg-base-100 rounded-3xl shadow-xl border border-base-300 flex flex-col md:flex-row overflow-hidden hover:border-primary/30 transition-all duration-500 group cursor-pointer"
                                        onClick={() => handleViewHotel(hotel._id)}
                                    >
                                        {/* Hotel Image */}
                                        <div className="w-full md:w-80 h-64 md:h-auto relative overflow-hidden shrink-0">
                                            <img
                                                src={hotel.photos?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500"}
                                                alt={hotel.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                            <div className="absolute top-4 left-4">
                                                <span className="bg-primary text-primary-content text-[10px] font-black px-3 py-1.5 rounded-xl shadow-lg uppercase tracking-widest">PRO CHOICE</span>
                                            </div>
                                        </div>

                                        {/* Hotel Content */}
                                        <div className="flex-1 p-6 md:p-8 flex flex-col md:flex-row gap-8">
                                            <div className="flex-1 space-y-4">
                                                <div>
                                                    <h3 className="text-2xl font-black tracking-tight mb-2 group-hover:text-primary transition-colors">{hotel.name}</h3>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex text-warning">
                                                            {[...Array(5)].map((_, i) => (
                                                                <StarIcon key={i} size={14} weight={i < 4 ? "fill" : "regular"} />
                                                            ))}
                                                        </div>
                                                        <span className="text-[10px] font-black text-base-content/30 uppercase tracking-tighter">• {hotel.city}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                                                    <MapPinIcon size={18} weight="bold" />
                                                    <span className="line-clamp-1">{hotel.address}</span>
                                                </div>
                                                
                                                <div className="flex flex-wrap gap-2 pt-4">
                                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase bg-success/10 text-success px-3 py-1.5 rounded-xl border border-success/20">
                                                        <CheckCircleIcon size={16} weight="fill" />
                                                        <span>FREE Cancellation</span>
                                                    </div>
                                                    <div className="bg-primary/10 text-primary text-[10px] font-black uppercase px-3 py-1.5 rounded-xl border border-primary/20">
                                                        {hotel.totalAvailableQuantity} rooms left
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="md:w-56 md:border-l border-base-300 md:pl-8 flex flex-col justify-between text-right">
                                                <div className="flex justify-end gap-3 items-start">
                                                    <div className="text-right">
                                                        <p className="font-black text-sm uppercase tracking-tight">Excellent</p>
                                                        <p className="text-[10px] font-bold opacity-30 uppercase">{hotel.reviewCount || 0} reviews</p>
                                                    </div>
                                                    <div className="bg-primary text-primary-content font-black h-12 w-12 rounded-2xl flex items-center justify-center text-lg shadow-xl shadow-primary/20">
                                                        {hotel.averageRating || "8.5"}
                                                    </div>
                                                </div>

                                                <div className="mt-8">
                                                    <p className="text-[10px] font-black text-base-content/30 uppercase tracking-widest mb-1">Starts from</p>
                                                    <div className="flex items-center justify-end gap-1 text-primary leading-none">
                                                        <span className="text-sm font-black">$</span>
                                                        <span className="text-4xl font-black tracking-tighter">{hotel.minPrice}</span>
                                                    </div>
                                                    <button 
                                                        className="btn btn-primary w-full mt-6 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewHotel(hotel._id);
                                                        }}
                                                    >
                                                        VIEW DETAILS
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default RoomCatalog;
