import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';

const FALLBACK_IMAGE = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800';
const MEALS = ['lunch', 'dinner'];

// Helper: Get all dates for the next 30 days
// Helper: Get all dates for the next 30 days
function getNext30Days() {
    const days = [];
    const today = new Date();
    const todayMs = today.getTime();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    for (let i = 0; i < 30; i++) {
        const date = new Date(todayMs + (i * dayInMs));
        days.push({
            date: date,
            dateString: date.toISOString().split('T')[0],
            displayDate: date.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
            }),
            dayName: date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
        });
    }
    
    return days;
}

export default function ManageMenu() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [form, setForm] = useState({
        name: '',
        description: '',
        price: '',
        calories: '',
        ingredients: '',
        dates: [],
        mealType: '',
        imageUrl: '',
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [viewMode, setViewMode] = useState('calendar');

    const formRef = useRef(null);
    const nameInputRef = useRef(null);
    const [highlightEdit, setHighlightEdit] = useState(false);

    const next30Days = getNext30Days();

    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/api/menu');
            setItems(res.data.data || []);
        } catch (err) {
            console.error(err);
            setError('Failed to load menu items');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleDateToggle = (dateString) => {
        setForm(prev => ({
            ...prev,
            dates: prev.dates.includes(dateString)
                ? prev.dates.filter(d => d !== dateString)
                : [...prev.dates, dateString]
        }));
    };

    const handleSelectAllDates = () => {
        setForm(prev => ({
            ...prev,
            dates: next30Days.map(d => d.dateString)
        }));
    };

    const handleClearAllDates = () => {
        setForm(prev => ({ ...prev, dates: [] }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.name.trim()) {
            setError('Item name is required');
            return;
        }
        if (!form.price || Number.isNaN(Number(form.price)) || Number(form.price) < 0) {
            setError('Valid price is required');
            return;
        }
        if (!form.dates || form.dates.length === 0) {
            setError('Please select at least one date');
            return;
        }
        if (!form.mealType) {
            setError('Please select a meal type');
            return;
        }
        if (form.calories && (Number.isNaN(Number(form.calories)) || Number(form.calories) < 0)) {
            setError('Calories must be a valid non-negative number');
            return;
        }

        setSaving(true);

        try {
            // Upload image if provided
            let uploadedImageUrl = form.imageUrl;
            if (imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);
                try {
                    const uploadRes = await axiosInstance.post('/api/upload', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    uploadedImageUrl = uploadRes.data.url;
                } catch (uploadErr) {
                    console.error('Image upload failed:', uploadErr);
                    setError('Image upload failed, but continuing with item creation');
                }
            }

            const basePayload = {
                name: form.name.trim(),
                description: form.description.trim(),
                price: Number(form.price),
                calories: form.calories ? Number(form.calories) : undefined,
                ingredients: form.ingredients
                    ? form.ingredients.split(',').map(i => i.trim()).filter(Boolean)
                    : [],
                mealType: form.mealType,
                imageUrl: uploadedImageUrl || undefined,
            };

            if (editingId) {
                // When editing, update the single item
                const item = items.find(i => i._id === editingId);
                await axiosInstance.put(`/api/menu/${editingId}`, {
                    ...basePayload,
                    day: item.day,
                    date: item.date,
                });
                setEditingId(null);
            } else {
                // When creating, add item for each selected date
                // REMOVED the replacement logic - now always creates new items
                for (const dateString of form.dates) {
                    const selectedDay = next30Days.find(d => d.dateString === dateString);
                    
                    const payload = {
                        ...basePayload,
                        day: selectedDay.dayName,
                        date: new Date(dateString).toISOString(),
                    };

                    // Always create a new item (no replacement)
                    await axiosInstance.post('/api/menu', payload);
                }
            }

            setForm({ 
                name: '', 
                description: '', 
                price: '', 
                calories: '', 
                ingredients: '', 
                dates: [], 
                mealType: '', 
                imageUrl: '' 
            });
            setImageFile(null);
            setImagePreview('');
            loadItems();
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (item) => {
        const itemDate = new Date(item.date).toISOString().split('T')[0];
        
        setForm({
            name: item.name || '',
            description: item.description || '',
            price: item.price ?? '',
            calories: item.calories ?? '',
            ingredients: Array.isArray(item.ingredients) ? item.ingredients.join(', ') : (item.ingredients || ''),
            dates: [itemDate],
            mealType: item.mealType || '',
            imageUrl: item.imageUrl || '',
        });
        setEditingId(item._id);
        setImagePreview(item.imageUrl || '');
        setImageFile(null);

        setTimeout(() => {
            if (formRef.current) window.scrollTo({ top: 0, behavior: 'smooth' });
            nameInputRef.current?.focus();
            setHighlightEdit(true);
            setTimeout(() => setHighlightEdit(false), 2500);
        }, 100);
    };

    const handleCancel = () => {
        setForm({ 
            name: '', 
            description: '', 
            price: '', 
            calories: '', 
            ingredients: '', 
            dates: [], 
            mealType: '', 
            imageUrl: '' 
        });
        setEditingId(null);
        setError('');
        setImageFile(null);
        setImagePreview('');
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this menu item?')) return;
        try {
            await axiosInstance.delete(`/api/menu/${id}`);
            loadItems();
        } catch (_err) {
            console.error(_err);
            alert('Failed to delete item');
        }
    };

    const handleClearAdminComment = async (id) => {
        try {
            await axiosInstance.put(`/api/menu/${id}`, { clearAdminComment: true });
            loadItems();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || err.message || 'Failed to clear admin comment');
        }
    };

    // Group items by date for calendar view
    const itemsByDate = items.reduce((acc, item) => {
        const dateKey = new Date(item.date).toISOString().split('T')[0];
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(item);
        return acc;
    }, {});

    return (
        <div className="min-h-screen pt-40 bg-white pb-8">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Manage Monthly Menu</h1>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
                            className="px-4 py-2 bg-violet-100 text-violet-800 rounded-lg hover:bg-violet-200 transition font-semibold"
                        >
                            {viewMode === 'calendar' ? 'List View' : 'Calendar View'}
                        </button>
                        <button
                            onClick={() => navigate('/dashboard/restaurant')}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                        >
                            Back
                        </button>
                    </div>
                </div>

                {/* Add/Edit Form */}
                <div
                    ref={formRef}
                    className={`bg-white rounded-xl shadow-md p-6 mb-6 transition-all ${highlightEdit ? 'ring-4 ring-violet-200 ring-opacity-70' : ''}`}
                >
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        {editingId ? 'Edit Menu Item' : 'Add New Menu Item'}
                    </h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Item Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    ref={nameInputRef}
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-violet-500 focus:outline-none"
                                    placeholder="e.g., Margherita Pizza"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Price <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    value={form.price}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-violet-500 focus:outline-none"
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-violet-500 focus:outline-none resize-none"
                                placeholder="Item description (optional)"
                                rows="2"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Calories (kcal)
                                </label>
                                <input
                                    type="number"
                                    name="calories"
                                    value={form.calories}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-violet-500 focus:outline-none"
                                    placeholder="e.g., 250"
                                    min="0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Meal Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="mealType"
                                    value={form.mealType}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-violet-500 focus:outline-none"
                                    required
                                >
                                    <option value="">Select meal</option>
                                    {MEALS.map(meal => (
                                        <option key={meal} value={meal}>
                                            {meal.charAt(0).toUpperCase() + meal.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Item Image
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-violet-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        {imagePreview && (
                            <div className="mt-2">
                                <img 
                                    src={imagePreview} 
                                    alt="Preview" 
                                    className="w-32 h-24 object-cover rounded-lg border-2 border-gray-200"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Ingredients (comma separated)
                            </label>
                            <input
                                type="text"
                                name="ingredients"
                                value={form.ingredients}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-violet-500 focus:outline-none"
                                placeholder="sugar, tea, milk"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Select Dates (Next 30 Days) <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handleSelectAllDates}
                                        disabled={editingId}
                                        className="text-xs px-3 py-1 rounded border border-violet-200 text-violet-700 hover:bg-violet-50 disabled:opacity-50"
                                    >
                                        Select All
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleClearAllDates}
                                        disabled={editingId}
                                        className="text-xs px-3 py-1 rounded border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Clear All
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 max-h-64 overflow-y-auto p-2 bg-gray-50 rounded-lg">
                                {next30Days.map(day => {
                                    const isSelected = form.dates.includes(day.dateString);
                                    const hasItems = itemsByDate[day.dateString];
                                    
                                    return (
                                        <label
                                            key={day.dateString}
                                            className={`flex flex-col items-center p-2 rounded-lg border-2 cursor-pointer transition text-center ${
                                                isSelected
                                                    ? 'border-violet-500 bg-violet-50'
                                                    : hasItems
                                                    ? 'border-blue-200 bg-blue-50'
                                                    : 'border-gray-200 hover:border-violet-300'
                                            } ${editingId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleDateToggle(day.dateString)}
                                                className="sr-only"
                                                disabled={editingId}
                                            />
                                            <span className="text-xs font-medium text-gray-600">
                                                {day.displayDate.split(',')[0]}
                                            </span>
                                            <span className="text-sm font-bold mt-1">
                                                {day.date.getDate()}
                                            </span>
                                            {hasItems && (
                                                <span className="text-[10px] text-blue-600 mt-1">
                                                    {hasItems.length} item{hasItems.length > 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </label>
                                    );
                                })}
                            </div>
                            {editingId && (
                                <p className="text-xs text-gray-500 mt-2">
                                    Date cannot be changed when editing. Delete and recreate to change date.
                                </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                                Selected: {form.dates.length} date{form.dates.length !== 1 ? 's' : ''}
                            </p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 px-4 py-2 rounded-lg bg-violet-600 text-white font-semibold transition hover:-translate-y-0.5 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? 'Saving...' : editingId ? 'Update Item' : 'Add Item'}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-800 font-semibold transition hover:border-violet-200 hover:bg-violet-50"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Menu Items Display */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        Menu Items ({items.length})
                    </h2>

                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-violet-600 border-t-transparent mx-auto"></div>
                            <p className="text-gray-600 mt-4">Loading menu items...</p>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No menu items yet. Add your first item above!
                        </div>
                    ) : viewMode === 'list' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {items.map((item) => (
                                <div key={item._id} className="border-2 border-gray-100 rounded-lg p-4 hover:shadow-md transition flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1 flex gap-4">
                                            <img
                                                src={item.imageUrl || FALLBACK_IMAGE}
                                                alt={item.name || 'Menu item'}
                                                onError={(e) => {
                                                    e.currentTarget.onerror = null;
                                                    e.currentTarget.src = FALLBACK_IMAGE;
                                                }}
                                                className="w-24 h-20 object-cover rounded-lg flex-shrink-0"
                                            />
                                            <div>
                                                <div className="font-semibold">{item.name}</div>
                                                <div className="text-sm text-gray-600">{item.description}</div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {new Date(item.date).toLocaleDateString('en-US', { 
                                                        weekday: 'short', 
                                                        month: 'short', 
                                                        day: 'numeric' 
                                                    })}
                                                    {item.mealType && ` | ${item.mealType.charAt(0).toUpperCase() + item.mealType.slice(1)}`}
                                                </div>
                                                {item.calories !== undefined && item.calories !== null && (
                                                    <div className="text-xs text-gray-500 mt-1">Calories: {item.calories} kcal</div>
                                                )}
                                                {item.adminComment && (
                                                    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                                                        <div className="font-semibold">Admin comment</div>
                                                        <div className="mt-1 whitespace-pre-wrap">{item.adminComment}</div>
                                                        <div className="mt-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleClearAdminComment(item._id)}
                                                                className="rounded-md border border-amber-300 bg-white px-2 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-100 transition"
                                                            >
                                                                Mark done
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-lg font-semibold text-violet-700 ml-2 whitespace-nowrap">
                                            {typeof item.price === 'number' ? `${item.price} BDT` : item.price}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-4">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="flex-1 px-3 py-2 rounded border border-violet-200 text-sm font-semibold text-violet-800 hover:bg-violet-50 transition"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item._id)}
                                            className="flex-1 px-3 py-2 rounded border border-gray-200 text-sm font-semibold text-gray-800 hover:bg-gray-100 transition"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // Calendar View
                        <div className="space-y-6">
                            {next30Days.map(day => {
                                const dayItems = itemsByDate[day.dateString] || [];
                                
                                return (
                                    <div key={day.dateString} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-semibold text-gray-900">
                                                {day.displayDate} - {day.dayName.charAt(0).toUpperCase() + day.dayName.slice(1)}
                                            </h3>
                                            <span className="text-sm text-gray-500">
                                                {dayItems.length} item{dayItems.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        
                                        {dayItems.length === 0 ? (
                                            <p className="text-sm text-gray-400 italic">No items scheduled</p>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {dayItems.map(item => (
                                                    <div key={item._id} className="flex gap-3 border border-gray-100 rounded-lg p-3 hover:shadow-sm transition">
                                                        <img
                                                            src={item.imageUrl || FALLBACK_IMAGE}
                                                            alt={item.name}
                                                            onError={(e) => {
                                                                e.currentTarget.onerror = null;
                                                                e.currentTarget.src = FALLBACK_IMAGE;
                                                            }}
                                                            className="w-16 h-16 object-cover rounded flex-shrink-0"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium text-sm truncate">{item.name}</div>
                                                            <div className="text-xs text-gray-500">
                                                                {item.mealType?.charAt(0).toUpperCase() + item.mealType?.slice(1)}
                                                            </div>
                                                            <div className="text-sm font-semibold text-violet-700 mt-1">
                                                                {item.price} BDT
                                                            </div>
                                                            {item.adminComment && (
                                                                <div className="mt-1 text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded">
                                                                    Admin comment
                                                                </div>
                                                            )}
                                                            <div className="flex gap-2 mt-2">
                                                                <button
                                                                    onClick={() => handleEdit(item)}
                                                                    className="text-xs px-2 py-1 rounded border border-violet-200 text-violet-700 hover:bg-violet-50"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(item._id)}
                                                                    className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-700 hover:bg-gray-50"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}