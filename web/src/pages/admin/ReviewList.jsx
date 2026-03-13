import { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import axiosClient from '../../services/axiosClient';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { CircleNotch, Trash, Eye, Star, ChatsTeardrop } from '@phosphor-icons/react';

const ReviewList = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await axiosClient.get('/reviews');
            setReviews(response.data);
        } catch (err) {
            setError(err);
            toast.error('Failed to load guest reviews.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
            try {
                await axiosClient.delete(`/reviews/${id}`);
                setReviews(reviews.filter((review) => review._id !== id));
                toast.success('Review deleted successfully.');
            } catch (err) {
                toast.error('Failed to delete review: ' + (err.response?.data?.message || err.message));
            }
        }
    };

    const columns = [
        { 
            accessorKey: 'hotelId.name', 
            header: 'Property',
            cell: (info) => <span className="font-medium text-gray-900">{info.getValue() || '-'}</span>,
            accessorFn: (row) => row.hotelId?.name || '-'
        },
        { 
            accessorKey: 'userId.fullName', 
            header: 'Guest',
            cell: (info) => <span className="text-gray-600 font-light">{info.getValue() || 'Anonymous'}</span>,
            accessorFn: (row) => row.userId?.fullName || '-'
        },
        { 
            accessorKey: 'rating', 
            header: 'Rating',
            cell: (info) => {
                const rating = Number(info.getValue()) || 0;
                return (
                    <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                                key={star} 
                                size={14} 
                                weight="fill" 
                                className={star <= rating ? "text-orange-800" : "text-gray-200"} 
                            />
                        ))}
                        <span className="ml-2 text-xs font-medium text-gray-900">{rating}.0</span>
                    </div>
                );
            }
        },
        { 
            accessorKey: 'reviewText', 
            header: 'Feedback',
            cell: (info) => (
                <span className="text-gray-500 font-light italic line-clamp-2 min-w-[250px] leading-relaxed">
                    "{info.getValue() || 'No written feedback provided.'}"
                </span>
            )
        },
        {
            accessorKey: 'actions',
            header: 'Actions',
            enableGlobalFilter: false,
            enableSorting: false,
            cell: ({ row }) => (
                <div className="flex items-center gap-1">
                    <Link
                        to={`/admin/reviews/${row.original._id}/view`}
                        className="p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-50"
                        title="View Full Review"
                    >
                        <Eye size={18} weight="light" />
                    </Link>
                    <button
                        onClick={() => handleDelete(row.original._id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                        title="Delete Review"
                    >
                        <Trash size={18} weight="light" />
                    </button>
                </div>
            ),
        },
    ];

    if (loading)
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-transparent">
                <CircleNotch size={32} weight="light" className="text-orange-800 animate-spin" />
                <p className="text-gray-500 font-light text-sm tracking-widest uppercase">
                    Loading Feedback...
                </p>
            </div>
        );

    if (error)
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-transparent">
                <p className="text-red-500 font-serif text-xl">Unable to load data</p>
                <p className="text-gray-500 font-light">{error.message}</p>
            </div>
        );

    return (
        <div className="p-6 md:p-8 lg:p-12">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 pb-6 border-b border-gray-200 gap-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-serif text-gray-900 mb-2">
                            Guest Reviews
                        </h1>
                        <p className="text-xs font-light text-gray-500 uppercase tracking-[0.2em]">
                            Monitor Guest Feedback & Satisfaction
                        </p>
                    </div>
                </div>

                {/* Table Section or Empty State */}
                {reviews.length === 0 ? (
                    <div className="bg-white border border-gray-200 border-dashed rounded-sm py-32 flex flex-col items-center justify-center text-center px-4">
                        <ChatsTeardrop size={48} weight="light" className="text-gray-300 mb-6" />
                        <h3 className="text-xl font-serif text-gray-900 mb-2">No Reviews Yet</h3>
                        <p className="text-gray-500 font-light max-w-md mx-auto">
                            Guests haven't left any feedback for the properties in your portfolio yet.
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
                        <Table data={reviews} columns={columns} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReviewList;