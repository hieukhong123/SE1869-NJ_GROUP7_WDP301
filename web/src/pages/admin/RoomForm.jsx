import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';
import { toast } from 'sonner';
import { 
    CaretLeft, 
    FloppyDisk, 
    CircleNotch,
    CheckCircle,
    XCircle
} from '@phosphor-icons/react';

const RoomForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [roomData, setRoomData] = useState({
        roomName: '',
        roomPrice: 0,
        maxOccupancy: 0,
        quantity: 0,
        hotelId: '',
        description: '',
        status: 'available',
    });
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch hotels for dropdown
    useEffect(() => {
        const fetchHotels = async () => {
            try {
                const response = await axiosClient.get('/hotels/admin-all');
                setHotels(response.data);
            } catch (err) {
                toast.error('Failed to load properties list.');
                setError(err);
            }
        };
        fetchHotels();
    }, []);

    // Fetch room data if in edit mode
    useEffect(() => {
        if (id) {
            const fetchRoom = async () => {
                try {
                    setLoading(true);
                    const response = await axiosClient.get(`/rooms/admin/${id}`);
                    setRoomData(response.data);
                } catch (err) {
                    toast.error('Failed to load room details.');
                    setError(err);
                } finally {
                    setLoading(false);
                }
            };
            fetchRoom();
        }
    }, [id]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setRoomData((prevData) => ({
            ...prevData,
            [name]:
                type === 'checkbox'
                    ? checked
                        ? 'available'
                        : 'unavailable'
                    : name === 'roomPrice' ||
                      name === 'maxOccupancy' ||
                      name === 'quantity'
                    ? Number(value)
                    : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (id) {
                await axiosClient.put(`/rooms/${id}`, roomData);
                toast.success('Room classification updated.');
            } else {
                await axiosClient.post('/rooms', roomData);
                toast.success('New room classification created.');
            }
            navigate('/admin/rooms');
        } catch (err) {
            toast.error(
                'Operation failed: ' +
                    (err.response?.data?.message || err.message),
            );
            setError(err);
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
        <div className="p-6 md:p-8 lg:p-12 max-w-5xl mx-auto">
            
            {/* Header */}
            <div className="flex items-center gap-4 mb-10 pb-6 border-b border-gray-200">
                <button 
                    onClick={() => navigate('/admin/rooms')} 
                    className="p-2 text-gray-400 hover:text-gray-900 transition-colors border border-gray-200 rounded-sm hover:bg-white bg-gray-50"
                    title="Back to Accommodations"
                >
                    <CaretLeft size={20} weight="light" />
                </button>
                <div>
                    <h1 className="text-3xl font-serif text-gray-900 mb-1">
                        {id ? 'Edit Accommodation' : 'New Accommodation'}
                    </h1>
                    <p className="text-[10px] font-medium text-gray-500 uppercase tracking-[0.2em]">
                        Room & Suite Management
                    </p>
                </div>
            </div>

            {/* Form Card */}
            <div className="bg-white border border-gray-100 rounded-sm shadow-sm">
                <form onSubmit={handleSubmit} className="p-8 md:p-10">
                    
                    <div className="space-y-10">
                            
                            {/* SECTION: Classification */}
                            <div>
                                <h3 className="text-xs uppercase tracking-widest text-gray-900 font-medium mb-6 pb-2 border-b border-gray-100 flex justify-between items-end">
                                    Classification
                                    
                                    {/* Custom Toggle Switch for Status */}
                                    <label className="flex items-center cursor-pointer group">
                                        <div className="relative">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only" 
                                                name="status"
                                                checked={roomData.status === 'available'}
                                                onChange={handleChange}
                                            />
                                            <div className={`block w-10 h-6 rounded-full transition-colors duration-300 ${roomData.status === 'available' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${roomData.status === 'available' ? 'transform translate-x-4' : ''}`}></div>
                                        </div>
                                        <div className="ml-3 text-[10px] uppercase tracking-widest font-medium text-gray-500">
                                            {roomData.status === 'available' ? (
                                                <span className="text-green-600 flex items-center gap-1"><CheckCircle weight="fill"/> Available</span>
                                            ) : (
                                                <span className="text-gray-400 flex items-center gap-1"><XCircle weight="fill"/> Unavailable</span>
                                            )}
                                        </div>
                                    </label>
                                </h3>
                                
                                <div className="space-y-8">
                                    {/* Hotel Dropdown */}
                                    <div className="relative group">
                                        <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Belongs to Hotel</label>
                                        <select
                                            name="hotelId"
                                            value={roomData.hotelId}
                                            onChange={handleChange}
                                            className="w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-gray-900 font-light focus:ring-0 focus:border-gray-900 transition-colors appearance-none cursor-pointer"
                                            required
                                        >
                                            <option value="" disabled>Select a Hotel</option>
                                            {hotels.map((hotel) => (
                                                <option key={hotel._id} value={hotel._id}>
                                                    {hotel.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Room Name */}
                                    <div className="relative group">
                                        <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Room Type / Name</label>
                                        <input
                                            type="text"
                                            name="roomName"
                                            value={roomData.roomName}
                                            onChange={handleChange}
                                            placeholder="e.g. Ocean View Suite"
                                            className="w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-gray-900 font-light focus:ring-0 focus:border-gray-900 transition-colors placeholder-gray-300"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION: Details */}
                            <div>
                                <h3 className="text-xs uppercase tracking-widest text-gray-900 font-medium mb-6 pb-2 border-b border-gray-100">
                                    Capacity & Pricing
                                </h3>
                                
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="relative group">
                                        <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Rate (USD/Night)</label>
                                        <input
                                            type="number"
                                            name="roomPrice"
                                            value={roomData.roomPrice || ''}
                                            onChange={handleChange}
                                            placeholder="0"
                                            className="w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-gray-900 font-light focus:ring-0 focus:border-gray-900 transition-colors placeholder-gray-300"
                                            required
                                            min="1"
                                        />
                                    </div>
                                    <div className="relative group">
                                        <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Max Occupancy</label>
                                        <input
                                            type="number"
                                            name="maxOccupancy"
                                            value={roomData.maxOccupancy || ''}
                                            onChange={handleChange}
                                            placeholder="0"
                                            className="w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-gray-900 font-light focus:ring-0 focus:border-gray-900 transition-colors placeholder-gray-300"
                                            required
                                            min="1"
                                        />
                                    </div>
                                    <div className="relative group">
                                        <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Quantity</label>
                                        <input
                                            type="number"
                                            name="quantity"
                                            value={roomData.quantity || ''}
                                            onChange={handleChange}
                                            placeholder="0"
                                            className="w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-gray-900 font-light focus:ring-0 focus:border-gray-900 transition-colors placeholder-gray-300"
                                            required
                                            min="1"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION: Description */}
                            <div>
                                <h3 className="text-xs uppercase tracking-widest text-gray-900 font-medium mb-6 pb-2 border-b border-gray-100">
                                    Description
                                </h3>
                                <div className="relative group">
                                    <textarea
                                        name="description"
                                        value={roomData.description}
                                        onChange={handleChange}
                                        placeholder="Describe the room's interior, view, and specific amenities..."
                                        className="w-full bg-gray-50 border border-gray-200 rounded-sm px-4 py-3 text-gray-900 font-light focus:ring-0 focus:border-gray-900 transition-colors h-32 resize-none placeholder-gray-400"
                                    ></textarea>
                                </div>
                            </div>

                        </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col-reverse sm:flex-row gap-4 pt-10 mt-10 border-t border-gray-100 lg:justify-end">
                        <button
                            type="button"
                            className="px-8 py-3 bg-transparent border border-gray-300 text-gray-700 hover:border-gray-900 hover:text-gray-900 text-xs tracking-widest uppercase transition-colors rounded-sm sm:w-auto w-full text-center"
                            onClick={() => navigate('/admin/rooms')}
                            disabled={loading}
                        >
                            Discard
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-3 bg-orange-800 hover:bg-orange-900 text-white text-xs tracking-widest uppercase transition-colors rounded-sm sm:w-auto w-full flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <><CircleNotch size={16} className="animate-spin" /> <span>Saving</span></>
                            ) : (
                                <><FloppyDisk size={16} /> <span>{id ? 'Save Changes' : 'Create Room'}</span></>
                            )}
                        </button>
                    </div>
                    
                </form>
            </div>
        </div>
    );
};

export default RoomForm;
