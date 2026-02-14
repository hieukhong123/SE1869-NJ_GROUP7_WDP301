import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import {
	BuildingsIcon,
	BedIcon,
	CalendarCheckIcon,
	UsersIcon,
	SignOutIcon,
} from '@phosphor-icons/react';

const AdminLayout = () => {
	return (
		<div className="drawer lg:drawer-open">
			<input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
			<div className="drawer-content flex flex-col min-h-screen bg-base-200 p-6">
				{/* Navbar for Mobile */}
				<div className="lg:hidden flex justify-between items-center mb-4">
					<label
						htmlFor="my-drawer-2"
						className="btn btn-square btn-ghost"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							className="inline-block w-6 h-6 stroke-current"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M4 6h16M4 12h16M4 18h16"
							></path>
						</svg>
					</label>
					<span className="font-bold text-lg">Roomerang Admin</span>
				</div>

				{/* Main Content Rendered Here */}
				<Outlet />
			</div>

			<div className="drawer-side z-20">
				<label
					htmlFor="my-drawer-2"
					aria-label="close sidebar"
					className="drawer-overlay"
				></label>
				<ul className="menu p-4 w-80 min-h-full bg-base-100 text-base-content border-r border-base-300 gap-2">
					{/* Branding */}
					<div className="mb-6 px-4 pt-2">
						<h1 className="text-2xl font-black text-primary">
							Roomerang
						</h1>
						<p className="text-xs text-base-content/60">
							Admin Dashboard
						</p>
					</div>

					{/* Navigation */}
					<li>
						<Link to="/admin/bookings">
							<CalendarCheckIcon size={24} />
							Manage Bookings
						</Link>
					</li>
					<li>
						<Link to="/admin/hotels">
							<BuildingsIcon size={24} />
							Manage Hotels
						</Link>
					</li>
					<li>
						<Link to="/admin/rooms">
							<BedIcon size={24} />
							Manage Rooms
						</Link>
					</li>
					<li>
						<Link to="/admin/users">
							<UsersIcon size={24} />
							Manage Users
						</Link>
					</li>

					<div className="divider"></div>

					<li className="mt-auto">
						<button className="text-error">
							<SignOutIcon size={24} />
							Logout
						</button>
					</li>
				</ul>
			</div>
		</div>
	);
};

export default AdminLayout;
