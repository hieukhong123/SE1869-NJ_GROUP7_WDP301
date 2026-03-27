import { 
    UserIcon, 
    InfoIcon, 
    CaretUp, 
    CaretDown, 
    Sparkle 
} from "@phosphor-icons/react";
import { toast } from "sonner";

const BookingFormCard = ({
    hotel,
    formData,
    rooms,
    extraFees,
    roomSelections,
    selectedExtras,
    totalAmount,
    submitting,
    onInputChange,
    onNumberChange,
    onRoomQuantityChange,
    onExtraToggle,
    onSubmit,
}) => {
    
    const getMinCheckoutDate = () => {
        if (!formData.checkIn) return "";
        const checkInDate = new Date(formData.checkIn);
        return checkInDate.toISOString().split('T')[0];
    };

    const roomsForAdults = Math.ceil((formData.adult || 1) / 2);
    const currentChildGuests = (formData.children || 0) + (formData.baby || 0);
    const remainingChildGuests = Math.max(0, currentChildGuests - roomsForAdults);
    const currentRoomsNeeded = roomsForAdults + remainingChildGuests;

    const roomSuggestions = rooms.filter((room) => {
        const maxAvailable = room.availableQuantity !== undefined ? room.availableQuantity : room.quantity;
        return maxAvailable >= currentRoomsNeeded && currentRoomsNeeded > 0;
    }).map((room) => ({
        roomId: room._id,
        roomName: room.roomName,
        quantity: currentRoomsNeeded,
        pricePerNight: room.roomPrice * currentRoomsNeeded,
    }));

    const handleApplySuggestion = (targetRoomId, qty, roomName) => {
        Object.keys(roomSelections).forEach((roomId) => {
            if (roomId !== targetRoomId && roomSelections[roomId] > 0) {
                onRoomQuantityChange(roomId, 0);
            }
        });
        
        onRoomQuantityChange(targetRoomId, qty);
        
        toast.success(`Applied successfully: ${qty} × ${roomName}`);
    };

    return (
        <form onSubmit={onSubmit} className="bg-white border border-gray-200 rounded-sm shadow-xl shadow-gray-200/30">
            <div className="p-8 lg:p-10">
                
                {/* Header */}
                <div className="border-b border-gray-100 pb-6 mb-8 text-center">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-orange-800 mb-2 block">
                        Reservation Request
                    </span>
                    <h2 className="text-2xl font-serif text-gray-900 leading-tight">
                        {hotel.name}
                    </h2>
                </div>

                {/* Guest Information Section */}
                <div className="space-y-6 mb-10">
                    <div className="flex items-center gap-2 mb-4">
                        <InfoIcon size={16} weight="light" className="text-gray-400" />
                        <h3 className="text-xs uppercase tracking-widest text-gray-500 font-medium">
                            Guest Details
                        </h3>
                    </div>

                    <div className="space-y-5">
                        <div className="relative group">
                            <input
                                type="text"
                                name="name"
                                placeholder="Full Name"
                                className="w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-gray-900 font-light placeholder-gray-400 focus:ring-0 focus:border-orange-800 transition-colors"
                                value={formData.name}
                                onChange={onInputChange}
                                required
                            />
                        </div>

                        <div className="relative group">
                            <input
                                type="tel"
                                name="phone"
                                placeholder="Phone Number"
                                className="w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-gray-900 font-light placeholder-gray-400 focus:ring-0 focus:border-orange-800 transition-colors"
                                value={formData.phone}
                                onChange={onInputChange}
                                required
                            />
                        </div>

                        <div className="relative group">
                            <input
                                type="email"
                                name="email"
                                placeholder="Email Address"
                                className="w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-gray-900 font-light placeholder-gray-400 focus:ring-0 focus:border-orange-800 transition-colors"
                                value={formData.email}
                                onChange={onInputChange}
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Occupancy & Dates Section */}
                <div className="space-y-6 mb-10">
                    <div className="flex items-center gap-2 mb-4">
                        <UserIcon size={16} weight="light" className="text-gray-400" />
                        <h3 className="text-xs uppercase tracking-widest text-gray-500 font-medium">
                            Stay Details
                        </h3>
                    </div>

                    {/* Guests Count */}
                    <div className="flex gap-4 p-4 bg-gray-50/50 border border-gray-100 rounded-sm">
                        <div className="flex-1 text-center border-r border-gray-200 last:border-r-0">
                            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Adults</label>
                            <input
                                type="number"
                                min="1"
                                className="w-full bg-transparent border-0 text-center text-lg font-light text-gray-900 focus:ring-0 p-0"
                                value={formData.adult}
                                onChange={(e) => onNumberChange("adult", e.target.value)}
                            />
                        </div>
                        <div className="flex-1 text-center border-r border-gray-200">
                            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Children</label>
                            <input
                                type="number"
                                min="0"
                                className="w-full bg-transparent border-0 text-center text-lg font-light text-gray-900 focus:ring-0 p-0"
                                value={formData.children}
                                onChange={(e) => onNumberChange("children", e.target.value)}
                            />
                        </div>
                        <div className="flex-1 text-center">
                            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Infants</label>
                            <input
                                type="number"
                                min="0"
                                className="w-full bg-transparent border-0 text-center text-lg font-light text-gray-900 focus:ring-0 p-0"
                                value={formData.baby}
                                onChange={(e) => onNumberChange("baby", e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1 pl-1">
                                Check In
                            </label>
                            <div className="relative border-b border-gray-300 focus-within:border-orange-800 transition-colors">
                                <input
                                    type="date"
                                    name="checkIn"
                                    className="w-full bg-transparent border-0 px-0 py-2 text-gray-900 font-light focus:ring-0 text-sm"
                                    value={formData.checkIn}
                                    onChange={onInputChange}
                                    min={new Date().toISOString().split('T')[0]}
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex-1 relative">
                            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1 pl-1">
                                Check Out
                            </label>
                            <div className="relative border-b border-gray-300 focus-within:border-orange-800 transition-colors">
                                <input
                                    type="date"
                                    name="checkOut"
                                    className="w-full bg-transparent border-0 px-0 py-2 text-gray-900 font-light focus:ring-0 text-sm disabled:text-gray-400"
                                    value={formData.checkOut}
                                    onChange={onInputChange}
                                    min={getMinCheckoutDate()}
                                    disabled={!formData.checkIn}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Room Selection */}
                <div className="space-y-4 mb-10">
                    <h3 className="text-xs uppercase tracking-widest text-gray-500 font-medium pb-2 border-b border-gray-100 flex items-center justify-between">
                        Accommodation
                        <span className="text-[9px] text-gray-400 normal-case tracking-normal">
                            Requires {currentRoomsNeeded} room{currentRoomsNeeded > 1 ? 's' : ''}
                        </span>
                    </h3>

                    {roomSuggestions.length > 0 && (
                        <div className="mb-6 p-4 bg-orange-50/50 border border-orange-100 rounded-sm animate-fade-in">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkle size={14} weight="fill" className="text-orange-800" />
                                <span className="text-[10px] uppercase tracking-widest text-orange-800 font-medium">
                                    Recommended Configurations
                                </span>
                            </div>
                            <div className="flex flex-col gap-2">
                                {roomSuggestions.map((sug) => (
                                    <button
                                        key={`sug-${sug.roomId}`}
                                        type="button"
                                        onClick={() => handleApplySuggestion(sug.roomId, sug.quantity, sug.roomName)}
                                        className="flex items-center justify-between p-3 border border-orange-200 hover:border-orange-800 bg-white hover:bg-orange-50/80 transition-colors duration-300 rounded-sm text-left group"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900 group-hover:text-orange-800 transition-colors">
                                                {sug.quantity} × {sug.roomName}
                                            </span>
                                            <span className="text-[10px] text-gray-500 mt-0.5">
                                                Perfect for your party size
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-serif text-gray-900 block">
                                                ${sug.pricePerNight.toLocaleString()} <span className="text-[10px] font-sans text-gray-400">/night</span>
                                            </span>
                                            <span className="text-[10px] font-medium uppercase tracking-widest text-orange-800 opacity-0 group-hover:opacity-100 transition-opacity">
                                                Select
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Manual Room List */}
                    {rooms.length === 0 ? (
                        <p className="text-sm font-light text-red-500 italic py-4">
                            No rooms available at the moment.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {rooms.map((room) => {
                                const isSelected = (roomSelections[room._id] || 0) > 0;
                                
                                return (
                                    <div key={room._id} className={`flex items-start justify-between group p-3 -mx-3 rounded-sm transition-colors ${isSelected ? 'bg-gray-50' : 'hover:bg-gray-50/50'}`}>
                                        <div className="flex-1 pr-4">
                                            <p className="font-serif text-gray-900 transition-colors">
                                                {room.roomName}
                                            </p>
                                            {room.description && (
                                                <p className="text-xs font-light text-gray-500 mt-1 leading-relaxed line-clamp-2">
                                                    {room.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-sm font-light text-gray-500" translate="no">
                                                    ${room.roomPrice?.toLocaleString()} / night
                                                </span>
                                                <span className="text-gray-300">•</span>
                                                {room.availableQuantity > 0 ? (
                                                    <span className="text-[10px] uppercase tracking-wider text-green-600" translate="no">
                                                        {room.availableQuantity} left
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] uppercase tracking-wider text-red-500">
                                                        Sold Out
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                className="w-7 h-7 flex items-center justify-center border border-gray-300 hover:border-orange-800 hover:bg-orange-50 text-gray-600 hover:text-orange-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:bg-transparent disabled:hover:text-gray-600 rounded-sm"
                                                disabled={room.availableQuantity <= 0 || (roomSelections[room._id] || 0) <= 0}
                                                onClick={() => onRoomQuantityChange(room._id, Math.max(0, (roomSelections[room._id] || 0) - 1))}
                                            >
                                                <CaretDown size={14} weight="bold" />
                                            </button>
                                            <span className="w-8 text-center font-medium text-gray-900" translate="no">
                                                {roomSelections[room._id] || 0}
                                            </span>
                                            <button
                                                type="button"
                                                className="w-7 h-7 flex items-center justify-center border border-gray-300 hover:border-orange-800 hover:bg-orange-50 text-gray-600 hover:text-orange-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:bg-transparent disabled:hover:text-gray-600 rounded-sm"
                                                disabled={room.availableQuantity <= 0 || (roomSelections[room._id] || 0) >= room.availableQuantity}
                                                onClick={() => onRoomQuantityChange(room._id, Math.min(room.availableQuantity, (roomSelections[room._id] || 0) + 1))}
                                            >
                                                <CaretUp size={14} weight="bold" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Additional Services */}
                {extraFees.length > 0 && (
                    <div className="space-y-4 mb-10">
                        <h3 className="text-xs uppercase tracking-widest text-gray-500 font-medium pb-2 border-b border-gray-100">
                            Enhance Your Stay
                        </h3>
                        <div className="space-y-3">
                            {extraFees.map((extra) => (
                                <label
                                    key={extra._id}
                                    className="flex items-center justify-between cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex items-center justify-center w-4 h-4 border border-gray-300 rounded-sm overflow-hidden group-hover:border-orange-800 transition-colors">
                                            <input
                                                type="checkbox"
                                                className="absolute opacity-0 w-full h-full cursor-pointer peer"
                                                checked={selectedExtras.includes(extra._id)}
                                                onChange={() => onExtraToggle(extra._id)}
                                            />
                                            <div className="w-full h-full bg-orange-800 opacity-0 peer-checked:opacity-100 transition-opacity flex items-center justify-center">
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                                            </div>
                                        </div>
                                        <span className="text-sm font-light text-gray-700 group-hover:text-gray-900 transition-colors">
                                            {extra.extraName}
                                        </span>
                                    </div>
                                    <span className="text-sm font-light text-gray-500" translate="no">
                                        + ${extra.extraPrice}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Total Summary */}
                <div className="bg-gray-50 p-6 rounded-sm mb-8">
                    <div className="flex items-end justify-between">
                        <span className="text-xs uppercase tracking-widest text-gray-500 font-medium">
                            Estimated Total
                        </span>
                        <div className="flex flex-col items-end">
                            <span className="text-2xl md:text-3xl font-serif text-gray-900 tracking-wide" translate="no" key={totalAmount}>
                                ${Number(totalAmount).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-gray-400 font-light mt-1">Taxes & fees included</span>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    className="w-full py-4 px-8 bg-gray-900 hover:bg-black text-white text-xs tracking-widest uppercase transition-all duration-300 rounded-sm flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-900"
                    disabled={submitting || rooms.length === 0}
                >
                    {submitting ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Processing...
                        </>
                    ) : (
                        "Request Reservation"
                    )}
                </button>
            </div>
        </form>
    );
};

export default BookingFormCard;