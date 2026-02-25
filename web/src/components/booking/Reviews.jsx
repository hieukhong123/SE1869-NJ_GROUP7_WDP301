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
        // Get current user from localStorage
        const userStr = localStorage.getItem("user");
        if (userStr) {
            setCurrentUser(JSON.parse(userStr));
        }
        
        fetchReviews();
    }, [hotelId]);

    useEffect(() => {
        // Filter reviews based on selected rating
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

        // PRE-01: Check if user is logged in
        if (!currentUser) {
            toast.error("Please login to submit a review");
            return;
        }

        // Alternative Flow 4.2: Validate rating selection
        if (!newReview.rating || newReview.rating < 1 || newReview.rating > 5) {
            toast.error("Please select a rating");
            return;
        }

        // Alternative Flow 4.1: Validate feedback content
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

            const response = await axiosClient.post("/reviews", reviewData);
            
            // POS-01: Feedback saved successfully
            toast.success("Review submitted successfully!");
            setNewReview({ rating: 5, reviewText: "" });
            
            // Refresh reviews to display new feedback at top
            fetchReviews();
        } catch (error) {
            console.error("Error submitting review:", error);
            // E1: Exception handling
            const errorMessage = error.response?.data?.message || "Failed to submit feedback. Please try again later.";
            toast.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const getStarCount = (rating) => {
        return reviews.filter(r => r.rating === rating).length;
    };

    const renderStars = (rating, size = 20, interactive = false, onRate = null) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={size}
                        weight={star <= rating ? "fill" : "regular"}
                        className={`${
                            star <= rating ? "text-warning" : "text-base-content/30"
                        } ${interactive ? "cursor-pointer hover:text-warning" : ""}`}
                        onClick={() => interactive && onRate && onRate(star)}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                    Reviews ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
                </h2>
            </div>

            {/* Star Filter */}
            <div className="flex flex-wrap gap-3">
                <button
                    className={`btn btn-sm ${!selectedRating ? "btn-primary" : "btn-outline"}`}
                    onClick={() => setSelectedRating(null)}
                >
                    All
                </button>
                {[5, 4, 3, 2, 1].map((rating) => (
                    <button
                        key={rating}
                        className={`btn btn-sm ${
                            selectedRating === rating ? "btn-primary" : "btn-outline"
                        }`}
                        onClick={() => setSelectedRating(rating)}
                    >
                        <Star size={16} weight="fill" className="text-warning" />
                        {rating}
                        <span className="badge badge-sm">{getStarCount(rating)}</span>
                    </button>
                ))}
            </div>

            {/* Review Form - PRE-01: User must be logged in */}
            {currentUser ? (
                <div className="card bg-base-100 border border-base-300">
                    <div className="card-body">
                        <form onSubmit={handleSubmitReview} className="space-y-4">
                            {/* Rating Selection */}
                            <div className="flex items-center gap-3">
                                <span className="font-medium text-sm">Your Rating:</span>
                                {renderStars(
                                    newReview.rating,
                                    24,
                                    true,
                                    (rating) => setNewReview({ ...newReview, rating })
                                )}
                            </div>

                            {/* Review Text Input */}
                            <div className="relative">
                                <textarea
                                    placeholder="Share your thoughts about this hotel..."
                                    className="textarea textarea-bordered w-full h-24 resize-none"
                                    value={newReview.reviewText}
                                    onChange={(e) =>
                                        setNewReview({ ...newReview, reviewText: e.target.value })
                                    }
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="btn btn-warning gap-2"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span>
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <PaperPlaneTilt size={20} weight="fill" />
                                        SUBMIT REVIEW
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="card bg-base-100 border border-warning">
                    <div className="card-body text-center py-8">
                        <SignIn size={48} className="mx-auto text-warning mb-3" />
                        <h3 className="font-semibold text-lg mb-2">Login Required</h3>
                        <p className="text-base-content/70 mb-4">
                            You must have an account and be logged in to submit a review.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <Link to="/login" className="btn btn-warning">
                                Login
                            </Link>
                            <Link to="/register" className="btn btn-outline">
                                Create Account
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
                {filteredReviews.length === 0 ? (
                    <div className="card bg-base-100 border border-base-300">
                        <div className="card-body text-center py-12">
                            <p className="text-base-content/60">
                                {selectedRating
                                    ? `No ${selectedRating}-star reviews yet`
                                    : "No reviews yet. Be the first to review!"}
                            </p>
                        </div>
                    </div>
                ) : (
                    filteredReviews.map((review) => (
                        <div
                            key={review._id}
                            className="card bg-base-100 border border-base-300"
                        >
                            <div className="card-body p-6">
                                <div className="flex items-start gap-4">
                                    {/* User Avatar */}
                                    <div className="avatar placeholder">
                                        <div className="bg-primary/10 text-primary rounded-full w-12 h-12 flex items-center justify-center">
                                            <User size={24} weight="fill" />
                                        </div>
                                    </div>

                                    {/* Review Content */}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <p className="font-medium">
                                                    {review.userId?.fullName || "Anonymous"}
                                                </p>
                                                <p className="text-sm text-base-content/60">
                                                    {review.userId?.email || ""}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                {renderStars(review.rating, 18)}
                                                <p className="text-xs text-base-content/60 mt-1">
                                                    {new Date(review.createdAt).toLocaleDateString(
                                                        "en-US",
                                                        {
                                                            month: "long",
                                                            day: "numeric",
                                                            year: "numeric",
                                                        }
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Review Text */}
                                        {review.reviewText && (
                                            <p className="text-base-content/80 leading-relaxed">
                                                {review.reviewText}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Reviews;
