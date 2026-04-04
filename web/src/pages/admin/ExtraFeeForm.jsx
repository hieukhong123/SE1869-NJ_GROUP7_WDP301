import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';
import { toast } from 'sonner';
import { 
    CaretLeft, 
    FloppyDisk, 
    CircleNotch
} from '@phosphor-icons/react';

const ExtraFeeForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [extraFee, setExtraFee] = useState({
        extraName: '',
        extraPrice: '',
        hotelId: '',
    });
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch list of properties for dropdown
    useEffect(() => {
        const fetchHotels = async () => {
            try {
                const response = await axiosClient.get('/hotels');
                setHotels(response.data);
            } catch (err) {
                console.error('Failed to fetch hotels:', err);
                toast.error('Failed to load property list.');
            }
        };
        fetchHotels();
    }, []);

    // Fetch existing extra fee data if in edit mode
    useEffect(() => {
        if (id) {
            const fetchExtraFee = async () => {
                setLoading(true);
                try {
                    const response = await axiosClient.get(`/extra-fees/${id}`);
                    // axiosClient typically returns response.data, assuming your setup matches
                    setExtraFee(response.data || response); 
                } catch (err) {
                    setError(err);
                    toast.error('Failed to load service details.');
                } finally {
                    setLoading(false);
                }
            };
            fetchExtraFee();
        }
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setExtraFee({
            ...extraFee,
            [name]: value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const price = Number(extraFee.extraPrice);
        if (isNaN(price) || price < 0 || price > 1000000) {
            toast.error('Service price must be between 0 and 1,000,000.');
            setLoading(false);
            return;
        }
        if (!extraFee.extraName.trim()) {
            toast.error('Service name is required.');
            setLoading(false);
            return;
        }

        try {
            if (id) {
                await axiosClient.put(`/extra-fees/${id}`, extraFee);
                toast.success('Service updated successfully.');
            } else {
                await axiosClient.post('/extra-fees', extraFee);
                toast.success('New service added to portfolio.');
            }
            navigate('/admin/extra-fees');
        } catch (err) {
            setError(err);
            toast.error('Operation failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    if (loading && id) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-transparent">
                <CircleNotch size={32} weight="light" className="text-orange-800 animate-spin" />
                <p className="text-gray-500 font-light text-sm tracking-widest uppercase">
                    Loading Data...
                </p>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 lg:p-12 max-w-4xl mx-auto">
            
            {/* Header */}
            <div className="flex items-center gap-4 mb-10 pb-6 border-b border-gray-200">
                <button 
                    onClick={() => navigate('/admin/extra-fees')} 
                    className="p-2 text-gray-400 hover:text-gray-900 transition-colors border border-gray-200 rounded-sm hover:bg-white bg-gray-50"
                    title="Back to Services"
                >
                    <CaretLeft size={20} weight="light" />
                </button>
                <div>
                    <h1 className="text-3xl font-serif text-gray-900 mb-1">
                        {id ? 'Edit Service' : 'New Service'}
                    </h1>
                    <p className="text-[10px] font-medium text-gray-500 uppercase tracking-[0.2em]">
                        Additional Amenities & Fees
                    </p>
                </div>
            </div>

            {/* Form Card */}
            <div className="bg-white border border-gray-100 rounded-sm shadow-sm">
                <form onSubmit={handleSubmit} className="p-8 md:p-10">
                    
                    <div className="space-y-8">
                        
                        {/* SECTION: Service Details */}
                        <div>
                            <h3 className="text-xs uppercase tracking-widest text-gray-900 font-medium mb-6 pb-2 border-b border-gray-100">
                                Service Details
                            </h3>
                            
                            <div className="grid md:grid-cols-2 gap-8">
                                
                                {/* Property Dropdown */}
                                <div className="relative group md:col-span-2">
                                    <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Available At Property</label>
                                    <select
                                        name="hotelId"
                                        value={extraFee.hotelId}
                                        onChange={handleChange}
                                        className="w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-gray-900 font-light focus:ring-0 focus:border-gray-900 transition-colors appearance-none cursor-pointer"
                                        required
                                    >
                                        <option value="" disabled>Select a Property...</option>
                                        {hotels.map((hotel) => (
                                            <option key={hotel._id} value={hotel._id}>
                                                {hotel.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Service Name */}
                                <div className="relative group">
                                    <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Service Name</label>
                                    <input
                                        type="text"
                                        name="extraName"
                                        value={extraFee.extraName}
                                        onChange={handleChange}
                                        placeholder="e.g. Airport Transfer"
                                        className="w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-gray-900 font-light focus:ring-0 focus:border-gray-900 transition-colors placeholder-gray-300"
                                        required
                                    />
                                </div>

                                {/* Price */}
                                <div className="relative group">
                                    <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Price / Fee (USD)</label>
                                    <input
                                        type="number"
                                        name="extraPrice"
                                        value={extraFee.extraPrice}
                                        onChange={handleChange}
                                        placeholder="e.g. 50"
                                        min="0"
                                        step="0.01"
                                        className="w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-gray-900 font-light focus:ring-0 focus:border-gray-900 transition-colors placeholder-gray-300"
                                        required
                                    />
                                </div>

                            </div>
                        </div>

                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col-reverse sm:flex-row gap-4 pt-10 mt-10 border-t border-gray-100 sm:justify-end">
                        <button
                            type="button"
                            className="px-8 py-3 bg-transparent border border-gray-300 text-gray-700 hover:border-gray-900 hover:text-gray-900 text-xs tracking-widest uppercase transition-colors rounded-sm sm:w-auto w-full text-center"
                            onClick={() => navigate('/admin/extra-fees')}
                            disabled={loading}
                        >
                            Discard
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-3 bg-gray-900 hover:bg-black text-white text-xs tracking-widest uppercase transition-colors rounded-sm sm:w-auto w-full flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <><CircleNotch size={16} className="animate-spin" /> Saving</>
                            ) : (
                                <><FloppyDisk size={16} /> {id ? 'Save Changes' : 'Create Service'}</>
                            )}
                        </button>
                    </div>
                    
                </form>
            </div>
        </div>
    );
};

export default ExtraFeeForm;