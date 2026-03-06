import { useState, useEffect, useMemo } from "react";
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
    CalendarIcon
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

    useEffect(() => {
        fetchData();
    }, []);

    // Sync state with URL changes
    useEffect(() => {
        setSelectedCity(searchParams.get("city") || "");
        setSelectedHotel(searchParams.get("hotelId") || "");
        setSearchQuery(searchParams.get("query") || "");
        setCheckIn(searchParams.get("checkIn") || "");
        setCheckOut(searchParams.get("checkOut") || "");
        setGuests(parseInt(searchParams.get("guests")) || 2);
    }, [searchParams]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [hotelsResponse, roomsResponse] = await Promise.all([
                axiosClient.get("/hotels"),
                axiosClient.get("/rooms")
            ]);
            setAllHotels(hotelsResponse.data || []);
            setRooms(roomsResponse.data || []);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load search results");
        } finally {
            setLoading(false);
        }
    };

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
        // 1. Group rooms by hotelId
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
            
            if (hotelsMap[hotelId] && room.status === "available" && room.quantity > 0) {
                hotelsMap[hotelId].rooms.push(room);
                hotelsMap[hotelId].totalAvailableQuantity += room.quantity;
                if (room.roomPrice < hotelsMap[hotelId].minPrice) {
                    hotelsMap[hotelId].minPrice = room.roomPrice;
                }
            }
        });

        // 2. Filter hotels based on criteria
        let result = Object.values(hotelsMap).filter(hotel => {
            const matchesSearch = searchQuery === "" ||
                hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                hotel.city.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesCity = !selectedCity || hotel.city === selectedCity;
            const matchesHotelFilter = !selectedHotel || hotel._id === selectedHotel;
            const matchesPrice = hotel.minPrice <= priceRange;
            
            // Critical: Hotel must have enough rooms to accommodate guests (max 2 per room)
            const hasEnoughRooms = hotel.totalAvailableQuantity >= roomsNeeded;

            return matchesSearch && matchesCity && matchesHotelFilter && matchesPrice && hasEnoughRooms;
        });

        // 3. Apply Sorting
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
        <div className="min-h-screen bg-slate-50">
            {/* Top Search Bar */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm py-4">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[200px] relative">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Destination</label>
                            <div className="relative mt-1">
                                <input
                                    type="text"
                                    placeholder="Hotel or city"
                                    className="input input-bordered input-sm w-full pl-10 focus:outline-primary"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                            </div>
                        </div>
                        
                        <div className="w-full md:w-32">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Check-in</label>
                            <div className="relative mt-1">
                                <input
                                    type="date"
                                    className="input input-bordered input-sm w-full pl-9 focus:outline-primary"
                                    value={checkIn}
                                    onChange={(e) => setCheckIn(e.target.value)}
                                />
                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </div>
                        </div>

                        <div className="w-full md:w-32">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Check-out</label>
                            <div className="relative mt-1">
                                <input
                                    type="date"
                                    className="input input-bordered input-sm w-full pl-9 focus:outline-primary"
                                    value={checkOut}
                                    onChange={(e) => setCheckOut(e.target.value)}
                                />
                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </div>
                        </div>

                        <div className="w-full md:w-24">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Guests</label>
                            <div className="relative mt-1">
                                <input
                                    type="number"
                                    min="1"
                                    className="input input-bordered input-sm w-full pl-9 focus:outline-primary"
                                    value={guests}
                                    onChange={(e) => setGuests(parseInt(e.target.value))}
                                />
                                <UsersIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </div>
                        </div>

                        <button 
                            className="btn btn-primary btn-sm px-6 font-bold"
                            onClick={handleSearchClick}
                        >
                            SEARCH
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-7xl py-6">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Sidebar Filters */}
                    <aside className="w-full lg:w-72 shrink-0 space-y-4">
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <FunnelIcon size={18} weight="bold" />
                                <span className="font-bold">Requirement</span>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <p className="text-xs text-blue-800 font-medium">
                                    Booking for {guests} travelers requires at least {roomsNeeded} rooms (Max 2 guests per room).
                                </p>
                            </div>
                            
                            <div className="mt-6 space-y-6">
                                <div>
                                    <h3 className="font-bold text-sm mb-4">Max Price: ${priceRange}</h3>
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
                                    <h3 className="font-bold text-sm mb-3">Popular Cities</h3>
                                    <div className="space-y-2">
                                        {cities.slice(0, 5).map(city => (
                                            <label key={city} className="flex items-center gap-2 cursor-pointer hover:text-primary">
                                                <input 
                                                    type="checkbox" 
                                                    className="checkbox checkbox-sm checkbox-primary"
                                                    checked={selectedCity === city}
                                                    onChange={() => setSelectedCity(selectedCity === city ? "" : city)}
                                                />
                                                <span className="text-sm">{city}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Main Results Area */}
                    <main className="flex-1">
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold">{displayedHotels.length} hotels found</h2>
                            <select 
                                className="select select-sm select-ghost font-bold"
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
                            <div className="bg-white rounded-lg shadow-sm border border-slate-200 py-20 text-center">
                                <BedIcon size={64} weight="thin" className="mx-auto text-slate-300 mb-4" />
                                <h3 className="text-2xl font-bold text-slate-400">No hotels available</h3>
                                <p className="text-slate-500 mt-2">Try reducing guests or changing dates.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {displayedHotels.map((hotel) => (
                                    <div
                                        key={hotel._id}
                                        className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row overflow-hidden hover:border-primary transition-colors group cursor-pointer"
                                        onClick={() => handleViewHotel(hotel._id)}
                                    >
                                        {/* Hotel Image */}
                                        <div className="w-full md:w-72 h-56 md:h-auto relative overflow-hidden shrink-0">
                                            <img
                                                src={hotel.photos?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500"}
                                                alt={hotel.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute top-2 left-2 flex flex-col gap-1">
                                                <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded">ROOMERANG CHOICE</span>
                                            </div>
                                        </div>

                                        {/* Hotel Content */}
                                        <div className="flex-1 p-4 flex flex-col md:flex-row gap-4">
                                            <div className="flex-1 space-y-2">
                                                <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{hotel.name}</h3>
                                                <div className="flex items-center gap-1">
                                                    <div className="flex text-orange-400">
                                                        {[...Array(5)].map((_, i) => (
                                                            <StarIcon key={i} size={14} weight={i < 4 ? "fill" : "regular"} />
                                                        ))}
                                                    </div>
                                                    <span className="text-xs text-slate-500">• {hotel.city}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-primary text-sm font-semibold">
                                                    <MapPinIcon size={16} />
                                                    <span className="line-clamp-1">{hotel.address}</span>
                                                </div>
                                                
                                                <div className="flex flex-wrap gap-2 pt-2">
                                                    <div className="flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-100">
                                                        <CheckCircleIcon size={14} weight="fill" />
                                                        <span>FREE Cancellation</span>
                                                    </div>
                                                    <div className="bg-blue-50 text-blue-700 text-[11px] px-2 py-1 rounded border border-blue-100">
                                                        {hotel.totalAvailableQuantity} rooms left
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="md:w-48 md:border-l border-slate-100 md:pl-4 flex flex-col justify-between text-right">
                                                <div className="flex justify-end gap-2 items-start">
                                                    <div className="text-right">
                                                        <p className="font-bold text-sm">Excellent</p>
                                                        <p className="text-[10px] text-slate-500">{hotel.reviewCount || 0} reviews</p>
                                                    </div>
                                                    <div className="bg-primary text-white font-bold h-10 w-10 rounded-tr-lg rounded-bl-lg rounded-br-sm flex items-center justify-center">
                                                        {hotel.averageRating || "8.5"}
                                                    </div>
                                                </div>

                                                <div>
                                                    <p className="text-[10px] text-slate-500">Starts from</p>
                                                    <div className="flex items-center justify-end gap-1 text-primary leading-none">
                                                        <span className="text-xs font-bold">US$</span>
                                                        <span className="text-2xl font-black">{hotel.minPrice}</span>
                                                    </div>
                                                    <button 
                                                        className="btn btn-primary btn-md w-full mt-4"
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
