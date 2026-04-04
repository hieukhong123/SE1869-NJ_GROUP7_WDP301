import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { UserCircleIcon, SignOutIcon, ReceiptIcon, HeartIcon, HouseIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';

const Navbar = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        // Check if user is logged in
        const checkUser = () => {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                } catch (error) {
                    console.error('Error parsing user data:', error);
                    localStorage.removeItem('user');
                    setUser(null);
                }
            } else {
                setUser(null);
            }
        };

        checkUser();

        // Listen for login/logout events
        window.addEventListener('userLogin', checkUser);
        window.addEventListener('userLogout', checkUser);
        
        // Listen for scroll to add subtle shadow
        const handleScroll = () => {
            if (window.scrollY > 10) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };
        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('userLogin', checkUser);
            window.removeEventListener('userLogout', checkUser);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        toast.success('Logged out successfully');
        window.dispatchEvent(new Event('userLogout'));
        navigate('/');
    };

    return (
        <nav 
            className={`sticky top-0 z-40 w-full transition-all duration-300 bg-white/95 backdrop-blur-md ${
                isScrolled ? 'shadow-sm border-b border-gray-100 py-3' : 'py-5 border-b border-gray-100'
            }`}
        >
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                
                {/* Logo - Left */}
                <div className="flex-1 md:flex-none">
                    <Link to="/" className="flex items-center gap-3 group">
                        {/* Biểu tượng tối giản */}
                        <div className="w-8 h-8 flex items-center justify-center border border-gray-900 group-hover:bg-gray-900 transition-colors duration-300 rounded-sm">
                            <svg
                                className="w-4 h-4 text-gray-900 group-hover:text-white transition-colors duration-300"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z" />
                            </svg>
                        </div>
                        <span className="text-xl md:text-2xl font-serif text-gray-900 tracking-wide">
                            Roomerang
                        </span>
                    </Link>
                </div>

                {/* Navigation Links - Center (Hidden on Mobile) */}
                <div className="hidden md:flex flex-1 justify-center">
                    <ul className="flex items-center gap-7 max-w-md">
                        {['Home', 'Location', 'Hotels', 'About', 'Terms', 'Contact'].map((item) => {
                            const path = item === 'Home' ? '/' : `/${item.toLowerCase().replace(' ', '-')}`;
                            return (
                                <li key={item}>
                                    <NavLink
                                        to={path}
                                        className={({ isActive }) =>
                                            `relative text-xs uppercase tracking-widest py-2 transition-colors duration-300 ${
                                                isActive 
                                                    ? 'text-orange-800 font-medium' 
                                                    : 'text-gray-500 hover:text-gray-900'
                                            }`
                                        }
                                    >
                                        {({ isActive }) => (
                                            <>
                                                {item}
                                                {/* Underline indicator */}
                                                <span 
                                                    className={`absolute bottom-0 left-0 h-[1px] bg-orange-800 transition-all duration-300 ${
                                                        isActive ? 'w-full' : 'w-0'
                                                    }`}
                                                ></span>
                                            </>
                                        )}
                                    </NavLink>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {/* User Actions - Right */}
                <div className="flex-1 flex justify-end items-center gap-4 md:gap-6">
                    {user ? (
                        <div className="dropdown dropdown-end">
                            <div
                                tabIndex={0}
                                role="button"
                                className="flex items-center gap-2 cursor-pointer group"
                            >
                                <span className="hidden md:inline text-xs uppercase tracking-widest text-gray-500 group-hover:text-gray-900 transition-colors">
                                    {user.userName || user.fullName || 'Guest'}
                                </span>
                                <UserCircleIcon size={28} weight="light" className="text-gray-900" />
                            </div>
                            <ul
                                tabIndex={0}
                                className="dropdown-content menu bg-white rounded-sm z-[1] w-64 p-2 shadow-2xl mt-4 border border-gray-100"
                            >
                                <li className="menu-title px-4 py-3 border-b border-gray-50 mb-2">
                                    <span className="text-xs uppercase tracking-widest text-gray-400 p-0">
                                        Welcome back
                                    </span>
                                    <span className="text-sm font-serif text-gray-900 mt-1 block">
                                        {user.fullName || user.userName}
                                    </span>
                                </li>
                                <li>
                                    <Link to="/profile" className="text-sm font-light text-gray-600 hover:text-orange-800 hover:bg-orange-50/50 rounded-sm py-3">
                                        <UserCircleIcon size={18} weight="light" />
                                        <span>Profile Settings</span>
                                    </Link>
                                </li>
                                {(user.role === 'admin' || user.role === 'staff') && (
                                    <li>
                                        <Link to="/admin/dashboard" className="text-sm font-light text-gray-600 hover:text-orange-800 hover:bg-orange-50/50 rounded-sm py-3">
                                            <HouseIcon size={18} weight="light" />
                                            <span>Management Dashboard</span>
                                        </Link>
                                    </li>
                                )}
                                <li>
                                    <Link to="/my-bookings" className="text-sm font-light text-gray-600 hover:text-orange-800 hover:bg-orange-50/50 rounded-sm py-3">
                                        <ReceiptIcon size={18} weight="light" />
                                        <span>My Reservations</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/my-favorites" className="text-sm font-light text-gray-600 hover:text-orange-800 hover:bg-orange-50/50 rounded-sm py-3">
                                        <HeartIcon size={18} weight="light" />
                                        <span>Saved Properties</span>
                                    </Link>
                                </li>
                                
                                <div className="h-[1px] bg-gray-100 my-2"></div>
                                
                                <li>
                                    <button
                                        onClick={handleLogout}
                                        className="text-sm font-light text-red-500 hover:bg-red-50 hover:text-red-600 rounded-sm py-3"
                                    >
                                        <SignOutIcon size={18} weight="light" />
                                        <span>Sign Out</span>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link 
                                to="/login"
                                className="text-xs uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors hidden sm:block"
                            >
                                Sign In
                            </Link>
                            <Link 
                                to="/register"
                                className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white text-xs tracking-widest uppercase transition-colors rounded-sm"
                            >
                                Register
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;