import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../common/Navbar';
import Footer from '../common/Footer';

const PublicLayout = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFCFA] font-sans antialiased text-gray-900 selection:bg-orange-800 selection:text-white">
      <Navbar />

      <main className="flex-1 flex flex-col relative w-full">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default PublicLayout;
