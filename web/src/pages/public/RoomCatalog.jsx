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
} from "@phosphor-icons/react";
import { toast } from "sonner";

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
                        onClick={() => {
                            onChange("");
                            setIsOpen(false);
                        }}
                    >
                        {placeholder}
                    </div>

                    {options.map((option) => (
                        <div
                            key={option.value}
                            className={`px-4 py-3 text-sm font-light cursor-pointer transition-colors ${value === option.value ? "text-orange-800 bg-orange-50/50" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const LuxuryMultiSelectDropdown = ({
    label,
    selectedValues,
    options,
    onToggle,
    placeholder,
}) => {
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

    const selectedLabel =
        selectedValues.length === 0
            ? placeholder
            : selectedValues.length <= 2
                ? selectedValues.join(", ")
                : `${selectedValues.slice(0, 2).join(", ")} +${selectedValues.length - 2}`;

    return (
        <div className="relative" ref={dropdownRef}>
            <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">
                {label}
            </label>

            <div
                className="relative flex items-center justify-between w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-gray-900 font-light cursor-pointer group"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={selectedValues.length === 0 ? "text-gray-400 truncate" : "text-gray-900 truncate"}>
                    {selectedLabel}
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
                    {options.length === 0 && (
                        <div className="px-4 py-3 text-sm font-light text-gray-400">
                            No packages available
                        </div>
                    )}

                    {options.map((option) => {
                        const isSelected = selectedValues.includes(option.value);
                        return (
                            <div
                                key={option.value}
                                className={`px-4 py-3 text-sm font-light cursor-pointer transition-colors flex items-center justify-between ${isSelected ? "text-orange-800 bg-orange-50/50" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}
                                onClick={() => onToggle(option.value)}
                            >
                                <span className="truncate pr-4">{option.label}</span>
                                <span className={`w-4 h-4 rounded-full border ${isSelected ? "border-orange-800 bg-orange-800" : "border-gray-300"}`}></span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const RoomCatalog = () => {
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

    const navigate = useNavigate();

    const HOTELS_PER_PAGE = 9;

    const hasDateRange = Boolean(checkIn && checkOut);
    const hasInvalidDateRange =
        hasDateRange && new Date(checkOut).getTime() <= new Date(checkIn).getTime();

    const guestsNeeded = Number(guestCount) || 0;
    const minimumRating = Number(selectedRating) || 0;

    const fetchBaseData = useCallback(async () => {
        try {
            setLoading(true);

            const [hotelsResponse, reviewsResponse, extraFeesResponse] = await Promise.all([
                axiosClient.get("/hotels"),
                axiosClient.get("/reviews"),
                axiosClient.get("/extra-fees"),
            ]);

            setAllHotels(hotelsResponse.data || []);
            setAllReviews(reviewsResponse.data || []);
            setAllExtraFees(extraFeesResponse.data || []);
        } catch (error) {
            console.error("Error fetching catalog base data:", error);
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
            try {
                setAvailabilityLoading(true);

                const endpoint = hasDateRange && !hasInvalidDateRange
                    ? `/rooms?checkIn=${checkIn}&checkOut=${checkOut}`
                    : "/rooms";

                const roomsResponse = await axiosClient.get(endpoint);
                setAllRooms(roomsResponse.data || []);
            } catch (error) {
                console.error("Error fetching availability rooms:", error);
                toast.error("Failed to refresh room availability");
            } finally {
                setAvailabilityLoading(false);
            }
        };

        fetchAvailabilityRooms();
    }, [checkIn, checkOut, hasDateRange, hasInvalidDateRange]);

    useEffect(() => {
        const params = {};

        if (searchQuery.trim()) params.search = searchQuery.trim();
        if (selectedCity) params.city = selectedCity;
        if (selectedHotel) params.hotelId = selectedHotel;
        if (guestCount) params.guests = guestCount;
        if (checkIn) params.checkIn = checkIn;
        if (checkOut) params.checkOut = checkOut;
        if (selectedRating) params.rating = selectedRating;
        if (selectedPropertyType) params.propertyType = selectedPropertyType;
        if (selectedExtraPackages.length > 0) {
            params.extras = selectedExtraPackages.join(",");
        }

        setSearchParams(params, { replace: true });
    }, [
        searchQuery,
        selectedCity,
        selectedHotel,
        guestCount,
        checkIn,
        checkOut,
        selectedRating,
        selectedPropertyType,
        selectedExtraPackages,
        setSearchParams,
    ]);

    const cities = useMemo(
        () => [...new Set(allHotels.map((hotel) => hotel.city).filter(Boolean))].sort(),
        [allHotels]
    );

    const propertyTypes = useMemo(
        () => [...new Set(allHotels.map((hotel) => hotel.propertyType).filter(Boolean))].sort(),
        [allHotels]
    );

    const extraPackageNames = useMemo(
        () => [...new Set(allExtraFees.map((fee) => fee.extraName).filter(Boolean))].sort(),
        [allExtraFees]
    );

    const filteredHotelsForDropdown = useMemo(
        () =>
            allHotels.filter((hotel) => {
                const matchesCity = !selectedCity || hotel.city === selectedCity;
                const matchesPropertyType = !selectedPropertyType || hotel.propertyType === selectedPropertyType;
                return matchesCity && matchesPropertyType;
            }),
        [allHotels, selectedCity, selectedPropertyType]
    );

    useEffect(() => {
        if (
            selectedHotel &&
            !filteredHotelsForDropdown.some((hotel) => hotel._id === selectedHotel)
        ) {
            setSelectedHotel("");
        }
    }, [selectedHotel, filteredHotelsForDropdown]);

    const ratingsByHotel = useMemo(
        () =>
            allReviews.reduce((accumulator, review) => {
                const hotelId = review.hotelId?._id || review.hotelId;
                if (!hotelId) return accumulator;

                if (!accumulator[hotelId]) {
                    accumulator[hotelId] = { total: 0, count: 0, average: 0 };
                }

                accumulator[hotelId].total += Number(review.rating) || 0;
                accumulator[hotelId].count += 1;
                accumulator[hotelId].average =
                    accumulator[hotelId].total / accumulator[hotelId].count;

                return accumulator;
            }, {}),
        [allReviews]
    );

    const normalizedExtrasByHotel = useMemo(() => {
        const extrasByHotel = allExtraFees.reduce((accumulator, fee) => {
            const hotelId = fee.hotelId?._id || fee.hotelId;
            if (!hotelId || !fee.extraName) return accumulator;

            if (!accumulator[hotelId]) {
                accumulator[hotelId] = new Set();
            }

            accumulator[hotelId].add(fee.extraName);
            return accumulator;
        }, {});

        return Object.keys(extrasByHotel).reduce((accumulator, hotelId) => {
            accumulator[hotelId] = Array.from(extrasByHotel[hotelId]);
            return accumulator;
        }, {});
    }, [allExtraFees]);

    const roomStatsByHotel = useMemo(
        () =>
            allRooms.reduce((accumulator, room) => {
                const hotelId = room.hotelId?._id || room.hotelId;
                if (!hotelId) return accumulator;

                if (!accumulator[hotelId]) {
                    accumulator[hotelId] = {
                        hasAvailableRooms: false,
                        availableUnits: 0,
                        maxOccupancy: 0,
                        minPrice: Infinity,
                    };
                }

                const availableQuantity = Number(room.availableQuantity ?? room.quantity ?? 0);
                const isBookable = room.status === "available" && availableQuantity > 0;

                if (!isBookable) return accumulator;

                accumulator[hotelId].hasAvailableRooms = true;
                accumulator[hotelId].availableUnits += availableQuantity;
                accumulator[hotelId].maxOccupancy = Math.max(
                    accumulator[hotelId].maxOccupancy,
                    Number(room.maxOccupancy) || 0
                );

                const roomPrice = Number(room.roomPrice) || 0;
                if (roomPrice > 0) {
                    accumulator[hotelId].minPrice = Math.min(
                        accumulator[hotelId].minPrice,
                        roomPrice
                    );
                }

                return accumulator;
            }, {}),
        [allRooms]
    );

    const filteredHotels = useMemo(() => {
        return allHotels.filter((hotel) => {
            if (hasInvalidDateRange) return false;

            const hotelId = hotel._id;
            const roomStats = roomStatsByHotel[hotelId];
            const ratingInfo = ratingsByHotel[hotelId] || { average: 0, count: 0 };
            const hotelExtras = normalizedExtrasByHotel[hotelId] || [];

            const searchValue = searchQuery.trim().toLowerCase();
            const matchesSearch =
                !searchValue ||
                hotel.name?.toLowerCase().includes(searchValue) ||
                hotel.city?.toLowerCase().includes(searchValue) ||
                hotel.address?.toLowerCase().includes(searchValue) ||
                hotel.description?.toLowerCase().includes(searchValue);

            const matchesAvailability = Boolean(roomStats?.hasAvailableRooms);
            const matchesCity = !selectedCity || hotel.city === selectedCity;
            const matchesHotel = !selectedHotel || hotelId === selectedHotel;
            const matchesGuests =
                !guestsNeeded || (roomStats?.maxOccupancy || 0) >= guestsNeeded;
            const matchesRating = !minimumRating || ratingInfo.average >= minimumRating;
            const matchesPropertyType =
                !selectedPropertyType || hotel.propertyType === selectedPropertyType;
            const matchesExtraPackages =
                selectedExtraPackages.length === 0 ||
                selectedExtraPackages.every((extraName) => hotelExtras.includes(extraName));

            return (
                matchesSearch &&
                matchesAvailability &&
                matchesCity &&
                matchesHotel &&
                matchesGuests &&
                matchesRating &&
                matchesPropertyType &&
                matchesExtraPackages
            );
        });
    }, [
        allHotels,
        hasInvalidDateRange,
        roomStatsByHotel,
        ratingsByHotel,
        normalizedExtrasByHotel,
        searchQuery,
        selectedCity,
        selectedHotel,
        guestsNeeded,
        minimumRating,
        selectedPropertyType,
        selectedExtraPackages,
    ]);

    const totalPages = Math.ceil(filteredHotels.length / HOTELS_PER_PAGE);
    const startIndex = (currentPage - 1) * HOTELS_PER_PAGE;
    const endIndex = startIndex + HOTELS_PER_PAGE;
    const currentHotels = filteredHotels.slice(startIndex, endIndex);

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const handleCityFilter = (cityValue) => {
        setSelectedCity(cityValue);
        setSelectedHotel("");
        setCurrentPage(1);
    };

    const handleHotelFilter = (hotelValue) => {
        setSelectedHotel(hotelValue);
        setCurrentPage(1);
    };

    const handleSearchChange = (value) => {
        setSearchQuery(value);
        setCurrentPage(1);
    };

    const handleGuestChange = (value) => {
        const sanitizedValue = value === "" ? "" : Math.max(1, Number(value) || 1);
        setGuestCount(String(sanitizedValue));
        setCurrentPage(1);
    };

    const handleCheckInChange = (value) => {
        setCheckIn(value);
        setCurrentPage(1);
    };

    const handleCheckOutChange = (value) => {
        setCheckOut(value);
        setCurrentPage(1);
    };

    const handleRatingFilter = (value) => {
        setSelectedRating(value);
        setCurrentPage(1);
    };

    const handlePropertyTypeFilter = (value) => {
        setSelectedPropertyType(value);
        setSelectedHotel("");
        setCurrentPage(1);
    };

    const handleExtraPackageToggle = (value) => {
        setSelectedExtraPackages((previous) =>
            previous.includes(value)
                ? previous.filter((item) => item !== value)
                : [...previous, value]
        );
        setCurrentPage(1);
    };

    const clearAllFilters = () => {
        setSelectedCity("");
        setSelectedHotel("");
        setSearchQuery("");
        setGuestCount("");
        setCheckIn("");
        setCheckOut("");
        setSelectedRating("");
        setSelectedPropertyType("");
        setSelectedExtraPackages([]);
        setCurrentPage(1);
        setSearchParams({}, { replace: true });
    };

    const handleViewHotel = (hotelId) => {
        const params = new URLSearchParams();
        if (checkIn) params.set("checkIn", checkIn);
        if (checkOut) params.set("checkOut", checkOut);
        if (guestCount) params.set("adult", guestCount);

        const queryString = params.toString();
        navigate(`/hotels/${hotelId}/book${queryString ? `?${queryString}` : ""}`);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const cityOptions = cities.map((city) => ({ label: city, value: city }));
    const hotelOptions = filteredHotelsForDropdown.map((hotel) => ({
        label: hotel.name,
        value: hotel._id,
    }));
    const ratingOptions = [1, 2, 3, 4, 5].map((starValue) => ({
        label: `${starValue}+ stars`,
        value: String(starValue),
    }));
    const propertyTypeOptions = propertyTypes.map((propertyType) => ({
        label: propertyType,
        value: propertyType,
    }));
    const extraPackageOptions = extraPackageNames.map((packageName) => ({
        label: packageName,
        value: packageName,
    }));

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
                <div className="mb-16 text-center">
                    <span className="text-xs uppercase tracking-[0.2em] font-medium text-orange-800 mb-4 block">
                        Our Collection
                    </span>
                    <h1 className="text-4xl md:text-5xl font-serif text-gray-900 mb-4">
                        Hotel Portfolio
                    </h1>
                    <p className="text-gray-500 font-light max-w-2xl mx-auto">
                        Browse available properties and refine results with advanced booking filters.
                    </p>
                </div>

                <div className="mb-12 py-8 border-y border-gray-200">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="relative group">
                            <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">
                                Search
                            </label>
                            <div className="relative flex items-center border-b border-gray-300">
                                <MagnifyingGlass size={18} weight="light" className="absolute left-0 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Hotel, city, address..."
                                    className="w-full bg-transparent border-0 pl-8 pr-0 py-2 text-gray-900 font-light focus:ring-0 placeholder-gray-400"
                                    value={searchQuery}
                                    onChange={(event) => handleSearchChange(event.target.value)}
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
                            label="Property Type"
                            placeholder="All Types"
                            options={propertyTypeOptions}
                            value={selectedPropertyType}
                            onChange={handlePropertyTypeFilter}
                        />
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mt-8">
                        <div className="relative group">
                            <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">
                                Guests
                            </label>
                            <div className="relative flex items-center border-b border-gray-300">
                                <Users size={18} weight="light" className="absolute left-0 text-gray-400" />
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="Any"
                                    className="w-full bg-transparent border-0 pl-8 pr-0 py-2 text-gray-900 font-light focus:ring-0 placeholder-gray-400"
                                    value={guestCount}
                                    onChange={(event) => handleGuestChange(event.target.value)}
                                />
                                <div className="absolute bottom-[-1px] left-0 w-0 h-[1px] bg-orange-800 transition-all duration-300 group-hover:w-full group-focus-within:w-full"></div>
                            </div>
                        </div>

                        <div className="relative group">
                            <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">
                                Check-in
                            </label>
                            <div className="relative border-b border-gray-300">
                                <input
                                    type="date"
                                    className="w-full bg-transparent border-0 px-0 py-2 text-gray-900 font-light focus:ring-0"
                                    value={checkIn}
                                    onChange={(event) => handleCheckInChange(event.target.value)}
                                />
                                <div className="absolute bottom-[-1px] left-0 w-0 h-[1px] bg-orange-800 transition-all duration-300 group-hover:w-full group-focus-within:w-full"></div>
                            </div>
                        </div>

                        <div className="relative group">
                            <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">
                                Check-out
                            </label>
                            <div className="relative border-b border-gray-300">
                                <input
                                    type="date"
                                    className="w-full bg-transparent border-0 px-0 py-2 text-gray-900 font-light focus:ring-0"
                                    value={checkOut}
                                    onChange={(event) => handleCheckOutChange(event.target.value)}
                                />
                                <div className="absolute bottom-[-1px] left-0 w-0 h-[1px] bg-orange-800 transition-all duration-300 group-hover:w-full group-focus-within:w-full"></div>
                            </div>
                        </div>

                        <LuxuryDropdown
                            label="Rating"
                            placeholder="All Ratings"
                            options={ratingOptions}
                            value={selectedRating}
                            onChange={handleRatingFilter}
                        />

                        <LuxuryMultiSelectDropdown
                            label="Extra Packages"
                            placeholder="Any Package"
                            options={extraPackageOptions}
                            selectedValues={selectedExtraPackages}
                            onToggle={handleExtraPackageToggle}
                        />
                    </div>

                    {hasInvalidDateRange && (
                        <p className="mt-6 text-sm text-red-500 font-light">
                            Check-out date must be after check-in date.
                        </p>
                    )}
                </div>

                <div className="mb-8 flex justify-between items-end">
                    <p className="text-sm font-light uppercase tracking-widest text-gray-500">
                        {filteredHotels.length} {filteredHotels.length === 1 ? "Property" : "Properties"} found
                    </p>
                    <div className="text-right">
                        {availabilityLoading && (
                            <p className="text-xs font-light uppercase tracking-widest text-gray-400 flex items-center justify-end gap-2 mb-1">
                                <CircleNotch size={12} className="animate-spin" /> Refreshing availability
                            </p>
                        )}
                        {totalPages > 1 && (
                            <p className="text-xs font-light uppercase tracking-widest text-gray-400">
                                Page {currentPage} of {totalPages}
                            </p>
                        )}
                    </div>
                </div>

                {filteredHotels.length === 0 ? (
                    <div className="text-center py-24 flex flex-col items-center">
                        <Bed size={64} weight="light" className="text-gray-300 mb-6" />
                        <h3 className="text-2xl font-serif text-gray-900 mb-2">
                            {hasInvalidDateRange ? "Invalid date range" : "No availability"}
                        </h3>
                        <p className="text-gray-500 font-light max-w-md mx-auto">
                            {hasInvalidDateRange
                                ? "Please choose a valid check-in and check-out range."
                                : "We couldn't find any hotels matching your criteria. Please adjust filters and try again."}
                        </p>
                        <button
                            onClick={clearAllFilters}
                            className="mt-8 text-sm uppercase tracking-widest text-orange-800 hover:text-gray-900 transition-colors border-b border-orange-800 pb-1 hover:border-gray-900"
                        >
                            Clear Filters
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
                            {currentHotels.map((hotel) => {
                                const roomStats = roomStatsByHotel[hotel._id] || {
                                    availableUnits: 0,
                                    maxOccupancy: 0,
                                    minPrice: Infinity,
                                };

                                const ratingInfo = ratingsByHotel[hotel._id] || {
                                    average: 0,
                                    count: 0,
                                };

                                const roundedRating = Math.round(ratingInfo.average);
                                const hotelPackages = (normalizedExtrasByHotel[hotel._id] || []).slice(0, 3);

                                return (
                                    <div
                                        key={hotel._id}
                                        className="group bg-white flex flex-col border border-gray-100 hover:shadow-xl transition-all duration-500 overflow-hidden rounded-sm"
                                    >
                                        <figure className="relative h-64 bg-gray-50 overflow-hidden">
                                            {hotel.photos?.[0] ? (
                                                <img
                                                    src={hotel.photos[0]}
                                                    alt={hotel.name}
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
                                                {hotel.city}
                                                {hotel.propertyType ? ` • ${hotel.propertyType}` : ""}
                                            </div>

                                            <h2 className="text-2xl font-serif text-gray-900 mb-3 line-clamp-1">
                                                {hotel.name}
                                            </h2>

                                            <div className="flex items-center gap-0.5 mb-4">
                                                {[1, 2, 3, 4, 5].map((starNumber) => (
                                                    <Star
                                                        key={starNumber}
                                                        size={14}
                                                        weight="fill"
                                                        className={starNumber <= roundedRating ? "text-orange-800" : "text-gray-200"}
                                                    />
                                                ))}
                                                <span className="ml-2 text-xs font-light text-gray-500">
                                                    {ratingInfo.count > 0
                                                        ? `${ratingInfo.average.toFixed(1)} (${ratingInfo.count})`
                                                        : "No reviews"}
                                                </span>
                                            </div>

                                            {hotel.description && (
                                                <p className="text-sm font-light text-gray-500 line-clamp-2 mb-6 leading-relaxed">
                                                    {hotel.description}
                                                </p>
                                            )}

                                            <div className="flex items-center gap-6 mb-6 text-sm font-light text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    <Users size={16} weight="light" className="text-gray-400" />
                                                    <span>Up to {roomStats.maxOccupancy || "-"} guests</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Bed size={16} weight="light" className="text-gray-400" />
                                                    <span>{roomStats.availableUnits} rooms</span>
                                                </div>
                                            </div>

                                            {hotelPackages.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-8">
                                                    {hotelPackages.map((packageName) => (
                                                        <span
                                                            key={`${hotel._id}-${packageName}`}
                                                            className="text-[10px] uppercase tracking-widest font-medium text-gray-500 border border-gray-200 px-2.5 py-1 rounded-sm"
                                                        >
                                                            {packageName}
                                                        </span>
                                                    ))}
                                                    {(normalizedExtrasByHotel[hotel._id] || []).length > 3 && (
                                                        <span className="text-[10px] uppercase tracking-widest font-medium text-gray-400 border border-gray-200 px-2.5 py-1 rounded-sm">
                                                            +{(normalizedExtrasByHotel[hotel._id] || []).length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            <div className="mt-auto flex items-center justify-between pt-6 border-t border-gray-100">
                                                <div className="flex flex-col">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-lg text-gray-900 font-medium tracking-wide">
                                                            {roomStats.minPrice !== Infinity
                                                                ? `$${roomStats.minPrice.toLocaleString()}`
                                                                : "Contact"}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] uppercase tracking-widest text-gray-400">
                                                        {roomStats.minPrice !== Infinity ? "From / Night" : "Pricing"}
                                                    </span>
                                                </div>

                                                <button
                                                    className="px-6 py-2.5 bg-transparent border border-orange-800 text-orange-800 hover:bg-orange-800 hover:text-white transition-colors duration-300 text-xs tracking-widest uppercase rounded-sm"
                                                    onClick={() => handleViewHotel(hotel._id)}
                                                >
                                                    Reserve
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {totalPages > 1 && (
                            <div className="mt-16 flex justify-center items-center gap-2">
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

                                <div className="flex gap-2">
                                    {[...Array(totalPages)].map((_, index) => {
                                        const pageNumber = index + 1;

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
                                        }

                                        if (
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
