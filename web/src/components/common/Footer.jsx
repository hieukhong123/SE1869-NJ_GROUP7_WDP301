import { FacebookLogo, InstagramLogo, TwitterLogo, YoutubeLogo } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

const Footer = () => {
	const currentYear = new Date().getFullYear();

	return (
		<footer className="bg-base-100 border-t border-base-200 pt-16 pb-8 mt-auto">
			<div className="container mx-auto px-6 max-w-7xl">
				{/* Top Branding Section */}
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
					<Link to="/" className="flex items-center gap-2">
						<div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
							<svg
								className="w-6 h-6 text-primary"
								fill="currentColor"
								viewBox="0 0 24 24"
							>
								<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z" />
							</svg>
						</div>
						<span className="text-2xl font-black text-primary tracking-tight">
							Roomerang
						</span>
					</Link>
					
					<div className="flex gap-4">
						<a href="#" className="btn btn-ghost btn-circle text-primary hover:bg-primary/10 transition-all">
							<FacebookLogo size={24} weight="fill" />
						</a>
						<a href="#" className="btn btn-ghost btn-circle text-primary hover:bg-primary/10 transition-all">
							<InstagramLogo size={24} weight="fill" />
						</a>
						<a href="#" className="btn btn-ghost btn-circle text-primary hover:bg-primary/10 transition-all">
							<TwitterLogo size={24} weight="fill" />
						</a>
						<a href="#" className="btn btn-ghost btn-circle text-primary hover:bg-primary/10 transition-all">
							<YoutubeLogo size={24} weight="fill" />
						</a>
					</div>
				</div>

				{/* Main Links Grid */}
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10 mb-16">
					<div>
						<h4 className="font-bold text-sm uppercase tracking-widest text-warning mb-6">Support</h4>
						<ul className="space-y-4 text-sm font-medium">
							<li><a href="#" className="hover:text-primary transition-colors">COVID-19 FAQs</a></li>
							<li><a href="#" className="hover:text-primary transition-colors">Manage trips</a></li>
							<li><a href="#" className="hover:text-primary transition-colors">Customer Help</a></li>
							<li><a href="#" className="hover:text-primary transition-colors">Safety Center</a></li>
						</ul>
					</div>
					<div>
						<h4 className="font-bold text-sm uppercase tracking-widest text-warning mb-6">Discover</h4>
						<ul className="space-y-4 text-sm font-medium">
							<li><a href="#" className="hover:text-primary transition-colors">Genius Loyalty</a></li>
							<li><a href="#" className="hover:text-primary transition-colors">Seasonal Deals</a></li>
							<li><a href="#" className="hover:text-primary transition-colors">Travel Articles</a></li>
							<li><a href="#" className="hover:text-primary transition-colors">For Business</a></li>
						</ul>
					</div>
					<div>
						<h4 className="font-bold text-sm uppercase tracking-widest text-warning mb-6">Terms</h4>
						<ul className="space-y-4 text-sm font-medium">
							<li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
							<li><a href="#" className="hover:text-primary transition-colors">Terms of Use</a></li>
							<li><a href="#" className="hover:text-primary transition-colors">Cookie Policy</a></li>
							<li><a href="#" className="hover:text-primary transition-colors">Grievance Officer</a></li>
						</ul>
					</div>
					<div>
						<h4 className="font-bold text-sm uppercase tracking-widest text-warning mb-6">Partners</h4>
						<ul className="space-y-4 text-sm font-medium">
							<li><a href="#" className="hover:text-primary transition-colors">Extranet Login</a></li>
							<li><a href="#" className="hover:text-primary transition-colors">Partner Help</a></li>
							<li><a href="#" className="hover:text-primary transition-colors">List Property</a></li>
							<li><a href="#" className="hover:text-primary transition-colors">Affiliates</a></li>
						</ul>
					</div>
					<div>
						<h4 className="font-bold text-sm uppercase tracking-widest text-warning mb-6">Company</h4>
						<ul className="space-y-4 text-sm font-medium">
							<li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
							<li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
							<li><a href="#" className="hover:text-primary transition-colors">Press Center</a></li>
							<li><a href="#" className="hover:text-primary transition-colors">Sustainability</a></li>
						</ul>
					</div>
				</div>

				{/* Bottom section */}
				<div className="pt-8 border-t border-base-200 flex flex-col md:flex-row justify-between items-center gap-6">
					<p className="text-sm font-medium opacity-60">
						© {currentYear} Roomerang™. Inspired by Booking.com. All rights reserved.
					</p>
					
					<div className="text-[11px] font-bold opacity-40 uppercase tracking-tighter">
						Part of Booking Holdings Inc. Group
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
