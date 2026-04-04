import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axiosClient from '../../services/axiosClient';
import {
  CaretLeft,
  CircleNotch,
  Buildings,
  Bed,
  User,
  Phone,
  EnvelopeSimple,
  CalendarCheck,
  Users,
  Baby,
  Sparkle,
  PlusCircle,
} from '@phosphor-icons/react';

const resolveHotelId = (hotelIdValue) => {
  if (!hotelIdValue) return '';
  if (typeof hotelIdValue === 'string') return hotelIdValue;
  if (typeof hotelIdValue === 'object') return hotelIdValue._id || hotelIdValue.id || '';
  return '';
};

const StaffBookingCreate = () => {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isStaff = currentUser?.role === 'staff';
  const currentStaffHotelId = resolveHotelId(currentUser?.hotelId);

  const [submitting, setSubmitting] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Hotel selection (admin only)
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState(isStaff ? currentStaffHotelId : '');

  // Room & availability
  const [rooms, setRooms] = useState([]);
  const [extraFees, setExtraFees] = useState([]);
  const [roomSelections, setRoomSelections] = useState({});
  const [selectedExtras, setSelectedExtras] = useState([]);

  // Guest info
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    adult: 1,
    children: 0,
    baby: 0,
    checkIn: '',
    checkOut: '',
  });

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!isStaff) {
      axiosClient.get('/hotels/admin-all').then((res) => {
        setHotels(res.data || []);
      }).catch(() => setHotels([]));
    }
  }, [isStaff]);

  // Fetch rooms when hotel + dates are selected
  useEffect(() => {
    if (!selectedHotelId) {
      setRooms([]);
      return;
    }
    const fetchRooms = async () => {
      setLoadingRooms(true);
      try {
        let url = `/rooms?hotelId=${selectedHotelId}`;
        if (formData.checkIn && formData.checkOut) {
          url += `&checkIn=${formData.checkIn}&checkOut=${formData.checkOut}`;
        }
        const res = await axiosClient.get(url);
        setRooms(res.data || []);
      } catch {
        setRooms([]);
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchRooms();
  }, [selectedHotelId, formData.checkIn, formData.checkOut]);

  // Fetch extra fees when hotel is selected
  useEffect(() => {
    if (!selectedHotelId) {
      setExtraFees([]);
      return;
    }
    axiosClient.get(`/extra-fees/public`).then((res) => {
      const fees = (res.data || []).filter(
        (e) => String(e.hotelId?._id || e.hotelId) === String(selectedHotelId)
      );
      setExtraFees(fees);
    }).catch(() => setExtraFees([]));
  }, [selectedHotelId]);

  const totalSelectedRooms = Object.values(roomSelections).reduce((a, b) => a + b, 0);

  const calculateTotal = () => {
    if (!formData.checkIn || !formData.checkOut) return 0;
    const checkInDate = new Date(formData.checkIn);
    const checkOutDate = new Date(formData.checkOut);
    const nights = Math.max(1, Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)));

    let roomTotal = 0;
    Object.entries(roomSelections).forEach(([roomId, qty]) => {
      const room = rooms.find((r) => r._id === roomId);
      if (room) roomTotal += Number(room.roomPrice || 0) * qty;
    });

    let extrasTotal = 0;
    selectedExtras.forEach((id) => {
      const fee = extraFees.find((e) => e._id === id);
      if (fee) extrasTotal += Number(fee.extraPrice || 0);
    });

    return (roomTotal * nights + extrasTotal).toFixed(2);
  };

  const handleRoomQty = (roomId, delta) => {
    const room = rooms.find((r) => r._id === roomId);
    const maxAvailable = room ? (room.availableQuantity !== undefined ? room.availableQuantity : room.quantity) : 0;
    setRoomSelections((prev) => {
      const current = prev[roomId] || 0;
      const next = Math.max(0, Math.min(current + delta, maxAvailable));
      return { ...prev, [roomId]: next };
    });
  };

  const handleExtraToggle = (id) => {
    setSelectedExtras((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedHotelId) {
      toast.error('Please select a hotel');
      return;
    }
    if (!formData.checkIn || !formData.checkOut) {
      toast.error('Please select check-in and check-out dates');
      return;
    }
    if (new Date(formData.checkOut) <= new Date(formData.checkIn)) {
      toast.error('Check-out must be after check-in');
      return;
    }
    if (totalSelectedRooms === 0) {
      toast.error('Please select at least one room');
      return;
    }
    if (!formData.name.trim() || !formData.phone.trim() || !formData.email.trim()) {
      toast.error('Please fill in all guest contact information');
      return;
    }

    // Build roomIds array (repeated entries for qty > 1)
    const roomIds = [];
    Object.entries(roomSelections).forEach(([roomId, qty]) => {
      for (let i = 0; i < qty; i++) roomIds.push(roomId);
    });

    setSubmitting(true);
    try {
      const payload = {
        hotelId: selectedHotelId,
        roomIds,
        extraIds: selectedExtras,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        adult: Number(formData.adult),
        children: Number(formData.children),
        baby: Number(formData.baby),
      };

      await axiosClient.post('/bookings/manual', payload);
      toast.success('Manual booking created successfully!');
      navigate('/admin/bookings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  const isWalkIn = formData.checkIn === today;

  return (
    <div className="p-6 md:p-8 lg:p-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10 pb-6 border-b border-gray-200">
        <button
          onClick={() => navigate('/admin/bookings')}
          className="p-2 text-gray-400 hover:text-gray-900 transition-colors border border-gray-200 rounded-sm hover:bg-white bg-gray-50"
        >
          <CaretLeft size={20} weight="light" />
        </button>
        <div>
          <h1 className="text-3xl font-serif text-gray-900 mb-1">New Manual Booking</h1>
          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-[0.2em]">
            Walk-in Guest Registration
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
        {/* Left column: Hotel, Dates, Guest Info */}
        <div className="lg:col-span-2 space-y-6">

          {/* Hotel Selection (admin only) */}
          {!isStaff && (
            <div className="bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                <Buildings size={18} weight="light" className="text-gray-400" />
                <h2 className="text-xs uppercase tracking-widest text-gray-900 font-medium">Property</h2>
              </div>
              <div className="p-5">
                <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Select Hotel *</label>
                <select
                  value={selectedHotelId}
                  onChange={(e) => {
                    setSelectedHotelId(e.target.value);
                    setRoomSelections({});
                    setSelectedExtras([]);
                  }}
                  className="w-full border border-gray-200 text-sm py-2.5 px-3 rounded-sm focus:ring-0 focus:border-gray-900"
                  required
                >
                  <option value="">— Choose a hotel —</option>
                  {hotels.filter((h) => h.status === 'active').map((h) => (
                    <option key={h._id} value={h._id}>{h.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Stay Dates */}
          <div className="bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center gap-3">
              <CalendarCheck size={18} weight="light" className="text-gray-400" />
              <h2 className="text-xs uppercase tracking-widest text-gray-900 font-medium">Stay Period</h2>
              {isWalkIn && (
                <span className="ml-auto text-[10px] uppercase tracking-widest font-medium px-2 py-1 bg-green-50 text-green-700 border border-green-100 rounded-sm">
                  Walk-in Today → Status: Checked In
                </span>
              )}
            </div>
            <div className="p-5 grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Check-in Date *</label>
                <input
                  type="date"
                  value={formData.checkIn}
                  min={today}
                  onChange={(e) => {
                    setFormData((p) => ({ ...p, checkIn: e.target.value }));
                    setRoomSelections({});
                  }}
                  className="w-full border border-gray-200 text-sm py-2.5 px-3 rounded-sm focus:ring-0 focus:border-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Check-out Date *</label>
                <input
                  type="date"
                  value={formData.checkOut}
                  min={formData.checkIn || today}
                  onChange={(e) => {
                    setFormData((p) => ({ ...p, checkOut: e.target.value }));
                    setRoomSelections({});
                  }}
                  className="w-full border border-gray-200 text-sm py-2.5 px-3 rounded-sm focus:ring-0 focus:border-gray-900"
                  required
                />
              </div>
            </div>
          </div>

          {/* Guest Information */}
          <div className="bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center gap-3">
              <User size={18} weight="light" className="text-gray-400" />
              <h2 className="text-xs uppercase tracking-widest text-gray-900 font-medium">Guest Information</h2>
            </div>
            <div className="p-5 grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Nguyen Van A"
                  className="w-full border border-gray-200 text-sm py-2.5 px-3 rounded-sm focus:ring-0 focus:border-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Phone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="e.g. 0901234567"
                  className="w-full border border-gray-200 text-sm py-2.5 px-3 rounded-sm focus:ring-0 focus:border-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  placeholder="e.g. guest@email.com"
                  className="w-full border border-gray-200 text-sm py-2.5 px-3 rounded-sm focus:ring-0 focus:border-gray-900"
                  required
                />
              </div>
            </div>

            {/* Guest Counts */}
            <div className="px-5 pb-5 grid grid-cols-3 gap-4">
              {[
                { key: 'adult', label: 'Adults', icon: <Users size={16} weight="light" className="text-gray-400" />, min: 1 },
                { key: 'children', label: 'Children', icon: <Baby size={16} weight="light" className="text-gray-400" />, min: 0 },
                { key: 'baby', label: 'Babies', icon: <Baby size={16} weight="light" className="text-gray-400" />, min: 0 },
              ].map(({ key, label, icon, min }) => (
                <div key={key}>
                  <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-gray-400 mb-2">{icon} {label}</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, [key]: Math.max(min, Number(p[key]) - 1) }))}
                      className="w-8 h-8 border border-gray-200 rounded-sm text-gray-500 hover:bg-gray-50 text-lg leading-none"
                    >-</button>
                    <span className="w-8 text-center text-sm font-medium text-gray-900">{formData[key]}</span>
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, [key]: Number(p[key]) + 1 }))}
                      className="w-8 h-8 border border-gray-200 rounded-sm text-gray-500 hover:bg-gray-50 text-lg leading-none"
                    >+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Room Selection */}
          {selectedHotelId && (
            <div className="bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                <Bed size={18} weight="light" className="text-gray-400" />
                <h2 className="text-xs uppercase tracking-widest text-gray-900 font-medium">Room Selection</h2>
                {loadingRooms && <CircleNotch size={14} className="animate-spin text-gray-400 ml-auto" />}
              </div>
              <div className="p-5">
                {rooms.length === 0 && !loadingRooms ? (
                  <p className="text-sm text-gray-400 italic">
                    {formData.checkIn && formData.checkOut
                      ? 'No available rooms for selected dates.'
                      : 'Select dates to see available rooms.'}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {rooms.map((room) => {
                      const available = room.availableQuantity !== undefined ? room.availableQuantity : room.quantity;
                      const qty = roomSelections[room._id] || 0;
                      return (
                        <div key={room._id} className="flex items-center justify-between p-4 border border-gray-100 rounded-sm hover:border-gray-300 transition-colors">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{room.roomName}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              ${Number(room.roomPrice).toLocaleString()}/night · Available: {available}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleRoomQty(room._id, -1)}
                              disabled={qty === 0}
                              className="w-8 h-8 border border-gray-200 rounded-sm text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                            >-</button>
                            <span className="w-6 text-center text-sm font-medium text-gray-900">{qty}</span>
                            <button
                              type="button"
                              onClick={() => handleRoomQty(room._id, 1)}
                              disabled={qty >= available}
                              className="w-8 h-8 border border-gray-200 rounded-sm text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                            >+</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Extra Services */}
          {extraFees.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                <Sparkle size={18} weight="light" className="text-gray-400" />
                <h2 className="text-xs uppercase tracking-widest text-gray-900 font-medium">Extra Services</h2>
              </div>
              <div className="p-5 space-y-2">
                {extraFees.map((fee) => (
                  <label key={fee._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-sm cursor-pointer hover:border-gray-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedExtras.includes(fee._id)}
                        onChange={() => handleExtraToggle(fee._id)}
                        className="checkbox checkbox-sm"
                      />
                      <span className="text-sm font-light text-gray-700">{fee.extraName}</span>
                    </div>
                    <span className="text-xs font-medium text-gray-500">+${fee.extraPrice}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Summary & Submit */}
        <div className="lg:col-span-1">
          <div className="bg-gray-900 text-white rounded-sm shadow-lg sticky top-24">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-sm uppercase tracking-widest text-white font-medium">Booking Summary</h2>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="space-y-2 text-gray-400 font-light">
                <div className="flex justify-between">
                  <span>Booking Type</span>
                  <span className={`text-xs font-medium uppercase tracking-widest px-2 py-0.5 rounded-sm ${isWalkIn ? 'bg-green-900/50 text-green-400' : 'bg-gray-700 text-gray-300'}`}>
                    {isWalkIn ? 'Walk-in → Checked In' : 'Pre-booking → Confirmed'}
                  </span>
                </div>
                {formData.checkIn && (
                  <div className="flex justify-between">
                    <span>Check-in</span>
                    <span className="text-white">{formData.checkIn}</span>
                  </div>
                )}
                {formData.checkOut && (
                  <div className="flex justify-between">
                    <span>Check-out</span>
                    <span className="text-white">{formData.checkOut}</span>
                  </div>
                )}
                {formData.checkIn && formData.checkOut && (
                  <div className="flex justify-between">
                    <span>Nights</span>
                    <span className="text-white">
                      {Math.max(1, Math.ceil((new Date(formData.checkOut) - new Date(formData.checkIn)) / (1000 * 60 * 60 * 24)))}
                    </span>
                  </div>
                )}
              </div>

              {totalSelectedRooms > 0 && (
                <>
                  <div className="w-full h-px bg-gray-800" />
                  <div className="space-y-1.5 text-gray-400 font-light text-xs">
                    {Object.entries(roomSelections).filter(([, q]) => q > 0).map(([roomId, qty]) => {
                      const room = rooms.find((r) => r._id === roomId);
                      return room ? (
                        <div key={roomId} className="flex justify-between">
                          <span>{room.roomName} ×{qty}</span>
                          <span>${(room.roomPrice * qty).toLocaleString()}/night</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </>
              )}

              {selectedExtras.length > 0 && (
                <>
                  <div className="w-full h-px bg-gray-800" />
                  <div className="space-y-1.5 text-gray-400 font-light text-xs">
                    {selectedExtras.map((id) => {
                      const fee = extraFees.find((e) => e._id === id);
                      return fee ? (
                        <div key={id} className="flex justify-between">
                          <span>{fee.extraName}</span>
                          <span>+${fee.extraPrice}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </>
              )}

              <div className="w-full h-px bg-gray-800" />
              <div className="flex justify-between items-end">
                <span className="text-xs uppercase tracking-widest text-gray-400">Total</span>
                <div className="text-right">
                  <p className="text-2xl font-serif tracking-tight text-white">
                    ${Number(calculateTotal()).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-gray-500 font-light mt-0.5">Collected offline</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-800">
              <button
                type="submit"
                form="booking-form-dummy"
                onClick={handleSubmit}
                disabled={submitting || totalSelectedRooms === 0}
                className="w-full py-3 bg-white text-gray-900 text-xs uppercase tracking-widest font-medium hover:bg-gray-100 transition-colors rounded-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <CircleNotch size={16} className="animate-spin" />
                ) : (
                  <PlusCircle size={16} weight="light" />
                )}
                {submitting ? 'Creating...' : 'Create Booking'}
              </button>
              <p className="text-[10px] text-gray-500 text-center mt-3 font-light">
                {isWalkIn
                  ? 'Walk-in: status will be set to Checked In'
                  : 'Pre-booking: status will be set to Confirmed'}
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default StaffBookingCreate;
