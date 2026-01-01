import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const LUNCH_CUTOFF_HOUR = 10;
const DINNER_CUTOFF_HOUR = 16;
const MONTHLY_DISCOUNT_PERCENT = 10;
const WEEKLY_MIN_MEALS = 2;
const MONTHLY_MIN_MEALS = 4;

const getCurrentDate = () => {
  const now = new Date();
  return {
    date: now,
    year: now.getFullYear(),
    month: now.getMonth(),
    day: now.getDate(),
    hour: now.getHours(),
    minute: now.getMinutes()
  };
};

const isToday = (dateString) => {
  const current = getCurrentDate();
  const currentDateStr = `${current.year}-${String(current.month + 1).padStart(2, '0')}-${String(current.day).padStart(2, '0')}`;
  return currentDateStr === dateString;
};

const getDateString = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const isMealSelectionAllowed = (dateString, mealType) => {
  const current = getCurrentDate();
  
  // Get today's date at midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get meal date at midnight
  const mealDate = new Date(dateString);
  mealDate.setHours(0, 0, 0, 0);
  
  // If meal date is in the past
  if (mealDate < today) {
    return false;
  }
  
  // If meal date is today, check cutoff times
  if (mealDate.getTime() === today.getTime()) {
    if (mealType === 'lunch' && current.hour >= LUNCH_CUTOFF_HOUR) {
      return false;
    }
    if (mealType === 'dinner' && current.hour >= DINNER_CUTOFF_HOUR) {
      return false;
    }
  }
  
  return true;
};

// Main Component
export default function SubscriptionManager({ restaurantId: propRestaurantId }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const restaurantId = propRestaurantId || id;
  
  const [menuItems, setMenuItems] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMeals, setSelectedMeals] = useState({});
  const [planType, setPlanType] = useState('weekly');
  const [creating, setCreating] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const current = getCurrentDate();
    const today = new Date(current.year, current.month, current.day);
    const day = today.getDay();
    const diff = -day;
    const sunday = new Date(today);
    sunday.setDate(sunday.getDate() + diff);
    return sunday;
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    const current = getCurrentDate();
    return {
      year: current.year,
      month: current.month
    };
  });

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
      // Filter to only show active subscriptions (not cancelled)
      const visibleSubs = restaurantId 
        ? (data.data || []).filter(sub => 
            (sub.restaurantId?._id === restaurantId || sub.restaurantId === restaurantId) &&
            sub.status !== 'cancelled'
          )
        : (data.data || []).filter(sub => sub.status !== 'cancelled');
        
      setSubscriptions(visibleSubs);
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysForPlan = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (planType === 'weekly') {
      const weekStart = new Date(currentWeekStart);
      
      const menuByDate = {};
      menuItems.forEach(item => {
        const itemDate = item.date ? new Date(item.date) : new Date();
        const dateString = getDateString(itemDate);
        
        if (!menuByDate[dateString]) {
          menuByDate[dateString] = { lunch: [], dinner: [] };
        }
        
        if (item.mealType === 'lunch') {
          menuByDate[dateString].lunch.push(item);
        } else if (item.mealType === 'dinner') {
          menuByDate[dateString].dinner.push(item);
        }
      });
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        const dateString = getDateString(date);
        
        // Skip past dates
        const dateAtMidnight = new Date(date);
        dateAtMidnight.setHours(0, 0, 0, 0);
        if (dateAtMidnight < today) continue;
        
        const dayIndex = date.getDay();
        const dayName = DAYS[dayIndex];
        const menuForDate = menuByDate[dateString] || { lunch: [], dinner: [] };
        
        days.push({
          date: new Date(date),
          dateString,
          day: dayName,
          dayName: DAY_NAMES[dayIndex],
          dateDisplay: date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          }),
          isToday: isToday(dateString),
          menuItems: menuForDate
        });
      }
    } else {
      const { year, month } = currentMonth;
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      const menuByDate = {};
      menuItems.forEach(item => {
        const itemDate = item.date ? new Date(item.date) : new Date();
        const dateString = getDateString(itemDate);
        
        if (!menuByDate[dateString]) {
          menuByDate[dateString] = { lunch: [], dinner: [] };
        }
        
        if (item.mealType === 'lunch') {
          menuByDate[dateString].lunch.push(item);
        } else if (item.mealType === 'dinner') {
          menuByDate[dateString].dinner.push(item);
        }
      });
      
      const startDate = new Date(Math.max(firstDay.getTime(), today.getTime()));
      for (let date = new Date(startDate); date <= lastDay; date.setDate(date.getDate() + 1)) {
        const dateString = getDateString(date);
        const dayIndex = date.getDay();
        const dayName = DAYS[dayIndex];
        
        const menuForDate = menuByDate[dateString] || { lunch: [], dinner: [] };
        
        days.push({
          date: new Date(date),
          dateString,
          day: dayName,
          dayName: DAY_NAMES[dayIndex],
          dateDisplay: date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          }),
          isToday: isToday(dateString),
          menuItems: menuForDate
        });
      }
    }
    
    return days;
  };

  const planDays = getDaysForPlan();

  const getTotalMealsQuantity = () => {
    return Object.values(selectedMeals).reduce((sum, meal) => sum + (meal.quantity || 1), 0);
  };

  const meetsMinimumRequirements = () => {
    const totalQuantity = getTotalMealsQuantity();
    if (planType === 'weekly') {
      return totalQuantity >= WEEKLY_MIN_MEALS;
    } else {
      return totalQuantity >= MONTHLY_MIN_MEALS;
    }
  };

  const handleMealSelect = (dateString, day, mealType, menuItemId, isSelected) => {
    if (!isMealSelectionAllowed(dateString, mealType)) {
      const current = getCurrentDate();
      const currentTime = `${current.hour.toString().padStart(2, '0')}:${current.minute.toString().padStart(2, '0')}`;
      
      if (isToday(dateString)) {
        alert(`Cannot select ${mealType} for today - cutoff time has passed (${currentTime}).\nLunch cutoff: ${LUNCH_CUTOFF_HOUR}:00 AM\nDinner cutoff: ${DINNER_CUTOFF_HOUR}:00 PM`);
      } else {
        alert(`Cannot select ${mealType} for ${dateString} - date is in the past.`);
      }
      return;
    }
    
    const key = `${dateString}_${mealType}_${menuItemId}`;
    
    setSelectedMeals(prev => {
      const newSelected = { ...prev };
      
      if (isSelected) {
        const menuItem = menuItems.find(item => item._id === menuItemId);
        if (!menuItem) return prev;
        
        newSelected[key] = {
          date: dateString,
          day,
          mealType,
          menuItemId,
          quantity: 1,
          price: menuItem.price,
          menuItemName: menuItem.name,
          dateDisplay: new Date(dateString).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })
        };
      } else {
        delete newSelected[key];
      }
      
      return newSelected;
    });
  };

  const handleQuantityChange = (key, quantity) => {
    if (quantity < 1) {
      setSelectedMeals(prev => {
        const newSelected = { ...prev };
        delete newSelected[key];
        return newSelected;
      });
      return;
    }
    
    setSelectedMeals(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        quantity
      }
    }));
  };

  const selectAllMealsForDay = (dateString, day, mealType, mealItems) => {
    if (!isMealSelectionAllowed(dateString, mealType)) {
      alert(`Cannot select ${mealType} for this date - cutoff time has passed or date is in the past.`);
      return;
    }
    
    setSelectedMeals(prev => {
      const newSelected = { ...prev };
      
      if (mealItems.length > 0) {
        const menuItem = mealItems[0];
        const key = `${dateString}_${mealType}_${menuItem._id}`;
        newSelected[key] = {
          date: dateString,
          day,
          mealType,
          menuItemId: menuItem._id,
          quantity: 1,
          price: menuItem.price,
          menuItemName: menuItem.name,
          dateDisplay: new Date(dateString).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })
        };
      }
      
      return newSelected;
    });
  };

  const clearAllMealsForDay = (dateString, mealType) => {
    setSelectedMeals(prev => {
      const newSelected = { ...prev };
      
      Object.keys(newSelected).forEach(key => {
        if (key.startsWith(`${dateString}_${mealType}_`)) {
          delete newSelected[key];
        }
      });
      
      return newSelected;
    });
  };

  const selectAllMealsOfType = (mealType) => {
    setSelectedMeals(prev => {
      const newSelected = { ...prev };
      
      planDays.forEach(dayInfo => {
        const mealsForDay = dayInfo.menuItems[mealType];
        
        if (mealsForDay.length > 0 && isMealSelectionAllowed(dayInfo.dateString, mealType)) {
          const menuItem = mealsForDay[0];
          const key = `${dayInfo.dateString}_${mealType}_${menuItem._id}`;
          newSelected[key] = {
            date: dayInfo.dateString,
            day: dayInfo.day,
            mealType,
            menuItemId: menuItem._id,
            quantity: 1,
            price: menuItem.price,
            menuItemName: menuItem.name,
            dateDisplay: dayInfo.dateDisplay
          };
        }
      });
      
      return newSelected;
    });
  };

  const handleCreateSubscription = async () => {
    const totalQuantity = getTotalMealsQuantity();
    if (planType === 'weekly' && totalQuantity < WEEKLY_MIN_MEALS) {
      alert(`Weekly subscription requires at least ${WEEKLY_MIN_MEALS} meals. You have selected ${totalQuantity} meal${totalQuantity !== 1 ? 's' : ''}.`);
      return;
    }
    if (planType === 'monthly' && totalQuantity < MONTHLY_MIN_MEALS) {
      alert(`Monthly subscription requires at least ${MONTHLY_MIN_MEALS} meals. You have selected ${totalQuantity} meal${totalQuantity !== 1 ? 's' : ''}.`);
      return;
    }

    const mealSelections = Object.values(selectedMeals).map(meal => ({
      date: meal.date,
      day: meal.day,
      mealType: meal.mealType,
      menuItemId: meal.menuItemId,
      quantity: meal.quantity || 1,
      price: meal.price,
      itemName: meal.menuItemName,
    }));

    if (mealSelections.length === 0) {
      alert('Please select at least one meal');
      return;
    }

    const today = getDateString(new Date());
    const current = getCurrentDate();
    const todaySelections = mealSelections.filter(meal => meal.date === today);
    
    for (const meal of todaySelections) {
      if (meal.mealType === 'lunch' && current.hour >= LUNCH_CUTOFF_HOUR) {
        alert(`Cannot create subscription with today's lunch - cutoff time has passed (${LUNCH_CUTOFF_HOUR}:00 AM)`);
        return;
      }
      if (meal.mealType === 'dinner' && current.hour >= DINNER_CUTOFF_HOUR) {
        alert(`Cannot create subscription with today's dinner - cutoff time has passed (${DINNER_CUTOFF_HOUR}:00 PM)`);
        return;
      }
    }

    try {
      setCreating(true);
      
      await axiosInstance.post('/api/subscriptions', {
        restaurantId,
        mealSelections,
        planType,
        startDate: new Date().toISOString(),
      });

      const startText = todaySelections.length > 0 ? 'from today' : 'from tomorrow';
      const discountText = planType === 'monthly' ? ` with ${MONTHLY_DISCOUNT_PERCENT}% discount applied` : '';
      
      alert(`${planType === 'weekly' ? 'Weekly' : 'Monthly'} subscription created successfully${discountText}!\nStarting ${startText}.`);
      
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

  const handleCancel = async (subscriptionId) => {
    const confirmMessage = `Cancel this subscription?\n\n⚠️ All future orders will be cancelled\n💰 You will not be charged for cancelled orders\n✅ Today's orders (if any) will still be delivered`;
    
    if (!window.confirm(confirmMessage)) return;
    
    try {
      await axiosInstance.delete(`/api/subscriptions/${subscriptionId}`);
      alert('Subscription cancelled successfully!');
      fetchSubscriptions(); // This will refresh and filter out cancelled subscriptions
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      alert(error.response?.data?.message || 'Failed to cancel subscription');
    }
  };

  const handlePrevWeek = () => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() - 7);
    setCurrentWeekStart(date);
  };

  const handleNextWeek = () => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + 7);
    setCurrentWeekStart(date);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = prev.month === 0 ? 11 : prev.month - 1;
      const newYear = prev.month === 0 ? prev.year - 1 : prev.year;
      return { year: newYear, month: newMonth };
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = prev.month === 11 ? 0 : prev.month + 1;
      const newYear = prev.month === 11 ? prev.year + 1 : prev.year;
      return { year: newYear, month: newMonth };
    });
  };

  const getPlanPeriodDisplay = () => {
    if (planDays.length === 0) return '';
    
    if (planType === 'weekly') {
      const firstDay = planDays[0];
      const lastDay = planDays[planDays.length - 1];
      return `${firstDay.dateDisplay} - ${lastDay.dateDisplay}`;
    } else {
      const monthName = new Date(currentMonth.year, currentMonth.month).toLocaleDateString('en-US', { 
        month: 'long' 
      });
      return `${monthName} ${currentMonth.year}`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {restaurantId ? 'Manage Subscriptions' : 'Your Active Subscriptions'}
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

      {subscriptions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {restaurantId ? (
            <div className="space-y-3">
              <p>No active subscriptions yet. Create one to get started!</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 font-semibold"
              >
                Create Subscription
              </button>
            </div>
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
              onCancel={() => handleCancel(sub._id)}
              navigate={navigate}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateSubscriptionModal
          menuItems={menuItems}
          selectedMeals={selectedMeals}
          planType={planType}
          planDays={planDays}
          planPeriodDisplay={getPlanPeriodDisplay()}
          onPlanTypeChange={setPlanType}
          onMealSelect={handleMealSelect}
          onQuantityChange={handleQuantityChange}
          onSelectAllMealsForDay={selectAllMealsForDay}
          onClearAllMealsForDay={clearAllMealsForDay}
          onSelectAllMealsOfType={selectAllMealsOfType}
          onClearAllSelections={() => setSelectedMeals({})}
          onPrevPeriod={planType === 'weekly' ? handlePrevWeek : handlePrevMonth}
          onNextPeriod={planType === 'weekly' ? handleNextWeek : handleNextMonth}
          onCreate={handleCreateSubscription}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedMeals({});
            setCurrentWeekStart(() => {
              const current = getCurrentDate();
              const today = new Date(current.year, current.month, current.day);
              const day = today.getDay();
              const diff = -day;
              const sunday = new Date(today);
              sunday.setDate(sunday.getDate() + diff);
              return sunday;
            });
            setCurrentMonth(() => {
              const current = getCurrentDate();
              return {
                year: current.year,
                month: current.month
              };
            });
          }}
          creating={creating}
          meetsMinimumRequirements={meetsMinimumRequirements()}
        />
      )}
    </div>
  );
}

// Sub-components
function SubscriptionCard({ subscription, onCancel, navigate }) {
  const isActive = subscription.status === 'active';
  
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  return (
    <div className="border-2 rounded-lg p-4 border-violet-200 bg-violet-50">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg text-gray-900">{subscription.restaurantId?.name || 'Restaurant'}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-1 rounded text-xs font-semibold bg-violet-200 text-violet-800">
              {subscription.status?.toUpperCase() || 'ACTIVE'}
            </span>
            <span className="text-xs text-gray-600 px-2 py-1 bg-gray-100 rounded">
              {subscription.planType === 'weekly' ? 'Weekly Plan' : 'Monthly Plan'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onCancel} 
            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-semibold"
          >
            ✕ Cancel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-sm text-gray-600">Start Date</p>
          <p className="font-medium">{formatDate(subscription.startDate)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Total Amount</p>
          <p className="font-medium">{subscription.totalAmount?.toFixed(2) || '0.00'} BDT</p>
        </div>
      </div>

      {subscription.mealSelections?.length > 0 && (
        <div className="mt-3">
          <p className="text-sm text-gray-600 mb-1">Meals Selected:</p>
          <div className="flex flex-wrap gap-2">
            {subscription.mealSelections.slice(0, 3).map((meal, index) => (
              <span 
                key={index}
                className="text-xs bg-white border px-2 py-1 rounded"
              >
                {meal.day?.substring(0, 3)} {meal.mealType === 'lunch' ? '☀️' : '🌙'} ×{meal.quantity || 1}
              </span>
            ))}
            {subscription.mealSelections.length > 3 && (
              <span className="text-xs text-gray-500 self-center">
                + {subscription.mealSelections.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CreateSubscriptionModal({ 
  menuItems, 
  selectedMeals, 
  planType, 
  planDays,
  planPeriodDisplay,
  onPlanTypeChange, 
  onMealSelect, 
  onQuantityChange, 
  onSelectAllMealsForDay,
  onClearAllMealsForDay,
  onSelectAllMealsOfType,
  onClearAllSelections, 
  onPrevPeriod,
  onNextPeriod,
  onCreate, 
  onClose, 
  creating,
  meetsMinimumRequirements
}) {
  const current = getCurrentDate();
  const currentTime = `${current.hour.toString().padStart(2, '0')}:${current.minute.toString().padStart(2, '0')}`;

  const totalPrice = Object.values(selectedMeals).reduce((sum, meal) => {
    const pricePerMeal = meal.price || 0;
    const quantity = meal.quantity || 1;
    return sum + (pricePerMeal * quantity);
  }, 0);

  const totalQuantity = Object.values(selectedMeals).reduce((sum, meal) => sum + (meal.quantity || 1), 0);
  const discountAmount = planType === 'monthly' ? totalPrice * (MONTHLY_DISCOUNT_PERCENT / 100) : 0;
  const finalPrice = totalPrice - discountAmount;

  const isMealSelected = (dateString, mealType, menuItemId) => {
    const key = `${dateString}_${mealType}_${menuItemId}`;
    return !!selectedMeals[key];
  };

  const getMealQuantity = (dateString, mealType, menuItemId) => {
    const key = `${dateString}_${mealType}_${menuItemId}`;
    return selectedMeals[key]?.quantity || 1;
  };

  const getSelectedCountForDay = (dateString, mealType) => {
    return Object.keys(selectedMeals).filter(key => 
      key.startsWith(`${dateString}_${mealType}_`)
    ).length;
  };

  const getTotalQuantityForDay = (dateString, mealType) => {
    return Object.keys(selectedMeals)
      .filter(key => key.startsWith(`${dateString}_${mealType}_`))
      .reduce((total, key) => total + (selectedMeals[key]?.quantity || 1), 0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="text-2xl font-bold">Create {planType === 'weekly' ? 'Weekly' : 'Monthly'} Subscription</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
        </div>

        <div className="p-6">
          {/* Plan Type Selection */}
          <div className="mb-8">
            <h4 className="font-semibold text-gray-900 mb-3">Choose Subscription Plan:</h4>
            <div className="grid grid-cols-2 gap-4">
              <div 
                onClick={() => onPlanTypeChange('weekly')}
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  planType === 'weekly' 
                    ? 'border-violet-500 bg-violet-50' 
                    : 'border-gray-200 hover:border-violet-200'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    planType === 'weekly' ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    📅
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-900">Weekly Plan</h5>
                    <p className="text-xs text-gray-600">Minimum {WEEKLY_MIN_MEALS} meals required</p>
                  </div>
                </div>
              </div>
              
              <div 
                onClick={() => onPlanTypeChange('monthly')}
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  planType === 'monthly' 
                    ? 'border-violet-500 bg-violet-50' 
                    : 'border-gray-200 hover:border-violet-200'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    planType === 'monthly' ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    📆
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-900">Monthly Plan</h5>
                    <p className="text-xs text-gray-600">Minimum {MONTHLY_MIN_MEALS} meals, {MONTHLY_DISCOUNT_PERCENT}% discount</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cutoff Time Info */}
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <span className="text-lg">🕐</span>
              <div>
                <p className="font-semibold">Cutoff Times (Current: {currentTime})</p>
                <p className="text-xs">Lunch: Before {LUNCH_CUTOFF_HOUR}:00 AM | Dinner: Before {DINNER_CUTOFF_HOUR}:00 PM</p>
              </div>
            </div>
          </div>

          {/* Minimum Requirements Banner */}
          {!meetsMinimumRequirements && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="text-amber-600 text-xl">⚠️</div>
                <div>
                  <p className="font-semibold text-amber-800">Minimum Requirements Not Met</p>
                  <p className="text-sm text-amber-700">
                    {planType === 'weekly' 
                      ? `Weekly requires at least ${WEEKLY_MIN_MEALS} meals. You have ${totalQuantity}.`
                      : `Monthly requires at least ${MONTHLY_MIN_MEALS} meals. You have ${totalQuantity}.`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Period Navigation */}
          <div className="mb-6">
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
              <button
                onClick={onPrevPeriod}
                className="px-4 py-2 border rounded-lg hover:bg-white"
              >
                ← Previous
              </button>
              
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">
                  {planPeriodDisplay}
                </div>
                <div className="text-sm text-gray-600">
                  {planDays.length} days available
                </div>
              </div>
              
              <button
                onClick={onNextPeriod}
                className="px-4 py-2 border rounded-lg hover:bg-white"
              >
                Next →
              </button>
            </div>
          </div>

          {/* Quick Select Buttons */}
          {planDays.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <h4 className="font-semibold text-gray-900 mb-3">Quick Select:</h4>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => onSelectAllMealsOfType('lunch')}
                  className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 font-semibold text-sm"
                >
                  ☀️ Select All Lunches
                </button>
                <button
                  onClick={() => onSelectAllMealsOfType('dinner')}
                  className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 font-semibold text-sm"
                >
                  🌙 Select All Dinners
                </button>
                <button
                  onClick={onClearAllSelections}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold text-sm"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}

          {/* Days Grid */}
          <div className="mb-8">
            {planDays.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <div className="text-4xl mb-4">📭</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Menu Available</h3>
                <button
                  onClick={onNextPeriod}
                  className="px-4 py-2 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 font-semibold"
                >
                  Check Next {planType === 'weekly' ? 'Week' : 'Month'}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {planDays.map(dayInfo => {
                  const { dateString, day, dayName, dateDisplay, menuItems: dayMenuItems, isToday: isTodayDay } = dayInfo;
                  const lunchAllowed = isMealSelectionAllowed(dateString, 'lunch');
                  const dinnerAllowed = isMealSelectionAllowed(dateString, 'dinner');
                  
                  return (
                    <div key={dateString} className="border rounded-lg overflow-hidden">
                      {/* Day Header */}
                      <div className="bg-gradient-to-r from-violet-50 to-white border-b p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-lg text-gray-900">{dayName}</h3>
                              {isTodayDay && (
                                <span className="px-2 py-1 bg-violet-100 text-violet-700 text-xs font-semibold rounded">
                                  TODAY
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-violet-600 font-semibold">{dateDisplay}</p>
                          </div>
                          <div className="text-sm text-gray-600">
                            {dayMenuItems.lunch.length} lunch • {dayMenuItems.dinner.length} dinner
                          </div>
                        </div>
                      </div>
                      
                      {/* Meals */}
                      <div className="p-4">
                        {/* Lunch */}
                        {dayMenuItems.lunch.length > 0 && (
                          <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                                  <span className="text-orange-600">☀️</span>
                                </div>
                                <h4 className="font-semibold text-gray-900">Lunch</h4>
                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                                  {getSelectedCountForDay(dateString, 'lunch')} items • {getTotalQuantityForDay(dateString, 'lunch')} total
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => onSelectAllMealsForDay(dateString, day, 'lunch', dayMenuItems.lunch)}
                                  disabled={!lunchAllowed}
                                  className={`px-3 py-1 text-xs rounded ${
                                    lunchAllowed
                                      ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  }`}
                                >
                                  Select One
                                </button>
                                <button
                                  onClick={() => onClearAllMealsForDay(dateString, 'lunch')}
                                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>
                            
                            {!lunchAllowed && isTodayDay && (
                              <div className="text-xs text-red-500 mb-2 p-2 bg-red-50 rounded">
                                ⚠️ Lunch selection closed (after {LUNCH_CUTOFF_HOUR}:00 AM)
                              </div>
                            )}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {dayMenuItems.lunch.map(menuItem => {
                                const isSelected = isMealSelected(dateString, 'lunch', menuItem._id);
                                const quantity = getMealQuantity(dateString, 'lunch', menuItem._id);
                                const key = `${dateString}_lunch_${menuItem._id}`;
                                
                                return (
                                  <div 
                                    key={menuItem._id} 
                                    className={`border rounded-lg p-3 ${
                                      isSelected ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
                                    } ${!lunchAllowed ? 'opacity-50' : ''}`}
                                  >
                                    <div className="flex items-start gap-2">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => onMealSelect(dateString, day, 'lunch', menuItem._id, e.target.checked)}
                                        disabled={!lunchAllowed}
                                        className="w-5 h-5 mt-1 rounded"
                                      />
                                      <div className="flex-1">
                                        <div className="flex justify-between">
                                          <h5 className="font-medium text-gray-900">{menuItem.name}</h5>
                                          <span className="font-semibold">{menuItem.price} BDT</span>
                                        </div>
                                        {menuItem.description && (
                                          <p className="text-xs text-gray-500 mt-1">{menuItem.description}</p>
                                        )}
                                        {isSelected && (
                                          <div className="flex items-center gap-2 mt-2">
                                            <button
                                              onClick={() => onQuantityChange(key, quantity - 1)}
                                              className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300"
                                            >
                                              -
                                            </button>
                                            <span className="font-semibold">{quantity}</span>
                                            <button
                                              onClick={() => onQuantityChange(key, quantity + 1)}
                                              className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300"
                                            >
                                              +
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {/* Dinner */}
                        {dayMenuItems.dinner.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                  <span className="text-indigo-600">🌙</span>
                                </div>
                                <h4 className="font-semibold text-gray-900">Dinner</h4>
                                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                                  {getSelectedCountForDay(dateString, 'dinner')} items • {getTotalQuantityForDay(dateString, 'dinner')} total
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => onSelectAllMealsForDay(dateString, day, 'dinner', dayMenuItems.dinner)}
                                  disabled={!dinnerAllowed}
                                  className={`px-3 py-1 text-xs rounded ${
                                    dinnerAllowed
                                      ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  }`}
                                >
                                  Select One
                                </button>
                                <button
                                  onClick={() => onClearAllMealsForDay(dateString, 'dinner')}
                                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>
                            
                            {!dinnerAllowed && isTodayDay && (
                              <div className="text-xs text-red-500 mb-2 p-2 bg-red-50 rounded">
                                ⚠️ Dinner selection closed (after {DINNER_CUTOFF_HOUR}:00 PM)
                              </div>
                            )}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {dayMenuItems.dinner.map(menuItem => {
                                const isSelected = isMealSelected(dateString, 'dinner', menuItem._id);
                                const quantity = getMealQuantity(dateString, 'dinner', menuItem._id);
                                const key = `${dateString}_dinner_${menuItem._id}`;
                                
                                return (
                                  <div 
                                    key={menuItem._id} 
                                    className={`border rounded-lg p-3 ${
                                      isSelected ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200'
                                    } ${!dinnerAllowed ? 'opacity-50' : ''}`}
                                  >
                                    <div className="flex items-start gap-2">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => onMealSelect(dateString, day, 'dinner', menuItem._id, e.target.checked)}
                                        disabled={!dinnerAllowed}
                                        className="w-5 h-5 mt-1 rounded"
                                      />
                                      <div className="flex-1">
                                        <div className="flex justify-between">
                                          <h5 className="font-medium text-gray-900">{menuItem.name}</h5>
                                          <span className="font-semibold">{menuItem.price} BDT</span>
                                        </div>
                                        {menuItem.description && (
                                          <p className="text-xs text-gray-500 mt-1">{menuItem.description}</p>
                                        )}
                                        {isSelected && (
                                          <div className="flex items-center gap-2 mt-2">
                                            <button
                                              onClick={() => onQuantityChange(key, quantity - 1)}
                                              className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300"
                                            >
                                              -
                                            </button>
                                            <span className="font-semibold">{quantity}</span>
                                            <button
                                              onClick={() => onQuantityChange(key, quantity + 1)}
                                              className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300"
                                            >
                                              +
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="p-4 bg-stone-50 rounded-xl border mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
              <div>
                <div className="text-xs text-stone-600 uppercase mb-1">Plan</div>
                <div className="font-semibold text-gray-900">{planType === 'weekly' ? 'Weekly' : 'Monthly'}</div>
              </div>
              <div>
                <div className="text-xs text-stone-600 uppercase mb-1">Total Meals</div>
                <div className="font-semibold text-gray-900">
                  {totalQuantity} meals
                  {!meetsMinimumRequirements && (
                    <span className="text-xs text-red-600 ml-2">
                      (Min: {planType === 'weekly' ? WEEKLY_MIN_MEALS : MONTHLY_MIN_MEALS})
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-stone-600 uppercase mb-1">Days</div>
                <div className="font-semibold text-gray-900">
                  {new Set(Object.values(selectedMeals).map(m => m.date)).size} days
                </div>
              </div>
              <div>
                <div className="text-xs text-stone-600 uppercase mb-1">Items</div>
                <div className="font-semibold text-gray-900">
                  {Object.keys(selectedMeals).length} items
                </div>
              </div>
            </div>
            
            <div className="border-t pt-3">
              {/* Price Breakdown */}
              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{totalPrice.toFixed(2)} BDT</span>
                </div>
                
                {planType === 'monthly' && discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Monthly Discount ({MONTHLY_DISCOUNT_PERCENT}%):
                    </span>
                    <span className="font-medium text-green-600">-{discountAmount.toFixed(2)} BDT</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-semibold text-gray-900">
                    {planType === 'weekly' ? 'Weekly Total:' : 'Monthly Total:'}
                  </span>
                  <div className="text-right">
                    {planType === 'monthly' && discountAmount > 0 && (
                      <div className="text-xs text-gray-500 line-through mb-1">
                        {totalPrice.toFixed(2)} BDT
                      </div>
                    )}
                    <span className="text-xl font-bold text-violet-700">{finalPrice.toFixed(2)} BDT</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={onClose} 
              className="flex-1 px-4 py-2 border rounded-xl hover:bg-stone-50 font-semibold"
            >
              Cancel
            </button>
            <button 
              onClick={onCreate} 
              disabled={creating || !meetsMinimumRequirements || Object.keys(selectedMeals).length === 0}
              className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating...' : `Start ${planType === 'weekly' ? 'Weekly' : 'Monthly'} Subscription`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}