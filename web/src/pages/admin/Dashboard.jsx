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
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isStaff = user?.role === 'staff';

  const [stats, setStats] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hotelStatus, setHotelStatus] = useState('all');
  const [hotelId, setHotelId] = useState('all');
  const [revenueView, setRevenueView] = useState('daily'); // 'daily', 'weekly', 'monthly'
  const [statusView, setStatusView] = useState('summary'); // 'summary', 'daily', 'weekly', 'monthly'
  const [analysisMonth, setAnalysisMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const response = await axiosClient.get('/hotels/admin-all');
        setHotels(response.data || []);
      } catch (err) {
        setHotels([]);
      }
    };

    fetchHotels();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const params = { hotelStatus };
        if (hotelId !== 'all') {
          params.hotelId = hotelId;
        }
        params.analysisMonth = analysisMonth;

        const response = await axiosClient.get('/dashboard', { params });
        setStats(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [hotelStatus, hotelId, analysisMonth]);

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

  const getRevenueChartData = () => {
    if (!stats) return { labels: [], datasets: [] };

    let labels = [];
    let data = [];
    let label = 'Revenue (USD)';

    if (revenueView === 'daily') {
      labels = (stats.dailyRevenue || []).map((item) => item.label);
      data = (stats.dailyRevenue || []).map((item) => item.revenue);
      label = `Daily Revenue - ${analysisMonth}`;
    } else if (revenueView === 'weekly') {
      labels = (stats.weeklyRevenue || []).map((item) => item.label);
      data = (stats.weeklyRevenue || []).map((item) => item.revenue);
      label = `Weekly Revenue - ${analysisMonth}`;
    } else {
      labels = (stats.monthlyRevenue || []).map(
        (item) => `${item._id.month}/${item._id.year}`
      );
      data = (stats.monthlyRevenue || []).map((item) => item.revenue);
      label = 'Monthly Revenue Trend';
    }

    return {
      labels,
      datasets: [
        {
          label,
          data,
          backgroundColor: '#9a3412',
          borderRadius: 2,
          barPercentage: revenueView === 'daily' ? 0.8 : 0.6,
        },
      ],
    };
  };

  const revenueChartData = getRevenueChartData();

  const getBookingsByStatusData = () => {
    if (!stats) return { labels: [], datasets: [] };

    const statusColors = {
      confirmed: '#9a3412', // orange-800
      paid: '#ea580c',      // orange-600
      pending: '#d97706',   // amber-600
      checked_in: '#166534', // green-800
      checked_out: '#1e40af', // blue-800
      cancelled: '#d1d5db', // gray-300
      expired: '#9ca3af',   // gray-400
      no_show: '#b91c1c',   // red-700
    };

    if (statusView === 'summary') {
      return {
        labels: stats.bookingsByStatus.map((item) => item._id.toUpperCase()),
        datasets: [
          {
            label: 'Reservations',
            data: stats.bookingsByStatus.map((item) => item.count),
            backgroundColor: stats.bookingsByStatus.map(
              (item) => statusColors[item._id] || '#fdba74'
            ),
            borderRadius: 2,
            barPercentage: 0.6,
          },
        ],
      };
    }

    // Time-series distribution
    let sourceData = [];
    if (statusView === 'daily') sourceData = stats.dailyBookingsStatus || [];
    else if (statusView === 'weekly') sourceData = stats.weeklyBookingsStatus || [];
    else sourceData = stats.monthlyBookingsStatus || [];

    const labels = sourceData.map((item) => item.label);
    const availableStatuses = [
      ...new Set(sourceData.flatMap((item) => Object.keys(item).filter((k) => k !== 'label' && k !== '_id'))),
    ];

    const datasets = availableStatuses.map((status) => ({
      label: status.toUpperCase(),
      data: sourceData.map((item) => item[status] || 0),
      backgroundColor: statusColors[status] || '#fdba74',
      stack: 'Stack 0',
      borderRadius: 0,
    }));

    return { labels, datasets };
  };

  const bookingsByStatusData = getBookingsByStatusData();

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

          {!isStaff && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full sm:w-auto">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-2">
                  Property
                </label>
                <select
                  value={hotelId}
                  onChange={(e) => setHotelId(e.target.value)}
                  className="w-full bg-white border border-gray-200 text-gray-900 text-[10px] uppercase tracking-widest py-2 pl-3 pr-8 rounded-sm cursor-pointer focus:ring-0 focus:border-gray-900 transition-colors"
                >
                  <option value="all">All Properties</option>
                  {hotels.map((hotel) => (
                    <option key={hotel._id} value={hotel._id}>
                      {hotel.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-2">
                  Property Status
                </label>
                <select
                  value={hotelStatus}
                  onChange={(e) => setHotelStatus(e.target.value)}
                  className="w-full bg-white border border-gray-200 text-gray-900 text-[10px] uppercase tracking-widest py-2 pl-3 pr-8 rounded-sm cursor-pointer focus:ring-0 focus:border-gray-900 transition-colors"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="suspended">Suspended Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
          {/* Revenue Card */}
          <div className="bg-white p-6 border border-gray-100 rounded-sm shadow-sm flex flex-col justify-between group">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-1">
                  Revenue this Month
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
                  Monthly Reservations
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
          
          {/* Today's Availability Card */}
          <div className="bg-white p-6 border border-gray-100 rounded-sm shadow-sm flex flex-col justify-between group">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-1">
                  Today's Rooms
                </p>
                <p className="text-xs text-orange-800 font-medium flex items-center gap-1">
                  {stats.occupancyStats.occupancyRate}% Occupied
                </p>
              </div>
              <div className="w-10 h-10 flex items-center justify-center bg-orange-50 text-orange-800 rounded-sm group-hover:bg-orange-800 group-hover:text-white transition-colors duration-300">
                <CalendarCheckIcon size={20} weight="light" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <h2 className="text-3xl font-serif text-gray-900 tracking-tight">
                {stats.occupancyStats.availableRooms}
                <span className="text-xs text-gray-400 font-sans ml-2 lowercase tracking-normal">Left Today</span>
              </h2>
              <div className="text-right">
                 <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                   {stats.occupancyStats.occupiedRooms} / {stats.occupancyStats.totalRooms}
                 </p>
              </div>
            </div>
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
                  New Guests (Month)
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
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-serif text-gray-900">
                  Revenue Analytics
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  {['daily', 'weekly', 'monthly'].map((view) => (
                    <button
                      key={view}
                      onClick={() => setRevenueView(view)}
                      className={`text-[9px] uppercase tracking-widest px-3 py-1 border transition-all duration-200 ${
                        revenueView === view
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {view}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {revenueView !== 'monthly' && (
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-1 text-right">
                      Month
                    </label>
                    <input
                      type="month"
                      value={analysisMonth}
                      onChange={(e) => setAnalysisMonth(e.target.value)}
                      className="bg-white border border-gray-200 text-gray-900 text-[10px] py-1 px-2 rounded-sm focus:ring-0 focus:border-gray-900"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="h-72 w-full">
              <Bar data={revenueChartData} options={commonOptions} />
            </div>
          </div>

          {/* Status Chart */}
          <div className="bg-white border border-gray-100 rounded-sm shadow-sm p-6 lg:p-8">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-serif text-gray-900">
                  Booking Distribution
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  {['summary', 'daily', 'weekly', 'monthly'].map((view) => (
                    <button
                      key={view}
                      onClick={() => setStatusView(view)}
                      className={`text-[9px] uppercase tracking-widest px-3 py-1 border transition-all duration-200 ${
                        statusView === view
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {view}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="h-72 w-full">
              <Bar 
                data={bookingsByStatusData} 
                options={{
                  ...commonOptions,
                  scales: {
                    ...commonOptions.scales,
                    x: {
                      ...commonOptions.scales.x,
                      stacked: statusView !== 'summary',
                    },
                    y: {
                      ...commonOptions.scales.y,
                      stacked: statusView !== 'summary',
                    },
                  },
                }} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
