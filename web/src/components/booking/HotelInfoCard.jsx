import { useState, useEffect } from "react";
import { MapPinIcon, HeartIcon, ImageIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import axiosClient from "../../services/axiosClient";

const HotelInfoCard = ({ hotel, reviews = [] }) => {
    const [isFavorite, setIsFavorite] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const [activePhoto, setActivePhoto] = useState(0);
    
    const calculateAverageRating = () => {
        if (!reviews || reviews.length === 0) return "8.5";
        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        return (sum / reviews.length).toFixed(1);
    };

    // Check if hotel is in favorites
    useEffect(() => {
        const checkFavoriteStatus = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                if (!user._id) return;
                
                const response = await axiosClient.get(`/favorites/check/${hotel._id}?userId=${user._id}`);
                setIsFavorite(response.isFavorite);
            } catch (error) {
                console.error('Error checking favorite status:', error);
            }
        };
        
        if (hotel?._id) {
            checkFavoriteStatus();
        }
    }, [hotel?._id]);
    
    // Toggle favorite
    const handleToggleFavorite = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (!user._id) {
                toast.error('Please login to add favorites');
                return;
            }
            
            setLoading(true);
            
            if (isFavorite) {
                await axiosClient.delete(`/favorites/${hotel._id}?userId=${user._id}`);
                setIsFavorite(false);
                toast.success('Removed from favorites');
            } else {
                await axiosClient.post('/favorites', { hotelId: hotel._id, userId: user._id });
                setIsFavorite(true);
                toast.success('Added to favorites');
            }
            window.dispatchEvent(new Event('favoritesUpdated'));
        } catch (error) {
            console.error('Error toggling favorite:', error);
            toast.error(error.response?.data?.message || 'Failed to update favorites');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card bg-base-100 shadow-xl sticky top-8">
            {/* Hotel Image */}
            <figure className="h-64 relative">
                <img
                    src={hotel.photos?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"}
                    alt={hotel.name}
                    className="w-full h-full object-cover"
                />
                <button
                    onClick={handleToggleFavorite}
                    disabled={loading}
                    className="btn btn-circle btn-sm absolute top-4 right-4 bg-base-100/80 hover:bg-base-100 border-0"
                    aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                    <HeartIcon 
                        size={20} 
                        weight={isFavorite ? "fill" : "regular"}
                        className={isFavorite ? "text-error" : "text-base-content"}
                    />
                </button>
            </figure>

            <div className="card-body">
                {/* Hotel Name and Rating */}
                <div className="flex items-start justify-between gap-2">
                    <h2 className="card-title text-2xl font-bold flex-1">
                        {hotel.name}
                    </h2>
                    <div className="flex flex-col items-end shrink-0">
                        <div className="bg-primary text-primary-content font-black h-12 w-12 rounded-xl flex items-center justify-center text-lg shadow-lg">
                            {calculateAverageRating()}
                        </div>
                        <span className="text-[10px] font-bold opacity-40 mt-1 uppercase tracking-wider">
                            {reviews.length} REVIEWS
                        </span>
                    </div>
                </div>

                <div className="flex items-start gap-2 opacity-60 mt-2">
                    <MapPinIcon size={18} weight="fill" className="text-primary mt-0.5" />
                    <div>
                        <p className="text-sm font-bold">{hotel?.address}</p>
                        <p className="text-xs font-medium">{hotel?.city}</p>
                    </div>
                </div>

                <div className="divider my-4 opacity-50"></div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-base-200/50 rounded-xl border border-base-300">
                        <span className="text-[10px] font-black opacity-40 uppercase">Phone</span>
                        <span className="text-sm font-bold">{hotel?.hotelPhone}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-base-200/50 rounded-xl border border-base-300">
                        <span className="text-[10px] font-black opacity-40 uppercase">Email</span>
                        <span className="text-sm font-bold">{hotel?.hotelEmail}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HotelInfoCard;
