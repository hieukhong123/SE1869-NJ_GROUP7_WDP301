import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';
import { toast } from 'sonner';
import {
    CaretLeft,
    FloppyDisk,
    UploadSimple,
    X,
    CircleNotch,
    Image as ImageIcon
} from '@phosphor-icons/react';
import CustomSelect from '../../components/common/CustomSelect';

const HotelForm = () => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const isStaff = user?.role === 'staff';
    const { id } = useParams();
    const navigate = useNavigate();
    const [hotel, setHotel] = useState({
        name: '',
        address: '',
        city: '',
        hotelPhone: '',
        hotelEmail: '',
        description: '',
        photos: [],
        status: 'active',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (id) {
            const fetchHotel = async () => {
                setLoading(true);
                try {
                    const response = await axiosClient.get(`/hotels/${id}`);
                    const fetchedHotel = response.data || {};
                    const normalizedStatus =
                        typeof fetchedHotel.status === 'boolean'
                            ? fetchedHotel.status
                                ? 'active'
                                : 'inactive'
                            : fetchedHotel.status || 'active';
                    setHotel({
                        ...fetchedHotel,
                        status: normalizedStatus,
                    });
                } catch (err) {
                    setError(err);
                    toast.error('Failed to load property details.');
                } finally {
                    setLoading(false);
                }
            };
            fetchHotel();
        }
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setHotel({
            ...hotel,
            [name]: value,
        });
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error('Please select an image file first.');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('image', selectedFile);

        try {
            const response = await axiosClient.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            const uploadedUrl = response?.url;

            if (!uploadedUrl) {
                throw new Error('Upload succeeded but no image URL was returned.');
            }

            setHotel((prevData) => ({
                ...prevData,
                photos: [...(prevData.photos || []), uploadedUrl],
            }));
            
            // Reset file input
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            
            toast.success('Image added to gallery');
        } catch (err) {
            toast.error(
                'Upload failed: ' +
                    (err.response?.data?.message || err.message),
            );
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemovePhoto = (index) => {
        setHotel((prevData) => ({
            ...prevData,
            photos: prevData.photos.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const allowedStatuses = ['active', 'inactive', 'suspended'];
            const normalizedStatus = allowedStatuses.includes(hotel.status)
                ? hotel.status
                : hotel.status
                  ? 'active'
                  : 'inactive';
            const payload = {
                ...hotel,
                status: normalizedStatus,
            };

            if (id) {
                // Phone validation
                if (payload.hotelPhone && !/^[0-9+-\s]{10,15}$/.test(payload.hotelPhone)) {
                    toast.error('Phone should be 10-15 digits.');
                    setLoading(false);
                    return;
                }
                // Email validation
                if (payload.hotelEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.hotelEmail)) {
                    toast.error('Invalid email format.');
                    setLoading(false);
                    return;
                }
                await axiosClient.put(`/hotels/${id}`, payload);
                toast.success('Property updated successfully.');
            } else {
                // Full validation for creation
                if (!/^[0-9+-\s]{10,15}$/.test(hotel.hotelPhone)) {
                    toast.error('Phone should be 10-15 digits.');
                    setLoading(false);
                    return;
                }
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(hotel.hotelEmail)) {
                    toast.error('Invalid email format.');
                    setLoading(false);
                    return;
                }
                await axiosClient.post('/hotels', payload);
                toast.success('New property created.');
            }
            navigate('/admin/hotels');
        } catch (err) {
            setError(err);
            toast.error('An error occurred while saving.');
        } finally {
            setLoading(false);
        }
    };

    if (loading && id)
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-transparent">
                <CircleNotch size={32} weight="light" className="text-orange-800 animate-spin" />
                <p className="text-gray-500 font-light text-sm tracking-widest uppercase">
                    Loading Data...
                </p>
            </div>
        );

    return (
        <div className="p-6 md:p-8 lg:p-12 max-w-5xl mx-auto">
            
            {/* Header */}
            <div className="flex items-center gap-4 mb-10 pb-6 border-b border-gray-200">
                <button 
                    onClick={() => navigate('/admin/hotels')} 
                    className="p-2 text-gray-400 hover:text-gray-900 transition-colors border border-gray-200 rounded-sm hover:bg-white bg-gray-50"
                    title="Back to Portfolio"
                >
                    <CaretLeft size={20} weight="light" />
                </button>
                <div>
                    <h1 className="text-3xl font-serif text-gray-900 mb-1">
                        {id ? 'Edit Property' : 'New Property'}
                    </h1>
                    <p className="text-[10px] font-medium text-gray-500 uppercase tracking-[0.2em]">
                        Portfolio Management
                    </p>
                </div>
            </div>

            {/* Form Card */}
            <div className="bg-white border border-gray-100 rounded-sm shadow-sm">
                <form onSubmit={handleSubmit} className="p-8 md:p-10">
                    
                    {/* SECTION: Basic Information */}
                    <h3 className="text-xs uppercase tracking-widest text-gray-900 font-medium mb-6 pb-2 border-b border-gray-100">
                        General Information
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-8 mb-10">
                        <div className="relative group md:col-span-2">
                            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Property Name</label>
                            <input
                                type="text"
                                name="name"
                                value={hotel.name}
                                onChange={handleChange}
                                  disabled={isStaff}
                                placeholder="e.g. The Grand Horizon"
                                className="w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-gray-900 font-light focus:ring-0 focus:border-gray-900 transition-colors placeholder-gray-300"
                                required
                            />
                        </div>

                        <div className="relative group">
                            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">City / Location</label>
                            <input
                                type="text"
                                name="city"
                                value={hotel.city || ''}
                                onChange={handleChange}
                                  disabled={isStaff}
                                placeholder="e.g. Hanoi"
                                className="w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-gray-900 font-light focus:ring-0 focus:border-gray-900 transition-colors placeholder-gray-300"
                                required
                            />
                        </div>

                        <div className="relative group">
                            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Full Address</label>
                            <input
                                type="text"
                                name="address"
                                value={hotel.address}
                                onChange={handleChange}
                                  disabled={isStaff}
                                placeholder="Street address"
                                className="w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-gray-900 font-light focus:ring-0 focus:border-gray-900 transition-colors placeholder-gray-300"
                                required
                            />
                        </div>
                    </div>

                    {/* SECTION: Contact Details */}
                    <h3 className="text-xs uppercase tracking-widest text-gray-900 font-medium mb-6 pb-2 border-b border-gray-100">
                        Contact Details
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-8 mb-10">
                        <div className="relative group">
                            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Phone Number</label>
                            <input
                                type="text"
                                name="hotelPhone"
                                value={hotel.hotelPhone}
                                onChange={handleChange}
                                  disabled={isStaff}
                                placeholder="+84 123 456 789"
                                className={`w-full bg-transparent border-0 border-b ${hotel.hotelPhone && !/^[0-9+-\s]+$/.test(hotel.hotelPhone) ? 'border-red-500' : 'border-gray-300'} px-0 py-2 text-gray-900 font-light focus:ring-0 focus:border-gray-900 transition-colors placeholder-gray-300`}
                                required
                            />
                        </div>

                        <div className="relative group">
                            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Email Address</label>
                            <input
                                type="email"
                                name="hotelEmail"
                                value={hotel.hotelEmail}
                                onChange={handleChange}
                                  disabled={isStaff}
                                placeholder="contact@property.com"
                                className="w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-gray-900 font-light focus:ring-0 focus:border-gray-900 transition-colors placeholder-gray-300"
                                required
                            />
                        </div>
                    </div>

                    {/* SECTION: Property Status */}
                    <h3 className="text-xs uppercase tracking-widest text-gray-900 font-medium mb-6 pb-2 border-b border-gray-100">
                        Property Status
                    </h3>
                    <div className="relative group w-full md:w-1/2 mb-6">
                        <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Status</label>
                        <CustomSelect
                            options={[
                                { label: 'Active', value: 'active' },
                                { label: 'Inactive', value: 'inactive' },
                                { label: 'Suspended', value: 'suspended' },
                            ]}
                            value={hotel.status || 'active'}
                            onChange={(val) => handleChange({ target: { name: 'status', value: val } })}
                            placeholder="Select status"
                        />
                    </div>
                    <p className="text-xs text-gray-500 font-light mb-10">
                        Active properties are visible and bookable. Inactive properties are hidden from search. Suspended properties are restricted for compliance or operational reasons.
                    </p>

                    {/* SECTION: Description */}
                    <h3 className="text-xs uppercase tracking-widest text-gray-900 font-medium mb-6 pb-2 border-b border-gray-100">
                        Property Description
                    </h3>
                    
                    <div className="relative group mb-10">
                        <textarea
                            name="description"
                            value={hotel.description}
                            onChange={handleChange}
                                  disabled={isStaff}
                            placeholder="Describe the property's unique features, ambiance, and surroundings..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-sm px-4 py-3 text-gray-900 font-light focus:ring-0 focus:border-gray-900 transition-colors h-32 resize-none placeholder-gray-400"
                        ></textarea>
                    </div>
                    
                    {/* SECTION: Media Gallery */}
                    <h3 className="text-xs uppercase tracking-widest text-gray-900 font-medium mb-6 pb-2 border-b border-gray-100">
                        Media Gallery
                    </h3>
                    
                    <div className="mb-12">
                        {/* Custom Upload Bar */}
                        <div className="flex flex-col sm:flex-row items-end gap-4 mb-6">
                            <div className="flex-1 w-full">
                                <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Select Image File</label>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="w-full text-sm text-gray-500 
                                        file:mr-4 file:py-2.5 file:px-4 
                                        file:rounded-sm file:border-0 
                                        file:text-xs file:font-medium file:uppercase file:tracking-widest
                                        file:bg-gray-100 file:text-gray-700 
                                        hover:file:bg-gray-200 transition-colors
                                        border-b border-gray-200 pb-2 cursor-pointer"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleUpload}
                                disabled={!selectedFile || isUploading}
                                className="w-full sm:w-auto px-6 py-2.5 bg-gray-900 hover:bg-black text-white text-xs tracking-widest uppercase transition-colors rounded-sm flex items-center justify-center gap-2 h-[45px] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUploading ? (
                                    <><CircleNotch size={16} className="animate-spin" /> <span>Uploading</span></>
                                ) : (
                                    <><UploadSimple size={16} /> <span>Upload</span></>
                                )}
                            </button>
                        </div>

                        {/* Image Preview Grid */}
                        {hotel.photos && hotel.photos.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4 bg-gray-50 border border-gray-100 rounded-sm">
                                {hotel.photos.map((photo, index) => (
                                    <div key={index} className="relative group rounded-sm overflow-hidden aspect-video bg-white border border-gray-200">
                                        <img
                                            src={photo}
                                            alt={`Gallery ${index + 1}`}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() => handleRemovePhoto(index)}
                                                className="w-8 h-8 flex items-center justify-center bg-white text-red-500 rounded-full hover:bg-red-50 transition-colors transform translate-y-2 group-hover:translate-y-0"
                                                title="Remove Image"
                                            >
                                                <X size={16} weight="bold" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-gray-300 rounded-sm bg-gray-50 text-gray-400">
                                <ImageIcon size={40} weight="light" className="mb-3 opacity-50" />
                                <p className="text-sm font-light">No images added yet.</p>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col-reverse sm:flex-row gap-4 pt-8 border-t border-gray-100">
                        <button
                            type="button"
                            className="px-8 py-3 bg-transparent border border-gray-300 text-gray-700 hover:border-gray-900 hover:text-gray-900 text-xs tracking-widest uppercase transition-colors rounded-sm flex-1 sm:flex-none text-center"
                            onClick={() => navigate('/admin/hotels')}
                        >
                            Discard
                        </button>
                        <button
                            type="submit"
                            disabled={loading || isUploading}
                            className="px-8 py-3 bg-orange-800 hover:bg-orange-900 text-white text-xs tracking-widest uppercase transition-colors rounded-sm flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <><CircleNotch size={16} className="animate-spin" /> <span>Saving</span></>
                            ) : (
                                <><FloppyDisk size={16} /> <span>{id ? 'Save Changes' : 'Create Property'}</span></>
                            )}
                        </button>
                    </div>
                    
                </form>
            </div>
        </div>
    );
};

export default HotelForm;


