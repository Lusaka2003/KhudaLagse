import { useEffect, useState } from 'react';
import axiosInstance from '../../api/axios';

// Icons
const XIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const WalletIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const UserIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const RestaurantIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const DeliveryIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const LocationIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const statusFilters = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'cooking', label: 'Cooking' },
    { value: 'ready', label: 'Ready' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/admin/orders?limit=50');
      setOrders(res.data.data.items || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to load orders'
      );
    } finally {
      setLoading(false);
    }
  };

  const openOrderDetails = (order, e) => {
    if (e) e.stopPropagation();
    setViewingOrder(order);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setViewingOrder(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cooking':
        return 'bg-orange-100 text-orange-800';
      case 'ready':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = searchQuery || statusFilter !== 'all' 
    ? orders.filter(o => {
        const matchesSearch = searchQuery.trim() === '' || 
          o._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.restaurantId?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
        
        return matchesSearch && matchesStatus;
      })
    : orders;

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-6 text-center">
        <div className="text-gray-600">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
          {error}
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by order ID, customer, or restaurant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="text-sm font-medium text-gray-600">Filter by:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    statusFilter === filter.value
                      ? filter.value === 'pending' ? 'bg-yellow-600 text-white' :
                        filter.value === 'cooking' ? 'bg-orange-600 text-white' :
                        filter.value === 'ready' ? 'bg-blue-600 text-white' :
                        filter.value === 'completed' ? 'bg-green-600 text-white' :
                        filter.value === 'cancelled' ? 'bg-red-600 text-white' :
                        'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {(searchQuery || statusFilter !== 'all') && (
          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Found {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
              {statusFilter !== 'all' && ` (${statusFilter})`}
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
      
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Order ID</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Restaurant</th>
                <th className="px-4 py-3 font-semibold">Items</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => (
                <tr 
                  key={o._id} 
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  onClick={() => openOrderDetails(o)}
                >
                  <td className="px-4 py-3 font-mono text-xs text-gray-900">
                    {o._id.substring(0, 8)}...
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {o.userId?.name || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {o.restaurantId?.name || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-xs">
                    {o.items?.map((item, idx) => (
                      <div key={idx}>
                        {item.quantity}x {item.itemId?.name || 'Unknown Item'}
                        {item.mealType && (
                          <span className="ml-2 text-gray-500">({item.mealType})</span>
                        )}
                      </div>
                    ))}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    ৳{o.total?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(o.status)}`}>
                      {o.status?.charAt(0).toUpperCase() + o.status?.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-600" colSpan={6}>
                    {searchQuery || statusFilter !== 'all'
                      ? 'No orders found matching your filters.'
                      : 'No orders found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {isModalOpen && viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Order Details</h2>
                <p className="text-sm text-gray-600">
                  Order #{viewingOrder._id.substring(0, 8)}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <XIcon />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="space-y-6">
                {/* Order Summary */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Order Summary</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Order ID</label>
                      <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                        <code className="text-sm text-gray-600 break-all">{viewingOrder._id}</code>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Order Status</label>
                      <div className="mt-1">
                        <span className={`inline-block rounded-full px-4 py-2 text-sm font-semibold ${getStatusColor(viewingOrder.status)}`}>
                          {viewingOrder.status?.charAt(0).toUpperCase() + viewingOrder.status?.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-2">
                        <CalendarIcon />
                        Created At
                      </label>
                      <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                        {formatDate(viewingOrder.createdAt)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-2">
                        <CalendarIcon />
                        Delivery Date & Time
                      </label>
                      <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                        {viewingOrder.deliveryDateTime ? formatDate(viewingOrder.deliveryDateTime) : 'Not scheduled'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Payment Status</label>
                      <div className="mt-1">
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                          viewingOrder.paymentStatus === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {viewingOrder.paymentStatus?.charAt(0).toUpperCase() + viewingOrder.paymentStatus?.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Order Type</label>
                      <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                        {viewingOrder.isSubscription ? 'Subscription Order' : 'Regular Order'}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-2">
                        <WalletIcon />
                        Total Amount
                      </label>
                      <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 font-semibold text-lg">
                        ৳{viewingOrder.total?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <UserIcon />
                    Customer Information
                  </h3>
                  <div className="rounded-lg border border-gray-200">
                    <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Name</label>
                        <div className="mt-1 font-medium">
                          {viewingOrder.userId?.name || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Email</label>
                        <div className="mt-1">
                          {viewingOrder.userId?.email || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Phone</label>
                        <div className="mt-1">
                          {viewingOrder.userId?.phone || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Customer ID</label>
                        <div className="mt-1">
                          <code className="text-xs text-gray-600 break-all">
                            {viewingOrder.userId?._id || 'N/A'}
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Restaurant Information */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <RestaurantIcon />
                    Restaurant Information
                  </h3>
                  <div className="rounded-lg border border-gray-200">
                    <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Name</label>
                        <div className="mt-1 font-medium">
                          {viewingOrder.restaurantId?.name || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Email</label>
                        <div className="mt-1">
                          {viewingOrder.restaurantId?.email || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Phone</label>
                        <div className="mt-1">
                          {viewingOrder.restaurantId?.phone || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Restaurant ID</label>
                        <div className="mt-1">
                          <code className="text-xs text-gray-600 break-all">
                            {viewingOrder.restaurantId?._id || 'N/A'}
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery Address */}
                {viewingOrder.deliveryAddress && (
                  <div>
                    <h3 className="mb-4 text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <LocationIcon />
                      Delivery Address
                    </h3>
                    <div className="rounded-lg border border-gray-200">
                      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-600">Full Address</label>
                          <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                            {viewingOrder.deliveryAddress.fullAddress}
                          </div>
                        </div>
                        {viewingOrder.deliveryAddress.house && (
                          <div>
                            <label className="block text-sm font-medium text-gray-600">House</label>
                            <div className="mt-1">
                              {viewingOrder.deliveryAddress.house}
                            </div>
                          </div>
                        )}
                        {viewingOrder.deliveryAddress.road && (
                          <div>
                            <label className="block text-sm font-medium text-gray-600">Road</label>
                            <div className="mt-1">
                              {viewingOrder.deliveryAddress.road}
                            </div>
                          </div>
                        )}
                        {viewingOrder.deliveryAddress.area && (
                          <div>
                            <label className="block text-sm font-medium text-gray-600">Area</label>
                            <div className="mt-1">
                              {viewingOrder.deliveryAddress.area}
                            </div>
                          </div>
                        )}
                        {viewingOrder.deliveryAddress.city && (
                          <div>
                            <label className="block text-sm font-medium text-gray-600">City</label>
                            <div className="mt-1">
                              {viewingOrder.deliveryAddress.city}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Items */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Order Items</h3>
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Item</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Quantity</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Meal Type</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Day</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Price</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {viewingOrder.items?.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">
                                {item.itemId?.name || 'Unknown Item'}
                              </div>
                              {item.itemId?.description && (
                                <div className="mt-1 text-sm text-gray-600">
                                  {item.itemId.description}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-700">{item.quantity}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                                item.mealType === 'lunch' ? 'bg-yellow-100 text-yellow-800' :
                                item.mealType === 'dinner' ? 'bg-indigo-100 text-indigo-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {item.mealType?.charAt(0).toUpperCase() + item.mealType?.slice(1) || 'N/A'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {item.day || '—'}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              ৳{item.price?.toFixed(2) || '0.00'}
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-900">
                              ৳{(item.quantity * (item.price || 0)).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={5} className="px-4 py-3 text-right font-medium text-gray-700">
                            Total:
                          </td>
                          <td className="px-4 py-3 font-semibold text-lg text-gray-900">
                            ৳{viewingOrder.total?.toFixed(2) || '0.00'}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Additional Information</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {viewingOrder.paymentMethod && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Payment Method</label>
                        <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                          {viewingOrder.paymentMethod}
                        </div>
                      </div>
                    )}
                    {viewingOrder.specialInstructions && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-600">Special Instructions</label>
                        <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                          {viewingOrder.specialInstructions}
                        </div>
                      </div>
                    )}
                    {viewingOrder.subscriptionId && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-600">Subscription ID</label>
                        <div className="mt-1">
                          <code className="text-xs text-gray-600 break-all">
                            {viewingOrder.subscriptionId}
                          </code>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 border-t border-gray-200 bg-white px-6 py-4">
              <div className="flex justify-end">
                <button
                  onClick={closeModal}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}