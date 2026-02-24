import { StarIcon, MapPinIcon } from "@phosphor-icons/react";

const HotelInfoCard = ({ hotel, reviews }) => {
    const calculateAverageRating = () => {
        if (reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        return (sum / reviews.length).toFixed(1);
    };

    return (
        <div className="card bg-base-100 shadow-xl sticky top-8">
            {/* Hotel Image */}
            <figure className="h-64">
                <img
                    src={hotel.photos?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"}
                    alt={hotel.name}
                    className="w-full h-full object-cover"
                />
            </figure>

            <div className="card-body">
                {/* Hotel Name and Rating */}
                <div className="flex items-start justify-between gap-2">
                    <h2 className="card-title text-2xl font-bold flex-1">
                        {hotel.name}
                    </h2>
                    <div className="flex items-center gap-1 bg-warning/20 px-3 py-1 rounded-lg">
                        <StarIcon weight="fill" className="text-warning" size={20} />
                        <span className="font-semibold">
                            {calculateAverageRating()}
                        </span>
                        <span className="text-sm text-base-content/60">
                            ({reviews.length})
                        </span>
                    </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-2 text-base-content/70">
                    <MapPinIcon size={20} className="mt-1 flex-shrink-0" />
                    <div>
                        <p className="font-medium">{hotel.address}</p>
                        <p className="text-sm">{hotel.city}</p>
                    </div>
                </div>

                {/* Description */}
                {hotel.description && (
                    <div className="mt-4">
                        <h3 className="font-semibold mb-2">About this hotel</h3>
                        <p className="text-sm text-base-content/70 leading-relaxed">
                            {hotel.description}
                        </p>
                    </div>
                )}

                {/* Contact Info */}
                <div className="divider"></div>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-base-content/60">Phone:</span>
                        <span className="font-medium">{hotel.hotelPhone}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-base-content/60">Email:</span>
                        <span className="font-medium">{hotel.hotelEmail}</span>
                    </div>
                    {hotel.distance && (
                        <div className="flex justify-between">
                            <span className="text-base-content/60">Distance:</span>
                            <span className="font-medium">{hotel.distance}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HotelInfoCard;
