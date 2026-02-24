const Footer = () => {
	return (
		<footer className="bg-base-200 py-8">
			<div className="container mx-auto px-6 text-center">
				<div className="flex justify-center items-center gap-2 mb-4">
					<div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
						<svg
							className="w-5 h-5 text-primary"
							fill="currentColor"
							viewBox="0 0 24 24"
						>
							<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z" />
						</svg>
					</div>
					<span className="text-lg font-black text-primary">
						Roomerang
					</span>
				</div>
				<p className="text-base-content/60">
					© {new Date().getFullYear()} Roomerang. All rights reserved.
				</p>
			</div>
		</footer>
	);
};

export default Footer;
