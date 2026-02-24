import { CalendarIcon } from "@phosphor-icons/react";

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
        checkInDate.setDate(checkInDate.getDate() + 1);
        return checkInDate.toISOString().split('T')[0];
    };

    return (
        <form onSubmit={onSubmit} className="card bg-base-100 shadow-xl border border-warning/30">
            <div className="card-body p-8">
                <div className="flex items-center justify-between border-b border-base-300 pb-4 mb-6">
                    <h2 className="text-xl font-bold text-base-content">
                        {hotel.name}
                    </h2>
                </div>

                {/* Information Section */}
                <div className="space-y-3 mb-6">
                    <h3 className="font-semibold text-base text-base-content">Information</h3>

                    <input
                        type="text"
                        name="name"
                        placeholder="Full Name"
                        className="input input-bordered w-full bg-base-200/50"
                        value={formData.name}
                        onChange={onInputChange}
                        required
                    />

                    <input
                        type="tel"
                        name="phone"
                        placeholder="Phone"
                        className="input input-bordered w-full bg-base-200/50"
                        value={formData.phone}
                        onChange={onInputChange}
                        required
                    />

                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        className="input input-bordered w-full bg-base-200/50"
                        value={formData.email}
                        onChange={onInputChange}
                        required
                    />

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 flex-1">
                            <label className="font-semibold text-base-content min-w-[70px]">
                                Adult
                            </label>
                            <input
                                type="number"
                                min="1"
                                className="input input-bordered input-sm w-16 text-center bg-base-200/50"
                                value={formData.adult}
                                onChange={(e) => onNumberChange("adult", e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2 flex-1">
                            <label className="font-semibold text-base-content min-w-[70px]">
                                Children
                            </label>
                            <input
                                type="number"
                                min="0"
                                className="input input-bordered input-sm w-16 text-center bg-base-200/50"
                                value={formData.children}
                                onChange={(e) => onNumberChange("children", e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2 flex-1">
                            <label className="font-semibold text-base-content min-w-[70px]">
                                Baby
                            </label>
                            <input
                                type="number"
                                min="0"
                                className="input input-bordered input-sm w-16 text-center bg-base-200/50"
                                value={formData.baby}
                                onChange={(e) => onNumberChange("baby", e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 flex-1">
                            <label className="font-semibold text-base-content min-w-[70px]">
                                BookAt
                            </label>
                            <div className="relative flex-1">
                                <input
                                    type="date"
                                    name="checkIn"
                                    className="input input-bordered input-sm w-full bg-base-200/50 pr-8"
                                    value={formData.checkIn}
                                    onChange={onInputChange}
                                    min={new Date().toISOString().split('T')[0]}
                                    required
                                />
                                <CalendarIcon
                                    size={16}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-1">
                            <label className="font-semibold text-base-content min-w-[70px]">
                                CheckOut
                            </label>
                            <div className="relative flex-1">
                                <input
                                    type="date"
                                    name="checkOut"
                                    className="input input-bordered input-sm w-full bg-base-200/50 pr-8"
                                    value={formData.checkOut}
                                    onChange={onInputChange}
                                    min={getMinCheckoutDate()}
                                    required
                                />
                                <CalendarIcon
                                    size={16}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Room Selection */}
                <div className="space-y-3 mb-6">
                    <h3 className="font-semibold text-sm text-base-content tracking-wide uppercase">
                        Select Room & Quantity
                    </h3>

                    {rooms.length === 0 ? (
                        <div className="alert alert-warning">
                            <span>No rooms available for this hotel</span>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {rooms.map((room) => (
                                <div
                                    key={room._id}
                                    className="flex items-center justify-between bg-base-200/30 rounded-lg px-4 py-2"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium text-sm text-base-content">
                                            {room.roomName} - ${room.roomPrice}
                                        </p>
                                        <p className="text-xs text-base-content/60 italic">
                                            (Remaining: {room.quantity} rooms)
                                        </p>
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        max={room.quantity}
                                        className="input input-bordered input-sm w-16 text-center bg-base-100"
                                        value={roomSelections[room._id] || 0}
                                        onChange={(e) =>
                                            onRoomQuantityChange(
                                                room._id,
                                                parseInt(e.target.value) || 0
                                            )
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Additional Services */}
                <div className="space-y-3 mb-6">
                    <h3 className="font-semibold text-sm text-base-content tracking-wide uppercase">
                        Select Additional Services
                    </h3>

                    {extraFees.length === 0 ? (
                        <p className="text-sm text-base-content/60">
                            No additional services available
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {extraFees.map((extra) => (
                                <label
                                    key={extra._id}
                                    className="flex items-center gap-3 cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-sm"
                                        checked={selectedExtras.includes(extra._id)}
                                        onChange={() => onExtraToggle(extra._id)}
                                    />
                                    <span className="text-base-content">
                                        {extra.extraName} - ${extra.extraPrice}
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Total Amount */}
                <div className="flex items-center justify-between py-3 border-t border-base-300">
                    <span className="font-bold text-base text-base-content">
                        TOTAL AMOUNT:
                    </span>
                    <span className="text-xl font-bold text-base-content">
                        ${totalAmount.toFixed(0)}
                    </span>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    className="btn btn-warning btn-lg w-full text-white font-bold uppercase rounded-full shadow-lg hover:shadow-xl transition-shadow"
                    disabled={submitting || rooms.length === 0}
                >
                    {submitting ? (
                        <>
                            <span className="loading loading-spinner"></span>
                            Processing...
                        </>
                    ) : (
                        "BOOK NOW"
                    )}
                </button>
            </div>
        </form>
    );
};

export default BookingFormCard;
