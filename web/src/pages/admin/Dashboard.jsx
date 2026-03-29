import { useState, useEffect } from 'react';
import axiosClient from '../../services/axiosClient';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {
  UsersIcon,
  BuildingsIcon,
  CalendarCheckIcon,
  CurrencyDollarIcon,
  CircleNotchIcon,
  TrendUpIcon,
} from '@phosphor-icons/react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hotelStatus, setHotelStatus] = useState('all');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(
          `/dashboard?hotelStatus=${hotelStatus}`,
        );
        setStats(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [hotelStatus]);

  if (loading)
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-transparent">
        <CircleNotchIcon
          size={32}
          weight="light"
          className="text-orange-800 animate-spin"
        />
        <p className="text-gray-500 font-light text-sm tracking-widest uppercase">
          Compiling Data...
        </p>
      </div>
    );

  if (error)
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-transparent">
        <p className="text-red-500 font-serif text-xl">
          Unable to load dashboard
        </p>
        <p className="text-gray-500 font-light">{error.message}</p>
      </div>
    );

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { family: 'inherit', size: 11 },
          color: '#6b7280', // gray-500
          usePointStyle: true,
          boxWidth: 6,
        },
      },
      tooltip: {
        backgroundColor: '#111827', // gray-900
        padding: 12,
        titleFont: { family: 'inherit', size: 13, weight: 'normal' },
        bodyFont: { family: 'inherit', size: 12 },
        cornerRadius: 2,
        displayColors: false,
      },
    },
    scales: {
      y: {
        grid: { color: '#f3f4f6', drawBorder: false }, // gray-100
        ticks: { color: '#9ca3af', font: { size: 11 } }, // gray-400
        beginAtZero: true,
      },
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { color: '#6b7280', font: { size: 11 } }, // gray-500
      },
    },
  };

  const monthlyRevenueData = {
    labels: stats.monthlyRevenue.map(
      (item) => `${item._id.month}/${item._id.year}`,
    ),
    datasets: [
      {
        label: 'Revenue (USD)',
        data: stats.monthlyRevenue.map((item) => item.revenue),
        backgroundColor: '#9a3412',
        borderRadius: 2,
        barPercentage: 0.6,
      },
    ],
  };

  const bookingsByStatusData = {
    labels: stats.bookingsByStatus.map((item) => item._id.toUpperCase()),
    datasets: [
      {
        label: 'Reservations',
        data: stats.bookingsByStatus.map((item) => item.count),
        backgroundColor: [
          '#9a3412', // orange-800 (Confirmed/Active)
          '#d97706', // amber-600 (Pending)
          '#d1d5db', // gray-300 (Cancelled)
          '#fdba74', // orange-300 (Others)
        ],
        borderRadius: 2,
        barPercentage: 0.6,
      },
    ],
  };

  return (
    <div className="p-6 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 pb-6 border-b border-gray-200 gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif text-gray-900 mb-2">
              Performance Overview
            </h1>
            <p className="text-xs font-light text-gray-500 uppercase tracking-[0.2em]">
              Business Intelligence Dashboard
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">
              Filter Property Status:
            </label>
            <select
              value={hotelStatus}
              onChange={(e) => setHotelStatus(e.target.value)}
              className="bg-white border border-gray-200 text-gray-900 text-[10px] uppercase tracking-widest py-2 pl-3 pr-8 rounded-sm cursor-pointer focus:ring-0 focus:border-gray-900 transition-colors"
            >
              <option value="all">All Properties</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* Revenue Card */}
          <div className="bg-white p-6 border border-gray-100 rounded-sm shadow-sm flex flex-col justify-between group">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-1">
                  Total Revenue
                </p>
                <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                  <TrendUpIcon size={12} /> +12% this month
                </p>
              </div>
              <div className="w-10 h-10 flex items-center justify-center bg-orange-50 text-orange-800 rounded-sm group-hover:bg-orange-800 group-hover:text-white transition-colors duration-300">
                <CurrencyDollarIcon size={20} weight="light" />
              </div>
            </div>
            <h2 className="text-3xl font-serif text-gray-900 tracking-tight">
              ${stats.totalRevenue.toLocaleString()}
            </h2>
          </div>

          {/* Bookings Card */}
          <div className="bg-white p-6 border border-gray-100 rounded-sm shadow-sm flex flex-col justify-between group">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-1">
                  Total Reservations
                </p>
              </div>
              <div className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-600 rounded-sm group-hover:bg-gray-900 group-hover:text-white transition-colors duration-300">
                <CalendarCheckIcon size={20} weight="light" />
              </div>
            </div>
            <h2 className="text-3xl font-serif text-gray-900 tracking-tight">
              {stats.totalBookings.toLocaleString()}
            </h2>
          </div>

          {/* Hotels Card */}
          <div className="bg-white p-6 border border-gray-100 rounded-sm shadow-sm flex flex-col justify-between group">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-1">
                  Properties in Portfolio
                </p>
              </div>
              <div className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-600 rounded-sm group-hover:bg-gray-900 group-hover:text-white transition-colors duration-300">
                <BuildingsIcon size={20} weight="light" />
              </div>
            </div>
            <h2 className="text-3xl font-serif text-gray-900 tracking-tight">
              {stats.totalHotels.toLocaleString()}
            </h2>
          </div>

          {/* Users Card */}
          <div className="bg-white p-6 border border-gray-100 rounded-sm shadow-sm flex flex-col justify-between group">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-1">
                  Registered Guests
                </p>
              </div>
              <div className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-600 rounded-sm group-hover:bg-gray-900 group-hover:text-white transition-colors duration-300">
                <UsersIcon size={20} weight="light" />
              </div>
            </div>
            <h2 className="text-3xl font-serif text-gray-900 tracking-tight">
              {stats.totalUsers.toLocaleString()}
            </h2>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="bg-white border border-gray-100 rounded-sm shadow-sm p-6 lg:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-serif text-gray-900">
                  Revenue Growth
                </h3>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-1">
                  Monthly Financial Analysis
                </p>
              </div>
            </div>
            <div className="h-72 w-full">
              <Bar data={monthlyRevenueData} options={commonOptions} />
            </div>
          </div>

          {/* Status Chart */}
          <div className="bg-white border border-gray-100 rounded-sm shadow-sm p-6 lg:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-serif text-gray-900">
                  Booking Distribution
                </h3>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-1">
                  Reservations by Current Status
                </p>
              </div>
            </div>
            <div className="h-72 w-full">
              <Bar data={bookingsByStatusData} options={commonOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
