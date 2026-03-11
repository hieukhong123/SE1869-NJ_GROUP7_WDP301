import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';
import { toast } from 'sonner';
import {
    MapPinIcon,
    StarIcon,
    MagnifyingGlassIcon,
    BuildingsIcon,
    SparkleIcon,
    MapTrifoldIcon,
    HeartIcon,
    CircleNotch,
} from '@phosphor-icons/react';

const Location = () => {
    const navigate = useNavigate();
    const [hotels, setHotels] = useState([]);
    const [filteredHotels, setFilteredHotels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [cities, setCities] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const hotelsPerPage = 6;

    useEffect(() => {
        fetchHotels();
        fetchFavorites();
    }, []);
    
    useEffect(() => {
        setCurrentPage(1);
    }, [filteredHotels.length]);
    
    const fetchFavorites = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (!user._id) return;
            
            const response = await axiosClient.get(`/favorites?userId=${user._id}`);
            setFavorites(response.data.map(hotel => hotel._id));
        } catch (error) {
            console.error('Error fetching favorites:', error);
        }
    };
    
    const handleToggleFavorite = async (e, hotelId) => {
        e.preventDefault();
        e.stopPropagation();
        
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (!user._id) {
                toast.error('Please login to add favorites');
                return;
            }
            
            const isFavorite = favorites.includes(hotelId);
            
            if (isFavorite) {
                await axiosClient.delete(`/favorites/${hotelId}?userId=${user._id}`);
                setFavorites(favorites.filter(id => id !== hotelId));
                toast.success('Removed from favorites');
            } else {
                await axiosClient.post('/favorites', { hotelId, userId: user._id });
                setFavorites([...favorites, hotelId]);
                toast.success('Added to favorites');
            }
            window.dispatchEvent(new Event('favoritesUpdated'));
        } catch (error) {
            console.error('Error toggling favorite:', error);
            toast.error(error.response?.data?.message || 'Failed to update favorites');
        }
    };

    const fetchHotels = async () => {
        try {
            setLoading(true);
            const response = await axiosClient.get('/hotels');
            const hotelsData = response.data;
            setHotels(hotelsData);
            setFilteredHotels(hotelsData);

            const uniqueCities = [
                ...new Set(hotelsData.map((hotel) => hotel.city).filter(Boolean)),
            ];
            setCities(uniqueCities);
        } catch (err) {
            console.error('Error fetching hotels:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        if (!searchQuery.trim()) {
            setFilteredHotels(hotels);
            return;
        }

        const filtered = hotels.filter(
            (hotel) =>
                hotel.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                hotel.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                hotel.address?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredHotels(filtered);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    };

    // Pagination
    const indexOfLastHotel = currentPage * hotelsPerPage;
    const indexOfFirstHotel = indexOfLastHotel - hotelsPerPage;
    const currentHotels = filteredHotels.slice(indexOfFirstHotel, indexOfLastHotel);
    const totalPages = Math.ceil(filteredHotels.length / hotelsPerPage);
    
    // Group current page hotels by city
    const currentHotelsByCity = currentHotels.reduce((acc, hotel) => {
        const city = hotel.city || 'Other';
        if (!acc[city]) {
            acc[city] = [];
        }
        acc[city].push(hotel);
        return acc;
    }, {});
    
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-[#FFFCFA]">
            {/* Hero Section with Search - Editorial Style */}
            <section className="bg-white py-24 px-4 border-b border-gray-100">
                <div className="max-w-4xl mx-auto text-center">
                    <span className="text-xs uppercase tracking-[0.2em] font-medium text-orange-800 mb-4 block">
                        Destinations
                    </span>
                    <h1 className="text-4xl md:text-6xl font-serif text-gray-900 mb-6">
                        Search Locations
                    </h1>
                    <p className="text-lg font-light text-gray-500 mb-12">
                        Discover exceptional properties in Vietnam's most coveted destinations.
                    </p>

                    {/* Minimalist Search Bar */}
                    <div className="max-w-2xl mx-auto mb-10">
                        <div className="relative group">
                            <div className="flex items-center border-b border-gray-300 pb-3">
                                <MagnifyingGlassIcon size={20} weight="light" className="text-gray-400 mr-4" />
                                <input
                                    type="text"
                                    placeholder="Search by city, property name, or address..."
                                    className="w-full bg-transparent border-none outline-none text-gray-900 font-light placeholder-gray-400 focus:ring-0 p-0"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                />
                                <button
                                    onClick={handleSearch}
                                    className="ml-4 px-6 py-2.5 bg-gray-900 hover:bg-orange-800 text-white text-xs tracking-widest uppercase transition-colors rounded-sm shrink-0"
                                >
                                    Search
                                </button>
                            </div>
                            {/* Line animation on focus/hover */}
                            <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-orange-800 transition-all duration-500 group-focus-within:w-full hover:w-full"></div>
                        </div>
                    </div>

                    {/* Quick City Links */}
                    {cities.length > 0 && (
                        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3">
                            <span className="text-xs uppercase tracking-widest text-gray-400 font-medium">
                                Popular:
                            </span>
                            {cities.slice(0, 6).map((city) => (
                                <button
                                    key={city}
                                    className="text-sm font-light text-gray-600 hover:text-orange-800 transition-colors border-b border-transparent hover:border-orange-800 pb-0.5"
                                    onClick={() => {
                                        setSearchQuery(city);
                                        const filtered = hotels.filter((hotel) =>
                                            hotel.city?.toLowerCase().includes(city.toLowerCase())
                                        );
                                        setFilteredHotels(filtered);
                                    }}
                                >
                                    {city}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Results Section */}
            <section className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <CircleNotch size={32} weight="light" className="text-orange-800 animate-spin" />
                        <p className="text-gray-500 font-light text-sm tracking-widest uppercase">
                            Curating properties...
                        </p>
                    </div>
                ) : filteredHotels.length === 0 ? (
                    <div className="text-center py-32 flex flex-col items-center">
                        <BuildingsIcon size={64} weight="light" className="text-gray-300 mb-6" />
                        <h2 className="text-2xl font-serif text-gray-900 mb-3">No properties found</h2>
                        <p className="text-gray-500 font-light mb-8 max-w-md mx-auto">
                            We couldn't find any results matching "{searchQuery}". Please refine your search criteria.
                        </p>
                        <button
                            className="inline-flex items-center gap-2 px-6 py-3 bg-transparent border border-gray-300 hover:border-gray-900 text-gray-900 text-sm tracking-widest uppercase transition-colors rounded-sm"
                            onClick={() => {
                                setSearchQuery('');
                                setFilteredHotels(hotels);
                            }}
                        >
                            View All Properties
                        </button>
                    </div>
                ) : (
                    <div className="space-y-16">
                        {/* Results Header */}
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-gray-200">
                            <div>
                                <h2 className="text-2xl font-serif text-gray-900 mb-2">
                                    {searchQuery ? `Results for "${searchQuery}"` : 'All Locations'}
                                </h2>
                                <p className="text-sm font-light text-gray-500 uppercase tracking-widest">
                                    {filteredHotels.length} Properties
                                </p>
                            </div>
                            {searchQuery && (
                                <button
                                    className="text-sm font-light text-gray-500 hover:text-orange-800 underline transition-colors"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setFilteredHotels(hotels);
                                    }}
                                >
                                    Clear search
                                </button>
                            )}
                        </div>

                        {/* Group by City */}
                        {Object.entries(currentHotelsByCity).map(([city, cityHotels]) => (
                            <div key={city} className="space-y-8">
                                <div className="flex items-center gap-3">
                                    <MapPinIcon size={24} weight="light" className="text-orange-800" />
                                    <h3 className="text-2xl font-serif text-gray-900">
                                        {city}
                                    </h3>
                                    <span className="text-xs font-light text-gray-400 uppercase tracking-widest ml-2 mt-1">
                                        ({cityHotels.length})
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {cityHotels.map((hotel) => (
                                        <div
                                            key={hotel._id}
                                            onClick={() => navigate(`/hotels/${hotel._id}/book`)}
                                            className="group flex flex-col bg-white border border-gray-100 rounded-sm hover:shadow-xl transition-all duration-500 overflow-hidden cursor-pointer relative"
                                        >
                                            {/* Image */}
                                            <figure className="relative h-64 overflow-hidden bg-gray-50">
                                                {hotel.photos && hotel.photos.length > 0 ? (
                                                    <img
                                                        src={hotel.photos[0]}
                                                        alt={hotel.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <BuildingsIcon size={48} weight="light" className="text-gray-300" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>

                                                {/* Badges */}
                                                <div className="absolute top-4 left-4 flex flex-col gap-2">
                                                    {hotel.featured && (
                                                        <div className="bg-orange-900/90 backdrop-blur-sm text-white text-[10px] px-3 py-1.5 uppercase tracking-[0.2em] font-medium rounded-sm w-fit">
                                                            Signature
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Favorite Button */}
                                                <button
                                                    onClick={(e) => handleToggleFavorite(e, hotel._id)}
                                                    className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-md hover:bg-white rounded-full transition-all duration-300 shadow-sm z-10"
                                                >
                                                    <HeartIcon 
                                                        size={20} 
                                                        weight={favorites.includes(hotel._id) ? "fill" : "light"}
                                                        className={favorites.includes(hotel._id) ? "text-orange-800" : "text-gray-900 hover:text-orange-800"}
                                                    />
                                                </button>
                                            </figure>

                                            {/* Info */}
                                            <div className="p-6 flex flex-col flex-grow">
                                                <h3 className="text-xl font-serif text-gray-900 mb-2 line-clamp-1 group-hover:text-orange-800 transition-colors">
                                                    {hotel.name}
                                                </h3>

                                                <p className="text-sm font-light text-gray-500 line-clamp-1 mb-4">
                                                    {hotel.address}
                                                </p>

                                                {hotel.description && (
                                                    <p className="text-sm font-light text-gray-400 line-clamp-2 mb-6 leading-relaxed">
                                                        {hotel.description}
                                                    </p>
                                                )}

                                                <div className="mt-auto flex items-center justify-between pt-6 border-t border-gray-100">
                                                    <div className="flex items-center gap-1.5">
                                                        <StarIcon size={16} weight="fill" className="text-orange-800" />
                                                        <span className="font-medium text-gray-900 text-sm">
                                                            {Number(hotel.averageRating) > 0 ? Number(hotel.averageRating).toFixed(1) : "New"}
                                                        </span>
                                                        {hotel.reviewCount > 0 && (
                                                            <span className="text-xs text-gray-400 font-light ml-1">
                                                                ({hotel.reviewCount})
                                                            </span>
                                                        )}
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
                        ))}
                        
                        {/* Elegant Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-6 mt-16 pt-8 border-t border-gray-100">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="text-xs uppercase tracking-widest font-medium text-gray-500 hover:text-orange-800 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    Prev
                                </button>
                                
                                <div className="flex gap-4">
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
                                                    className={`text-sm transition-colors ${
                                                        currentPage === pageNumber
                                                            ? 'text-orange-800 font-medium border-b border-orange-800 pb-0.5'
                                                            : 'text-gray-400 hover:text-orange-800 font-light pb-0.5 border-b border-transparent'
                                                    }`}
                                                >
                                                    {pageNumber}
                                                </button>
                                            );
                                        } else if (
                                            pageNumber === currentPage - 2 ||
                                            pageNumber === currentPage + 2
                                        ) {
                                            return <span key={pageNumber} className="text-gray-300">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>
                                
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="text-xs uppercase tracking-widest font-medium text-gray-500 hover:text-orange-800 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
};

export default Location;