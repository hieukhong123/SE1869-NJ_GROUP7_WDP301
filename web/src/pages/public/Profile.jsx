import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
    PencilSimple,
    Key,
    Receipt,
    SignOut,
    User,
    EnvelopeSimple,
    PhoneCall,
    Eye,
    EyeClosed,
    CheckCircle,
    XCircle,
    X,
    CircleNotch,
    UserCircle
} from '@phosphor-icons/react';
import axiosClient from '../../services/axiosClient';

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [editFormData, setEditFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
    });
    const [passwordFormData, setPasswordFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            toast.error('Please login to view your profile');
            navigate('/login');
            return;
        }

        try {
            const userData = JSON.parse(storedUser);
            fetchUserProfile(userData._id);
        } catch (error) {
            console.error('Error parsing user data:', error);
            localStorage.removeItem('user');
            navigate('/login');
        }
    }, [navigate]);

    const fetchUserProfile = async (userId) => {
        try {
            setLoading(true);
            const response = await axiosClient.get(`/users/profile/${userId}`);
            setUser(response.data);
            setEditFormData({
                fullName: response.data.fullName || '',
                email: response.data.email || '',
                phone: response.data.phone || '',
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handlePasswordInputChange = (e) => {
        const { name, value } = e.target;
        setPasswordFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        
        try {
            setSubmitting(true);
            const response = await axiosClient.put(`/users/profile/${user._id}`, editFormData);
            
            const storedUser = JSON.parse(localStorage.getItem('user'));
            const updatedUser = { ...storedUser, ...response.data };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            setUser(response.data);
            setShowEditModal(false);
            toast.success('Profile updated successfully');
            
            window.dispatchEvent(new Event('userLogin'));
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        if (passwordFormData.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        if (passwordFormData.newPassword === passwordFormData.currentPassword) {
            toast.error('New password must be different from current password');
            return;
        }

        try {
            setSubmitting(true);
            await axiosClient.put(`/users/change-password/${user._id}`, {
                currentPassword: passwordFormData.currentPassword,
                newPassword: passwordFormData.newPassword,
            });

            setShowPasswordModal(false);
            setShowCurrentPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);
            setPasswordFormData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
            toast.success('Password changed successfully');
        } catch (error) {
            console.error('Error changing password:', error);
            toast.error(error.response?.data?.message || 'Failed to change password');
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        toast.success('Logged out successfully');
        window.dispatchEvent(new Event('userLogout'));
        navigate('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFFCFA] gap-4">
                <CircleNotch size={32} weight="light" className="text-orange-800 animate-spin" />
                <p className="text-gray-500 font-light text-sm tracking-widest uppercase">
                    Loading your profile...
                </p>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#FFFCFA] pb-24 pt-16 md:pt-24">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
                
                <div className="grid lg:grid-cols-12 gap-12 items-start">
                    
                    <div className="lg:col-span-4 flex flex-col items-center text-center">
                        <div className="w-28 h-28 md:w-32 md:h-32 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center text-gray-300 mb-6 overflow-hidden shadow-sm">
                            {user.avartar ? (
                                <img src={user.avartar} alt={user.fullName || user.userName} className="w-full h-full object-cover" />
                            ) : (
                                <UserCircle size={64} weight="light" />
                            )}
                        </div>
                        
                        <h1 className="text-3xl font-serif text-gray-900 mb-1">
                            {user.fullName || user.userName}
                        </h1>
                        <p className="text-sm font-light text-gray-500 mb-10">
                            {user.email}
                        </p>

                        <div className="w-full flex flex-col gap-2 border-t border-gray-100 pt-8">
                            <button
                                onClick={() => setShowEditModal(true)}
                                className="flex items-center gap-4 w-full py-3 px-4 text-sm font-light text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors rounded-sm text-left"
                            >
                                <PencilSimple size={18} weight="light" className="text-gray-400" />
                                Edit Profile
                            </button>
                            <button
                                onClick={() => setShowPasswordModal(true)}
                                className="flex items-center gap-4 w-full py-3 px-4 text-sm font-light text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors rounded-sm text-left"
                            >
                                <Key size={18} weight="light" className="text-gray-400" />
                                Security Settings
                            </button>
                            <button
                                onClick={() => navigate('/my-bookings')}
                                className="flex items-center gap-4 w-full py-3 px-4 text-sm font-light text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors rounded-sm text-left"
                            >
                                <Receipt size={18} weight="light" className="text-gray-400" />
                                My Reservations
                            </button>
                            
                            <div className="h-[1px] bg-gray-100 my-2 w-full"></div>
                            
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-4 w-full py-3 px-4 text-sm font-light text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors rounded-sm text-left"
                            >
                                <SignOut size={18} weight="light" />
                                Sign Out
                            </button>
                        </div>
                    </div>

                    <div className="lg:col-span-8">
                        <div className="bg-white border border-gray-200 rounded-sm shadow-2xl shadow-gray-200/40 p-8 md:p-10">
                            <h2 className="text-xs uppercase tracking-[0.2em] font-medium text-orange-800 mb-8 pb-4 border-b border-gray-100">
                                Personal Details
                            </h2>
                            
                            <div className="space-y-6">
                                {/* Full Name */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                                    <div className="flex items-center gap-3 w-40 shrink-0">
                                        <User size={18} weight="light" className="text-gray-400" />
                                        <span className="text-[11px] uppercase tracking-widest text-gray-500">Full Name</span>
                                    </div>
                                    <div className="flex-1 font-serif text-lg text-gray-900">
                                        {user.fullName || <span className="text-gray-400 italic text-sm font-sans">Not provided</span>}
                                    </div>
                                </div>

                                <div className="w-full h-[1px] bg-gray-50"></div>

                                {/* Username */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                                    <div className="flex items-center gap-3 w-40 shrink-0">
                                        <UserCircle size={18} weight="light" className="text-gray-400" />
                                        <span className="text-[11px] uppercase tracking-widest text-gray-500">Username</span>
                                    </div>
                                    <div className="flex-1 font-light text-gray-900">
                                        {user.userName}
                                    </div>
                                </div>

                                <div className="w-full h-[1px] bg-gray-50"></div>

                                {/* Email */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                                    <div className="flex items-center gap-3 w-40 shrink-0">
                                        <EnvelopeSimple size={18} weight="light" className="text-gray-400" />
                                        <span className="text-[11px] uppercase tracking-widest text-gray-500">Email</span>
                                    </div>
                                    <div className="flex-1 font-light text-gray-900">
                                        {user.email}
                                    </div>
                                </div>

                                <div className="w-full h-[1px] bg-gray-50"></div>

                                {/* Phone */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                                    <div className="flex items-center gap-3 w-40 shrink-0">
                                        <PhoneCall size={18} weight="light" className="text-gray-400" />
                                        <span className="text-[11px] uppercase tracking-widest text-gray-500">Phone</span>
                                    </div>
                                    <div className="flex-1 font-light text-gray-900">
                                        {user.phone || <span className="text-gray-400 italic text-sm">Not provided</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full sm:w-[500px] rounded-t-2xl sm:rounded-sm flex flex-col overflow-hidden animate-slide-up shadow-2xl">
                        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
                            <div>
                                <h3 className="font-serif text-2xl text-gray-900">Edit Profile</h3>
                                <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-orange-800 mt-1">Update your information</p>
                            </div>
                            <button onClick={() => !submitting && setShowEditModal(false)} className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                                <X size={20} weight="light" />
                            </button>
                        </div>
                        
                        <div className="p-8">
                            <form onSubmit={handleEditSubmit} className="space-y-6">
                                <div className="relative group">
                                    <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        placeholder="Enter your full name"
                                        className="w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-gray-900 font-light placeholder-gray-300 focus:ring-0 focus:border-orange-800 transition-colors"
                                        value={editFormData.fullName}
                                        onChange={handleEditInputChange}
                                    />
                                </div>

                                <div className="relative group">
                                    <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Enter your email"
                                        className="w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-gray-900 font-light placeholder-gray-300 focus:ring-0 focus:border-orange-800 transition-colors"
                                        value={editFormData.email}
                                        onChange={handleEditInputChange}
                                        required
                                    />
                                    {editFormData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email) && (
                                        <span className="text-[10px] text-red-500 mt-2 flex items-center gap-1">
                                            <XCircle size={12} weight="fill" /> Invalid email format
                                        </span>
                                    )}
                                </div>

                                <div className="relative group">
                                    <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        placeholder="Enter your phone number"
                                        className="w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-gray-900 font-light placeholder-gray-300 focus:ring-0 focus:border-orange-800 transition-colors"
                                        value={editFormData.phone}
                                        onChange={handleEditInputChange}
                                    />
                                </div>

                                <div className="flex gap-4 pt-6 mt-2 border-t border-gray-100">
                                    <button type="button" onClick={() => setShowEditModal(false)} className="w-full py-3 bg-transparent border border-gray-300 hover:border-gray-900 text-gray-900 text-xs tracking-widest uppercase transition-colors rounded-sm flex-1">
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="w-full py-3 bg-gray-900 hover:bg-black text-white text-xs tracking-widest uppercase transition-all duration-300 rounded-sm flex flex-1 items-center justify-center gap-2 disabled:opacity-70"
                                        disabled={submitting || (editFormData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email))}
                                    >
                                        {submitting ? <><CircleNotch size={16} className="animate-spin" /> Saving...</> : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full sm:w-[500px] rounded-t-2xl sm:rounded-sm flex flex-col overflow-hidden animate-slide-up shadow-2xl">
                        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
                            <div>
                                <h3 className="font-serif text-2xl text-gray-900">Security Settings</h3>
                                <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-orange-800 mt-1">Change Password</p>
                            </div>
                            <button 
                                onClick={() => {
                                    if (!submitting) {
                                        setShowPasswordModal(false);
                                        setShowCurrentPassword(false);
                                        setShowNewPassword(false);
                                        setShowConfirmPassword(false);
                                        setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                    }
                                }} 
                                className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
                            >
                                <X size={20} weight="light" />
                            </button>
                        </div>
                        
                        <div className="p-8">
                            <form onSubmit={handlePasswordSubmit} className="space-y-6">
                                <div className="relative group">
                                    <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Current Password</label>
                                    <div className="relative">
                                        <input
                                            type={showCurrentPassword ? "text" : "password"}
                                            name="currentPassword"
                                            placeholder="Enter current password"
                                            className="w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 pr-8 text-gray-900 font-light placeholder-gray-300 focus:ring-0 focus:border-orange-800 transition-colors"
                                            value={passwordFormData.currentPassword}
                                            onChange={handlePasswordInputChange}
                                            required
                                        />
                                        <button type="button" className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                                            {showCurrentPassword ? <EyeClosed size={18} weight="light" /> : <Eye size={18} weight="light" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="relative group">
                                    <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            name="newPassword"
                                            placeholder="At least 6 characters"
                                            className="w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 pr-8 text-gray-900 font-light placeholder-gray-300 focus:ring-0 focus:border-orange-800 transition-colors"
                                            value={passwordFormData.newPassword}
                                            onChange={handlePasswordInputChange}
                                            required
                                        />
                                        <button type="button" className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900" onClick={() => setShowNewPassword(!showNewPassword)}>
                                            {showNewPassword ? <EyeClosed size={18} weight="light" /> : <Eye size={18} weight="light" />}
                                        </button>
                                    </div>
                                    {passwordFormData.newPassword && (
                                        <div className="mt-2 text-[10px] font-light flex items-center gap-1">
                                            {passwordFormData.newPassword.length < 6 ? (
                                                <span className="text-red-500 flex items-center gap-1"><XCircle size={12} weight="fill" /> Minimum 6 characters required</span>
                                            ) : passwordFormData.newPassword === passwordFormData.currentPassword ? (
                                                <span className="text-red-500 flex items-center gap-1"><XCircle size={12} weight="fill" /> Must be different from current</span>
                                            ) : (
                                                <span className="text-green-600 flex items-center gap-1"><CheckCircle size={12} weight="fill" /> Valid format</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="relative group">
                                    <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Confirm New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            placeholder="Re-enter new password"
                                            className="w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 pr-8 text-gray-900 font-light placeholder-gray-300 focus:ring-0 focus:border-orange-800 transition-colors"
                                            value={passwordFormData.confirmPassword}
                                            onChange={handlePasswordInputChange}
                                            required
                                        />
                                        <button type="button" className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                            {showConfirmPassword ? <EyeClosed size={18} weight="light" /> : <Eye size={18} weight="light" />}
                                        </button>
                                    </div>
                                    {passwordFormData.confirmPassword && (
                                        <div className="mt-2 text-[10px] font-light flex items-center gap-1">
                                            {passwordFormData.newPassword === passwordFormData.confirmPassword ? (
                                                <span className="text-green-600 flex items-center gap-1"><CheckCircle size={12} weight="fill" /> Passwords match</span>
                                            ) : (
                                                <span className="text-red-500 flex items-center gap-1"><XCircle size={12} weight="fill" /> Passwords do not match</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4 pt-6 mt-2 border-t border-gray-100">
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            setShowPasswordModal(false);
                                            setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                        }} 
                                        className="w-full py-3 bg-transparent border border-gray-300 hover:border-gray-900 text-gray-900 text-xs tracking-widest uppercase transition-colors rounded-sm flex-1"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="w-full py-3 bg-gray-900 hover:bg-black text-white text-xs tracking-widest uppercase transition-all duration-300 rounded-sm flex flex-1 items-center justify-center gap-2 disabled:opacity-70"
                                        disabled={
                                            submitting || 
                                            !passwordFormData.currentPassword || 
                                            !passwordFormData.newPassword || 
                                            !passwordFormData.confirmPassword ||
                                            passwordFormData.newPassword !== passwordFormData.confirmPassword ||
                                            passwordFormData.newPassword === passwordFormData.currentPassword ||
                                            passwordFormData.newPassword.length < 6
                                        }
                                    >
                                        {submitting ? <><CircleNotch size={16} className="animate-spin" /> Updating...</> : 'Update Password'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;