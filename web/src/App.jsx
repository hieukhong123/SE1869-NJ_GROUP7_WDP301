import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import AdminLayout from './components/layouts/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import BookingList from './pages/admin/BookingList';
import HotelList from './pages/admin/HotelList';
import HotelForm from './pages/admin/HotelForm';
import RoomList from './pages/admin/RoomList';
import RoomForm from './pages/admin/RoomForm';
import UserList from './pages/admin/UserList';
import UserForm from './pages/admin/UserForm';
import ExtraFeeList from './pages/admin/ExtraFeeList';
import ExtraFeeForm from './pages/admin/ExtraFeeForm';
import ReviewList from './pages/admin/ReviewList';
import ReviewDetails from './pages/admin/ReviewDetails';
import PaymentList from './pages/admin/PaymentList';
import RefundList from './pages/admin/RefundList';
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
						element={<Navigate to="/admin/dashboard" replace />}
					/>
          <Route path="dashboard" element={<Dashboard />} />

					<Route path="bookings" element={<BookingList />} />

					<Route path="hotels" element={<HotelList />} />
					<Route path="hotels/new" element={<HotelForm />} />
					<Route path="hotels/:id/edit" element={<HotelForm />} />

					<Route path="rooms" element={<RoomList />} />
					<Route path="rooms/new" element={<RoomForm />} />
					<Route path="rooms/:id/edit" element={<RoomForm />} />

					<Route path="users" element={<UserList />} />
					<Route path="users/new" element={<UserForm />} />
					<Route path="users/:id/edit" element={<UserForm />} />

          <Route path="extra-fees" element={<ExtraFeeList />} />
          <Route path="extra-fees/new" element={<ExtraFeeForm />} />
          <Route path="extra-fees/:id/edit" element={<ExtraFeeForm />} />

          <Route path="reviews" element={<ReviewList />} />
          <Route path="reviews/:id/view" element={<ReviewDetails />} />

          <Route path="payments" element={<PaymentList />} />
          <Route path="refunds" element={<RefundList />} />
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

