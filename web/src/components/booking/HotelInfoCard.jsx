import { useState } from "react";
import { MapPinIcon, ImageIcon } from "@phosphor-icons/react";

const HotelInfoCard = ({ hotel, reviews = [] }) => {
    const [activePhoto, setActivePhoto] = useState(0);
    
    const calculateAverageRating = () => {
        if (!reviews || reviews.length === 0) return "8.5";
        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        return (sum / reviews.length).toFixed(1);
    };

    const photos = hotel?.photos?.length > 0 
        ? hotel.photos 
        : ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"];

    return (
        <div className="card bg-base-100 shadow-xl overflow-hidden border border-base-200">
            {/* Image Gallery */}
            <div className="relative group">
                <figure className="h-64 overflow-hidden">
                    <img
                        src={photos[activePhoto]}
                        alt={hotel?.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                </figure>
                
                {/* Thumbnails Row */}
                {photos.length > 1 && (
                    <div className="absolute bottom-4 left-4 right-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {photos.map((photo, index) => (
                            <button
                                key={index}
                                onClick={() => setActivePhoto(index)}
                                className={`w-14 h-10 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                                    activePhoto === index ? "border-primary scale-110 shadow-lg" : "border-white/50 opacity-80"
                                }`}
                            >
                                <img src={photo} className="w-full h-full object-cover" alt={`Thumbnail ${index + 1}`} />
                            </button>
                        ))}
                    </div>
                )}

                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <ImageIcon size={14} />
                    {photos.length} PHOTOS
                </div>
            </div>

            <div className="card-body p-6">
                <div className="flex items-start justify-between gap-4">
                    <h2 className="card-title text-2xl font-black leading-tight">
                        {hotel?.name}
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
