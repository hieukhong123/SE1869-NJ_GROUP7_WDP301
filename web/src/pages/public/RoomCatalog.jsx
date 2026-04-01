import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axiosClient from "../../services/axiosClient";
import {
    Users,
    Bed,
    Star,
    MagnifyingGlass,
    CaretDown,
    CircleNotch,
    CaretLeft,
    CaretRight,
    MapPin
} from "@phosphor-icons/react";
import { toast } from "sonner";

// --- UTILS ---
const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const getNextDateValue = (dateValue) => {
    if (!dateValue) return "";
    const [year, month, day] = dateValue.split("-").map(Number);
    const nextDate = new Date(year, month - 1, day);
    nextDate.setDate(nextDate.getDate() + 1);
    return formatDateForInput(nextDate);
};

// --- CUSTOM COMPONENTS ---
const LuxuryDropdown = ({ label, value, options, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find((option) => option.value === value);

    return (
        <div className="relative" ref={dropdownRef}>
            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">
                {label}
            </label>
            <div
                className="relative flex items-center justify-between w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-gray-900 font-light cursor-pointer group transition-colors hover:border-gray-900"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={!value ? "text-gray-400" : "text-gray-900"}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <CaretDown size={14} weight="light" className={`text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
            </div>

            {isOpen && (
                <div className="absolute z-50 top-full left-0 mt-1 w-full bg-white border border-gray-100 shadow-2xl rounded-sm py-2 max-h-64 overflow-y-auto animate-fade-in">
                    <div
                        className={`px-4 py-2.5 text-sm font-light cursor-pointer transition-colors ${!value ? "text-orange-800 bg-orange-50/50" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}
                        onClick={() => { onChange(""); setIsOpen(false); }}
                    >
                        {placeholder}
                    </div>
                    {options.map((option) => (
                        <div
                            key={option.value}
                            className={`px-4 py-2.5 text-sm font-light cursor-pointer transition-colors ${value === option.value ? "text-orange-800 bg-orange-50/50" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}
                            onClick={() => { onChange(option.value); setIsOpen(false); }}
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const LuxuryMultiSelectDropdown = ({ label, selectedValues, options, onToggle, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedLabel = selectedValues.length === 0
        ? placeholder
        : selectedValues.length <= 2
            ? selectedValues.join(", ")
            : `${selectedValues.slice(0, 2).join(", ")} +${selectedValues.length - 2}`;

    return (
        <div className="relative" ref={dropdownRef}>
            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">
                {label}
            </label>
            <div
                className="relative flex items-center justify-between w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-gray-900 font-light cursor-pointer group transition-colors hover:border-gray-900"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={selectedValues.length === 0 ? "text-gray-400 truncate" : "text-gray-900 truncate pr-4"}>
                    {selectedLabel}
                </span>
                <CaretDown size={14} weight="light" className={`text-gray-400 transition-transform duration-300 shrink-0 ${isOpen ? "rotate-180" : ""}`} />
            </div>

            {isOpen && (
                <div className="absolute z-50 top-full left-0 mt-1 w-full bg-white border border-gray-100 shadow-2xl rounded-sm py-2 max-h-64 overflow-y-auto animate-fade-in">
                    {options.length === 0 && (
                        <div className="px-4 py-3 text-sm font-light text-gray-400">No options available</div>
                    )}
                    {options.map((option) => {
                        const isSelected = selectedValues.includes(option.value);
                        return (
                            <div
                                key={option.value}
                                className={`px-4 py-2.5 text-sm font-light cursor-pointer transition-colors flex items-center justify-between ${isSelected ? "text-orange-800 bg-orange-50/50" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}
                                onClick={() => onToggle(option.value)}
                            >
                                <span className="truncate pr-4">{option.label}</span>
                                <span className={`w-3.5 h-3.5 rounded-full border transition-colors ${isSelected ? "border-orange-800 bg-orange-800" : "border-gray-300"}`}></span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// --- MAIN COMPONENT ---
const RoomCatalog = () => {
    // State Declarations
    const [allHotels, setAllHotels] = useState([]);
    const [allRooms, setAllRooms] = useState([]);
    const [allReviews, setAllReviews] = useState([]);
    const [allExtraFees, setAllExtraFees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [availabilityLoading, setAvailabilityLoading] = useState(false);

    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedCity, setSelectedCity] = useState(searchParams.get("city") || "");
    const [selectedHotel, setSelectedHotel] = useState(searchParams.get("hotelId") || "");
    const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
    const [guestCount, setGuestCount] = useState(searchParams.get("guests") || "");
    const [checkIn, setCheckIn] = useState(searchParams.get("checkIn") || "");
    const [checkOut, setCheckOut] = useState(searchParams.get("checkOut") || "");
    const [selectedRating, setSelectedRating] = useState(searchParams.get("rating") || "");
    const [selectedPropertyType, setSelectedPropertyType] = useState(searchParams.get("propertyType") || "");
    const [selectedExtraPackages, setSelectedExtraPackages] = useState(
        (searchParams.get("extras") || "").split(",").filter(Boolean)
    );
    const [currentPage, setCurrentPage] = useState(1);

    const [appliedFilters, setAppliedFilters] = useState({
        city: selectedCity,
        hotelId: selectedHotel,
        searchQuery: searchQuery,
        guestCount: guestCount,
        checkIn: checkIn,
        checkOut: checkOut,
        rating: selectedRating,
        propertyType: selectedPropertyType,
        extras: selectedExtraPackages
    });

    const navigate = useNavigate();
    const HOTELS_PER_PAGE = 9;

    // Date Logic
    const todayDateValue = useMemo(() => formatDateForInput(new Date()), []);
    const minimumCheckOutDate = checkIn ? getNextDateValue(checkIn) : todayDateValue;
    const hasPastCheckIn = Boolean(checkIn && checkIn < todayDateValue);
    const hasPastCheckOut = Boolean(checkOut && checkOut < todayDateValue);
    const hasDateRange = Boolean(checkIn && checkOut);
    const hasInvalidDateRange = hasDateRange && checkOut <= checkIn;
    const hasDateValidationError = hasPastCheckIn || hasPastCheckOut || hasInvalidDateRange;

    const dateValidationMessage = useMemo(() => {
        if (hasPastCheckIn) return "Check-in date cannot be in the past.";
        if (hasPastCheckOut) return "Check-out date cannot be in the past.";
        if (hasInvalidDateRange) return "Check-out date must be after check-in date.";
        return "";
    }, [hasPastCheckIn, hasPastCheckOut, hasInvalidDateRange]);

    const appliedHasPastCheckIn = Boolean(appliedFilters.checkIn && appliedFilters.checkIn < todayDateValue);
    const appliedHasPastCheckOut = Boolean(appliedFilters.checkOut && appliedFilters.checkOut < todayDateValue);
    const appliedIsInvalidRange = Boolean(appliedFilters.checkIn && appliedFilters.checkOut && appliedFilters.checkOut <= appliedFilters.checkIn);
    const appliedHasDateValidationError = appliedHasPastCheckIn || appliedHasPastCheckOut || appliedIsInvalidRange;

    // Data Fetching
    const fetchBaseData = useCallback(async () => {
        try {
            setLoading(true);
            const [hotelsRes, reviewsRes, extraFeesRes] = await Promise.all([
                axiosClient.get("/hotels"),
                axiosClient.get("/reviews"),
                axiosClient.get("/extra-fees/public"),
            ]);
            setAllHotels(hotelsRes.data || []);
            setAllReviews(reviewsRes.data || []);
            setAllExtraFees(extraFeesRes.data || []);
        } catch (error) {
            toast.error("Failed to load hotel portfolio");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBaseData();
    }, [fetchBaseData]);

    useEffect(() => {
        const fetchAvailabilityRooms = async () => {
            const hasAppliedDateRange = Boolean(appliedFilters.checkIn && appliedFilters.checkOut);
            const isInvalidRange = hasAppliedDateRange && appliedFilters.checkOut <= appliedFilters.checkIn;
            
            try {
                setAvailabilityLoading(true);
                const endpoint = hasAppliedDateRange && !isInvalidRange
                    ? `/rooms?checkIn=${appliedFilters.checkIn}&checkOut=${appliedFilters.checkOut}`
                    : "/rooms";
                const roomsResponse = await axiosClient.get(endpoint);
                setAllRooms(roomsResponse.data || []);
            } catch (error) {
                toast.error("Failed to refresh room availability");
            } finally {
                setAvailabilityLoading(false);
            }
        };
        fetchAvailabilityRooms();
    }, [appliedFilters.checkIn, appliedFilters.checkOut]);

    // Data Processing (Memos)
    const cities = useMemo(() => [...new Set(allHotels.map((h) => h.city).filter(Boolean))].sort(), [allHotels]);
    const propertyTypes = useMemo(() => [...new Set(allHotels.map((h) => h.propertyType).filter(Boolean))].sort(), [allHotels]);
    const extraPackageNames = useMemo(() => [...new Set(allExtraFees.map((f) => f.extraName).filter(Boolean))].sort(), [allExtraFees]);

    const filteredHotelsForDropdown = useMemo(() =>
        allHotels.filter((hotel) => {
            const matchesCity = !selectedCity || hotel.city === selectedCity;
            const matchesPropertyType = !selectedPropertyType || hotel.propertyType === selectedPropertyType;
            return matchesCity && matchesPropertyType;
        }),
        [allHotels, selectedCity, selectedPropertyType]
    );

    useEffect(() => {
        if (selectedHotel && !filteredHotelsForDropdown.some((h) => h._id === selectedHotel)) {
            setSelectedHotel("");
        }
    }, [selectedHotel, filteredHotelsForDropdown]);

    const ratingsByHotel = useMemo(() =>
        allReviews.reduce((acc, review) => {
            const hotelId = review.hotelId?._id || review.hotelId;
            if (!hotelId) return acc;
            if (!acc[hotelId]) acc[hotelId] = { total: 0, count: 0, average: 0 };
            acc[hotelId].total += Number(review.rating) || 0;
            acc[hotelId].count += 1;
            acc[hotelId].average = acc[hotelId].total / acc[hotelId].count;
            return acc;
        }, {}),
        [allReviews]
    );

    const normalizedExtrasByHotel = useMemo(() => {
        const extras = allExtraFees.reduce((acc, fee) => {
            const hotelId = fee.hotelId?._id || fee.hotelId;
            if (!hotelId || !fee.extraName) return acc;
            if (!acc[hotelId]) acc[hotelId] = new Set();
            acc[hotelId].add(fee.extraName);
            return acc;
        }, {});
        return Object.keys(extras).reduce((acc, hotelId) => {
            acc[hotelId] = Array.from(extras[hotelId]);
            return acc;
        }, {});
    }, [allExtraFees]);

    const roomStatsByHotel = useMemo(() =>
        allRooms.reduce((acc, room) => {
            const hotelId = room.hotelId?._id || room.hotelId;
            if (!hotelId) return acc;
            if (!acc[hotelId]) acc[hotelId] = { 
                hasAvailableRooms: false, 
                availableUnits: 0, 
                maxOccupancy: 0, 
                totalCapacity: 0,
                minPrice: Infinity 
            };
            
            const availableQuantity = Number(room.availableQuantity ?? room.quantity ?? 0);
            const isBookable = room.status === "available" && availableQuantity > 0;
            if (!isBookable) return acc;

            const roomMaxOccupancy = Number(room.maxOccupancy) || 0;

            acc[hotelId].hasAvailableRooms = true;
            acc[hotelId].availableUnits += availableQuantity;
            acc[hotelId].maxOccupancy = Math.max(acc[hotelId].maxOccupancy, roomMaxOccupancy);
            
            acc[hotelId].totalCapacity += (roomMaxOccupancy * availableQuantity);
            
            const roomPrice = Number(room.roomPrice) || 0;
            if (roomPrice > 0) acc[hotelId].minPrice = Math.min(acc[hotelId].minPrice, roomPrice);
            return acc;
        }, {}),
        [allRooms]
    );

    const filteredHotels = useMemo(() => {
        return allHotels.filter((hotel) => {
            if (appliedHasDateValidationError) return false;
            const hotelId = hotel._id;
            const roomStats = roomStatsByHotel[hotelId];
            const ratingInfo = ratingsByHotel[hotelId] || { average: 0, count: 0 };
            const hotelExtras = normalizedExtrasByHotel[hotelId] || [];
            const searchValue = appliedFilters.searchQuery.trim().toLowerCase();

            const matchesSearch = !searchValue ||
                hotel.name?.toLowerCase().includes(searchValue) ||
                hotel.city?.toLowerCase().includes(searchValue) ||
                hotel.address?.toLowerCase().includes(searchValue) ||
                hotel.description?.toLowerCase().includes(searchValue);
            const matchesAvailability = Boolean(roomStats?.hasAvailableRooms);
            const matchesCity = !appliedFilters.city || hotel.city === appliedFilters.city;
            const matchesHotel = !appliedFilters.hotelId || hotelId === appliedFilters.hotelId;
            
            const matchesGuests = !Number(appliedFilters.guestCount) || (roomStats?.totalCapacity || 0) >= Number(appliedFilters.guestCount);
            
            const matchesRating = !Number(appliedFilters.rating) || ratingInfo.average >= Number(appliedFilters.rating);
            const matchesPropertyType = !appliedFilters.propertyType || hotel.propertyType === appliedFilters.propertyType;
            const matchesExtraPackages = appliedFilters.extras.length === 0 ||
                appliedFilters.extras.every((extra) => hotelExtras.includes(extra));

            return matchesSearch && matchesAvailability && matchesCity && matchesHotel && matchesGuests && matchesRating && matchesPropertyType && matchesExtraPackages;
        });
    }, [allHotels, appliedHasDateValidationError, roomStatsByHotel, ratingsByHotel, normalizedExtrasByHotel, appliedFilters]);

    // Pagination
    const totalPages = Math.ceil(filteredHotels.length / HOTELS_PER_PAGE);
    const startIndex = (currentPage - 1) * HOTELS_PER_PAGE;
    const currentHotels = filteredHotels.slice(startIndex, startIndex + HOTELS_PER_PAGE);

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    // Handlers
    const handleCityFilter = (val) => { setSelectedCity(val); setSelectedHotel(""); };
    const handleSearchChange = (val) => { setSearchQuery(val); };
    const handlePropertyTypeFilter = (val) => { setSelectedPropertyType(val); setSelectedHotel(""); };
    const handleRatingFilter = (val) => { setSelectedRating(val); };
    const handleExtraPackageToggle = (val) => {
        setSelectedExtraPackages((prev) => prev.includes(val) ? prev.filter((item) => item !== val) : [...prev, val]);
    };
    const handleGuestChange = (value) => {
        if (value === "") { setGuestCount(""); return; }
        const parsedValue = Number(value);
        if (!Number.isFinite(parsedValue)) return;
        setGuestCount(String(Math.max(1, Math.floor(parsedValue))));
    };
    const handleCheckInChange = (value) => {
        if (value && value < todayDateValue) { toast.error("Check-in date cannot be in the past"); return; }
        setCheckIn(value);
        if (checkOut && value && checkOut <= value) { setCheckOut(""); toast.info("Check-out cleared. Please choose a new date."); }
    };
    const handleCheckOutChange = (value) => {
        if (value && value < todayDateValue) { toast.error("Check-out date cannot be in the past"); return; }
        if (checkIn && value && value <= checkIn) { toast.error("Check-out must be after check-in"); return; }
        setCheckOut(value);
    };
    const clearAllFilters = () => {
        setSelectedCity(""); setSelectedHotel(""); setSearchQuery(""); setGuestCount("");
        setCheckIn(""); setCheckOut(""); setSelectedRating(""); setSelectedPropertyType("");
        setSelectedExtraPackages([]); 
        
        setAppliedFilters({
            city: "", hotelId: "", searchQuery: "", guestCount: "",
            checkIn: "", checkOut: "", rating: "", propertyType: "", extras: []
        });
        
        setCurrentPage(1); setSearchParams({}, { replace: true });
    };
    
    // Nút TÌM KIẾM
    const handleSearchSubmit = () => {
        setAppliedFilters({
            city: selectedCity,
            hotelId: selectedHotel,
            searchQuery: searchQuery,
            guestCount: guestCount,
            checkIn: checkIn,
            checkOut: checkOut,
            rating: selectedRating,
            propertyType: selectedPropertyType,
            extras: selectedExtraPackages
        });
        setCurrentPage(1);

        const params = {};
        if (searchQuery.trim()) params.search = searchQuery.trim();
        if (selectedCity) params.city = selectedCity;
        if (selectedHotel) params.hotelId = selectedHotel;
        if (guestCount) params.guests = guestCount;
        if (checkIn) params.checkIn = checkIn;
        if (checkOut) params.checkOut = checkOut;
        if (selectedRating) params.rating = selectedRating;
        if (selectedPropertyType) params.propertyType = selectedPropertyType;
        if (selectedExtraPackages.length > 0) params.extras = selectedExtraPackages.join(",");
        setSearchParams(params, { replace: true });

        const resultsSection = document.getElementById("results-section");
        if (resultsSection) {
            window.scrollTo({ top: resultsSection.offsetTop - 100, behavior: "smooth" });
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleSearchSubmit();
        }
    };

    const handleViewHotel = (hotelId) => {
        const params = new URLSearchParams();
        if (checkIn) params.set("checkIn", checkIn);
        if (checkOut) params.set("checkOut", checkOut);
        if (guestCount) params.set("guests", guestCount); 
        navigate(`/hotels/${hotelId}/book${params.toString() ? `?${params.toString()}` : ""}`);
    };
    const handlePageChange = (page) => {
        setCurrentPage(page);
        const resultsSection = document.getElementById("results-section");
        if (resultsSection) {
            window.scrollTo({ top: resultsSection.offsetTop - 100, behavior: "smooth" });
        }
    };

    // Options
    const cityOptions = cities.map((city) => ({ label: city, value: city }));
    const ratingOptions = [1, 2, 3, 4, 5].map((star) => ({ label: `${star}+ Stars`, value: String(star) }));
    const propertyTypeOptions = propertyTypes.map((type) => ({ label: type, value: type }));
    const extraPackageOptions = extraPackageNames.map((pkg) => ({ label: pkg, value: pkg }));

    // --- RENDER ---
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
        <div className="min-h-screen bg-[#FFFCFA] pt-32 pb-24">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                
                {/* Hero Section */}
                <div className="mb-16 text-center">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-orange-800 mb-4 block">
                        Our Collection
                    </span>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-gray-900 mb-6">
                        Hotel Portfolio
                    </h1>
                    <p className="text-gray-500 font-light text-sm tracking-wide max-w-2xl mx-auto">
                        Discover extraordinary properties tailored to your needs. Refine your search below to uncover the perfect stay.
                    </p>
                </div>

                {/* Main Search Bar (Horizontal) */}
                <section className="mb-12 bg-white border border-gray-100 rounded-sm p-6 md:p-8 shadow-2xl shadow-gray-200/40 relative z-20">
                    <div className="flex justify-between items-end mb-6 border-b border-gray-100 pb-4">
                        <h2 className="text-xl font-serif text-gray-900">Find Your Stay</h2>
                        <button
                            onClick={clearAllFilters}
                            className="text-[10px] uppercase tracking-widest text-orange-800 hover:text-gray-900 transition-colors border-b border-orange-800 pb-0.5 hover:border-gray-900"
                        >
                            Reset Fields
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-end">
                        
                        {/* Search Keyword */}
                        <div className="relative group lg:col-span-4">
                            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Destination or Property</label>
                            <div className="relative flex items-center border-b border-gray-300 hover:border-gray-900 transition-colors">
                                <MagnifyingGlass size={16} weight="light" className="absolute left-0 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search city, address..."
                                    className="w-full bg-transparent border-0 pl-7 pr-0 py-2 text-gray-900 font-light focus:ring-0 placeholder-gray-300"
                                    value={searchQuery}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                            </div>
                        </div>

                        {/* Check-in */}
                        <div className="relative group lg:col-span-2">
                            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Check-in</label>
                            <div className="relative border-b border-gray-300 hover:border-gray-900 transition-colors">
                                <input
                                    type="date"
                                    min={todayDateValue}
                                    className="w-full bg-transparent border-0 px-0 py-2 text-gray-900 font-light focus:ring-0 cursor-pointer"
                                    value={checkIn}
                                    onChange={(e) => handleCheckInChange(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Check-out */}
                        <div className="relative group lg:col-span-2">
                            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Check-out</label>
                            <div className="relative border-b border-gray-300 hover:border-gray-900 transition-colors">
                                <input
                                    type="date"
                                    min={minimumCheckOutDate}
                                    className="w-full bg-transparent border-0 px-0 py-2 text-gray-900 font-light focus:ring-0 cursor-pointer"
                                    value={checkOut}
                                    onChange={(e) => handleCheckOutChange(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Guests */}
                        <div className="relative group lg:col-span-2">
                            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Guests</label>
                            <div className="relative flex items-center border-b border-gray-300 hover:border-gray-900 transition-colors">
                                <Users size={16} weight="light" className="absolute left-0 text-gray-400" />
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="Add guests"
                                    className="w-full bg-transparent border-0 pl-7 pr-0 py-2 text-gray-900 font-light focus:ring-0 placeholder-gray-300"
                                    value={guestCount}
                                    onChange={(e) => handleGuestChange(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                            </div>
                        </div>

                        {/* Search Button */}
                        <div className="lg:col-span-2">
                            <button
                                onClick={handleSearchSubmit}
                                className="w-full py-[11px] bg-gray-900 hover:bg-black text-white text-xs tracking-widest uppercase transition-colors rounded-sm flex items-center justify-center gap-2"
                            >
                                <MagnifyingGlass size={14} weight="light" /> Search
                            </button>
                        </div>

                    </div>

                    {dateValidationMessage && (
                        <p className="mt-4 text-[11px] text-red-500 font-light uppercase tracking-wide">
                            * {dateValidationMessage}
                        </p>
                    )}
                </section>

                {/* Content Grid (Sidebar + List) */}
                <div id="results-section" className="grid lg:grid-cols-[260px_minmax(0,1fr)] gap-10 lg:gap-16 items-start relative z-10 pt-4">
                    
                    {/* Filter Sidebar */}
                    <aside className="bg-white border border-gray-100 rounded-sm p-6 shadow-sm lg:sticky lg:top-24">
                        <h3 className="text-sm font-serif text-gray-900 mb-8 pb-4 border-b border-gray-100">Refine Results</h3>
                        
                        <div className="space-y-8">
                            <LuxuryDropdown
                                label="Property Style"
                                placeholder="Any Style"
                                options={propertyTypeOptions}
                                value={selectedPropertyType}
                                onChange={handlePropertyTypeFilter}
                            />
                            <LuxuryDropdown
                                label="Guest Rating"
                                placeholder="Any Rating"
                                options={ratingOptions}
                                value={selectedRating}
                                onChange={handleRatingFilter}
                            />
                            <LuxuryMultiSelectDropdown
                                label="Amenities"
                                placeholder="Any Amenity"
                                options={extraPackageOptions}
                                selectedValues={selectedExtraPackages}
                                onToggle={handleExtraPackageToggle}
                            />
                        </div>

                        <button 
                            onClick={handleSearchSubmit}
                            className="w-full mt-8 py-3 bg-gray-900 hover:bg-black text-white text-xs tracking-widest uppercase transition-colors rounded-sm flex items-center justify-center gap-2"
                        >
                            Apply Filters
                        </button>
                    </aside>

                    {/* Hotel List */}
                    <div>
                        {/* Results Header */}
                        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-gray-100">
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">
                                Showing {filteredHotels.length} {filteredHotels.length === 1 ? "Property" : "Properties"}
                            </p>
                            <div className="flex items-center gap-4">
                                {availabilityLoading && (
                                    <p className="text-[10px] text-orange-800 uppercase tracking-widest flex items-center gap-1.5">
                                        <CircleNotch size={12} className="animate-spin" /> Syncing Availability
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* List or Empty State */}
                        {filteredHotels.length === 0 ? (
                            <div className="bg-white border border-gray-100 rounded-sm py-24 flex flex-col items-center text-center px-6 shadow-sm">
                                <MagnifyingGlass size={48} weight="light" className="text-gray-300 mb-6" />
                                <h3 className="text-xl font-serif text-gray-900 mb-2">No Matches Found</h3>
                                <p className="text-gray-500 font-light max-w-sm mx-auto text-sm">
                                    {appliedHasDateValidationError
                                        ? "Please adjust your travel dates to see available properties."
                                        : "Try removing some filters to explore more options in our collection."}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="grid md:grid-cols-2 gap-8 mb-12">
                                    {currentHotels.map((hotel) => {
                                        const roomStats = roomStatsByHotel[hotel._id] || { availableUnits: 0, maxOccupancy: 0, totalCapacity: 0, minPrice: Infinity };
                                        const ratingInfo = ratingsByHotel[hotel._id] || { average: 0, count: 0 };
                                        const roundedRating = Math.round(ratingInfo.average);
                                        const hotelPackages = (normalizedExtrasByHotel[hotel._id] || []).slice(0, 3);

                                        return (
                                            <div key={hotel._id} className="group bg-white border border-gray-100 hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500 rounded-sm overflow-hidden flex flex-col animate-fade-in">
                                                
                                                {/* Image */}
                                                <figure className="relative h-64 bg-gray-50 overflow-hidden">
                                                    {hotel.photos?.[0] ? (
                                                        <img
                                                            src={hotel.photos[0]}
                                                            alt={hotel.name}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Bed size={32} weight="light" className="text-gray-300" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
                                                    
                                                    {/* Location Badge */}
                                                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-sm flex items-center gap-1.5 shadow-sm">
                                                        <MapPin size={12} weight="fill" className="text-orange-800" />
                                                        <span className="text-[10px] uppercase tracking-widest font-medium text-gray-900">{hotel.city}</span>
                                                    </div>
                                                </figure>

                                                {/* Details */}
                                                <div className="p-6 md:p-8 flex flex-col flex-grow">
                                                    <h2 className="text-2xl font-serif text-gray-900 mb-3 group-hover:text-orange-800 transition-colors line-clamp-1">
                                                        {hotel.name}
                                                    </h2>

                                                    <div className="flex items-center gap-1 mb-5">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <Star key={star} size={12} weight="fill" className={star <= roundedRating ? "text-orange-800" : "text-gray-200"} />
                                                        ))}
                                                        <span className="ml-2 text-[10px] text-gray-400 uppercase tracking-widest">
                                                            {ratingInfo.count > 0 ? `${ratingInfo.average.toFixed(1)} / 5` : "New"}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap gap-4 mb-6 text-sm font-light text-gray-600">
                                                        <div className="flex items-center gap-2">
                                                            <Users size={16} weight="light" className="text-gray-400" />
                                                            <span>Fits {roomStats.totalCapacity || "-"} guests total</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Bed size={16} weight="light" className="text-gray-400" />
                                                            <span>{roomStats.availableUnits} rooms left</span>
                                                        </div>
                                                    </div>

                                                    {hotelPackages.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mb-8">
                                                            {hotelPackages.map((pkg) => (
                                                                <span key={pkg} className="text-[9px] uppercase tracking-widest font-medium text-gray-500 bg-gray-50 border border-gray-100 px-2 py-1 rounded-sm">
                                                                    {pkg}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Footer: Price & Action */}
                                                    <div className="mt-auto pt-6 border-t border-gray-100 flex items-center justify-between">
                                                        <div>
                                                            <span className="block text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">Starting at</span>
                                                            <span className="text-xl font-serif text-gray-900">
                                                                {roomStats.minPrice !== Infinity ? `$${roomStats.minPrice.toLocaleString()}` : "N/A"}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleViewHotel(hotel._id)}
                                                            className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white text-xs tracking-widest uppercase transition-colors rounded-sm"
                                                        >
                                                            Reserve
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex justify-center items-center gap-2 pt-8 border-t border-gray-200">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-sm transition-colors text-gray-400 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent"
                                        >
                                            <CaretLeft size={16} weight="light" />
                                        </button>
                                        
                                        <span className="px-4 text-[10px] uppercase tracking-widest text-gray-500 font-medium">
                                            Page {currentPage} of {totalPages}
                                        </span>

                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-sm transition-colors text-gray-400 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent"
                                        >
                                            <CaretRight size={16} weight="light" />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoomCatalog;