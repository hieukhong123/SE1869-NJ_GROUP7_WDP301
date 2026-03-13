import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';
import { 
    CaretLeft, 
    CircleNotch, 
    Star, 
    User, 
    Buildings,
    Quotes
} from '@phosphor-icons/react';

const ReviewDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [review, setReview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (id) {
            const fetchReview = async () => {
                setLoading(true);
                try {
                    const response = await axiosClient.get(`/reviews/${id}`);
                    setReview(response.data);
                } catch (err) {
                    setError(err);
                } finally {
                    setLoading(false);
                }
            };
            fetchReview();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-transparent">
                <CircleNotch size={32} weight="light" className="text-orange-800 animate-spin" />
                <p className="text-gray-500 font-light text-sm tracking-widest uppercase">
                    Loading Feedback...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-transparent">
                <p className="text-red-500 font-serif text-xl">Unable to load review</p>
                <p className="text-gray-500 font-light">{error.message}</p>
            </div>
        );
    }

    if (!review) return null;

    const rating = Number(review.rating) || 0;

    return (
        <div className="p-6 md:p-8 lg:p-12 max-w-4xl mx-auto">
            
            {/* Header */}
            <div className="flex items-center gap-4 mb-10 pb-6 border-b border-gray-200">
                <button 
                    onClick={() => navigate('/admin/reviews')} 
                    className="p-2 text-gray-400 hover:text-gray-900 transition-colors border border-gray-200 rounded-sm hover:bg-white bg-gray-50"
                    title="Back to Reviews"
                >
                    <CaretLeft size={20} weight="light" />
                </button>
                <div>
                    <h1 className="text-3xl font-serif text-gray-900 mb-1">
                        Feedback Details
                    </h1>
                    <p className="text-[10px] font-medium text-gray-500 uppercase tracking-[0.2em]">
                        Guest Satisfaction Record
                    </p>
                </div>
            </div>

            {/* Content Card */}
            <div className="bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden">
                
                {/* Meta Information */}
                <div className="grid sm:grid-cols-2 gap-0 border-b border-gray-100 bg-gray-50/50">
                    <div className="p-6 sm:p-8 sm:border-r border-b sm:border-b-0 border-gray-100">
                        <div className="flex items-center gap-3 mb-2">
                            <Buildings size={18} weight="light" className="text-orange-800" />
                            <span className="text-[10px] uppercase tracking-widest text-gray-400">Property</span>
                        </div>
                        <p className="text-lg font-serif text-gray-900 ml-7">
                            {review.hotelId?.name || "Unknown Property"}
                        </p>
                    </div>
                    
                    <div className="p-6 sm:p-8">
                        <div className="flex items-center gap-3 mb-2">
                            <User size={18} weight="light" className="text-orange-800" />
                            <span className="text-[10px] uppercase tracking-widest text-gray-400">Guest</span>
                        </div>
                        <p className="text-lg font-serif text-gray-900 ml-7">
                            {review.userId?.fullName || "Anonymous Guest"}
                        </p>
                    </div>
                </div>

                {/* Review Content */}
                <div className="p-8 md:p-12 relative">
                    
                    {/* Decorative Quotes */}
                    <Quotes size={64} weight="fill" className="absolute top-8 left-8 text-gray-50 opacity-50" />
                    
                    <div className="relative z-10 flex flex-col items-center text-center">
                        
                        {/* Star Rating */}
                        <div className="flex items-center gap-1 mb-8">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                    key={star} 
                                    size={24} 
                                    weight="fill" 
                                    className={star <= rating ? "text-orange-800" : "text-gray-200"} 
                                />
                            ))}
                            <span className="ml-3 text-sm font-medium text-gray-900 border-l border-gray-300 pl-3">
                                {rating}.0 / 5.0
                            </span>
                        </div>

                        {/* Review Text */}
                        <p className="text-xl md:text-2xl font-light text-gray-700 italic leading-relaxed max-w-2xl whitespace-pre-wrap">
                            "{review.reviewText || "No written feedback provided."}"
                        </p>
                        
                    </div>
                </div>

            </div>

            {/* Action Buttons */}
            <div className="flex justify-end mt-8">
                <button
                    type="button"
                    className="px-8 py-3 bg-transparent border border-gray-300 text-gray-700 hover:border-gray-900 hover:text-gray-900 text-xs tracking-widest uppercase transition-colors rounded-sm"
                    onClick={() => navigate('/admin/reviews')}
                >
                    Return to List
                </button>
            </div>
            
        </div>
    );
};

export default ReviewDetails;