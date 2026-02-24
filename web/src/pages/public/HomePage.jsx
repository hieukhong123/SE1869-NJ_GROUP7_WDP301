import { useState, useEffect } from "react";
import axiosClient from "../../services/axiosClient";
import {
    MapPinIcon,
    StarIcon,
    MapTrifoldIcon,
} from "@phosphor-icons/react";

const HomePage = () => {
    const [featuredHotels, setFeaturedHotels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchFeaturedHotels = async () => {
            try {
                setLoading(true);
                const response = await axiosClient.get("/hotels/featured");
                setFeaturedHotels(response.data);
            } catch (err) {
                console.error("Error fetching featured hotels:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchFeaturedHotels();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        // TODO: Implement search functionality
        console.log("Searching for:", searchQuery);
    };

    return (
        <>
            {/* Hero Section */}
            <section className="relative bg-base-200 py-16">
                <div className="container mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-8 items-center">
                        {/* Hero Images */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <div className="rounded-2xl overflow-hidden shadow-lg h-64">
                                    <img
                                        src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500"
                                        alt="Luxury Hotel Room"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="rounded-2xl overflow-hidden shadow-lg h-48">
                                    <img
                                        src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=500"
                                        alt="Hotel Interior"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4 pt-8">
                                <div className="rounded-2xl overflow-hidden shadow-lg h-64">
                                    <img
                                        src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=500"
                                        alt="Hotel Lobby"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="rounded-2xl overflow-hidden shadow-lg h-48">
                                    <img
                                        src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=500"
                                        alt="Hotel Exterior"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Hero Text */}
                        <div>
                            <div className="inline-block mb-4">
                                <div className="badge badge-warning gap-2 py-4 px-4 text-white">
                                    <MapPinIcon size={16} weight="fill" />
                                    Explore Perfect Stay Loving
                                </div>
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                                Staying at the perfect hotel opens the door to{" "}
                                <span className="text-warning">unforgettable</span>{" "}
                                <span className="text-warning">memories</span>
                            </h1>
                            <p className="text-base-content/70 mb-8 text-lg">
                                From accommodations, services, to nearby attractions, trust our
                                comprehensive offerings for a memorable hotel experience.
                            </p>

                            {/* Search Box */}
                            <div className="card bg-base-100 shadow-xl p-6">
                                <form onSubmit={handleSearch}>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 p-4 bg-base-200 rounded-lg">
                                                <MapTrifoldIcon size={24} className="text-warning" />
                                                <div>
                                                    <div className="text-xs font-bold text-base-content/60">
                                                        HOTEL
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="You can search for hotels!"
                                                        className="bg-transparent border-none outline-none w-full"
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            className="btn btn-warning text-white px-8"
                                        >
                                            Explore
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Hotels Section */}
            <section className="py-16 bg-base-100">
                <div className="container mx-auto px-6">
                    <div className="mb-8">
                        <div className="inline-block mb-4">
                            <div className="badge badge-warning gap-2 py-3 px-4 text-white">
                                Explore
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold">Our Featured Hotels</h2>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <span className="loading loading-spinner loading-lg text-warning"></span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {featuredHotels.map((hotel) => (
                                <div
                                    key={hotel._id}
                                    className="card bg-base-100 shadow-xl overflow-hidden hover:shadow-2xl transition-shadow"
                                >
                                    {/* Hotel Image */}
                                    <figure className="relative h-48">
                                        <img
                                            src={
                                                hotel.photos?.[0] ||
                                                "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500"
                                            }
                                            alt={hotel.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="badge bg-orange-500 absolute top-4 left-4 text-white border-none">
                                            Featured
                                        </div>
                                    </figure>

                                    {/* Hotel Info */}
                                    <div className="card-body p-4">
                                        {/* Location */}
                                        <div className="flex items-center gap-2 text-sm text-base-content/60">
                                            <MapPinIcon
                                                size={16}
                                                weight="fill"
                                                className="text-orange-500"
                                            />
                                            <span>{hotel.city}</span>
                                        </div>

                                        {/* Hotel Name */}
                                        <h3 className="card-title text-lg">{hotel.name}</h3>

                                        {/* Rating and Distance */}
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-1">
                                                <StarIcon
                                                    size={16}
                                                    weight="fill"
                                                    className="text-warning"
                                                />
                                                <span className="font-semibold">
                                                    {hotel.averageRating}
                                                </span>
                                                {hotel.reviewCount > 0 && (
                                                    <span className="text-base-content/60">
                                                        ({hotel.reviewCount})
                                                    </span>
                                                )}
                                            </div>
                                            {hotel.distance && (
                                                <div className="flex items-center gap-1 text-base-content/60">
                                                    <MapTrifoldIcon size={16} />
                                                    <span>{hotel.distance}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Book Now Button */}
                                        <div className="card-actions mt-4">
                                            <button className="btn btn-primary btn-sm w-full">
                                                Book Now
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && featuredHotels.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-base-content/60">
                                No featured hotels available at the moment.
                            </p>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
};

export default HomePage;
