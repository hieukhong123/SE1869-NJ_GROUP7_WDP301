import { Link, NavLink } from 'react-router-dom';

const Navbar = () => {
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
				<button className="btn btn-warning btn-sm text-white">
					LOGIN
				</button>
				<button className="btn btn-warning btn-sm text-white">
					REGISTER
				</button>
			</div>
		</nav>
	);
};

export default Navbar;
