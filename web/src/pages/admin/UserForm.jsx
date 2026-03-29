import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';
import { toast } from 'sonner';
import { 
    CaretLeft, 
    FloppyDisk, 
    CircleNotch,
    CheckCircle,
    XCircle
} from '@phosphor-icons/react';

const UserForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState({
        userName: '',
        email: '',
        password: '',
        fullName: '',
        role: 'user',
        status: true,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hotels, setHotels] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            try {
                const [hotelRes, userRes] = await Promise.all([
                    axiosClient.get('/hotels/admin-all'),
                    id ? axiosClient.get(`/users/${id}`) : Promise.resolve(null),
                ]);

                setHotels(hotelRes.data || []);

                if (userRes) {
                    setUser(userRes.data);
                }
            } catch (err) {
                const message =
                    err.response?.data?.message || err.message || 'Something went wrong';
                setError(message);
                toast.error(message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setUser({
            ...user,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (id) {
                await axiosClient.put(`/users/${id}`, user);
                toast.success('User profile updated successfully.');
            } else {
                await axiosClient.post('/users', user);
                toast.success('New user added to the directory.');
            }
            navigate('/admin/users');
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
                    Loading Profile...
                </p>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 lg:p-12 max-w-4xl mx-auto">
            
            {/* Header */}
            <div className="flex items-center gap-4 mb-10 pb-6 border-b border-gray-200">
                <button 
                    onClick={() => navigate('/admin/users')} 
                    className="p-2 text-gray-400 hover:text-gray-900 transition-colors border border-gray-200 rounded-sm hover:bg-white bg-gray-50"
                    title="Back to Directory"
                >
                    <CaretLeft size={20} weight="light" />
                </button>
                <div>
                    <h1 className="text-3xl font-serif text-gray-900 mb-1">
                        {id ? 'Edit User Profile' : 'Add New User'}
                    </h1>
                    <p className="text-[10px] font-medium text-gray-500 uppercase tracking-[0.2em]">
                        Guest Directory Management
                    </p>
                </div>
            </div>

            {/* Form Card */}
            <div className="bg-white border border-gray-100 rounded-sm shadow-sm">
                <form onSubmit={handleSubmit} className="p-8 md:p-10">
                    
                    <div className="space-y-10">
                        
                        {/* SECTION: Account Credentials */}
                        <div>
                            <h3 className="text-xs uppercase tracking-widest text-gray-900 font-medium mb-6 pb-2 border-b border-gray-100">
                                Account Credentials
                            </h3>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="relative group">
                                    <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Username</label>
                                    <input
                                        type="text"
                                        name="userName"
                                        value={user.userName}
                                        onChange={handleChange}
                                        placeholder="Username"
                                        className="w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-gray-900 font-light focus:ring-0 focus:border-gray-900 transition-colors placeholder-gray-300"
                                        required
                                    />
                                </div>

                                <div className="relative group">
                                    <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={user.email}
                                        onChange={handleChange}
                                        placeholder="Email address"
                                        className="w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-gray-900 font-light focus:ring-0 focus:border-gray-900 transition-colors placeholder-gray-300"
                                        required
                                    />
                                </div>

                                {/* Password field only shows when creating a NEW user */}
                                {!id && (
                                    <div className="relative group md:col-span-2">
                                        <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Temporary Password</label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={user.password}
                                            onChange={handleChange}
                                            placeholder="Assign an initial password"
                                            className="w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-gray-900 font-light focus:ring-0 focus:border-gray-900 transition-colors placeholder-gray-300"
                                            required
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* SECTION: Personal Details */}
                        <div>
                            <h3 className="text-xs uppercase tracking-widest text-gray-900 font-medium mb-6 pb-2 border-b border-gray-100">
                                Personal Details
                            </h3>
                            <div className="relative group">
                                <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={user.fullName || ''}
                                    onChange={handleChange}
                                    placeholder="Full name"
                                    className="w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-gray-900 font-light focus:ring-0 focus:border-gray-900 transition-colors placeholder-gray-300"
                                />
                            </div>
                        </div>

                        {/* SECTION: System Privileges */}
                        <div>
                            <h3 className="text-xs uppercase tracking-widest text-gray-900 font-medium mb-6 pb-2 border-b border-gray-100 flex justify-between items-end">
                                System Privileges
                                
                                {/* Custom Toggle Switch for Status */}
                                <label className="flex items-center cursor-pointer group">
                                    <div className="relative">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only" 
                                            name="status"
                                            checked={user.status}
                                            onChange={handleChange}
                                        />
                                        <div className={`block w-10 h-6 rounded-full transition-colors duration-300 ${user.status ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${user.status ? 'transform translate-x-4' : ''}`}></div>
                                    </div>
                                    <div className="ml-3 text-[10px] uppercase tracking-widest font-medium text-gray-500">
                                        {user.status ? (
                                            <span className="text-green-600 flex items-center gap-1"><CheckCircle weight="fill"/> Active</span>
                                        ) : (
                                            <span className="text-gray-400 flex items-center gap-1"><XCircle weight="fill"/> Suspended</span>
                                        )}
                                    </div>
                                </label>
                            </h3>
                            
                            <div className="relative group w-full md:w-1/2">
                                <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Assigned Role</label>
                                <select
                                    name="role"
                                    value={user.role}
                                    onChange={handleChange}
                                    className="w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-gray-900 font-light focus:ring-0 focus:border-gray-900 transition-colors appearance-none cursor-pointer"
                                >
                                    <option value="user">Standard User (Guest)</option>
                                    <option value="admin">Administrator</option>
                                      <option value="staff">Staff</option>
                                  </select>
                              </div>

                              {user.role === 'staff' && (
                                  <div className="relative group w-full md:w-1/2 mt-6">
                                      <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Assign Hotel / Resort</label>
                                      <select
                                          name="hotelId"
                                          value={user.hotelId || ''}
                                          onChange={handleChange}
                                          required
                                          className="w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-gray-900 font-light focus:ring-0 focus:border-gray-900 transition-colors appearance-none cursor-pointer"
                                      >
                                          <option value="">Select a property</option>
                                          {hotels.map(hotel => (
                                              <option key={hotel._id} value={hotel._id}>{hotel.name}</option>
                                          ))}
                                      </select>
                                  </div>
                              )}
                        </div>

                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col-reverse sm:flex-row gap-4 pt-10 mt-10 border-t border-gray-100 sm:justify-end">
                        <button
                            type="button"
                            className="px-8 py-3 bg-transparent border border-gray-300 text-gray-700 hover:border-gray-900 hover:text-gray-900 text-xs tracking-widest uppercase transition-colors rounded-sm sm:w-auto w-full text-center"
                            onClick={() => navigate('/admin/users')}
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
                                <><FloppyDisk size={16} /> {id ? 'Save Changes' : 'Create User'}</>
                            )}
                        </button>
                    </div>
                    
                </form>
            </div>
        </div>
    );
};

export default UserForm;




