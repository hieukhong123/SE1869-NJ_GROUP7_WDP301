import { CheckCircleIcon, XCircleIcon } from '@phosphor-icons/react';

const RefundSuccessPreviewModal = ({
  isOpen,
  onClose,
  booking,
  previewMeta,
}) => {
  if (!isOpen || !booking) {
    return null;
  }

  const amount = Number(booking.totalAmount || 0);
  const receiverName = booking.name || booking.userId?.fullName || 'Guest';
  const propertyName = booking.hotelId?.name || 'Property';

  return (
    <div className="fixed inset-0 z-[120] bg-black/45 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-[560px] rounded-sm shadow-2xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
          <span className="text-[10px] uppercase tracking-[0.25em] text-gray-500">
            Refund Transfer Result
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 transition-colors"
            aria-label="Close preview"
          >
            <XCircleIcon size={20} weight="fill" />
          </button>
        </div>

        <div className="p-8">
          <div className="flex flex-col items-center text-center">
            <CheckCircleIcon size={58} weight="fill" className="text-green-600" />
            <h3 className="mt-4 text-2xl font-serif text-gray-900">Transfer Successful</h3>
            <p className="mt-1 text-xs uppercase tracking-widest text-gray-500">
              Reference {previewMeta.referenceNo}
            </p>
          </div>

          <div className="mt-8 border border-gray-200 rounded-sm overflow-hidden">
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 p-5 text-sm">
              <span className="text-gray-500">Amount</span>
              <span className="text-right font-semibold text-green-700">
                ${amount.toLocaleString()}
              </span>

              <span className="text-gray-500">Beneficiary</span>
              <span className="text-right text-gray-900">{receiverName}</span>

              <span className="text-gray-500">Booking Ref</span>
              <span className="text-right text-gray-900">{String(booking._id).slice(-8).toUpperCase()}</span>

              <span className="text-gray-500">Property</span>
              <span className="text-right text-gray-900">{propertyName}</span>

              <span className="text-gray-500">Transfer Time</span>
              <span className="text-right text-gray-900">{previewMeta.timestamp}</span>

              <span className="text-gray-500">Status</span>
              <span className="text-right text-green-700 font-medium uppercase tracking-wider">
                Completed
              </span>
            </div>
          </div>

          <p className="mt-6 text-xs text-gray-500 leading-relaxed">
            Take a screenshot of this result screen and upload it as transfer proof in the refund form.
          </p>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-900 text-white text-xs uppercase tracking-widest hover:bg-black transition-colors rounded-sm"
            >
              I Captured The Screenshot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundSuccessPreviewModal;
