import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import AdminLayout from './components/layouts/AdminLayout';
import BookingList from './pages/admin/BookingList';
import HotelList from './pages/admin/HotelList';
import RoomList from './pages/admin/RoomList';
import RoomForm from './pages/admin/RoomForm';
import PublicHome from './pages/public/PublicHome';

function App() {
	return (
		<BrowserRouter>
			<Toaster richColors position="bottom-right" />

			<Routes>
				<Route path="/" element={<PublicHome />} />

				<Route path="/admin" element={<AdminLayout />}>
					<Route
						index
						element={<Navigate to="/admin/bookings" replace />}
					/>

					<Route path="bookings" element={<BookingList />} />

					<Route path="hotels" element={<HotelList />} />

					<Route path="rooms" element={<RoomList />} />
					<Route path="rooms/new" element={<RoomForm />} />
					<Route path="rooms/:id/edit" element={<RoomForm />} />

					<Route
						path="users"
						element={
							<div className="p-4">User Management (TODO)</div>
						}
					/>
				</Route>

				{/* 404 CATCH ALL */}
				<Route
					path="*"
					element={
						<div className="flex items-center justify-center h-screen bg-base-200">
							<div className="text-center">
								<h1 className="text-4xl font-bold">404</h1>
								<p className="py-2">Page not found</p>
							</div>
						</div>
					}
				/>
			</Routes>
		</BrowserRouter>
	);
}

export default App;
