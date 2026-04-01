import { useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import {
  House,
  Buildings,
  Bed,
  CalendarCheck,
  Users,
  Money,
  Star,
  CreditCard,
  Envelope,
  SignOut,
  List,
  ClockCounterClockwise,
  ArrowsLeftRight,
  FileText,
  User,
} from '@phosphor-icons/react';
import { toast } from 'sonner';

const AdminLayout = () => {
  const navigate = useNavigate();

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!user || !token || (user.role !== 'admin' && user.role !== 'staff')) {
      toast.error('Access denied.');
      navigate('/login');
    }
  }, [user, token, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  let adminMenu = [
    { path: '/admin/dashboard', name: 'Dashboard', icon: House },
    { path: '/admin/bookings', name: 'Reservations', icon: CalendarCheck },
    { path: '/admin/hotels', name: 'Hotels', icon: Buildings },
    { path: '/admin/rooms', name: 'Accommodations', icon: Bed },
    { path: '/admin/users', name: 'User Directory', icon: Users },
    { path: '/admin/extra-fees', name: 'Additional Services', icon: Money },
    { path: '/admin/reviews', name: 'Guest Reviews', icon: Star },
    { path: '/admin/payments', name: 'Transactions', icon: CreditCard },
    { path: '/admin/contacts', name: 'Contact Messages', icon: Envelope },
    { type: 'separator' },
    {
      path: '/admin/logs/refund',
      name: 'Refund Logs',
      icon: ArrowsLeftRight,
    },
    {
      path: '/admin/logs/hotel-status',
      name: 'Hotel Status Logs',
      icon: ClockCounterClockwise,
    },
    {
      path: '/admin/logs/booking-status',
      name: 'Booking Logs',
      icon: FileText,
    },
  ];

  if (user?.role === 'staff') {
    adminMenu = adminMenu
      .filter(
        (item) =>
          !item.path ||
          ![
            '/admin/users',
            '/admin/contacts',
            '/admin/payments',
            '/admin/extra-fees',
            '/admin/logs/refund',
            '/admin/logs/hotel-status'
          ].includes(item.path)
      )
      .map((item) => {
        if (item.name === 'Hotels') {
          return {
            ...item,
            name: 'My Hotel',
            path: '/admin/hotels',
          };
        }
        return item;
      });
  }

  return (
    <div className="drawer lg:drawer-open font-sans">
      <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />

      {/* Main Content Area */}
      <div className="drawer-content flex flex-col min-h-screen bg-gray-50">
        {/* Mobile Top Navbar - Elegant white bar */}
        <div className="lg:hidden flex justify-between items-center bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center border border-gray-900 rounded-sm">
              <svg
                className="w-4 h-4 text-gray-900"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z" />
              </svg>
            </div>
            <span className="font-serif text-xl text-gray-900">
              Workspace
            </span>
          </div>
          <label
            htmlFor="my-drawer-2"
            className="cursor-pointer p-2 -mr-2 text-gray-600 hover:text-gray-900"
          >
            <List size={24} weight="light" />
          </label>
        </div>

        {/* Main Content Rendered Here */}
        <div className="flex-1 w-full max-w-400 mx-auto">
          <Outlet />
        </div>
      </div>

      {/* Sidebar */}
      <div className="drawer-side z-40">
        <label
          htmlFor="my-drawer-2"
          className="drawer-overlay"
        ></label>

        <div className="flex flex-col w-72 min-h-screen bg-white border-r border-gray-200">
          {/* Branding */}
          <div className="px-8 py-10 border-b border-gray-100">
            <Link to="/" className="flex items-center gap-3 group mb-2 w-fit">
              <div className="w-8 h-8 flex items-center justify-center border border-gray-900 group-hover:bg-gray-900 transition rounded-sm">
                <svg
                  className="w-4 h-4 text-gray-900 group-hover:text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z" />
                </svg>
              </div>
              <span className="text-2xl font-serif text-gray-900">
                Roomerang
              </span>
            </Link>

            <span className="text-[10px] uppercase tracking-widest text-orange-800 ml-11">
              Management Portal
            </span>
          </div>

          <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto">
            {adminMenu.map((item, index) => {
              if (item.type === 'separator') {
                return (
                  <div
                    key={`sep-${index}`}
                    className="h-[1px] bg-gray-100 my-4 mx-4"
                  />
                );
              }
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() =>
                    (document.getElementById('my-drawer-2').checked = false)
                  }
                  className={({ isActive }) =>
                    `flex items-center gap-4 px-4 py-3 rounded-sm text-sm transition-colors ${
                      isActive
                        ? 'bg-orange-50 text-orange-800 font-medium'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={20} weight={isActive ? 'fill' : 'light'} />
                      {item.name}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-4 px-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-800 font-medium overflow-hidden border border-orange-200">
                {user?.avatar ? (
                  <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.fullName?.split(' ').map(n => n[0]).join('') || <User size={20} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.fullName || 'Administrator'}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 truncate">
                  {user?.role === 'admin' ? 'System Administrator' : 'Hotel Staff'}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-4 w-full px-4 py-3 text-sm text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors rounded-sm"
            >
              <SignOut size={20} />
              Secure Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;