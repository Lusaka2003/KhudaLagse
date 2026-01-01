import { useEffect, useState, useMemo } from 'react';
import axiosInstance from '../../api/axios';

// Add View Icon
const ViewIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const SearchIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const EditIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const SaveIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const TrashIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

const StarIcon = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const FilterIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const LocationIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const HomeIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

export default function Users() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [viewingUser, setViewingUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState('all');

  const roleOptions = useMemo(
    () => ['customer', 'restaurant', 'deliveryStaff'],
    []
  );

  const roleFilters = [
    { value: 'all', label: 'All Roles' },
    { value: 'customer', label: 'Customers' },
    { value: 'restaurant', label: 'Restaurants' },
    { value: 'deliveryStaff', label: 'Delivery Staff' },
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    let filtered = users;

    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query)
      );
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [searchQuery, users, roleFilter]);

  const loadUsers = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/admin/users?limit=50');
      setUsers(res.data.data.items || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to load users'
      );
    } finally {
      setLoading(false);
    }
  };

  const updateUserField = async (id, payload) => {
    setBusyId(id);
    setError('');
    try {
      await axiosInstance.patch(`/api/admin/users/${id}`, payload);
      await loadUsers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to update user'
      );
    } finally {
      setBusyId(null);
    }
  };

  const startEditing = (user, e) => {
    if (e) e.stopPropagation();
    setEditingId(user._id);
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
    });
  };

  const cancelEditing = (e) => {
    if (e) e.stopPropagation();
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (id, e) => {
    if (e) e.stopPropagation();
    if (!editForm.name || !editForm.email) {
      setError('Name and email are required');
      return;
    }

    setBusyId(id);
    setError('');
    try {
      await axiosInstance.patch(`/api/admin/users/${id}`, editForm);
      await loadUsers();
      setEditingId(null);
      setEditForm({});
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to update user'
      );
    } finally {
      setBusyId(null);
    }
  };

  const deleteUser = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    setBusyId(id);
    setError('');
    try {
      await axiosInstance.delete(`/api/admin/users/${id}`);
      await loadUsers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to delete user'
      );
    } finally {
      setBusyId(null);
    }
  };

  const openUserDetails = (user, e) => {
    if (e) e.stopPropagation();
    setViewingUser(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setViewingUser(null);
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

  const formatLocation = (location) => {
    if (!location) return 'Not available';
    
    if (location.type === 'Point' && location.coordinates) {
      const [lng, lat] = location.coordinates;
      return `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
    }
    
    if (typeof location === 'object') {
      return JSON.stringify(location, null, 2);
    }
    
    return location;
  };

  const renderRoleSpecificInfo = (user) => {
    switch (user.role) {
      case 'restaurant':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-600 flex items-center gap-2">
                <LocationIcon />
                Restaurant Location
              </label>
              <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <pre className="whitespace-pre-wrap text-sm">
                  {formatLocation(user.location)}
                </pre>
              </div>
            </div>
            {user.cuisineTypes?.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-600">Cuisine Types</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {user.cuisineTypes.map((cuisine, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-700"
                    >
                      {cuisine}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {user.menu?.length !== undefined && (
              <div>
                <label className="block text-sm font-medium text-gray-600">Menu Items</label>
                <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 font-semibold">
                  {user.menu.length} items
                </div>
              </div>
            )}
          </>
        );
        
      case 'customer':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-600 flex items-center gap-2">
              <HomeIcon />
              Customer Address
            </label>
            <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              {user.address ? (
                typeof user.address === 'string' ? (
                  <span>{user.address}</span>
                ) : (
                  <pre className="whitespace-pre-wrap text-sm">
                    {JSON.stringify(user.address, null, 2)}
                  </pre>
                )
              ) : (
                <span className="text-gray-500">No address provided</span>
              )}
            </div>
            {user.favorites?.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-600">Favorites</label>
                <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 font-semibold">
                  {user.favorites.length} favorite items/restaurants
                </div>
              </div>
            )}
          </div>
        );
        
      case 'deliveryStaff':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-600 flex items-center gap-2">
              <LocationIcon />
              Current Location
            </label>
            <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <pre className="whitespace-pre-wrap text-sm">
                {formatLocation(user.location)}
              </pre>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-6 text-center">
        <div className="text-gray-600">Loading users...</div>
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
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FilterIcon />
              <span className="text-sm font-medium text-gray-600">Filter by:</span>
            </div>
            <div className="flex gap-2">
              {roleFilters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setRoleFilter(filter.value)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    roleFilter === filter.value
                      ? filter.value === 'all'
                        ? 'bg-gray-900 text-white'
                        : filter.value === 'customer'
                        ? 'bg-blue-500 text-white'
                        : filter.value === 'restaurant'
                        ? 'bg-purple-500 text-white'
                        : 'bg-pink-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {searchQuery || roleFilter !== 'all' ? (
          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
              {roleFilter !== 'all' && ` (${roleFilter}s)`}
            </div>
            {(searchQuery || roleFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('all');
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : null}
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr 
                  key={u._id} 
                  className={`border-b border-gray-100 ${editingId === u._id ? '' : 'hover:bg-gray-50 cursor-pointer'}`}
                  onClick={editingId === u._id ? undefined : () => openUserDetails(u)}
                >
                  {editingId === u._id ? (
                    <>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm({ ...editForm, name: e.target.value })
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="w-full rounded border border-gray-300 px-2 py-1 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) =>
                            setEditForm({ ...editForm, email: e.target.value })
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="w-full rounded border border-gray-300 px-2 py-1 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editForm.phone}
                          onChange={(e) =>
                            setEditForm({ ...editForm, phone: e.target.value })
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="w-full rounded border border-gray-300 px-2 py-1 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={editForm.role}
                          onChange={(e) =>
                            setEditForm({ ...editForm, role: e.target.value })
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="w-full rounded border border-gray-300 px-2 py-1 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {roleOptions.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            disabled={busyId === u._id}
                            onClick={(e) => saveEdit(u._id, e)}
                            className="rounded-lg bg-green-500 p-2 text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Save changes"
                          >
                            <SaveIcon />
                          </button>
                          <button
                            disabled={busyId === u._id}
                            onClick={(e) => cancelEditing(e)}
                            className="rounded-lg bg-gray-500 p-2 text-white transition-colors hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Cancel"
                          >
                            <XIcon />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {u.name}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{u.email}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {u.phone || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          u.role === 'customer' ? 'bg-blue-100 text-blue-700' :
                          u.role === 'restaurant' ? 'bg-purple-100 text-purple-700' :
                          'bg-pink-100 text-pink-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            disabled={busyId === u._id}
                            onClick={(e) => openUserDetails(u, e)}
                            className="rounded-lg bg-gray-500 p-2 text-white transition-colors hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                            title="View details"
                          >
                            <ViewIcon />
                          </button>
                          <button
                            disabled={busyId === u._id}
                            onClick={(e) => startEditing(u, e)}
                            className="rounded-lg bg-blue-500 p-2 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Edit user"
                          >
                            <EditIcon />
                          </button>
                          <button
                            disabled={busyId === u._id}
                            onClick={(e) => deleteUser(u._id, e)}
                            className="rounded-lg bg-red-500 p-2 text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Delete user"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-gray-600"
                    colSpan={5}
                  >
                    {searchQuery || roleFilter !== 'all'
                      ? 'No users found matching your filters.'
                      : 'No users found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {isModalOpen && viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">User Details</h2>
                <p className="text-sm text-gray-600">
                  Complete information for {viewingUser.name}
                  <span className={`ml-2 rounded-full px-2 py-1 text-xs font-semibold ${
                    viewingUser.role === 'customer' ? 'bg-blue-100 text-blue-700' :
                    viewingUser.role === 'restaurant' ? 'bg-purple-100 text-purple-700' :
                    'bg-pink-100 text-pink-700'
                  }`}>
                    {viewingUser.role}
                  </span>
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
                {/* Basic Information */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Basic Information</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Full Name</label>
                      <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                        {viewingUser.name}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Email Address</label>
                      <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                        {viewingUser.email}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Phone Number</label>
                      <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                        {viewingUser.phone || 'Not provided'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">User Role</label>
                      <div className="mt-1">
                        <span className={`inline-block rounded-full px-4 py-2 text-sm font-semibold ${
                          viewingUser.role === 'customer' ? 'bg-blue-100 text-blue-700' :
                          viewingUser.role === 'restaurant' ? 'bg-purple-100 text-purple-700' :
                          'bg-pink-100 text-pink-700'
                        }`}>
                          {viewingUser.role}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Role-Specific Information */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">
                    {viewingUser.role === 'restaurant' && 'Restaurant Information'}
                    {viewingUser.role === 'customer' && 'Customer Information'}
                    {viewingUser.role === 'deliveryStaff' && 'Delivery Staff Information'}
                  </h3>
                  <div className="space-y-4">
                    {renderRoleSpecificInfo(viewingUser)}
                  </div>
                </div>

                {/* Account Status */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Account Status</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Account Status</label>
                      <div className="mt-1">
                        <span className={`inline-block rounded-full px-4 py-2 text-sm font-semibold ${
                          viewingUser.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {viewingUser.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Account Created</label>
                      <div className="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                        <CalendarIcon />
                        <span>{formatDate(viewingUser.createdAt)}</span>
                      </div>
                    </div>
                    {viewingUser.isAvailable !== undefined && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Availability</label>
                        <div className="mt-1">
                          <span className={`inline-block rounded-full px-4 py-2 text-sm font-semibold ${
                            viewingUser.isAvailable
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {viewingUser.isAvailable ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                      </div>
                    )}
                    {viewingUser.isOpen !== undefined && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Restaurant Status</label>
                        <div className="mt-1">
                          <span className={`inline-block rounded-full px-4 py-2 text-sm font-semibold ${
                            viewingUser.isOpen
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {viewingUser.isOpen ? 'Open' : 'Closed'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ratings & Statistics */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Statistics</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {viewingUser.rating !== undefined && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Rating</label>
                        <div className="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                          <StarIcon />
                          <span className="font-semibold">{viewingUser.rating}</span>
                          <span className="text-sm text-gray-600">
                            ({viewingUser.totalRatings || 0} ratings)
                          </span>
                        </div>
                      </div>
                    )}
                    {viewingUser.totalDeliveries !== undefined && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Total Deliveries</label>
                        <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 font-semibold">
                          {viewingUser.totalDeliveries}
                        </div>
                      </div>
                    )}
                    {viewingUser.walletBalance !== undefined && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Wallet Balance</label>
                        <div className="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                          <WalletIcon />
                          <span className="font-semibold">${viewingUser.walletBalance.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                    {viewingUser.imageUrl && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-600">Profile Image</label>
                        <div className="mt-1">
                          <img
                            src={viewingUser.imageUrl}
                            alt={viewingUser.name}
                            className="h-32 w-32 rounded-lg object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* User ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-600">User ID</label>
                  <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                    <code className="text-sm text-gray-600 break-all">{viewingUser._id}</code>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 border-t border-gray-200 bg-white px-6 py-4">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    startEditing(viewingUser);
                    closeModal();
                  }}
                  disabled={busyId === viewingUser._id}
                  className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Edit User
                </button>
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