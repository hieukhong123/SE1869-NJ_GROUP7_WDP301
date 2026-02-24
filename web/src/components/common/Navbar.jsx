import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { UserCircle, SignOut } from '@phosphor-icons/react';
import { toast } from 'sonner';

const Navbar = () => {
	const navigate = useNavigate();
	const [user, setUser] = useState(null);

	useEffect(() => {
		// Check if user is logged in
		const checkUser = () => {
			const storedUser = localStorage.getItem('user');
			if (storedUser) {
				try {
					setUser(JSON.parse(storedUser));
				} catch (error) {
					console.error('Error parsing user data:', error);
					localStorage.removeItem('user');
					setUser(null);
				}
			} else {
				setUser(null);
			}
		};

		checkUser();

		// Listen for login/logout events
		window.addEventListener('userLogin', checkUser);
		window.addEventListener('userLogout', checkUser);

		return () => {
			window.removeEventListener('userLogin', checkUser);
			window.removeEventListener('userLogout', checkUser);
		};
	}, []);

	const handleLogout = () => {
		localStorage.removeItem('user');
		setUser(null);
		toast.success('Logged out successfully');
		// Dispatch custom event for other components
		window.dispatchEvent(new Event('userLogout'));
		navigate('/');
	};

	return (
		<nav className="navbar bg-base-100 shadow-sm px-6 sticky top-0 z-50">
			<div className="navbar-start">
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
					<span className="text-xl font-black text-primary">
						Roomerang
					</span>
				</Link>
			</div>
			<div className="navbar-center hidden lg:flex">
				<ul className="menu menu-horizontal px-1 gap-2">
					<li>
						<NavLink
							to="/"
							className={({ isActive }) =>
								isActive
									? 'font-medium text-warning'
									: 'font-medium'
							}
						>
							Home
						</NavLink>
					</li>
					<li>
						<a className="font-medium">Location</a>
					</li>
					<li>
						<a className="font-medium">About</a>
					</li>
					<li>
						<a className="font-medium">Promotion</a>
					</li>
					<li>
						<a className="font-medium">Contact</a>
					</li>
				</ul>
			</div>
			<div className="navbar-end gap-2">
				{user ? (
					<>
						{/* User Profile Dropdown */}
						<div className="dropdown dropdown-end">
							<div
								tabIndex={0}
								role="button"
								className="btn btn-ghost btn-sm gap-2"
							>
								<UserCircle size={24} weight="fill" className="text-warning" />
								<span className="hidden md:inline font-medium">
									{user.userName || user.fullName || 'User'}
								</span>
							</div>
							<ul
								tabIndex={0}
								className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow-lg mt-2"
							>
								<li className="menu-title">
									<span className="text-sm">
										{user.fullName || user.userName}
									</span>
								</li>
								<li>
									<a className="text-sm">
										<UserCircle size={18} />
										Profile
									</a>
								</li>
								<li>
									<a className="text-sm">My Bookings</a>
								</li>
								<div className="divider my-0"></div>
								<li>
									<a
										onClick={handleLogout}
										className="text-sm text-error hover:bg-error/10"
									>
										<SignOut size={18} />
										Logout
									</a>
								</li>
							</ul>
						</div>
					</>
				) : (
					<>
						<Link to="/login">
							<button className="btn btn-warning btn-sm text-white">
								LOGIN
							</button>
						</Link>
						<Link to="/register">
							<button className="btn btn-warning btn-sm text-white">
								REGISTER
							</button>
						</Link>
					</>
				)}
			</div>
		</nav>
	);
};

export default Navbar;
