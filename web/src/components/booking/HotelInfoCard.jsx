import { useState, useEffect } from "react";
import { MapPinIcon, HeartIcon, StarIcon, PhoneIcon, EnvelopeSimpleIcon, X, CaretRight } from "@phosphor-icons/react";
import { toast } from "sonner";
import axiosClient from "../../services/axiosClient";

const HotelInfoCard = ({ hotel, reviews = [] }) => {
    const [isFavorite, setIsFavorite] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const calculateAverageRating = () => {
        if (!reviews || reviews.length === 0) return "New";
        const sum = reviews.reduce((acc, review) => acc + Number(review.rating), 0);
        return Number(sum / reviews.length).toFixed(1);
    };

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
    
    const handleToggleFavorite = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (!user._id) {
                toast.error('Please login to save this property');
                return;
            }
            
            setLoading(true);
            
            if (isFavorite) {
                await axiosClient.delete(`/favorites/${hotel._id}?userId=${user._id}`);
                setIsFavorite(false);
                toast.success('Removed from saved properties');
            } else {
                await axiosClient.post('/favorites', { hotelId: hotel._id, userId: user._id });
                setIsFavorite(true);
                toast.success('Property saved to your collection');
            }
            window.dispatchEvent(new Event('favoritesUpdated'));
        } catch (error) {
            console.error('Error toggling favorite:', error);
            toast.error(error.response?.data?.message || 'Failed to update collection');
        } finally {
            setLoading(false);
        }
    };

    const photos = hotel?.photos || ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"];
    const mainPhoto = photos[0];
    const subPhotos = photos.slice(1, 5); 
    const remainingPhotosCount = photos.length > 5 ? photos.length - 5 : 0;

    return (
        <>
            <div className="bg-white border border-gray-200 rounded-sm shadow-2xl shadow-gray-200/50 sticky top-32 overflow-hidden flex flex-col">
                
                <div className="relative group cursor-pointer" onClick={() => setIsModalOpen(true)}>
                    <figure className="h-48 relative bg-gray-50 overflow-hidden">
                        <img
                            src={mainPhoto}
                            alt={hotel?.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                        />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500"></div>
                    </figure>

                    {subPhotos.length > 0 && (
                        <div className="grid grid-cols-4 gap-1 mt-1 px-1">
                            {subPhotos.map((photo, idx) => (
                                <div key={idx} className="relative h-16 bg-gray-50 overflow-hidden rounded-sm">
                                    <img 
                                        src={photo} 
                                        alt={`Detail ${idx + 1}`} 
                                        className="w-full h-full object-cover"
                                    />
                                    {idx === 3 && remainingPhotosCount > 0 && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <span className="text-white text-xs font-medium tracking-wide">
                                                +{remainingPhotosCount}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite();
                        }}
                        disabled={loading}
                        className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-md hover:bg-white rounded-full transition-all duration-300 shadow-md disabled:opacity-50 z-10"
                        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                    >
                        <HeartIcon 
                            size={18} 
                            weight={isFavorite ? "fill" : "light"}
                            className={isFavorite ? "text-orange-800" : "text-gray-900 hover:text-orange-800 transition-colors"}
                        />
                    </button>
                    
                    <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-sm shadow-md z-10">
                        <StarIcon size={14} weight="fill" className="text-orange-800" />
                        <span className="font-serif font-medium text-gray-900 text-sm">
                            {calculateAverageRating()}
                        </span>
                        {reviews.length > 0 && (
                            <span className="text-[9px] uppercase tracking-widest text-gray-500 font-light border-l border-gray-300 pl-1.5 ml-0.5">
                                {reviews.length} Revs
                            </span>
                        )}
                    </div>
                </div>

                <div className="p-6 md:p-8 flex-1 flex flex-col">
                    <div className="mb-6">
                        <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-orange-800 mb-2 block">
                            Property Overview
                        </span>
                        <h2 className="text-2xl font-serif text-gray-900 leading-snug">
                            {hotel?.name}
                        </h2>
                    </div>

                    <div className="flex items-start gap-3 mb-6 flex-1">
                        <MapPinIcon size={20} weight="light" className="text-gray-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-light text-gray-600 leading-relaxed">
                                {hotel?.address}
                            </p>
                            <p className="text-xs uppercase tracking-widest text-gray-400 mt-1 font-medium">
                                {hotel?.city}
                            </p>
                        </div>
                    </div>

                    <div className="h-[1px] bg-gray-100 w-full mb-6"></div>

                    <div>
                        <h3 className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-4">
                            Direct Inquiries
                        </h3>
                        <div className="space-y-3">
                            <div className="group flex items-center gap-3">
                                <div className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-sm bg-gray-50 group-hover:bg-gray-900 group-hover:border-gray-900 transition-colors">
                                    <PhoneIcon size={16} weight="light" className="text-gray-500 group-hover:text-white transition-colors" />
                                </div>
                                <div className="flex-1">
                                    <a href={`tel:${hotel?.hotelPhone}`} className="text-sm font-light text-gray-900 hover:text-orange-800 transition-colors block">
                                        {hotel?.hotelPhone || "Not available"}
                                    </a>
                                </div>
                            </div>
                            <div className="group flex items-center gap-3">
                                <div className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-sm bg-gray-50 group-hover:bg-gray-900 group-hover:border-gray-900 transition-colors">
                                    <EnvelopeSimpleIcon size={16} weight="light" className="text-gray-500 group-hover:text-white transition-colors" />
                                </div>
                                <div className="flex-1">
                                    <a href={`mailto:${hotel?.hotelEmail}`} className="text-sm font-light text-gray-900 hover:text-orange-800 transition-colors block truncate">
                                        {hotel?.hotelEmail || "Not available"}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="mt-6 w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-900 text-xs tracking-widest uppercase transition-colors rounded-sm flex items-center justify-center gap-2 border border-gray-200"
                    >
                        Explore Gallery <CaretRight size={14} weight="light" />
                    </button>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div 
                        className="bg-white w-full sm:w-[90vw] md:w-[80vw] max-w-5xl h-[90vh] sm:h-[85vh] rounded-t-2xl sm:rounded-sm flex flex-col overflow-hidden animate-slide-up"
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0">
                            <div>
                                <h3 className="font-serif text-xl text-gray-900">Property Gallery</h3>
                                <p className="text-xs uppercase tracking-widest text-gray-500">{photos.length} Photos</p>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-full transition-colors"
                            >
                                <X size={20} weight="bold" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50">
                            <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
                                {photos.map((photo, index) => (
                                    <div key={index} className="break-inside-avoid rounded-sm overflow-hidden border border-gray-200 bg-white">
                                        <img 
                                            src={photo} 
                                            alt={`${hotel?.name} - View ${index + 1}`}
                                            className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
                                            loading="lazy"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default HotelInfoCard;