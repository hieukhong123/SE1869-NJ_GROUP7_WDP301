import { FacebookLogo, InstagramLogo, TwitterLogo, YoutubeLogo } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-[#FFFCFA] border-t border-gray-200 pt-20 pb-8 mt-auto">
            <div className="container mx-auto px-6 max-w-7xl">
                {/* Top Branding Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
                    <Link to="/" className="flex items-center gap-3 group">
                        {/* Biểu tượng logo tối giản đồng bộ với Navbar */}
                        <div className="w-8 h-8 flex items-center justify-center border border-gray-900 group-hover:bg-gray-900 transition-colors duration-300 rounded-sm">
                            <svg
                                className="w-4 h-4 text-gray-900 group-hover:text-white transition-colors duration-300"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z" />
                            </svg>
                        </div>
                        <span className="text-xl md:text-2xl font-serif text-gray-900 tracking-wide">
                            Roomerang
                        </span>
                    </Link>
                    
                    {/* Social Icons - Light weight & minimal */}
                    <div className="flex gap-6">
                        <a href="#" className="text-gray-400 hover:text-orange-800 transition-colors duration-300" aria-label="Facebook">
                            <FacebookLogo size={22} weight="light" />
                        </a>
                        <a href="#" className="text-gray-400 hover:text-orange-800 transition-colors duration-300" aria-label="Instagram">
                            <InstagramLogo size={22} weight="light" />
                        </a>
                        <a href="#" className="text-gray-400 hover:text-orange-800 transition-colors duration-300" aria-label="Twitter">
                            <TwitterLogo size={22} weight="light" />
                        </a>
                        <a href="#" className="text-gray-400 hover:text-orange-800 transition-colors duration-300" aria-label="Youtube">
                            <YoutubeLogo size={22} weight="light" />
                        </a>
                    </div>
                </div>

                {/* Main Links Grid - Editorial Columns */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-12 mb-20">
                    <div>
                        <h4 className="font-medium text-xs uppercase tracking-widest text-gray-900 mb-6">Support</h4>
                        <ul className="space-y-4 text-sm font-light text-gray-500">
                            <li><a href="#" className="hover:text-orange-800 transition-colors">COVID-19 FAQs</a></li>
                            <li><a href="#" className="hover:text-orange-800 transition-colors">Manage trips</a></li>
                            <li><a href="#" className="hover:text-orange-800 transition-colors">Customer Help</a></li>
                            <li><a href="#" className="hover:text-orange-800 transition-colors">Safety Center</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium text-xs uppercase tracking-widest text-gray-900 mb-6">Discover</h4>
                        <ul className="space-y-4 text-sm font-light text-gray-500">
                            <li><a href="#" className="hover:text-orange-800 transition-colors">Genius Loyalty</a></li>
                            <li><a href="#" className="hover:text-orange-800 transition-colors">Seasonal Deals</a></li>
                            <li><a href="#" className="hover:text-orange-800 transition-colors">Travel Articles</a></li>
                            <li><a href="#" className="hover:text-orange-800 transition-colors">For Business</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium text-xs uppercase tracking-widest text-gray-900 mb-6">Terms</h4>
                        <ul className="space-y-4 text-sm font-light text-gray-500">
                            <li><Link to="/terms#privacy" className="hover:text-orange-800 transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="hover:text-orange-800 transition-colors">Terms of Use</Link></li>
                            <li><Link to="/terms#privacy" className="hover:text-orange-800 transition-colors">Cookie Policy</Link></li>
                            <li><Link to="/contact" className="hover:text-orange-800 transition-colors">Grievance Officer</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium text-xs uppercase tracking-widest text-gray-900 mb-6">Partners</h4>
                        <ul className="space-y-4 text-sm font-light text-gray-500">
                            <li><a href="#" className="hover:text-orange-800 transition-colors">Extranet Login</a></li>
                            <li><a href="#" className="hover:text-orange-800 transition-colors">Partner Help</a></li>
                            <li><a href="#" className="hover:text-orange-800 transition-colors">List Property</a></li>
                            <li><a href="#" className="hover:text-orange-800 transition-colors">Affiliates</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium text-xs uppercase tracking-widest text-gray-900 mb-6">Company</h4>
                        <ul className="space-y-4 text-sm font-light text-gray-500">
                            <li><a href="#" className="hover:text-orange-800 transition-colors">About Us</a></li>
                            <li><a href="#" className="hover:text-orange-800 transition-colors">Careers</a></li>
                            <li><a href="#" className="hover:text-orange-800 transition-colors">Press Center</a></li>
                            <li><a href="#" className="hover:text-orange-800 transition-colors">Sustainability</a></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom section */}
                <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-xs font-light text-gray-400">
                        © {currentYear} Roomerang™. Curated stays and experiences. All rights reserved.
                    </p>
                    
                    <div className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
                        Inspired by Elegance
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;