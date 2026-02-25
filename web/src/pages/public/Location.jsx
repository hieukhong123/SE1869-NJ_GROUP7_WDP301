import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';
import {
	MapPinIcon,
	StarIcon,
	MagnifyingGlassIcon,
	BuildingsIcon,
	SparkleIcon,
	ArrowRightIcon,
	MapTrifoldIcon,
} from '@phosphor-icons/react';

const Location = () => {
	const [hotels, setHotels] = useState([]);
	const [filteredHotels, setFilteredHotels] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [cities, setCities] = useState([]);

	useEffect(() => {
		fetchHotels();
	}, []);

	const fetchHotels = async () => {
		try {
			setLoading(true);
			const response = await axiosClient.get('/hotels');
			const hotelsData = response.data;
			setHotels(hotelsData);
			setFilteredHotels(hotelsData);

			// Extract unique cities from hotels
			const uniqueCities = [
				...new Set(hotelsData.map((hotel) => hotel.city).filter(Boolean)),
			];
			setCities(uniqueCities);
		} catch (err) {
			console.error('Error fetching hotels:', err);
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = () => {
		if (!searchQuery.trim()) {
			setFilteredHotels(hotels);
			return;
		}

		const filtered = hotels.filter(
			(hotel) =>
				hotel.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				hotel.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				hotel.address?.toLowerCase().includes(searchQuery.toLowerCase())
		);
		setFilteredHotels(filtered);
	};

	const handleKeyPress = (e) => {
		if (e.key === 'Enter') {
			handleSearch();
		}
	};

	// Group hotels by city
	const hotelsByCity = filteredHotels.reduce((acc, hotel) => {
		const city = hotel.city || 'Other';
		if (!acc[city]) {
			acc[city] = [];
		}
		acc[city].push(hotel);
		return acc;
	}, {});

	return (
		<div className="min-h-screen bg-orange-50">
			{/* Hero Section with Search */}
			<section className="relative bg-gradient-to-b from-white via-orange-50/50 to-orange-50 py-20 px-4">
				<div className="max-w-7xl mx-auto text-center">
					<div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 rounded-full mb-6 border border-orange-200">
						<SparkleIcon size={20} weight="fill" className="text-orange-500" />
						<span className="text-sm font-medium text-orange-900">
							Discover your favorite destinations
						</span>
					</div>

					<h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-4">
						Search Locations
					</h1>
					<p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
						Discover amazing hotels in Vietnam's top travel destinations
					</p>

					{/* Search Bar */}
					<div className="max-w-3xl mx-auto mb-8">
						<div className="bg-white rounded-2xl shadow-lg border-2 border-orange-100 hover:border-orange-300 transition-colors">
							<div className="p-4">
								<div className="flex flex-col sm:flex-row gap-3">
									<div className="relative flex-1">
										<MagnifyingGlassIcon
											size={24}
											className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
											weight="bold"
										/>
										<input
											type="text"
											placeholder="Search by city, hotel name, or address..."
											className="input input-lg w-full pl-14 border-2 border-gray-200 focus:border-orange-400 focus:outline-none rounded-xl"
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
											onKeyPress={handleKeyPress}
										/>
									</div>
									<button
										className="btn btn-lg px-8 gap-2 bg-orange-500 hover:bg-orange-600 text-white border-0 rounded-xl shadow-md hover:shadow-lg transition-all"
										onClick={handleSearch}
									>
										<MagnifyingGlassIcon size={24} weight="bold" />
										<span className="hidden sm:inline">Search</span>
									</button>
								</div>
							</div>
						</div>
					</div>

					{/* Quick City Links */}
					{cities.length > 0 && (
						<div className="flex flex-wrap justify-center gap-3">
							<span className="text-gray-600 text-sm font-medium self-center">
								Popular cities:
							</span>
							{cities.slice(0, 6).map((city) => (
								<button
									key={city}
									className="px-5 py-2 bg-white hover:bg-orange-500 text-gray-700 hover:text-white rounded-full border-2 border-orange-200 hover:border-orange-500 transition-all duration-300 font-medium hover:scale-105 transform shadow-sm hover:shadow-md"
									onClick={() => {
										setSearchQuery(city);
										const filtered = hotels.filter((hotel) =>
											hotel.city
												?.toLowerCase()
												.includes(city.toLowerCase())
										);
										setFilteredHotels(filtered);
									}}
								>
									{city}
								</button>
							))}
						</div>
					)}
				</div>
			</section>

			{/* Results Section */}
			<section className="max-w-7xl mx-auto py-16 px-4">
				{loading ? (
					<div className="space-y-8">
						<div className="flex items-center justify-center py-12">
							<div className="text-center">
								<div className="relative">
									<span className="loading loading-spinner loading-lg text-orange-500"></span>
									<div className="absolute inset-0 blur-xl opacity-50">
										<span className="loading loading-spinner loading-lg text-orange-500"></span>
									</div>
								</div>
								<p className="mt-4 text-gray-600 font-medium">
									Loading hotels...
								</p>
							</div>
						</div>
						{/* Skeleton Loaders */}
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{[1, 2, 3, 4, 5, 6].map((i) => (
								<div
									key={i}
									className="bg-white rounded-xl shadow-md animate-pulse"
								>
									<div className="h-48 bg-orange-100 rounded-t-xl"></div>
									<div className="p-5">
										<div className="h-4 bg-orange-100 rounded w-3/4 mb-2"></div>
										<div className="h-4 bg-orange-100 rounded w-1/2 mb-4"></div>
										<div className="h-3 bg-orange-100 rounded w-full mb-2"></div>
										<div className="h-3 bg-orange-100 rounded w-5/6 mb-4"></div>
										<div className="grid grid-cols-3 gap-2 mb-4">
											<div className="aspect-video bg-orange-100 rounded"></div>
											<div className="aspect-video bg-orange-100 rounded"></div>
											<div className="aspect-video bg-orange-100 rounded"></div>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				) : filteredHotels.length === 0 ? (
					<div className="text-center py-20">
						<div className="relative inline-block">
							<BuildingsIcon
								size={120}
								weight="duotone"
								className="text-orange-200 mb-6"
							/>
							<div className="absolute -top-2 -right-2">
								<MagnifyingGlassIcon
									size={40}
									weight="bold"
									className="text-orange-500"
								/>
							</div>
						</div>
						<h2 className="text-3xl font-bold text-gray-900 mb-3">
							No hotels found
						</h2>
						<p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
							No results match the keyword "{searchQuery}". Try searching with a different keyword.
						</p>
						<button
							className="btn btn-lg gap-2 bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-lg hover:shadow-xl rounded-xl"
							onClick={() => {
								setSearchQuery('');
								setFilteredHotels(hotels);
							}}
						>
							<MapTrifoldIcon size={24} weight="fill" />
							View all hotels
						</button>
					</div>
				) : (
					<div className="space-y-12">
						{/* Results Header */}
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
							<div>
								<h2 className="text-3xl font-bold text-gray-900 mb-2">
									{searchQuery
										? `Results for "${searchQuery}"`
										: 'All hotels'}
								</h2>
								<p className="text-gray-600 flex items-center gap-2">
									<BuildingsIcon size={20} weight="fill" className="text-orange-500" />
									{filteredHotels.length} hotels
								</p>
							</div>
							{searchQuery && (
								<button
									className="btn btn-sm gap-2 border-2 border-orange-300 text-orange-600 hover:bg-orange-500 hover:text-white hover:border-orange-500 rounded-lg"
									onClick={() => {
										setSearchQuery('');
										setFilteredHotels(hotels);
									}}
								>
									Clear search
								</button>
							)}
						</div>

						{/* Group by City */}
						{Object.entries(hotelsByCity).map(([city, cityHotels]) => (
							<div key={city} className="space-y-6">
									<div className="flex items-center gap-3 pb-4 border-b-2 border-orange-200">
										<div className="p-3 bg-orange-100 rounded-xl">
											<MapPinIcon size={28} weight="fill" className="text-orange-500" />
										</div>
										<div>
											<h3 className="text-2xl font-bold text-gray-900">
												{city}
											</h3>
											<p className="text-gray-600">
												{cityHotels.length} hotels available
											</p>
										</div>
									</div>

								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
									{cityHotels.map((hotel) => (
										<div
											key={hotel._id}
											className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-2 border border-orange-100 overflow-hidden"
										>
											<figure className="relative h-56 overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100">
												{hotel.photos && hotel.photos.length > 0 ? (
													<>
														<img
															src={hotel.photos[0]}
															alt={hotel.name}
															className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
														/>
														<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
													</>
												) : (
													<div className="w-full h-full flex items-center justify-center">
														<BuildingsIcon
															size={80}
															weight="duotone"
															className="text-orange-200"
														/>
													</div>
												)}

												{/* Badges on Image */}
												<div className="absolute top-3 left-3 flex flex-wrap gap-2">
													{hotel.featured && (
														<div className="badge bg-orange-500 text-white gap-1 shadow-lg border-0 font-semibold">
															<SparkleIcon size={14} weight="fill" />
															Featured
														</div>
													)}
													{hotel.distance && (
														<div className="badge bg-orange-100 text-orange-700 gap-1 shadow-lg border-0">
															<MapTrifoldIcon size={14} weight="fill" />
															{hotel.distance}
														</div>
													)}
												</div>
											</figure>

											<div className="p-5">
												<h3 className="text-lg font-bold line-clamp-1 text-gray-900 group-hover:text-orange-500 transition-colors mb-3">
													{hotel.name}
												</h3>

												<div className="flex items-start gap-2 mb-3">
													<MapPinIcon
														size={18}
														weight="fill"
														className="text-orange-500 flex-shrink-0 mt-0.5"
													/>
													<p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
														{hotel.address}
													</p>
												</div>

												{hotel.description && (
													<p className="text-sm text-gray-500 line-clamp-2 mb-3 leading-relaxed">
														{hotel.description}
													</p>
												)}

												{/* Rating */}
												{hotel.averageRating > 0 && (
													<div className="flex items-center gap-2 mb-4 p-2 bg-orange-50 rounded-lg w-fit">
														<StarIcon
															size={20}
															weight="fill"
															className="text-orange-500"
														/>
														<span className="font-bold text-lg text-gray-900">
															{hotel.averageRating.toFixed(1)}
														</span>
														<span className="text-sm text-gray-500">
															/ 5.0
														</span>
													</div>
												)}

												{/* Image Gallery */}
												{hotel.photos && hotel.photos.length > 1 && (
													<div className="grid grid-cols-3 gap-2 mb-4">
														{hotel.photos.slice(1, 4).map((photo, idx) => (
															<div
																key={idx}
																className="aspect-video rounded-lg overflow-hidden bg-orange-50 border border-orange-100 group/img"
															>
																<img
																	src={photo}
																	alt={`${hotel.name} ${idx + 2}`}
																	className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500"
																/>
															</div>
														))}
													</div>
												)}

												<div className="flex justify-end items-center mt-auto pt-4 border-t border-orange-100">
		
													<Link
														to={`/hotels/${hotel._id}/book`}
														className="btn btn-sm bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-md hover:shadow-lg rounded-lg"
													>
														View Details
													</Link>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				)}
			</section>
		</div>
	);
};

export default Location;
