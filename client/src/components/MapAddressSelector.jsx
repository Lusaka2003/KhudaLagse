import { useState, useCallback, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
	iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
	iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
	shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const MapAddressSelector = ({ onAddressSelect, initialAddress }) => {
	const defaultLocation = [23.8103, 90.4125]; // Dhaka, Bangladesh center
	const [position, setPosition] = useState(
		initialAddress?.coordinates || defaultLocation
	);
	const [addressInput, setAddressInput] = useState(
		initialAddress?.fullAddress || ''
	);
	const [searchInput, setSearchInput] = useState('');
	const [suggestions, setSuggestions] = useState([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const [searchLoading, setSearchLoading] = useState(false);
	const suggestionsRef = useRef(null);

	// Search addresses by typing
	const searchAddress = useCallback(async (query) => {
		if (!query.trim()) {
			setSuggestions([]);
			return;
		}

		setSearchLoading(true);
		try {
			const response = await fetch(
				`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
					query
				)}&limit=8`
			);
			const data = await response.json();
			setSuggestions(data);
			setShowSuggestions(true);
		} catch (error) {
			console.error('Search error:', error);
			setSuggestions([]);
		} finally {
			setSearchLoading(false);
		}
	}, []);

	// Debounce search
	useEffect(() => {
		const timer = setTimeout(() => {
			if (searchInput.trim()) {
				searchAddress(searchInput);
			}
		}, 300);

		return () => clearTimeout(timer);
	}, [searchInput, searchAddress]);

	const selectSuggestion = (suggestion) => {
		const lat = parseFloat(suggestion.lat);
		const lng = parseFloat(suggestion.lon);
		setPosition([lat, lng]);
		setAddressInput(suggestion.display_name);
		setSearchInput('');
		setSuggestions([]);
		setShowSuggestions(false);
	};

	const MapClickHandler = () => {
		useMapEvents({
			click(e) {
				const { lat, lng } = e.latlng;
				setPosition([lat, lng]);
				reverseGeocode(lat, lng);
			},
		});
		return null;
	};

	const reverseGeocode = async (lat, lng) => {
		try {
			// Using OpenStreetMap's Nominatim for reverse geocoding (free, no API key needed)
			const response = await fetch(
				`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
			);
			const data = await response.json();
			setAddressInput(data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
		} catch (error) {
			console.error('Geocoding error:', error);
			setAddressInput(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
		}
	};

	const handleAddressSubmit = (e) => {
		e.preventDefault();
		if (addressInput.trim()) {
			onAddressSelect({
				fullAddress: addressInput,
				coordinates: position,
				house: '',
				road: '',
				area: '',
				city: 'Dhaka',
			});
			setIsOpen(false);
		}
	};

	const handleQuickLocation = () => {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const { latitude, longitude } = position.coords;
					setPosition([latitude, longitude]);
					reverseGeocode(latitude, longitude);
				},
				(error) => {
					console.error('Geolocation error:', error);
					alert('Unable to get your current location. Please select manually on the map.');
				}
			);
		} else {
			alert('Geolocation is not supported by your browser.');
		}
	};

	return (
		<div className="w-full">
			{/* Address Display / Toggle Button */}
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-3 text-left hover:border-purple-500 transition flex justify-between items-center"
			>
				<div className="flex-1">
					<p className="text-sm text-gray-600">Delivery Address</p>
					<p className="font-medium text-gray-900">
						{addressInput || 'Click to select address on map'}
					</p>
				</div>
				<svg
					className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M19 14l-7 7m0 0l-7-7m7 7V3"
					/>
				</svg>
			</button>

			{/* Map Modal */}
			{isOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
						<div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-100">
							<h2 className="text-2xl font-bold text-gray-900">Select Delivery Address</h2>
							<button
								type="button"
								onClick={() => setIsOpen(false)}
								className="text-gray-500 hover:text-gray-700 text-2xl"
							>
								×
							</button>
						</div>

						<div className="p-4 space-y-4">
							{/* Search Address Input */}
							<div className="relative">
								<div className="flex gap-2">
									<div className="flex-1 relative">
										<input
											type="text"
											value={searchInput}
											onChange={(e) => setSearchInput(e.target.value)}
											onFocus={() => searchInput && setShowSuggestions(true)}
											placeholder="Search for an address..."
											className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
										/>
										{searchLoading && (
											<div className="absolute right-3 top-2.5">
												<svg className="animate-spin h-5 w-5 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
													<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
													<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
												</svg>
											</div>
										)}
									</div>
									<button
										type="button"
										onClick={() => {
											setSearchInput('');
											setSuggestions([]);
											setShowSuggestions(false);
										}}
										className="bg-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-400 transition"
										title="Clear search"
									>
										✕
									</button>
								</div>

								{/* Autocomplete Suggestions Dropdown */}
								{showSuggestions && suggestions.length > 0 && (
									<div
										ref={suggestionsRef}
										className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto z-50 shadow-lg"
									>
										{suggestions.map((suggestion, index) => (
											<button
												key={index}
												type="button"
												onClick={() => selectSuggestion(suggestion)}
												className="w-full text-left px-4 py-3 hover:bg-purple-50 border-b last:border-b-0 transition"
											>
												<p className="font-medium text-gray-900 text-sm">
													{suggestion.display_name.split(',').slice(0, 2).join(',')}
												</p>
												<p className="text-xs text-gray-500 mt-0.5">
													{suggestion.display_name.split(',').slice(2).join(',')}
												</p>
											</button>
										))}
									</div>
								)}

								{showSuggestions && searchInput && !searchLoading && suggestions.length === 0 && (
									<div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg mt-1 p-3 z-50 text-gray-500 text-sm">
										No results found for "{searchInput}"
									</div>
								)}
							</div>

							{/* Quick Location Button */}
							<button
								type="button"
								onClick={handleQuickLocation}
								className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition font-semibold flex items-center justify-center gap-2"
							>
								<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
									<path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.3A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z" />
								</svg>
								Use Current Location
							</button>

							{/* Map Container */}
							<div className="relative z-0">
								<MapContainer
									center={position}
									zoom={14}
									style={{ height: '400px', borderRadius: '8px', zIndex: 0 }}
									className="border-2 border-gray-300"
								>
									<TileLayer
										url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
										attribution='&copy; OpenStreetMap contributors'
									/>
									<Marker position={position}>
										<Popup>
											<div className="text-sm">
												<p className="font-semibold">Selected Location</p>
												<p>{position[0].toFixed(4)}, {position[1].toFixed(4)}</p>
											</div>
										</Popup>
									</Marker>
									<MapClickHandler />
								</MapContainer>
								<p className="text-xs text-gray-500 mt-2 text-center">
									Click on the map to select a location
								</p>
							</div>

							{/* Address Input */}
							<form onSubmit={handleAddressSubmit} className="space-y-3">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Address
									</label>
									<textarea
										value={addressInput}
										onChange={(e) => setAddressInput(e.target.value)}
										placeholder="Enter or edit your delivery address"
										className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
										rows="3"
									/>
									<p className="text-xs text-gray-500 mt-1">
										Coordinates: {position[0].toFixed(4)}, {position[1].toFixed(4)}
									</p>
								</div>

								<div className="flex gap-2">
									<button
										type="button"
										onClick={() => setIsOpen(false)}
										className="flex-1 bg-gray-300 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-400 transition font-semibold"
									>
										Cancel
									</button>
									<button
										type="submit"
										className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition font-semibold disabled:opacity-50"
										disabled={!addressInput.trim()}
									>
										Confirm Address
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default MapAddressSelector;
