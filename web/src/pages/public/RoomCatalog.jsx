import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axiosClient from "../../services/axiosClient";
import {
    Users,
    CurrencyDollar,
    Bed
} from "@phosphor-icons/react";
import { toast } from "sonner";

const RoomCatalog = () => {
    const [rooms, setRooms] = useState([]);
    const [allHotels, setAllHotels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedCity, setSelectedCity] = useState(searchParams.get("city") || "");
    const [selectedHotel, setSelectedHotel] = useState(searchParams.get("hotelId") || "");
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch all hotels
            const hotelsResponse = await axiosClient.get("/hotels");
            setAllHotels(hotelsResponse.data || []);

            // Fetch all rooms
            const roomsResponse = await axiosClient.get("/rooms");
            setRooms(roomsResponse.data || []);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load rooms");
        } finally {
            setLoading(false);
        }
    };

    // Extract unique cities from hotels
    const cities = [...new Set(allHotels.map(hotel => hotel.city).filter(Boolean))];

    // Filter hotels by selected city
    const filteredHotels = selectedCity
        ? allHotels.filter(hotel => hotel.city === selectedCity)
        : allHotels;

    // Get IDs of filtered hotels for room filtering
    const filteredHotelIds = filteredHotels.map(hotel => hotel._id);

    const handleCityFilter = (city) => {
        setSelectedCity(city);
        setSelectedHotel(""); // Reset hotel filter when city changes

        const params = {};
        if (city) params.city = city;
        setSearchParams(params);
    };

    const handleHotelFilter = (hotelId) => {
        setSelectedHotel(hotelId);

        const params = {};
        if (selectedCity) params.city = selectedCity;
        if (hotelId) params.hotelId = hotelId;
        setSearchParams(params);
    };

    const filteredRooms = rooms.filter((room) => {
        const matchesSearch = searchQuery === "" ||
            room.roomName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            room.hotelId?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = room.status === "available";

        // Check if room belongs to a hotel in the filtered city
        const roomHotelId = room.hotelId?._id || room.hotelId;
        const matchesCity = !selectedCity || filteredHotelIds.includes(roomHotelId);
        const matchesHotel = !selectedHotel || roomHotelId === selectedHotel;

        return matchesSearch && matchesStatus && matchesCity && matchesHotel;
    });

    const handleBookNow = (hotelId) => {
        navigate(`/hotels/${hotelId}/book`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-base-200 flex items-center justify-center">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-200 py-8">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">Room Catalog</h1>
                    <p className="text-base-content/70">
                        Browse available rooms across all hotels
                    </p>
                </div>

                {/* Filters */}
                <div className="card bg-base-100 shadow-xl mb-6">
                    <div className="card-body p-6">
                        <div className="grid md:grid-cols-3 gap-4">
                            {/* Search Input */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Search</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Search by room or hotel name..."
                                    className="input input-bordered w-full"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* City Filter */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">City</span>
                                </label>
                                <select
                                    className="select select-bordered w-full"
                                    value={selectedCity}
                                    onChange={(e) => handleCityFilter(e.target.value)}
                                >
                                    <option value="">All Cities</option>
                                    {cities.map((city) => (
                                        <option key={city} value={city}>
                                            {city}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Hotel Filter */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Hotel</span>
                                </label>
                                <select
                                    className="select select-bordered w-full"
                                    value={selectedHotel}
                                    onChange={(e) => handleHotelFilter(e.target.value)}
                                >
                                    <option value="">
                                        {selectedCity ? `All Hotels in ${selectedCity}` : "All Hotels"}
                                    </option>
                                    {filteredHotels.map((hotel) => (
                                        <option key={hotel._id} value={hotel._id}>
                                            {hotel.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Count */}
                <div className="mb-4">
                    <p className="text-base-content/70">
                        Showing {filteredRooms.length} {filteredRooms.length === 1 ? "room" : "rooms"}
                    </p>
                </div>

                {/* Room Grid */}
                {filteredRooms.length === 0 ? (
                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body text-center py-16">
                            <Bed size={64} className="mx-auto text-base-content/30 mb-4" />
                            <h3 className="text-xl font-semibold mb-2">No rooms found</h3>
                            <p className="text-base-content/60">
                                Try adjusting your search or filter criteria
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRooms.map((room) => (
                            <div
                                key={room._id}
                                className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
                            >
                                {/* Room Image */}
                                <figure className="h-48 bg-gradient-to-br from-orange-50 to-orange-100">
                                    {room.photo ? (
                                        <img
                                            src={room.photo}
                                            alt={room.roomName}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Bed size={64} weight="duotone" className="text-orange-300" />
                                        </div>
                                    )}
                                </figure>

                                <div className="card-body">
                                    {/* Hotel Name Badge */}
                                    <div className="badge badge-primary badge-outline mb-2">
                                        {room.hotelId?.name || "Unknown Hotel"}
                                    </div>

                                    {/* Room Name */}
                                    <h2 className="card-title text-lg">
                                        {room.roomName}
                                    </h2>

                                    {/* Room Description */}
                                    {room.description && (
                                        <p className="text-sm text-base-content/70 line-clamp-2 mb-3">
                                            {room.description}
                                        </p>
                                    )}

                                    {/* Room Details */}
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Users size={18} className="text-primary" />
                                            <span>Max {room.maxOccupancy} guests</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Bed size={18} className="text-success" />
                                            <span>{room.quantity} {room.quantity === 1 ? "room" : "rooms"} available</span>
                                        </div>
                                    </div>

                                    {/* Price and Book Button */}
                                    <div className="card-actions items-center justify-between mt-auto pt-4 border-t border-base-300">
                                        <div>
                                            <div className="flex items-center gap-1 text-2xl font-bold text-primary">
                                                <CurrencyDollar size={24} weight="fill" />
                                                {room.roomPrice}
                                            </div>
                                            <p className="text-xs text-base-content/60">per night</p>
                                        </div>
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => handleBookNow(room.hotelId._id)}
                                        >
                                            Book Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoomCatalog;
