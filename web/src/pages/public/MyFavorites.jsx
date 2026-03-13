import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axiosClient from '../../services/axiosClient';
import {
    HeartIcon,
    MapPinIcon,
    StarIcon,
    BuildingsIcon,
    ArrowRightIcon,
    SparkleIcon,
} from '@phosphor-icons/react';

const MyFavorites = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState([]);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            toast.error('Please login to view favorites');
            navigate('/login');
            return;
        }
        
        try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            fetchFavorites(parsedUser._id);
        } catch (error) {
            console.error('Error parsing user data:', error);
            toast.error('Invalid user session. Please login again');
            localStorage.removeItem('user');
            navigate('/login');
        }
    }, [navigate]);

    const fetchFavorites = async (userId) => {
        try {
            setLoading(true);
            const response = await axiosClient.get(`/favorites?userId=${userId}`);
            setFavorites(response.data || []);
        } catch (error) {
            console.error('Error fetching favorites:', error);
            toast.error('Failed to load favorites');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFavorite = async (hotelId) => {
        if (!user?._id) return;
        
        try {
            await axiosClient.delete(`/favorites/${hotelId}?userId=${user._id}`);
            setFavorites(favorites.filter(hotel => hotel._id !== hotelId));
            toast.success('Removed from favorites');
        } catch (error) {
            console.error('Error removing favorite:', error);
            toast.error('Failed to remove favorite');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
                    <p className="text-gray-500 text-sm tracking-wide uppercase">Loading favorites...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Section */}
            <section className="bg-white border-b border-gray-200 py-16 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-3xl md:text-4xl font-serif text-gray-900 mb-3">
                        Your Saved Collections
                    </h1>
                    <p className="text-gray-500 max-w-2xl mx-auto font-light">
                        {favorites.length === 0
                            ? 'Curate your own list of extraordinary stays.'
                            : `You have thoughtfully selected ${favorites.length} ${favorites.length === 1 ? 'property' : 'properties'}.`}
                    </p>
                </div>
            </section>

            {/* Content Section */}
            <section className="max-w-7xl mx-auto py-12 px-4">
                {favorites.length === 0 ? (
                    <div className="text-center py-24 flex flex-col items-center">
                        <HeartIcon
                            size={64}
                            weight="light"
                            className="text-gray-300 mb-6"
                        />
                        <h2 className="text-2xl font-serif text-gray-900 mb-3">
                            No favorites yet
                        </h2>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto font-light">
                            Explore our curated collection of luxury hotels and save your favorites to plan your next unforgettable escape.
                        </p>
                        <Link
                            to="/location"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-black text-white text-sm tracking-wide uppercase transition-colors rounded-sm"
                        >
                            <BuildingsIcon size={18} weight="regular" />
                            <span>Discover Properties</span>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {favorites.map((hotel) => {
                            if (!hotel) return null;

                            return (
                                <div
                                    key={hotel._id}
                                    className="group bg-white flex flex-col border border-gray-100 hover:shadow-xl transition-all duration-500 overflow-hidden rounded-sm"
                                >
                                    <figure className="relative h-64 overflow-hidden bg-gray-100">
                                        {hotel.photos && hotel.photos.length > 0 ? (
                                            <>
                                                <img
                                                    src={hotel.photos[0]}
                                                    alt={hotel.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                                                />
                                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <BuildingsIcon
                                                    size={48}
                                                    weight="light"
                                                    className="text-gray-300"
                                                />
                                            </div>
                                        )}

                                        {/* Remove Button */}
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleRemoveFavorite(hotel._id);
                                            }}
                                            className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-md hover:bg-white text-gray-500 hover:text-red-500 rounded-full transition-all duration-300 shadow-sm"
                                            title="Remove from favorites"
                                        >
                                            <HeartIcon size={20} weight="fill" className="text-gray-900 hover:text-red-500 transition-colors" />
                                        </button>

                                        {/* Featured Badge */}
                                        {hotel.featured && (
                                            <div className="absolute top-4 left-4">
                                                <div className="bg-gray-900/90 backdrop-blur-sm text-white text-xs px-3 py-1.5 uppercase tracking-widest font-medium flex items-center gap-1.5 rounded-sm">
                                                    <SparkleIcon size={12} weight="fill" />
                                                    <span>Featured</span>
                                                </div>
                                            </div>
                                        )}
                                    </figure>

                                    <div className="p-6 flex flex-col flex-grow">
                                        <div className="flex justify-between items-start gap-4 mb-2">
                                            <h3 className="text-xl font-serif text-gray-900 line-clamp-1">
                                                {hotel.name}
                                            </h3>
                                            {hotel.averageRating > 0 && (
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <StarIcon size={16} weight="fill" className="text-gray-900" />
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {hotel.averageRating.toFixed(1)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-start gap-2 mb-4">
                                            <MapPinIcon
                                                size={16}
                                                weight="light"
                                                className="text-gray-400 shrink-0 mt-0.5"
                                            />
                                            <p className="text-sm text-gray-500 line-clamp-1 font-light">
                                                {hotel.address}, {hotel.city}
                                            </p>
                                        </div>

                                        {hotel.description && (
                                            <p className="text-sm text-gray-500 line-clamp-2 mb-6 font-light leading-relaxed">
                                                {hotel.description}
                                            </p>
                                        )}

                                        <div className="mt-auto pt-6 border-t border-gray-100">
                                            <Link
                                                to={`/hotels/${hotel._id}/book`}
                                                className="w-full inline-flex justify-center items-center gap-2 py-3 px-4 border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-colors duration-300 text-sm tracking-wide uppercase rounded-sm"
                                            >
                                                View Details
                                                <ArrowRightIcon size={16} weight="regular" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
};

export default MyFavorites;