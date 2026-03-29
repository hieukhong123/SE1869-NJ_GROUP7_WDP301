import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import {
  HouseIcon,
  BuildingsIcon,
  BedIcon,
  CalendarCheckIcon,
  UsersIcon,
  MoneyIcon,
  StarIcon,
  CreditCardIcon,
  EnvelopeIcon,
  SignOutIcon,
  ListIcon,
  ClockCounterClockwiseIcon,
  ArrowsLeftRightIcon,
  FileTextIcon,
} from '@phosphor-icons/react';
import { toast } from 'sonner';

const AdminLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  let adminMenu = [
    { path: '/admin/dashboard', name: 'Dashboard', icon: HouseIcon },
    { path: '/admin/bookings', name: 'Reservations', icon: CalendarCheckIcon },
    { path: '/admin/hotels', name: 'Hotels', icon: BuildingsIcon },
    { path: '/admin/rooms', name: 'Accommodations', icon: BedIcon },
    { path: '/admin/users', name: 'User Directory', icon: UsersIcon },
    { path: '/admin/extra-fees', name: 'Additional Services', icon: MoneyIcon },
    { path: '/admin/reviews', name: 'Guest Reviews', icon: StarIcon },
    { path: '/admin/payments', name: 'Transactions', icon: CreditCardIcon },
    { path: '/admin/contacts', name: 'Contact Messages', icon: EnvelopeIcon },
    { type: 'separator' },
    {
      path: '/admin/logs/refund',
      name: 'Refund Logs',
      icon: ArrowsLeftRightIcon,
    },
    {
      path: '/admin/logs/hotel-status',
      name: 'Hotel Status Logs',
      icon: ClockCounterClockwiseIcon,
    },
    {
      path: '/admin/logs/booking-status',
      name: 'Booking Logs',
      icon: FileTextIcon,
    },
  ];

  if (user?.role === 'staff') {
    adminMenu = adminMenu.filter(
      (item) =>
        !item.path || 
        ![
          '/admin/users',
          '/admin/contacts',
          '/admin/payments',
          '/admin/extra-fees',
        ].includes(item.path)
    );
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
            <ListIcon size={24} weight="light" />
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
                    `flex items-center gap-4 px-4 py-3 rounded-sm text-sm ${
                      isActive
                        ? 'bg-orange-50 text-orange-800 font-medium'
                        : 'text-gray-500 hover:bg-gray-50'
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

          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="flex items-center gap-4 w-full px-4 py-3 text-sm text-red-500 hover:bg-red-50"
            >
              <SignOutIcon size={20} />
              Secure Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;