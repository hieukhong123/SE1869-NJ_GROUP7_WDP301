import { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import axiosClient from '../../services/axiosClient';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import ConfirmModal from '../../components/common/ConfirmModal';
import {
  CircleNotchIcon,
  TrashIcon,
  EyeIcon,
  StarIcon,
  ChatsTeardropIcon,
} from '@phosphor-icons/react';

const ReviewList = () => {
  const [reviews, setReviews] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ hotelId: 'all', rating: 'all' });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    review: null,
    loading: false,
  });

  const fetchReviews = async (activeFilters = filters) => {
    try {
      setLoading(true);
      const params = {};
      if (activeFilters.hotelId !== 'all') {
        params.hotelId = activeFilters.hotelId;
      }
      if (activeFilters.rating !== 'all') {
        params.rating = activeFilters.rating;
      }

      const response = await axiosClient.get('/reviews', { params });
      setReviews(response.data);
    } catch (err) {
      setError(err);
      toast.error('Failed to load guest reviews.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHotels = async () => {
    try {
      const response = await axiosClient.get('/hotels/admin-all');
      setHotels(response.data || []);
    } catch (err) {
      setHotels([]);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  useEffect(() => {
    fetchReviews(filters);
  }, [filters]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const openDeleteModal = (review) => {
    setConfirmModal({ isOpen: true, review, loading: false });
  };

  const closeDeleteModal = () => {
    setConfirmModal({ isOpen: false, review: null, loading: false });
  };

  const confirmDelete = async () => {
    if (!confirmModal.review) {
      return;
    }

    setConfirmModal((prev) => ({ ...prev, loading: true }));

    try {
      await axiosClient.delete(`/reviews/${confirmModal.review._id}`);
      toast.success('Review deleted successfully.');
      await fetchReviews(filters);
      closeDeleteModal();
    } catch (err) {
      toast.error(
        'Failed to delete review: ' +
          (err.response?.data?.message || err.message),
      );
      setConfirmModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const columns = [
    {
      accessorKey: 'hotelId.name',
      header: 'Property',
      cell: ({ row }) => {
        const hotel = row.original.hotelId;
        return (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">
              {hotel?.name || '-'}
            </span>
            {hotel?.status && hotel.status !== 'active' && (
              <span
                className={`text-[8px] uppercase tracking-tighter font-bold px-1.5 py-0.5 rounded-full w-fit mt-1 ${
                  hotel.status === 'inactive'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-orange-100 text-orange-600'
                }`}
              >
                {hotel.status}
              </span>
            )}
          </div>
        );
      },
      accessorFn: (row) => row.hotelId?.name || '-',
    },
    {
      accessorKey: 'userId.fullName',
      header: 'Guest',
      cell: (info) => (
        <span className="text-gray-600 font-light">
          {info.getValue() || 'Anonymous'}
        </span>
      ),
      accessorFn: (row) => row.userId?.fullName || '-',
    },
    {
      accessorKey: 'rating',
      header: 'Rating',
      cell: (info) => {
        const rating = Number(info.getValue()) || 0;
        return (
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon
                key={star}
                size={14}
                weight="fill"
                className={star <= rating ? 'text-orange-800' : 'text-gray-200'}
              />
            ))}
            <span className="ml-2 text-xs font-medium text-gray-900">
              {rating}.0
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'reviewText',
      header: 'Feedback',
      cell: (info) => (
        <span className="text-gray-500 font-light italic line-clamp-2 min-w-62.5 leading-relaxed">
          "{info.getValue() || 'No written feedback provided.'}"
        </span>
      ),
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
            <EyeIcon size={18} weight="light" />
          </Link>
          <button
            onClick={() => openDeleteModal(row.original)}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
            title="Delete Review"
          >
            <TrashIcon size={18} weight="light" />
          </button>
        </div>
      ),
    },
  ];

  if (loading)
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-transparent">
        <CircleNotchIcon
          size={32}
          weight="light"
          className="text-orange-800 animate-spin"
        />
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

        <div className="bg-white border border-gray-100 rounded-sm p-4 sm:p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-2">
              Property
            </label>
            <select
              name="hotelId"
              value={filters.hotelId}
              onChange={handleFilterChange}
              className="w-full border border-gray-200 text-sm py-2.5 px-3 rounded-sm focus:ring-0 focus:border-gray-900"
            >
              <option value="all">All Properties</option>
              {hotels.map((hotel) => (
                <option key={hotel._id} value={hotel._id}>
                  {hotel.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-2">
              Rating
            </label>
            <select
              name="rating"
              value={filters.rating}
              onChange={handleFilterChange}
              className="w-full border border-gray-200 text-sm py-2.5 px-3 rounded-sm focus:ring-0 focus:border-gray-900"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>

        {/* Table Section or Empty State */}
        {reviews.length === 0 ? (
          <div className="bg-white border border-gray-200 border-dashed rounded-sm py-32 flex flex-col items-center justify-center text-center px-4">
            <ChatsTeardropIcon
              size={48}
              weight="light"
              className="text-gray-300 mb-6"
            />
            <h3 className="text-xl font-serif text-gray-900 mb-2">
              No Reviews Yet
            </h3>
            <p className="text-gray-500 font-light max-w-md mx-auto">
              Guests haven't left any feedback for the properties in your
              portfolio yet.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
            <Table data={reviews} columns={columns} />
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Delete Review"
        message={`Delete this review from ${confirmModal.review?.hotelId?.name || 'the property'}? This action cannot be undone.`}
        confirmText="Delete Review"
        onCancel={closeDeleteModal}
        onConfirm={confirmDelete}
        loading={confirmModal.loading}
        variant="danger"
      />
    </div>
  );
};

export default ReviewList;
