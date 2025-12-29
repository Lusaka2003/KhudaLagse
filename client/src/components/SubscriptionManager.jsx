import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function SubscriptionManager({ restaurantId: propRestaurantId }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const restaurantId = propRestaurantId || id;
  
  const [menuItems, setMenuItems] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMeals, setSelectedMeals] = useState({});
  const [isRepeating, setIsRepeating] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [subscriptionToPause, setSubscriptionToPause] = useState(null);

  useEffect(() => {
    fetchSubscriptions();
    if (restaurantId) {
      fetchMenuItems();
    }
  }, [restaurantId]);

  const fetchMenuItems = async () => {
    try {
      const { data } = await axiosInstance.get(`/api/menu/restaurant/${restaurantId}`);
      setMenuItems(data.data || []);
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get('/api/subscriptions');
      const visibleSubs = restaurantId 
        ? (data.data || []).filter(sub => sub.restaurantId._id === restaurantId)
        : (data.data || []);
        
      setSubscriptions(visibleSubs);
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysToInclude = () => {
    const today = new Date().getDay();
    const startDay = today === 0 ? 1 : (today + 1) % 7;
    const daysToInclude = [];
    const daysUntilSaturday = (6 - startDay + 7) % 7 + 1;
    
    for (let i = 0; i < daysUntilSaturday; i++) {
      const dayIndex = (startDay + i) % 7;
      daysToInclude.push(DAYS[dayIndex]);
    }
    
    return daysToInclude;
  };

  const handlePackageRestOfWeek = (mealType) => {
    const packageMeals = {};
    const daysToInclude = getDaysToInclude();
    
    daysToInclude.forEach(day => {
      const key = `${day}_${mealType}`;
      const items = menuItems.filter(item => item.day === day && item.mealType === mealType);
      if (items.length > 0) {
        packageMeals[key] = {
          menuItemId: items[0]._id,
          quantity: 1,
        };
      }
    });
    
    setSelectedMeals(packageMeals);
    setShowCreateModal(true);
  };

  const handleMealSelect = (day, mealType, menuItemId, quantity = 1) => {
    const key = `${day}_${mealType}`;
    setSelectedMeals(prev => ({
      ...prev,
      [key]: { menuItemId, quantity },
    }));
  };

  const handleQuantityChange = (day, mealType, quantity) => {
    const key = `${day}_${mealType}`;
    if (quantity < 1) {
      const newSelected = { ...selectedMeals };
      delete newSelected[key];
      setSelectedMeals(newSelected);
    } else {
      setSelectedMeals(prev => ({
        ...prev,
        [key]: { ...prev[key], quantity },
      }));
    }
  };

  const handleCreateSubscription = async () => {
    const mealSelections = Object.entries(selectedMeals).map(([key, value]) => {
      const [day, mealType] = key.split('_');
      return {
        day,
        mealType,
        menuItemId: value.menuItemId,
        quantity: value.quantity || 1,
      };
    });

    if (mealSelections.length === 0) {
      alert('Please select at least one meal');
      return;
    }

    try {
      setCreating(true);
      await axiosInstance.post('/api/subscriptions', {
        restaurantId,
        mealSelections,
        planType: 'weekly',
        isRepeating,
      });
      
      alert('Subscription created successfully!');
      setShowCreateModal(false);
      setSelectedMeals({});
      fetchSubscriptions();
    } catch (error) {
      console.error('Failed to create subscription:', error);
      alert(error.response?.data?.message || 'Failed to create subscription');
    } finally {
      setCreating(false);
    }
  };

  const handlePauseClick = (subscription) => {
    setSubscriptionToPause(subscription);
    setShowPauseModal(true);
  };

  const handlePauseConfirm = async () => {
    if (!subscriptionToPause) return;
    
    try {
      await axiosInstance.patch(`/api/subscriptions/${subscriptionToPause._id}/pause`, {
        cancelRemainingOrders: true
      });
      
      alert('Subscription paused. Remaining orders for this week cancelled.');
      setShowPauseModal(false);
      setSubscriptionToPause(null);
      fetchSubscriptions();
    } catch (error) {
      console.error('Failed to pause subscription:', error);
      alert(error.response?.data?.message || 'Failed to pause subscription');
    }
  };

  const handleResume = async (subscriptionId) => {
    try {
      await axiosInstance.patch(`/api/subscriptions/${subscriptionId}/resume`, {
        recreateRemainingOrders: true
      });
      
      alert('Subscription resumed! Orders recreated for remaining days.');
      fetchSubscriptions();
    } catch (error) {
      console.error('Failed to resume subscription:', error);
      alert(error.response?.data?.message || 'Failed to resume subscription');
    }
  };

  const handleCancel = async (subscriptionId) => {
    if (!window.confirm('Cancel subscription? All future orders will be cancelled.')) return;
    
    try {
      await axiosInstance.delete(`/api/subscriptions/${subscriptionId}`);
      alert('Subscription cancelled successfully');
      fetchSubscriptions();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      alert('Failed to cancel subscription');
    }
  };

  const groupedMenuItems = DAYS.reduce((acc, day) => {
    acc[day] = {
      lunch: menuItems.filter(item => item.day === day && item.mealType === 'lunch'),
      dinner: menuItems.filter(item => item.day === day && item.mealType === 'dinner'),
    };
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  const getCurrentDayMessage = () => {
    const today = new Date().getDay();
    const dayName = DAY_NAMES[today];
    const nextDay = today === 0 ? 'Monday' : DAY_NAMES[(today + 1) % 7];
    
    if (today === 0) {
      return `It's ${dayName}! Subscriptions will start from ${nextDay}.`;
    }
    return `Subscriptions will start from tomorrow (${nextDay}).`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {restaurantId ? 'Manage Subscriptions' : 'Your Subscriptions'}
        </h2>
        {restaurantId && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition font-semibold"
          >
            + Create Subscription
          </button>
        )}
      </div>

      {restaurantId && (
        <div className="mb-6 p-4 bg-gradient-to-br from-violet-50 to-teal-50 rounded-lg border border-violet-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">⚡</span>
            <h3 className="font-semibold text-gray-900">Quick Start</h3>
          </div>
          <p className="text-xs text-violet-700 mb-3">{getCurrentDayMessage()}</p>
          <div className="flex gap-3">
            <button
              onClick={() => handlePackageRestOfWeek('lunch')}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-lg hover:from-violet-600 hover:to-violet-700 transition font-semibold shadow-md"
            >
              ☀️ Add Lunch for Rest of Week
            </button>
            <button
              onClick={() => handlePackageRestOfWeek('dinner')}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:from-indigo-600 hover:to-indigo-700 transition font-semibold shadow-md"
            >
              🌙 Add Dinner for Rest of Week
            </button>
          </div>
        </div>
      )}

      {subscriptions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {restaurantId ? (
            <p>No subscriptions yet. Create one to get started!</p>
          ) : (
            <div>
              <p className="mb-4">You don't have any active subscriptions.</p>
              <button 
                onClick={() => navigate('/restaurants')}
                className="text-violet-600 font-semibold hover:underline"
              >
                Browse Restaurants to Subscribe
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {subscriptions.map(sub => (
            <SubscriptionCard
              key={sub._id}
              subscription={sub}
              onPause={() => handlePauseClick(sub)}
              onResume={handleResume}
              onCancel={handleCancel}
              navigate={navigate}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateSubscriptionModal
          groupedMenuItems={groupedMenuItems}
          selectedMeals={selectedMeals}
          isRepeating={isRepeating}
          onMealSelect={handleMealSelect}
          onQuantityChange={handleQuantityChange}
          onRepeatingChange={setIsRepeating}
          onCreate={handleCreateSubscription}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedMeals({});
          }}
          creating={creating}
        />
      )}

      {showPauseModal && subscriptionToPause && (
        <PauseConfirmModal
          subscription={subscriptionToPause}
          onConfirm={handlePauseConfirm}
          onCancel={() => {
            setShowPauseModal(false);
            setSubscriptionToPause(null);
          }}
        />
      )}
    </div>
  );
}

function PauseConfirmModal({ subscription, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⏸️</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Pause Subscription?</h3>
          <p className="text-sm text-gray-600">
            Pausing will cancel all remaining orders for this week from <strong>{subscription.restaurantId?.name}</strong>.
          </p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2 text-sm text-orange-800">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="font-semibold mb-1">What happens:</p>
              <ul className="text-xs space-y-1 ml-4 list-disc">
                <li>Remaining orders for this week cancelled</li>
                <li>No charges while paused</li>
                <li>Resume anytime to restart</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 font-semibold text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold"
          >
            Pause Subscription
          </button>
        </div>
      </div>
    </div>
  );
}

function SubscriptionCard({ subscription, onPause, onResume, onCancel, navigate }) {
  const isActive = subscription.status === 'active';
  const isPaused = subscription.status === 'paused';
  const isCancelled = subscription.status === 'cancelled';
  
  return (
    <div className={`border-2 rounded-lg p-4 ${isActive ? 'border-violet-200 bg-violet-50' : isPaused ? 'border-orange-200 bg-orange-50' : 'border-gray-200'}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg text-gray-900">{subscription.restaurantId?.name || 'Restaurant'}</h3>
          <div className="text-sm text-gray-600 mt-1">
            <span className={`px-2 py-1 rounded text-xs font-semibold ${
              isActive ? 'bg-violet-200 text-violet-800' :
              isPaused ? 'bg-orange-200 text-orange-800' :
              isCancelled ? 'bg-gray-200 text-gray-800' :
              'bg-gray-200 text-gray-800'
            }`}>
              {subscription.status.toUpperCase()}
            </span>
            {subscription.isRepeating && <span className="ml-2 text-gray-500">🔄 Repeating Weekly</span>}
          </div>
        </div>
        <div className="flex gap-2">
          {/* {isActive && (
            <button onClick={() => onPause(subscription._id)} className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm font-semibold">
              ⏸️ Pause
            </button>
          )}
          {isPaused && (
            <button onClick={() => onResume(subscription._id)} className="px-3 py-1 bg-violet-600 text-white rounded hover:bg-violet-700 text-sm font-semibold">
              ▶️ Resume
            </button>
          )} */}
          {subscription.status === 'halted' && (
            <button onClick={() => navigate('/wallet')} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-semibold">
              💰 Top Up
            </button>
          )}
          {!isCancelled && (
            <button onClick={() => onCancel(subscription._id)} className="px-3 py-1 bg-stone-100 text-stone-500 rounded hover:bg-red-50 hover:text-red-600 text-sm font-semibold">
              ✕
            </button>
          )}
        </div>
      </div>

      {isPaused && (
        <div className="mb-3 p-3 bg-orange-100 border border-orange-200 rounded-lg text-sm text-orange-800">
          ⏸️ <strong>Paused</strong> - Resume to restart deliveries
        </div>
      )}

      <div className="bg-white/50 rounded-lg p-3 mb-4 border border-violet-100">
        <div className="flex items-center gap-2 text-xs text-violet-800 font-bold mb-1">
          📅 Schedule Info
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-violet-600 uppercase">Starts On</p>
            <p className="text-xs font-bold text-gray-800">{new Date(subscription.startDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <div>
            <p className="text-[10px] text-violet-600 uppercase">Daily Deduction</p>
            <p className="text-xs font-bold text-gray-800">Variable</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {DAYS.map(day => {
          const lunch = subscription.mealSelections?.filter(m => m.day === day && m.mealType === 'lunch') || [];
          const dinner = subscription.mealSelections?.filter(m => m.day === day && m.mealType === 'dinner') || [];
          
          return (
            <div key={day} className="text-center border rounded p-2 bg-white">
              <div className="text-xs font-semibold text-gray-700 mb-1">{DAY_NAMES[DAYS.indexOf(day)].substring(0, 3)}</div>
              {lunch.length > 0 && <div className="text-xs text-violet-700 mb-1">🍽️ {lunch.map(m => `${m.quantity}x`).join(', ')}</div>}
              {dinner.length > 0 && <div className="text-xs text-violet-700">🌙 {dinner.map(m => `${m.quantity}x`).join(', ')}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CreateSubscriptionModal({ groupedMenuItems, selectedMeals, isRepeating, onMealSelect, onQuantityChange, onRepeatingChange, onCreate, onClose, creating }) {
  const totalPrice = Object.entries(selectedMeals).reduce((sum, [key, value]) => {
    const [day, mealType] = key.split('_');
    const items = groupedMenuItems[day]?.[mealType] || [];
    const item = items.find(i => i._id === value.menuItemId);
    return sum + (item?.price || 0) * (value.quantity || 1);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-2xl font-bold">Create Subscription</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isRepeating} onChange={e => onRepeatingChange(e.target.checked)} className="w-4 h-4" />
              <span className="font-semibold">Repeat weekly</span>
            </label>
            <p className="text-sm text-gray-600 ml-6 mt-1">
              {isRepeating ? 'Auto-renews each week' : 'One-time for this week'}
            </p>
          </div>

          <div className="space-y-4 mb-6">
            {DAYS.map(day => (
              <DayMealSelector
                key={day}
                day={day}
                dayName={DAY_NAMES[DAYS.indexOf(day)]}
                lunchItems={groupedMenuItems[day]?.lunch || []}
                dinnerItems={groupedMenuItems[day]?.dinner || []}
                selectedLunch={selectedMeals[`${day}_lunch`]}
                selectedDinner={selectedMeals[`${day}_dinner`]}
                onMealSelect={onMealSelect}
                onQuantityChange={onQuantityChange}
              />
            ))}
          </div>

          <div className="p-4 bg-stone-50 rounded-xl border mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">Weekly Total:</span>
              <span className="text-xl font-bold text-violet-700">{totalPrice.toFixed(2)} BDT</span>
            </div>
            <div className="space-y-1 text-[11px] text-stone-600">
              <p>✓ Starts from tomorrow (or Monday if Sunday)</p>
              <p>✓ First week charged upfront</p>
              <p>✓ Subscription halts if wallet balance low</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2 border rounded-xl hover:bg-stone-50 font-semibold">Cancel</button>
            <button onClick={onCreate} disabled={creating || Object.keys(selectedMeals).length === 0} className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 font-semibold disabled:opacity-50">
              {creating ? 'Creating...' : 'Start Subscription'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DayMealSelector({ day, dayName, lunchItems, dinnerItems, selectedLunch, selectedDinner, onMealSelect, onQuantityChange }) {
  return (
    <div className="border rounded-lg p-4">
      <h4 className="font-semibold mb-3">{dayName}</h4>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm font-semibold text-violet-700 mb-2">🍽️ Lunch</div>
          {lunchItems.length === 0 ? (
            <p className="text-sm text-gray-400">No lunch items</p>
          ) : (
            <>
              <select value={selectedLunch?.menuItemId || ''} onChange={e => e.target.value ? onMealSelect(day, 'lunch', e.target.value, selectedLunch?.quantity || 1) : onQuantityChange(day, 'lunch', 0)} className="w-full border rounded p-2 mb-2">
                <option value="">Select lunch...</option>
                {lunchItems.map(item => <option key={item._id} value={item._id}>{item.name} - {item.price} BDT</option>)}
              </select>
              {selectedLunch && (
                <div className="flex items-center gap-2">
                  <button onClick={() => onQuantityChange(day, 'lunch', (selectedLunch.quantity || 1) - 1)} className="px-2 py-1 bg-gray-200 rounded">-</button>
                  <span className="text-sm font-semibold">{selectedLunch.quantity || 1}</span>
                  <button onClick={() => onQuantityChange(day, 'lunch', (selectedLunch.quantity || 1) + 1)} className="px-2 py-1 bg-gray-200 rounded">+</button>
                </div>
              )}
            </>
          )}
        </div>
        <div>
          <div className="text-sm font-semibold text-violet-700 mb-2">🌙 Dinner</div>
          {dinnerItems.length === 0 ? (
            <p className="text-sm text-gray-400">No dinner items</p>
          ) : (
            <>
              <select value={selectedDinner?.menuItemId || ''} onChange={e => e.target.value ? onMealSelect(day, 'dinner', e.target.value, selectedDinner?.quantity || 1) : onQuantityChange(day, 'dinner', 0)} className="w-full border rounded p-2 mb-2">
                <option value="">Select dinner...</option>
                {dinnerItems.map(item => <option key={item._id} value={item._id}>{item.name} - {item.price} BDT</option>)}
              </select>
              {selectedDinner && (
                <div className="flex items-center gap-2">
                  <button onClick={() => onQuantityChange(day, 'dinner', (selectedDinner.quantity || 1) - 1)} className="px-2 py-1 bg-gray-200 rounded">-</button>
                  <span className="text-sm font-semibold">{selectedDinner.quantity || 1}</span>
                  <button onClick={() => onQuantityChange(day, 'dinner', (selectedDinner.quantity || 1) + 1)} className="px-2 py-1 bg-gray-200 rounded">+</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
