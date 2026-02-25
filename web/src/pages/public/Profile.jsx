import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
    PencilSimpleIcon,
    KeyIcon,
    ReceiptIcon,
    SignOutIcon,
    UserIcon,
    EnvelopeIcon,
    PhoneCallIcon,
    UserCircleIcon,
    EyeIcon,
    EyeClosedIcon,
    CheckCircleIcon,
    XCircleIcon
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
            
            // Update local storage
            const storedUser = JSON.parse(localStorage.getItem('user'));
            const updatedUser = { ...storedUser, ...response.data };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            // Update state
            setUser(response.data);
            setShowEditModal(false);
            toast.success('Profile updated successfully');
            
            // Dispatch event to update navbar
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

        // Validation
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

    const handleViewBookings = () => {
        navigate('/my-bookings');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-base-200 flex items-center justify-center">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-base-200 py-8">
            <div className="container mx-auto px-4 max-w-5xl">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="avatar placeholder">
                            <div className="bg-base-300 text-base-content rounded-full w-16">
                                {user.avartar ? (
                                    <img src={user.avartar} alt={user.fullName || user.userName} />
                                ) : (
                                    <UserCircleIcon size={64} weight="fill" />
                                )}
                            </div>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-base-content">
                                {user.fullName || user.userName}
                            </h1>
                            <p className="text-base-content/70">{user.email}</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid md:grid-cols-3 gap-6">
                    {/* Sidebar */}
                    <div className="md:col-span-1 space-y-2">
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="btn btn-ghost justify-start w-full gap-2"
                        >
                            <PencilSimpleIcon size={18} />
                            Edit Profile
                        </button>
                        <button
                            onClick={() => setShowPasswordModal(true)}
                            className="btn btn-ghost justify-start w-full gap-2"
                        >
                            <KeyIcon size={18} />
                            Change Password
                        </button>
                        <button
                            onClick={handleViewBookings}
                            className="btn btn-ghost justify-start w-full gap-2"
                        >
                            <ReceiptIcon size={18} />
                            My Bookings
                        </button>
                        <div className="divider my-2"></div>
                        <button
                            onClick={handleLogout}
                            className="btn btn-ghost justify-start w-full gap-2 text-error hover:bg-error/10"
                        >
                            <SignOutIcon size={18} />
                            Logout
                        </button>
                    </div>

                    {/* Profile Information */}
                    <div className="md:col-span-2">
                        <div className="card bg-base-100 shadow-sm">
                            <div className="card-body">
                                <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
                                
                                <div className="space-y-5">
                                    {/* Full Name */}
                                    <div className="flex items-center gap-3 pb-4 border-b border-base-300">
                                        <UserIcon size={20} className="text-base-content/60" />
                                        <div className="flex-1">
                                            <p className="text-xs text-base-content/60 mb-0.5">Full Name</p>
                                            <p className="font-medium">
                                                {user.fullName || 'Not provided'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div className="flex items-center gap-3 pb-4 border-b border-base-300">
                                        <EnvelopeIcon size={20} className="text-base-content/60" />
                                        <div className="flex-1">
                                            <p className="text-xs text-base-content/60 mb-0.5">Email</p>
                                            <p className="font-medium">{user.email}</p>
                                        </div>
                                    </div>

                                    {/* Username */}
                                    <div className="flex items-center gap-3 pb-4 border-b border-base-300">
                                        <UserCircleIcon size={20} className="text-base-content/60" />
                                        <div className="flex-1">
                                            <p className="text-xs text-base-content/60 mb-0.5">Username</p>
                                            <p className="font-medium">{user.userName}</p>
                                        </div>
                                    </div>

                                    {/* Phone */}
                                    <div className="flex items-center gap-3">
                                        <PhoneCallIcon size={20} className="text-base-content/60" />
                                        <div className="flex-1">
                                            <p className="text-xs text-base-content/60 mb-0.5">Phone</p>
                                            <p className="font-medium">
                                                {user.phone || 'Not provided'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {showEditModal && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-md">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <PencilSimpleIcon size={24} className="text-primary" />
                            </div>
                            <h3 className="font-bold text-xl">Edit Profile</h3>
                        </div>

                        <div className="alert alert-info mb-6">
                            <div className="text-sm">
                                <p className="font-medium">Update your profile information</p>
                            </div>
                        </div>
                        
                        <form onSubmit={handleEditSubmit} className="space-y-5">
                            {/* Full Name */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Full Name</span>
                                </label>
                                <input
                                    type="text"
                                    name="fullName"
                                    placeholder="Enter your full name"
                                    className="input input-bordered w-full"
                                    value={editFormData.fullName}
                                    onChange={handleEditInputChange}
                                />
                            </div>

                            {/* Email */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Email</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Enter your email address"
                                    className={`input input-bordered w-full ${
                                        editFormData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email)
                                            ? 'input-error'
                                            : editFormData.email
                                            ? 'input-success'
                                            : ''
                                    }`}
                                    value={editFormData.email}
                                    onChange={handleEditInputChange}
                                    required
                                />
                                {editFormData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email) && (
                                    <label className="label">
                                        <span className="label-text-alt text-xs text-error flex items-center gap-1">
                                            <XCircleIcon size={14} weight="fill" /> Please enter a valid email address
                                        </span>
                                    </label>
                                )}
                            </div>

                            {/* Phone */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Phone</span>
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    placeholder="Enter your phone number"
                                    className="input input-bordered w-full"
                                    value={editFormData.phone}
                                    onChange={handleEditInputChange}
                                />
                            </div>

                            <div className="modal-action mt-8">
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={() => setShowEditModal(false)}
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary gap-2"
                                    disabled={submitting || 
                                             (editFormData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email))}
                                >
                                    {submitting ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm"></span>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircleIcon size={18} weight="fill" />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                    <div 
                        className="modal-backdrop" 
                        onClick={() => !submitting && setShowEditModal(false)}
                    ></div>
                </div>
            )}

            {/* Change Password Modal */}
            {showPasswordModal && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-md">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <KeyIcon size={24} className="text-primary" />
                            </div>
                            <h3 className="font-bold text-xl">Change Password</h3>
                        </div>
                        
                        <div className="alert alert-info mb-6">
                            <div className="text-sm">
                                <p className="font-medium mb-1">Password Requirements:</p>
                                <ul className="list-disc list-inside space-y-0.5 text-xs">
                                    <li>At least 6 characters long</li>
                                    <li>New password must be different from current</li>
                                </ul>
                            </div>
                        </div>

                        <form onSubmit={handlePasswordSubmit} className="space-y-5">
                            {/* Current Password */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Current Password</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showCurrentPassword ? "text" : "password"}
                                        name="currentPassword"
                                        placeholder="Enter your current password"
                                        className="input input-bordered w-full pr-10"
                                        value={passwordFormData.currentPassword}
                                        onChange={handlePasswordInputChange}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/60 hover:text-base-content"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    >
                                        {showCurrentPassword ? <EyeClosedIcon size={20} /> : <EyeIcon size={20} />}
                                    </button>
                                </div>
                            </div>

                            {/* New Password */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">New Password</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        name="newPassword"
                                        placeholder="Enter your new password"
                                        className={`input input-bordered w-full pr-10 ${
                                            passwordFormData.newPassword && (
                                                passwordFormData.newPassword.length < 6 || 
                                                passwordFormData.newPassword === passwordFormData.currentPassword
                                            )
                                                ? 'input-error'
                                                : passwordFormData.newPassword && 
                                                  passwordFormData.newPassword.length >= 6 && 
                                                  passwordFormData.newPassword !== passwordFormData.currentPassword
                                                ? 'input-success'
                                                : ''
                                        }`}
                                        value={passwordFormData.newPassword}
                                        onChange={handlePasswordInputChange}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/60 hover:text-base-content"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                    >
                                        {showNewPassword ? <EyeClosedIcon size={20} /> : <EyeIcon size={20} />}
                                    </button>
                                </div>
                                {passwordFormData.newPassword && (
                                    <label className="label">
                                        <span className={`label-text-alt text-xs flex items-center gap-1 ${
                                            passwordFormData.newPassword.length >= 6 && 
                                            passwordFormData.newPassword !== passwordFormData.currentPassword 
                                                ? 'text-success' 
                                                : 'text-error'
                                        }`}>
                                            {passwordFormData.newPassword === passwordFormData.currentPassword ? (
                                                <><XCircleIcon size={14} weight="fill" /> Must be different from current password</>
                                            ) : passwordFormData.newPassword.length >= 6 ? (
                                                <><CheckCircleIcon size={14} weight="fill" /> Valid password</>
                                            ) : (
                                                <><XCircleIcon size={14} weight="fill" /> At least 6 characters required</>
                                            )}
                                        </span>
                                    </label>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Confirm New Password</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        placeholder="Re-enter your new password"
                                        className={`input input-bordered w-full pr-10 ${
                                            passwordFormData.confirmPassword && passwordFormData.newPassword !== passwordFormData.confirmPassword
                                                ? 'input-error'
                                                : passwordFormData.confirmPassword && passwordFormData.newPassword === passwordFormData.confirmPassword
                                                ? 'input-success'
                                                : ''
                                        }`}
                                        value={passwordFormData.confirmPassword}
                                        onChange={handlePasswordInputChange}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/60 hover:text-base-content"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? <EyeClosedIcon size={20} /> : <EyeIcon size={20} />}
                                    </button>
                                </div>
                                {passwordFormData.confirmPassword && (
                                    <label className="label">
                                        <span className={`label-text-alt text-xs flex items-center gap-1 ${
                                            passwordFormData.newPassword === passwordFormData.confirmPassword ? 'text-success' : 'text-error'
                                        }`}>
                                            {passwordFormData.newPassword === passwordFormData.confirmPassword ? (
                                                <><CheckCircleIcon size={14} weight="fill" /> Passwords match</>
                                            ) : (
                                                <><XCircleIcon size={14} weight="fill" /> Passwords do not match</>
                                            )}
                                        </span>
                                    </label>
                                )}
                            </div>

                            <div className="modal-action mt-8">
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={() => {
                                        setShowPasswordModal(false);
                                        setShowCurrentPassword(false);
                                        setShowNewPassword(false);
                                        setShowConfirmPassword(false);
                                        setPasswordFormData({
                                            currentPassword: '',
                                            newPassword: '',
                                            confirmPassword: '',
                                        });
                                    }}
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary gap-2"
                                    disabled={submitting || 
                                             !passwordFormData.currentPassword || 
                                             !passwordFormData.newPassword || 
                                             !passwordFormData.confirmPassword ||
                                             passwordFormData.newPassword !== passwordFormData.confirmPassword ||
                                             passwordFormData.newPassword === passwordFormData.currentPassword ||
                                             passwordFormData.newPassword.length < 6}
                                >
                                    {submitting ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm"></span>
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <KeyIcon size={18} />
                                            Change Password
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                    <div 
                        className="modal-backdrop" 
                        onClick={() => {
                            if (!submitting) {
                                setShowPasswordModal(false);
                                setShowCurrentPassword(false);
                                setShowNewPassword(false);
                                setShowConfirmPassword(false);
                                setPasswordFormData({
                                    currentPassword: '',
                                    newPassword: '',
                                    confirmPassword: '',
                                });
                            }
                        }}
                    ></div>
                </div>
            )}
        </div>
    );
};

export default Profile;
