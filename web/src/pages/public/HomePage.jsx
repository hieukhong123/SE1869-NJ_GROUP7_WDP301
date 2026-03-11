import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../services/axiosClient";
import {
	MapPinIcon,
	StarIcon,
    MagnifyingGlass,
    CircleNotch,
	MapTrifoldIcon,
	UsersIcon,
	CalendarIcon,
	MagnifyingGlassIcon,
    ArrowRight,
    ArrowLeft
} from '@phosphor-icons/react';

const POPULAR_CITIES = [
    { name: "Hanoi", count: 124, image: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800" },
    { name: "Ho Chi Minh City", count: 186, image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800" },
    { name: "Da Nang", count: 95, image: "https://images.unsplash.com/photo-1558223611-6672daee0df1?w=800" },
    { name: "Nha Trang", count: 82, image: "https://images.unsplash.com/photo-1596422846543-7ec4ab789b14?w=800" },
    { name: "Hoi An", count: 64, image: "https://images.unsplash.com/photo-1559508551-44bff1de756b?w=800" },
    { name: "Phu Quoc", count: 73, image: "https://images.unsplash.com/photo-1557456170-0cf4f4d0d362?w=800" }
];

const PROPERTY_TYPES = [
    { name: "Hotels", count: 245, image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800" },
    { name: "Resorts", count: 56, image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800" },
    { name: "Villas", count: 89, image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800" },
    { name: "Apartments", count: 120, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800" },
    { name: "Homestays", count: 210, image: "https://images.unsplash.com/photo-1502672260266-1c1de2d93688?w=800" }
];

const HomePage = () => {
    const navigate = useNavigate();
    const [featuredHotels, setFeaturedHotels] = useState([]);
    const [allHotels, setAllHotels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredHotels, setFilteredHotels] = useState([]);

    // Refs cho 3 Carousel
    const featuredRef = useRef(null);
    const citiesRef = useRef(null);
    const typesRef = useRef(null);

    // Hàm điều khiển cuộn
    const scroll = (ref, direction) => {
        if (ref.current) {
            const { scrollLeft, clientWidth } = ref.current;
            // Cuộn đi một khoảng bằng 75% chiều rộng màn hình hiện tại
            const scrollAmount = clientWidth * 0.75; 
            ref.current.scrollTo({
                left: direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
                behavior: "smooth",
            });
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const featuredResponse = await axiosClient.get("/hotels/featured");
                setFeaturedHotels(featuredResponse.data);
                
                const allResponse = await axiosClient.get("/hotels");
                setAllHotels(allResponse.data);
            } catch (err) {
                console.error("Error fetching hotels:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const normalizeVietnamese = (str) => {
        return str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);

        if (value.trim() === "") {
            setFilteredHotels([]);
            setShowSuggestions(false);
            return;
        }

        const normalizedQuery = normalizeVietnamese(value);
        const filtered = allHotels.filter((hotel) => {
            const normalizedName = normalizeVietnamese(hotel.name);
            const normalizedCity = normalizeVietnamese(hotel.city || "");
            const normalizedAddress = normalizeVietnamese(hotel.address || "");
            
            return (
                normalizedName.includes(normalizedQuery) ||
                normalizedCity.includes(normalizedQuery) ||
                normalizedAddress.includes(normalizedQuery)
            );
        });

        setFilteredHotels(filtered);
        setShowSuggestions(filtered.length > 0);
    };

    const handleSelectHotel = (hotelId) => {
        navigate(`/hotels/${hotelId}/book`);
        setSearchQuery("");
        setShowSuggestions(false);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (filteredHotels.length > 0) {
            handleSelectHotel(filteredHotels[0]._id);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FFFCFA] flex flex-col items-center justify-center gap-4">
                <CircleNotch size={32} weight="light" className="text-orange-800 animate-spin" />
                <p className="text-gray-500 font-light text-sm tracking-widest uppercase">
                    Preparing your experience...
                </p>
            </div>
        );
    }

    return (
        <div className="bg-[#FFFCFA] min-h-screen pb-24">
            {/* Hero Section */}
            <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden border-b border-orange-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                        <div className="order-2 lg:order-1 z-10">
                            <div className="inline-flex items-center gap-4 mb-6">
                                <span className="w-12 h-[1px] bg-orange-800"></span>
                                <span className="text-xs uppercase tracking-[0.2em] font-medium text-orange-800">
                                    The Art of Hospitality
                                </span>
                            </div>
                            
                            <h1 className="text-5xl lg:text-7xl font-serif text-gray-900 mb-8 leading-[1.1]">
                                Discover your next <br />
                                <span className="italic text-orange-800 font-light">extraordinary</span> stay
                            </h1>
                            
                            <p className="text-gray-500 font-light text-lg mb-12 max-w-lg leading-relaxed">
                                From curated accommodations to bespoke services, we craft unforgettable experiences tailored to the modern traveler.
                            </p>

                            <div className="relative max-w-lg">
                                <form onSubmit={handleSearch} className="relative group">
                                    <div className="flex items-center border-b border-gray-300 pb-3">
                                        <MagnifyingGlass size={20} weight="light" className="text-gray-400 mr-4" />
                                        <input
                                            type="text"
                                            placeholder="Search destinations or properties..."
                                            className="w-full bg-transparent border-none outline-none text-gray-900 font-light placeholder-gray-400 focus:ring-0 p-0"
                                            value={searchQuery}
                                            onChange={handleSearchChange}
                                            onFocus={() => searchQuery && setShowSuggestions(true)}
                                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                        />
                                        <button
                                            type="submit"
                                            className="ml-4 px-6 py-2.5 bg-gray-900 hover:bg-orange-800 text-white text-xs tracking-widest uppercase transition-colors rounded-sm shrink-0"
                                        >
                                            Explore
                                        </button>
                                    </div>
                                    <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-orange-800 transition-all duration-500 group-focus-within:w-full"></div>
                                </form>
                                
                                {showSuggestions && filteredHotels.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-4 bg-white shadow-2xl rounded-sm overflow-hidden z-50 max-h-80 overflow-y-auto border border-gray-100">
                                        {filteredHotels.map((hotel) => (
                                            <div
                                                key={hotel._id}
                                                onClick={() => handleSelectHotel(hotel._id)}
                                                className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-b-0 group"
                                            >
                                                <div className="w-12 h-12 rounded-sm overflow-hidden shrink-0 bg-gray-100">
                                                    <img
                                                        src={hotel.photos?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200"}
                                                        alt={hotel.name}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className="font-serif text-gray-900 text-lg group-hover:text-orange-800 transition-colors">
                                                        {hotel.name}
                                                    </h4>
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-light tracking-wide uppercase mt-1">
                                                        <MapPinIcon size={12} weight="light" />
                                                        <span>{hotel.city}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="order-1 lg:order-2 grid grid-cols-2 gap-4 lg:gap-6 relative">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-50 rounded-full blur-3xl opacity-60"></div>
                            <div className="space-y-4 lg:space-y-6 mt-12">
                                <div className="rounded-sm overflow-hidden h-64 lg:h-80 relative group">
                                    <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800" alt="Luxury Hotel Room" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
                                </div>
                                <div className="rounded-sm overflow-hidden h-48 lg:h-56 relative group">
                                    <img src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800" alt="Hotel Interior" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
                                </div>
                            </div>
                            <div className="space-y-4 lg:space-y-6">
                                <div className="rounded-sm overflow-hidden h-56 lg:h-64 relative group">
                                    <img src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800" alt="Hotel Lobby" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
                                </div>
                                <div className="rounded-sm overflow-hidden h-72 lg:h-96 relative group">
                                    <img src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800" alt="Hotel Exterior" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Hotels - HORIZONTAL CAROUSEL */}
            <section className="pt-24 pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <div>
                        <span className="text-xs uppercase tracking-[0.2em] font-medium text-orange-800 mb-3 block">
                            Portfolio
                        </span>
                        <h2 className="text-3xl md:text-4xl font-serif text-gray-900">
                            Featured Hotels
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/location')}
                            className="text-xs uppercase tracking-[0.2em] font-medium text-gray-500 hover:text-orange-800 transition-colors flex items-center gap-2 group"
                        >
                            <span>View All</span>
                            <ArrowRight size={14} weight="light" className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => scroll(featuredRef, "left")}
                                className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-full text-gray-500 hover:text-orange-800 hover:border-orange-800 transition-colors"
                            >
                                <ArrowLeft size={18} weight="light" />
                            </button>
                            <button 
                                onClick={() => scroll(featuredRef, "right")}
                                className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-full text-gray-500 hover:text-orange-800 hover:border-orange-800 transition-colors"
                            >
                                <ArrowRight size={18} weight="light" />
                            </button>
                        </div>
                    </div>
                </div>

                {featuredHotels.length > 0 && (
                    <div 
                        ref={featuredRef}
                        className="w-full overflow-x-auto pb-8 hide-scrollbar scroll-smooth"
                    >
                        <div className="flex gap-6 w-max mx-auto" style={{ paddingLeft: 'max(1rem, calc((100vw - 80rem) / 2))', paddingRight: 'max(1rem, calc((100vw - 80rem) / 2))' }}>
                            {featuredHotels.map((hotel) => (
                                <div
                                    key={hotel._id}
                                    onClick={() => navigate(`/hotels/${hotel._id}/book`)}
                                    className="w-[280px] sm:w-[350px] md:w-[400px] flex-shrink-0 group flex flex-col bg-white border border-gray-100 rounded-sm hover:shadow-xl transition-all duration-500 overflow-hidden cursor-pointer"
                                >
                                    <figure className="relative h-64 overflow-hidden bg-gray-50">
                                        <img
                                            src={hotel.photos?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500"}
                                            alt={hotel.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                                        />
                                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
                                        <div className="absolute top-4 left-4 bg-orange-900/90 backdrop-blur-sm text-white text-[10px] px-3 py-1.5 uppercase tracking-[0.2em] font-medium rounded-sm">
                                            Signature
                                        </div>
                                    </figure>

                                    <div className="p-6 flex flex-col flex-grow">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-light tracking-widest uppercase mb-3">
                                            <MapPinIcon size={14} weight="light" className="text-orange-800" />
                                            <span>{hotel.city}</span>
                                        </div>
                                        <h3 className="text-xl font-serif text-gray-900 mb-4 line-clamp-1 group-hover:text-orange-800 transition-colors">
                                            {hotel.name}
                                        </h3>
                                        <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-100">
                                            <div className="flex items-center gap-1.5">
                                                <StarIcon size={16} weight="fill" className="text-orange-800" />
                                                <span className="font-medium text-gray-900 text-sm">
                                                    {Number(hotel.averageRating) > 0 ? Number(hotel.averageRating).toFixed(1) : "New"}
                                                </span>
                                            </div>
                                            <span className="text-xs uppercase tracking-widest text-orange-800 font-medium group-hover:text-gray-900 transition-colors">
                                                Explore
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <div>
                        <span className="text-xs uppercase tracking-[0.2em] font-medium text-orange-800 mb-3 block">
                            Destinations
                        </span>
                        <h2 className="text-3xl md:text-4xl font-serif text-gray-900">
                            Discover Vietnam
                        </h2>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => scroll(citiesRef, "left")}
                            className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-full text-gray-500 hover:text-orange-800 hover:border-orange-800 transition-colors"
                        >
                            <ArrowLeft size={18} weight="light" />
                        </button>
                        <button 
                            onClick={() => scroll(citiesRef, "right")}
                            className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-full text-gray-500 hover:text-orange-800 hover:border-orange-800 transition-colors"
                        >
                            <ArrowRight size={18} weight="light" />
                        </button>
                    </div>
                </div>

                <div 
                    ref={citiesRef}
                    className="w-full overflow-x-auto pb-8 hide-scrollbar scroll-smooth"
                >
                    <div className="flex gap-4 lg:gap-6 w-max mx-auto" style={{ paddingLeft: 'max(1rem, calc((100vw - 80rem) / 2))', paddingRight: 'max(1rem, calc((100vw - 80rem) / 2))' }}>
                        {POPULAR_CITIES.map((city, index) => (
                            <div 
                                key={index}
                                onClick={() => navigate(`/location?city=${encodeURIComponent(city.name)}`)}
                                className="w-[260px] sm:w-[300px] md:w-[320px] flex-shrink-0 group relative h-72 md:h-80 lg:h-96 rounded-sm overflow-hidden cursor-pointer"
                            >
                                <img 
                                    src={city.image} 
                                    alt={city.name} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500"></div>
                                
                                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                                    <h3 className="text-white font-serif text-xl md:text-2xl mb-1 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                                        {city.name}
                                    </h3>
                                    <p className="text-white/80 font-light text-xs tracking-widest uppercase opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100">
                                        {city.count} Properties
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <div>
                        <span className="text-xs uppercase tracking-[0.2em] font-medium text-orange-800 mb-3 block">
                            Categories
                        </span>
                        <h2 className="text-3xl md:text-4xl font-serif text-gray-900">
                            Search by Type
                        </h2>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => scroll(typesRef, "left")}
                            className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-full text-gray-500 hover:text-orange-800 hover:border-orange-800 transition-colors"
                        >
                            <ArrowLeft size={18} weight="light" />
                        </button>
                        <button 
                            onClick={() => scroll(typesRef, "right")}
                            className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-full text-gray-500 hover:text-orange-800 hover:border-orange-800 transition-colors"
                        >
                            <ArrowRight size={18} weight="light" />
                        </button>
                    </div>
                </div>

                <div 
                    ref={typesRef}
                    className="w-full overflow-x-auto pb-8 hide-scrollbar scroll-smooth"
                >
                    <div className="flex gap-6 w-max mx-auto" style={{ paddingLeft: 'max(1rem, calc((100vw - 80rem) / 2))', paddingRight: 'max(1rem, calc((100vw - 80rem) / 2))' }}>
                        {PROPERTY_TYPES.map((type, index) => (
                            <div 
                                key={index}
                                className="w-[240px] sm:w-[280px] flex-shrink-0 group flex flex-col cursor-pointer"
                            >
                                <div className="relative h-56 rounded-sm overflow-hidden mb-4">
                                    <img 
                                        src={type.image} 
                                        alt={type.name} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                                    />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-serif text-gray-900 group-hover:text-orange-800 transition-colors">
                                        {type.name}
                                    </h3>
                                    <p className="text-gray-500 font-light text-sm mt-1">
                                        {type.count} accommodations
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

        </div>
    );
};

export default HomePage;