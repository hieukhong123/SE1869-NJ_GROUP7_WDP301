import { CircleNotchIcon, WarningCircleIcon, XIcon } from '@phosphor-icons/react';

const variantStyles = {
	danger: {
		icon: 'text-red-600',
		button: 'bg-red-600 hover:bg-red-700 text-white',
	},
	warning: {
		icon: 'text-orange-700',
		button: 'bg-orange-700 hover:bg-orange-800 text-white',
	},
	default: {
		icon: 'text-gray-700',
		button: 'bg-gray-900 hover:bg-black text-white',
	},
};

const ConfirmModal = ({
	isOpen,
	title,
	message,
	confirmText = 'Confirm',
	cancelText = 'Cancel',
	onCancel,
	onConfirm,
	loading = false,
	variant = 'default',
}) => {
	if (!isOpen) {
		return null;
	}

	const styles = variantStyles[variant] || variantStyles.default;

	return (
		<div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
			<div className="w-full max-w-md bg-white rounded-sm shadow-2xl p-8 animate-fade-in">
				<div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
					<div className="flex items-center gap-3">
						<WarningCircleIcon size={20} weight="fill" className={styles.icon} />
						<h3 className="text-xl font-serif text-gray-900">{title}</h3>
					</div>
					<button
						onClick={onCancel}
						disabled={loading}
						className="text-gray-400 hover:text-gray-900 transition-colors disabled:opacity-50"
					>
						<XIcon size={20} weight="light" />
					</button>
				</div>

				<p className="text-sm font-light text-gray-500 mb-8 leading-relaxed">{message}</p>

				<div className="flex gap-3 justify-end">
					<button
						onClick={onCancel}
						disabled={loading}
						className="px-6 py-2.5 border border-gray-300 text-gray-700 text-xs uppercase tracking-widest hover:border-gray-900 transition-colors rounded-sm disabled:opacity-50"
					>
						{cancelText}
					</button>
					<button
						onClick={onConfirm}
						disabled={loading}
						className={`px-6 py-2.5 text-xs uppercase tracking-widest transition-colors rounded-sm flex items-center gap-2 disabled:opacity-50 ${styles.button}`}
					>
						{loading ? <CircleNotchIcon size={14} className="animate-spin" /> : null}
						{confirmText}
					</button>
				</div>
			</div>
		</div>
	);
};

export default ConfirmModal;
