import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axiosClient from "../../services/axiosClient";
import {
    Users,
    Bed,
    MagnifyingGlass,
    CaretDown,
    CircleNotch,
    CaretLeft,
    CaretRight
} from "@phosphor-icons/react";
import { toast } from "sonner";

const LuxuryDropdown = ({ label, value, options, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Xử lý click ra ngoài để đóng dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className="relative" ref={dropdownRef}>
            <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">
                {label}
            </label>
            <div 
                className="relative flex items-center justify-between w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-gray-900 font-light cursor-pointer group"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={!value ? "text-gray-400" : "text-gray-900"}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <CaretDown 
                    size={16} 
                    weight="light" 
                    className={`text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} 
                />
                
                <div className={`absolute bottom-[-1px] left-0 h-[1px] bg-orange-800 transition-all duration-300 ${isOpen ? "w-full" : "w-0 group-hover:w-full"}`}></div>
            </div>

            {isOpen && (
                <div className="absolute z-50 top-full left-0 mt-2 w-full bg-white border border-gray-100 shadow-xl rounded-sm py-2 max-h-64 overflow-y-auto">
                    <div 
                        className={`px-4 py-3 text-sm font-light cursor-pointer transition-colors ${!value ? "text-orange-800 bg-orange-50/50" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}
                        onClick={() => { onChange(""); setIsOpen(false); }}
                    >
                        {placeholder}
                    </div>
                    {options.map((opt) => (
                        <div
                            key={opt.value}
                            className={`px-4 py-3 text-sm font-light cursor-pointer transition-colors ${value === opt.value ? "text-orange-800 bg-orange-50/50" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}
                            onClick={() => { onChange(opt.value); setIsOpen(false); }}
                        >
                            {opt.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
// ----------------------------------------

const RoomCatalog = () => {
    const [rooms, setRooms] = useState([]);
    const [allHotels, setAllHotels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    
    const [selectedCity, setSelectedCity] = useState(searchParams.get("city") || "");
    const [selectedHotel, setSelectedHotel] = useState(searchParams.get("hotelId") || "");
    const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
    const [currentPage, setCurrentPage] = useState(1);
    const navigate = useNavigate();

    const ROOMS_PER_PAGE = 9;

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const hotelsResponse = await axiosClient.get("/hotels");
            setAllHotels(hotelsResponse.data || []);
            const roomsResponse = await axiosClient.get("/rooms");
            setRooms(roomsResponse.data || []);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load portfolio");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const cities = [...new Set(allHotels.map(hotel => hotel.city).filter(Boolean))];

    const filteredHotels = selectedCity
        ? allHotels.filter(hotel => hotel.city === selectedCity)
        : allHotels;

    const filteredHotelIds = filteredHotels.map(hotel => hotel._id);

    const handleCityFilter = (cityValue) => {
        setSelectedCity(cityValue);
        setSelectedHotel("");
        setCurrentPage(1);

        const params = {};
        if (cityValue) params.city = cityValue;
        if (searchQuery) params.search = searchQuery;
        setSearchParams(params);
    };

    const handleHotelFilter = (hotelValue) => {
        setSelectedHotel(hotelValue);
        setCurrentPage(1);

        const params = {};
        if (selectedCity) params.city = selectedCity;
        if (hotelValue) params.hotelId = hotelValue;
        if (searchQuery) params.search = searchQuery;
        setSearchParams(params);
    };

    const handleSearchChange = (value) => {
        setSearchQuery(value);
        setCurrentPage(1);
        
        const params = {};
        if (selectedCity) params.city = selectedCity;
        if (selectedHotel) params.hotelId = selectedHotel;
        if (value) params.search = value;
        setSearchParams(params);
    };

    const filteredRooms = rooms.filter((room) => {
        const matchesSearch = searchQuery === "" ||
            room.roomName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            room.hotelId?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = room.status === "available";

        const roomHotelId = room.hotelId?._id || room.hotelId;
        const matchesCity = !selectedCity || filteredHotelIds.includes(roomHotelId);
        const matchesHotel = !selectedHotel || roomHotelId === selectedHotel;

        return matchesSearch && matchesStatus && matchesCity && matchesHotel;
    });

    const handleViewHotel = (hotelId) => {
        navigate(`/hotels/${hotelId}/book`);
    };

    // Pagination logic
    const totalPages = Math.ceil(filteredRooms.length / ROOMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ROOMS_PER_PAGE;
    const endIndex = startIndex + ROOMS_PER_PAGE;
    const currentRooms = filteredRooms.slice(startIndex, endIndex);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cityOptions = cities.map(city => ({ label: city, value: city }));
    const hotelOptions = filteredHotels.map(hotel => ({ label: hotel.name, value: hotel._id }));

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FFFCFA] flex flex-col items-center justify-center gap-4">
                <CircleNotch size={32} weight="light" className="text-orange-800 animate-spin" />
                <p className="text-gray-500 font-light text-sm tracking-widest uppercase">
                    Curating accommodations...
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFFCFA] py-24">
            <div className="container mx-auto px-4 max-w-7xl">
                
                {/* Header */}
                <div className="mb-16 text-center">
                    <span className="text-xs uppercase tracking-[0.2em] font-medium text-orange-800 mb-4 block">
                        Our Collection
                    </span>
                    <h1 className="text-4xl md:text-5xl font-serif text-gray-900 mb-4">
                        Room Portfolio
                    </h1>
                    <p className="text-gray-500 font-light max-w-2xl mx-auto">
                        Browse our curated selection of available rooms and suites across all distinguished properties.
                    </p>
                </div>

                <div className="mb-12 py-8 border-y border-gray-200">
                    <div className="grid md:grid-cols-3 gap-8">
                        
                        {/* Search Input */}
                        <div className="relative group">
                            <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">
                                Search
                            </label>
                            <div className="relative flex items-center border-b border-gray-300">
                                <MagnifyingGlass size={18} weight="light" className="absolute left-0 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Room or property name..."
                                    className="w-full bg-transparent border-0 pl-8 pr-0 py-2 text-gray-900 font-light focus:ring-0 placeholder-gray-400"
                                    value={searchQuery}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                />
                                <div className="absolute bottom-[-1px] left-0 w-0 h-[1px] bg-orange-800 transition-all duration-300 group-hover:w-full group-focus-within:w-full"></div>
                            </div>
                        </div>

                        <LuxuryDropdown 
                            label="Destination"
                            placeholder="All Destinations"
                            options={cityOptions}
                            value={selectedCity}
                            onChange={handleCityFilter}
                        />

                        <LuxuryDropdown 
                            label="Property"
                            placeholder={selectedCity ? `All Properties in ${selectedCity}` : "All Properties"}
                            options={hotelOptions}
                            value={selectedHotel}
                            onChange={handleHotelFilter}
                        />

                    </div>
                </div>

                <div className="mb-8 flex justify-between items-end">
                    <p className="text-sm font-light uppercase tracking-widest text-gray-500">
                        {filteredRooms.length} {filteredRooms.length === 1 ? "Accommodation" : "Accommodations"} found
                    </p>
                    {totalPages > 1 && (
                        <p className="text-xs font-light uppercase tracking-widest text-gray-400">
                            Page {currentPage} of {totalPages}
                        </p>
                    )}
                </div>

                {filteredRooms.length === 0 ? (
                    <div className="text-center py-24 flex flex-col items-center">
                        <Bed size={64} weight="light" className="text-gray-300 mb-6" />
                        <h3 className="text-2xl font-serif text-gray-900 mb-2">No availability</h3>
                        <p className="text-gray-500 font-light max-w-md mx-auto">
                            We couldn't find any rooms matching your current criteria. Please adjust your filters to explore other options.
                        </p>
                        <button 
                            onClick={() => {
                                setSearchQuery("");
                                setSelectedCity("");
                                setSelectedHotel("");
                                setCurrentPage(1);
                                setSearchParams({});
                            }}
                            className="mt-8 text-sm uppercase tracking-widest text-orange-800 hover:text-gray-900 transition-colors border-b border-orange-800 pb-1 hover:border-gray-900"
                        >
                            Clear Filters
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
                            {currentRooms.map((room) => (
                            <div
                                key={room._id}
                                className="group bg-white flex flex-col border border-gray-100 hover:shadow-xl transition-all duration-500 overflow-hidden rounded-sm"
                            >
                                {/* Room Image */}
                                <figure className="relative h-64 bg-gray-50 overflow-hidden">
                                    {room.photo ? (
                                        <img
                                            src={room.photo}
                                            alt={room.roomName}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Bed size={48} weight="light" className="text-gray-300" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-500"></div>
                                </figure>

                                <div className="p-8 flex flex-col flex-grow">
                                    <div className="text-xs uppercase tracking-[0.15em] text-orange-800 font-medium mb-3">
                                        {room.hotelId?.name || "Independent Property"}
                                    </div>

                                    <h2 className="text-2xl font-serif text-gray-900 mb-4 line-clamp-1">
                                        {room.roomName}
                                    </h2>

                                    {room.description && (
                                        <p className="text-sm font-light text-gray-500 line-clamp-2 mb-6 leading-relaxed">
                                            {room.description}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-6 mb-8 text-sm font-light text-gray-500">
                                        <div className="flex items-center gap-2">
                                            <Users size={16} weight="light" className="text-gray-400" />
                                            <span>Up to {room.maxOccupancy} guests</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Bed size={16} weight="light" className="text-gray-400" />
                                            <span>{room.quantity} left</span>
                                        </div>
                                    </div>

                                    <div className="mt-auto flex items-center justify-between pt-6 border-t border-gray-100">
                                        <div className="flex flex-col">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-lg text-gray-900 font-medium tracking-wide">
                                                    ${room.roomPrice?.toLocaleString()}
                                                </span>
                                            </div>
                                            <span className="text-[10px] uppercase tracking-widest text-gray-400">
                                                Per Night
                                            </span>
                                        </div>
                                        
                                        <button
                                            className="px-6 py-2.5 bg-transparent border border-orange-800 text-orange-800 hover:bg-orange-800 hover:text-white transition-colors duration-300 text-xs tracking-widest uppercase rounded-sm"
                                            onClick={() => handleViewHotel(room.hotelId._id || room.hotelId)}
                                        >
                                            Reserve
                                        </button>
                                    </div>
                                </div>
                            </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-16 flex justify-center items-center gap-2">
                                {/* Previous Button */}
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`p-2 border rounded-sm transition-all duration-300 ${
                                        currentPage === 1
                                            ? "border-gray-200 text-gray-300 cursor-not-allowed"
                                            : "border-gray-300 text-gray-600 hover:border-orange-800 hover:text-orange-800"
                                    }`}
                                >
                                    <CaretLeft size={18} weight="light" />
                                </button>

                                {/* Page Numbers */}
                                <div className="flex gap-2">
                                    {[...Array(totalPages)].map((_, index) => {
                                        const pageNumber = index + 1;
                                        
                                        // Show first page, last page, current page, and pages around current
                                        if (
                                            pageNumber === 1 ||
                                            pageNumber === totalPages ||
                                            (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={pageNumber}
                                                    onClick={() => handlePageChange(pageNumber)}
                                                    className={`min-w-[40px] h-[40px] border rounded-sm text-sm font-light transition-all duration-300 ${
                                                        currentPage === pageNumber
                                                            ? "bg-orange-800 text-white border-orange-800"
                                                            : "border-gray-300 text-gray-600 hover:border-orange-800 hover:text-orange-800"
                                                    }`}
                                                >
                                                    {pageNumber}
                                                </button>
                                            );
                                        } else if (
                                            pageNumber === currentPage - 2 ||
                                            pageNumber === currentPage + 2
                                        ) {
                                            return (
                                                <span
                                                    key={pageNumber}
                                                    className="min-w-[40px] h-[40px] flex items-center justify-center text-gray-400"
                                                >
                                                    ...
                                                </span>
                                            );
                                        }
                                        return null;
                                    })}
                                </div>

                                {/* Next Button */}
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`p-2 border rounded-sm transition-all duration-300 ${
                                        currentPage === totalPages
                                            ? "border-gray-200 text-gray-300 cursor-not-allowed"
                                            : "border-gray-300 text-gray-600 hover:border-orange-800 hover:text-orange-800"
                                    }`}
                                >
                                    <CaretRight size={18} weight="light" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default RoomCatalog;