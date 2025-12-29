import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';

const FALLBACK_IMAGE = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800';
const DAYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
const MEALS = ['lunch','dinner'];

// Helper: Get next occurrence of a given weekday
function getNextDateForDay(dayName) {
    const dayIndex = DAYS.indexOf(dayName.toLowerCase());
    if (dayIndex === -1) return new Date();

    const today = new Date();
    const todayIndex = today.getDay(); // 0=Sunday, 1=Monday, ...

    let diff = dayIndex - todayIndex;
    if (diff <= 0) diff += 7; // next occurrence
    const nextDate = new Date();
    nextDate.setDate(today.getDate() + diff);
    return nextDate;
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
        day: '',
        mealType: '',
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState(null);

    const formRef = useRef(null);
    const nameInputRef = useRef(null);
    const [highlightEdit, setHighlightEdit] = useState(false);

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
        if (!form.day) {
            setError('Please select a day');
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
            const payload = {
                name: form.name.trim(),
                description: form.description.trim(),
                price: Number(form.price),
                calories: form.calories ? Number(form.calories) : undefined,
                ingredients: form.ingredients
                    ? form.ingredients.split(',').map(i => i.trim()).filter(Boolean)
                    : [],
                day: form.day,
                mealType: form.mealType,
                date: getNextDateForDay(form.day).toISOString(),
            };

            if (editingId) {
                await axiosInstance.put(`/api/menu/${editingId}`, payload);
                setEditingId(null);
            } else {
                // Replace old menu for same day + meal type
                const existingItem = items.find(i => i.day === form.day && i.mealType === form.mealType);
                if (existingItem) {
                    await axiosInstance.put(`/api/menu/${existingItem._id}`, payload);
                } else {
                    await axiosInstance.post('/api/menu', payload);
                }
            }

            setForm({ name: '', description: '', price: '', calories: '', ingredients: '', day: '', mealType: '' });
            loadItems();
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (item) => {
        setForm({
            name: item.name || '',
            description: item.description || '',
            price: item.price ?? '',
            calories: item.calories ?? '',
            ingredients: Array.isArray(item.ingredients) ? item.ingredients.join(', ') : (item.ingredients || ''),
            day: item.day || '',
            mealType: item.mealType || '',
        });
        setEditingId(item._id);

        setTimeout(() => {
            if (formRef.current) window.scrollTo({ top: 0, behavior: 'smooth' });
            nameInputRef.current?.focus();
            setHighlightEdit(true);
            setTimeout(() => setHighlightEdit(false), 2500);
        }, 100);
    };

    const handleCancel = () => {
        setForm({ name: '', description: '', price: '', calories: '', ingredients: '', day: '', mealType: '' });
        setEditingId(null);
        setError('');
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

    return (
        <div className="min-h-screen pt-40 bg-white pb-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Manage Menu</h1>
                    <button
                        onClick={() => navigate('/dashboard/restaurant')}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                    >
                        Back
                    </button>
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
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-violet-500 focus:outline-none resize-none"
                                placeholder="Item description (optional)"
                                rows="3"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Day <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="day"
                                    value={form.day}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-violet-500 focus:outline-none"
                                    required
                                >
                                    <option value="">Select a day</option>
                                    {DAYS.map(day => (
                                        <option key={day} value={day}>
                                            {day.charAt(0).toUpperCase() + day.slice(1)}
                                        </option>
                                    ))}
                                </select>
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

                {/* Menu Items List */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Menu Items</h2>

                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-violet-600 border-t-transparent mx-auto"></div>
                            <p className="text-gray-600 mt-4">Loading menu items...</p>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No menu items yet. Add your first item above!
                        </div>
                    ) : (
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
                                                    {item.day?.charAt(0).toUpperCase() + item.day?.slice(1)}
                                                    {item.date && ` - ${new Date(item.date).toLocaleDateString()}`}
                                                    {item.mealType && ` | ${item.mealType.charAt(0).toUpperCase() + item.mealType.slice(1)}`}
                                                </div>
                                                {item.calories !== undefined && item.calories !== null && (
                                                    <div className="text-xs text-gray-500 mt-1">Calories: {item.calories} kcal</div>
                                                )}
                                                {item.ingredients && item.ingredients.length > 0 && (
                                                    <div className="text-xs text-gray-500 mt-1">Ingredients: {Array.isArray(item.ingredients) ? item.ingredients.join(', ') : item.ingredients}</div>
                                                )}
                                                {item.adminComment ? (
                                                    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                                                        <div className="font-semibold">Admin comment</div>
                                                        <div className="mt-1 whitespace-pre-wrap">{item.adminComment}</div>
                                                        {item.adminCommentedAt ? (
                                                            <div className="mt-1 text-[11px] text-amber-800">
                                                                {new Date(item.adminCommentedAt).toLocaleString()}
                                                            </div>
                                                        ) : null}
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
                                                ) : null}
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
                    )}
                </div>
            </div>
        </div>
    );
}
