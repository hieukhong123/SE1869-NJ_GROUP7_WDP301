import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../common/Navbar';
import Footer from '../common/Footer';
import ChatbotWidget from '../common/ChatbotWidget';

const PublicLayout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    if (pathname !== '/') {
      return;
    }

    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!storedUser || !token) {
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role === 'admin' || parsedUser.role === 'staff') {
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (error) {
    }
  }, [pathname, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFCFA] font-sans antialiased text-gray-900 selection:bg-orange-800 selection:text-white">
      <Navbar />

      <main className="flex-1 flex flex-col relative w-full">
        <Outlet />
      </main>

      <Footer />
      <ChatbotWidget />
    </div>
  );
};

export default PublicLayout;
