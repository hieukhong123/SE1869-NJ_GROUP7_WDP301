import React from 'react';
import { Link } from 'react-router-dom';

const PublicHome = () => {
	return (
		<div className="hero min-h-screen bg-base-200">
			<div className="hero-content text-center">
				<div className="max-w-md">
					<h1 className="text-5xl font-bold">Welcome to Roomerang</h1>
					<p className="py-6">Book your dream stay with us today.</p>
					<div className="flex gap-4 justify-center">
						<button className="btn btn-primary">
							Browse Hotels
						</button>
						<Link to="/admin/rooms" className="btn btn-outline">
							Admin Access
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
};
export default PublicHome;
