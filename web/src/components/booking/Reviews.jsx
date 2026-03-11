import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star, User, PaperPlaneTilt, SignIn } from "@phosphor-icons/react";
import { toast } from "sonner";
import axiosClient from "../../services/axiosClient";

const Reviews = ({ hotelId }) => {
    const [reviews, setReviews] = useState([]);
    const [filteredReviews, setFilteredReviews] = useState([]);
    const [selectedRating, setSelectedRating] = useState(null);
    const [newReview, setNewReview] = useState({
        rating: 5,
        reviewText: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            setCurrentUser(JSON.parse(userStr));
        }
        fetchReviews();
    }, [hotelId]);

    useEffect(() => {
        if (selectedRating) {
            setFilteredReviews(reviews.filter(r => r.rating === selectedRating));
        } else {
            setFilteredReviews(reviews);
        }
    }, [selectedRating, reviews]);

    const fetchReviews = async () => {
        try {
            const response = await axiosClient.get(`/reviews?hotelId=${hotelId}`);
            setReviews(response.data || []);
            setFilteredReviews(response.data || []);
        } catch (error) {
            console.error("Error fetching reviews:", error);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();

        if (!currentUser) {
            toast.error("Please login to submit a review");
            return;
        }

        if (!newReview.rating || newReview.rating < 1 || newReview.rating > 5) {
            toast.error("Please select a rating");
            return;
        }

        if (!newReview.reviewText.trim()) {
            toast.error("Please enter your feedback message");
            return;
        }

        try {
            setSubmitting(true);
            
            const reviewData = {
                hotelId,
                userId: currentUser._id,
                rating: newReview.rating,
                reviewText: newReview.reviewText,
            };

            await axiosClient.post("/reviews", reviewData);
            
            toast.success("Thank you for sharing your experience!");
            setNewReview({ rating: 5, reviewText: "" });
            
            fetchReviews();
        } catch (error) {
            console.error("Error submitting review:", error);
            const errorMessage = error.response?.data?.message || "Failed to submit feedback. Please try again later.";
            toast.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const getStarCount = (rating) => {
        return reviews.filter(r => r.rating === rating).length;
    };

    const renderStars = (rating, size = 16, interactive = false, onRate = null) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={size}
                        weight="fill"
                        className={`${
                            star <= rating ? "text-orange-800" : "text-gray-200"
                        } ${interactive ? "cursor-pointer hover:scale-110 transition-transform" : ""}`}
                        onClick={() => interactive && onRate && onRate(star)}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-12">
            {/* Header */}
            <div className="border-b border-gray-200 pb-6">
                <span className="text-xs uppercase tracking-[0.2em] font-medium text-orange-800 mb-2 block">
                    Guest Reviews
                </span>
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <h2 className="text-3xl font-serif text-gray-900">
                        Past Experiences
                    </h2>
                    <span className="text-sm font-light text-gray-500 uppercase tracking-widest">
                        {reviews.length} {reviews.length === 1 ? "Review" : "Reviews"}
                    </span>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-12">
                {/* Left Column: Filter & Submit Form */}
                <div className="lg:col-span-4 space-y-10">
                    {/* Star Filter */}
                    <div>
                        <h3 className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-4">
                            Filter by Rating
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            <button
                                className={`px-4 py-2 text-xs uppercase tracking-widest transition-colors rounded-sm border ${
                                    !selectedRating 
                                        ? "bg-gray-900 text-white border-gray-900" 
                                        : "bg-transparent text-gray-600 border-gray-200 hover:border-gray-900"
                                }`}
                                onClick={() => setSelectedRating(null)}
                            >
                                All
                            </button>
                            {[5, 4, 3, 2, 1].map((rating) => (
                                <button
                                    key={rating}
                                    className={`px-4 py-2 text-xs transition-colors rounded-sm border flex items-center gap-1.5 ${
                                        selectedRating === rating 
                                            ? "bg-gray-900 text-white border-gray-900" 
                                            : "bg-transparent text-gray-600 border-gray-200 hover:border-gray-900"
                                    }`}
                                    onClick={() => setSelectedRating(rating)}
                                >
                                    <Star size={12} weight="fill" className={selectedRating === rating ? "text-white" : "text-orange-800"} />
                                    {rating}
                                    <span className="ml-1 opacity-50">({getStarCount(rating)})</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Review Form */}
                    {currentUser ? (
                        <div className="bg-gray-50 p-6 md:p-8 rounded-sm border border-gray-100">
                            <h3 className="text-lg font-serif text-gray-900 mb-6">
                                Share Your Experience
                            </h3>
                            <form onSubmit={handleSubmitReview} className="space-y-6">
                                <div>
                                    <span className="block text-xs uppercase tracking-widest text-gray-500 mb-3">
                                        Your Rating
                                    </span>
                                    {renderStars(
                                        newReview.rating,
                                        24,
                                        true,
                                        (rating) => setNewReview({ ...newReview, rating })
                                    )}
                                </div>

                                <div>
                                    <span className="block text-xs uppercase tracking-widest text-gray-500 mb-3">
                                        Your Thoughts
                                    </span>
                                    <textarea
                                        placeholder="Tell us what made your stay special..."
                                        className="w-full bg-white border border-gray-200 px-4 py-3 text-gray-900 font-light focus:ring-0 focus:border-orange-800 transition-colors rounded-sm h-32 resize-none placeholder-gray-300"
                                        value={newReview.reviewText}
                                        onChange={(e) =>
                                            setNewReview({ ...newReview, reviewText: e.target.value })
                                        }
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-3 px-6 bg-gray-900 hover:bg-black text-white text-xs tracking-widest uppercase transition-all duration-300 rounded-sm flex items-center justify-center gap-2 disabled:opacity-70"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <PaperPlaneTilt size={16} weight="light" />
                                            Submit Review
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="bg-gray-50 p-8 rounded-sm border border-gray-100 text-center">
                            <SignIn size={32} weight="light" className="mx-auto text-gray-400 mb-4" />
                            <h3 className="font-serif text-gray-900 text-lg mb-2">Join the Conversation</h3>
                            <p className="text-sm font-light text-gray-500 mb-6">
                                We invite you to log in to share your experience with other travelers.
                            </p>
                            <div className="flex flex-col gap-3">
                                <Link to="/login" className="w-full py-3 bg-gray-900 hover:bg-black text-white text-xs tracking-widest uppercase transition-colors rounded-sm text-center">
                                    Sign In
                                </Link>
                                <Link to="/register" className="w-full py-3 bg-transparent border border-gray-300 hover:border-gray-900 text-gray-900 text-xs tracking-widest uppercase transition-colors rounded-sm text-center">
                                    Create Account
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Reviews List */}
                <div className="lg:col-span-8">
                    {filteredReviews.length === 0 ? (
                        <div className="py-16 text-center border border-gray-100 border-dashed rounded-sm">
                            <p className="text-gray-400 font-light italic">
                                {selectedRating
                                    ? `There are currently no ${selectedRating}-star reviews.`
                                    : "No experiences have been shared yet. Be the first to leave a review."}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {filteredReviews.map((review) => (
                                <div
                                    key={review._id}
                                    className="pb-8 border-b border-gray-100 last:border-b-0 last:pb-0"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-start gap-4 md:gap-6">
                                        {/* User Info (Left side on desktop) */}
                                        <div className="flex items-center sm:flex-col sm:items-center gap-3 sm:w-24 shrink-0">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                                                <User size={20} weight="light" />
                                            </div>
                                            <div className="sm:text-center">
                                                <p className="font-medium text-sm text-gray-900 line-clamp-1">
                                                    {review.userId?.fullName || "Guest"}
                                                </p>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1 hidden sm:block">
                                                    Verified
                                                </p>
                                            </div>
                                        </div>

                                        {/* Review Content (Right side) */}
                                        <div className="flex-1 bg-white">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                                {renderStars(review.rating, 16)}
                                                <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                                                    {new Date(review.createdAt).toLocaleDateString("en-US", {
                                                        month: "long",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    })}
                                                </p>
                                            </div>

                                            {review.reviewText && (
                                                <p className="text-gray-600 font-light leading-loose text-sm md:text-base italic">
                                                    "{review.reviewText}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reviews;