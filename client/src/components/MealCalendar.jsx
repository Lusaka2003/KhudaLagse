import { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const FALLBACK_IMAGE = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800';

export default function MealCalendar() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, [selectedWeek]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch subscriptions
      const subsResponse = await axiosInstance.get('/api/subscriptions');
      setSubscriptions(subsResponse.data.data || []);
      
      // Fetch orders for the selected week
      const weekStart = getWeekStart(selectedWeek);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      const ordersResponse = await axiosInstance.get('/api/orders', {
        params: {
          startDate: weekStart.toISOString(),
          endDate: weekEnd.toISOString()
        }
      });
    
      setSubscriptions(subscriptionsRes.data.data || []);
      setOrders(ordersRes.data.data || []); // Set orders data
      
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get start of week (Sunday)
  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  // Get meals for a specific day (from subscriptions)
  const getSubscriptionMealsForDay = (dayName, date) => {
    const meals = [];
    
    subscriptions.forEach(sub => {
      if (sub.status !== 'active' && sub.status !== 'paused') return;
      
      sub.mealSelections?.forEach(selection => {
        if (selection.day === dayName) {
          // Check if subscription is active for this date
          const startDate = new Date(sub.startDate);
          const endDate = sub.endDate ? new Date(sub.endDate) : null;
          const mealDate = new Date(date);
          
          if (mealDate < startDate) return;
          if (endDate && mealDate > endDate) return;
          
          // If repeating, check if it's the right week
          if (sub.isRepeating) {
            const weekStart = getWeekStart(mealDate);
            const subWeekStart = getWeekStart(startDate);
            const weeksDiff = Math.floor((weekStart - subWeekStart) / (7 * 24 * 60 * 60 * 1000));
            if (weeksDiff < 0) return;
          }
          
          meals.push({
            ...selection,
            subscriptionId: sub._id,
            restaurantName: sub.restaurantId?.name || 'Unknown',
            restaurantImage: sub.restaurantId?.imageUrl || FALLBACK_IMAGE,
            status: sub.status,
            type: 'subscription'
          });
        }
      });
    });
    
    return meals;
  };

  // Get orders for a specific day
  const getOrdersForDay = (date) => {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const dayOrders = orders.filter(order => {
      // Check if order has a deliveryDate or scheduledDate
      const orderDate = order.deliveryDate || order.scheduledDate || order.createdAt;
      if (!orderDate) return false;
      
      const oDate = new Date(orderDate);
      oDate.setHours(0, 0, 0, 0);
      
      return oDate.getTime() === targetDate.getTime() && 
             (order.status === 'pending' || order.status === 'accepted' || order.status === 'completed');
    });

    // Transform orders into meal format
    const meals = [];
    dayOrders.forEach(order => {
      order.items?.forEach(item => {
        meals.push({
          menuItemId: item.itemId,
          orderId: order._id,
          restaurantName: order.restaurantId?.name || 'Unknown',
          restaurantImage: order.restaurantId?.imageUrl || FALLBACK_IMAGE,
          quantity: item.quantity || 1,
          price: item.price || 0,
          mealType: item.itemId?.mealType || order.mealType || 'lunch',
          status: 'active',
          type: 'order',
          orderStatus: order.status
        });
      });
    });
    
    return meals;
  };

  // Get all meals for a specific day (subscriptions + orders)
  const getMealsForDay = (dayName, date) => {
    const subscriptionMeals = getSubscriptionMealsForDay(dayName, date);
    const orderMeals = getOrdersForDay(date);
    
    return [...subscriptionMeals, ...orderMeals];
  };

  // Get dates for the current week
  const getWeekDates = () => {
    const weekStart = getWeekStart(selectedWeek);
    return DAYS.map((day, index) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + index);
      return { day, date, dayName: DAY_NAMES[index] };
    });
  };

  const weekDates = getWeekDates();
  const nextWeek = () => {
    const newDate = new Date(selectedWeek);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedWeek(newDate);
  };
  
  const prevWeek = () => {
    const newDate = new Date(selectedWeek);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedWeek(newDate);
  };

  const goToToday = () => {
    setSelectedWeek(new Date());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your meal calendar...</p>
        </div>
      </div>
    );
  }

  const activeSubscriptions = subscriptions.filter(s => s.status === 'active' || s.status === 'paused');
  const hasAnyMeals = activeSubscriptions.length > 0 || orders.length > 0;
  
  if (!hasAnyMeals) {
    return (
      <div className="bg-gradient-to-br from-white to-violet-50 rounded-2xl shadow-md p-10 text-center border border-violet-100">
        <div className="w-20 h-20 rounded-full bg-violet-100 flex items-center justify-center text-3xl mb-6 mx-auto">
          📅
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">No Meals Scheduled</h3>
        <p className="text-gray-600 max-w-md mx-auto mb-6">
          Create a subscription or place an order to see your meal calendar.
        </p>
        <button
          onClick={() => window.location.href = '/restaurants'}
          className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-lg font-semibold hover:bg-violet-700 transition"
        >
          Browse Restaurants
        </button>
      </div>
    );
  }

  const today = new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Meal Calendar</h2>
          <p className="text-gray-600 text-sm mt-1">Your scheduled meals and orders for the week</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={prevWeek}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
            title="Previous week"
          >
            <span className="text-lg">←</span>
          </button>
          
          <div className="text-center min-w-[180px]">
            <div className="font-semibold text-gray-900">
              {weekDates[0].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDates[6].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
            <div className="text-sm text-gray-500">
              {selectedWeek.getFullYear()}
            </div>
          </div>
          
          <button
            onClick={nextWeek}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
            title="Next week"
          >
            <span className="text-lg">→</span>
          </button>
          
          <button
            onClick={goToToday}
            className="ml-2 px-4 py-2 bg-violet-100 text-violet-700 rounded-lg text-sm font-semibold hover:bg-violet-200 transition"
          >
            Today
          </button>
        </div>
      </div>

      {/* Week Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {weekDates.map(({ day, date, dayName }) => {
          const meals = getMealsForDay(day, date);
          const isToday = date.toDateString() === today.toDateString();
          const isPast = date < today;
          
          return (
            <div
              key={day}
              className={`rounded-xl p-4 min-h-[320px] transition-all duration-300 ${
                isToday 
                  ? 'bg-gradient-to-br from-violet-50 to-white border-2 border-violet-300 shadow-lg' 
                  : isPast
                  ? 'bg-gray-50 border border-gray-200'
                  : 'bg-white border border-gray-200 hover:border-violet-200 hover:shadow-md'
              }`}
            >
              {/* Day Header */}
              <div className="mb-4">
                <div className={`text-xs font-semibold uppercase tracking-wide ${
                  isToday ? 'text-violet-600' : 'text-gray-500'
                }`}>
                  {dayName}
                </div>
                <div className={`text-xl font-bold mt-1 ${
                  isToday ? 'text-violet-700' : 'text-gray-800'
                }`}>
                  {date.getDate()}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {date.toLocaleDateString('en-US', { month: 'short' })}
                </div>
              </div>
              
              {/* Meals List */}
              <div className="space-y-4">
                {/* Lunch Section */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                      <span className="text-xs">☀️</span>
                    </div>
                    <div className="text-xs font-semibold text-gray-700">Lunch</div>
                  </div>
                  
                  {meals.filter(m => m.mealType === 'lunch').map((meal, idx) => (
                    <MealCard key={`${meal.type}-${idx}`} meal={meal} isToday={isToday} />
                  ))}
                  
                  {meals.filter(m => m.mealType === 'lunch').length === 0 && (
                    <div className="text-xs text-gray-400 italic pl-2">No lunch scheduled</div>
                  )}
                </div>
                
                {/* Dinner Section */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-xs">🌙</span>
                    </div>
                    <div className="text-xs font-semibold text-gray-700">Dinner</div>
                  </div>
                  
                  {meals.filter(m => m.mealType === 'dinner').map((meal, idx) => (
                    <MealCard key={`${meal.type}-${idx}`} meal={meal} isToday={isToday} />
                  ))}
                  
                  {meals.filter(m => m.mealType === 'dinner').length === 0 && (
                    <div className="text-xs text-gray-400 italic pl-2">No dinner scheduled</div>
                  )}
                </div>
              </div>
              
              {/* Day Summary */}
              {meals.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500 flex items-center justify-between">
                    <span>Total Meals:</span>
                    <span className="font-semibold text-gray-700">{meals.length}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="text-sm font-medium text-gray-700 mb-2">Legend</div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-violet-300"></div>
            <span className="text-xs text-gray-600">Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-400"></div>
            <span className="text-xs text-gray-600">Subscription</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
            <span className="text-xs text-gray-600">One-time Order</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            <span className="text-xs text-gray-600">Paused</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MealCard({ meal, isToday }) {
  // Handle BOTH subscription meals AND order meals
  const menuItem = meal.menuItemId || meal.menuItem || null;
  const isPaused = meal.status === 'paused';
  const isOrder = meal.type === 'order';
  
  // If no menu item data, show placeholder
  if (!menuItem) {
    return (
      <div className={`group relative overflow-hidden rounded-xl border p-4 ${
        isToday ? 'bg-gradient-to-r from-violet-50 to-white border-violet-200' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">
              {isOrder ? 'Order' : 'Subscription'} Meal
            </div>
            <div className="text-xs text-gray-500">Details loading...</div>
          </div>
          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded">
            {isOrder ? '🛒' : '📅'}
          </span>
        </div>
      </div>
    );
  }

  // Use menu item data - menuItem should be populated object with imageUrl
  const imageUrl = menuItem?.imageUrl || 
                   meal.restaurantImage || 
                   FALLBACK_IMAGE;
  
  // Determine badge color based on source
  const badgeColor = isOrder 
    ? meal.mealType === 'lunch' ? 'bg-orange-500' : 'bg-indigo-500'
    : meal.mealType === 'lunch' ? 'bg-green-500' : 'bg-blue-500';
  
  const badgeText = isOrder 
    ? (meal.mealType === 'lunch' ? 'ORDER LUNCH' : 'ORDER DINNER')
    : (meal.mealType === 'lunch' ? 'SUB LUNCH' : 'SUB DINNER');
  
  return (
    <div className={`group relative overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-md ${
      isPaused 
        ? 'bg-gray-100 border-gray-300' 
        : isToday
        ? 'bg-gradient-to-r from-violet-50 to-white border-violet-200'
        : 'bg-white border-gray-200 hover:border-violet-200'
    } ${isPaused ? 'opacity-70' : ''}`}>
      
      {/* Meal Image */}
      <div className="relative h-24 overflow-hidden">
        <img
          src={imageUrl}
          alt={menuItem?.name || 'Meal'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = FALLBACK_IMAGE;
          }}
        />
        
        {/* Source & Meal Type Badge */}
        <div className={`absolute top-2 left-2 px-2 py-1 rounded text-[10px] font-bold text-white ${badgeColor}`}>
          {badgeText}
        </div>
        
        {/* Order Status Badge (for orders only) */}
        {isOrder && meal.status && (
          <div className={`absolute top-2 right-2 px-2 py-1 rounded text-[10px] font-bold ${
            meal.status === 'pending' ? 'bg-yellow-500' :
            meal.status === 'cooking' ? 'bg-blue-500' :
            meal.status === 'ready' ? 'bg-green-500' :
            meal.status === 'completed' ? 'bg-gray-500' :
            'bg-red-500'
          } text-white`}>
            {meal.status.toUpperCase()}
          </div>
        )}
        
        {/* Price Badge */}
        <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-black/70 text-white text-xs font-bold">
          {menuItem?.price || meal.price || 0} BDT
        </div>
      </div>
      
      {/* Meal Details */}
      <div className="p-3">
        {/* Meal Name */}
        <h4 className="font-bold text-gray-900 text-sm mb-2 line-clamp-1">
          {menuItem?.name || 'Unknown Meal'}
        </h4>
        
        {/* Description */}
        {menuItem?.description && (
          <p className="text-xs text-gray-600 mb-3 line-clamp-2">
            {menuItem.description}
          </p>
        )}
        
        {/* Restaurant Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={meal.restaurantImage || FALLBACK_IMAGE}
              alt={meal.restaurantName}
              className="w-6 h-6 object-cover rounded-full border border-gray-300"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = FALLBACK_IMAGE;
              }}
            />
            <span className="text-xs text-gray-700 font-medium truncate max-w-[100px]">
              {meal.restaurantName}
            </span>
          </div>
          
          {/* Quantity */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">Qty:</span>
            <span className="text-xs font-bold text-violet-700">{meal.quantity || 1}</span>
          </div>
        </div>
        
        {/* Additional Info */}
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
          {menuItem?.calories && (
            <span className="text-[10px] text-gray-500">
              🔥 {menuItem.calories} cal
            </span>
          )}
          
          {isPaused ? (
            <span className="text-[10px] text-gray-500 font-medium">⏸️ Paused</span>
          ) : isOrder ? (
            <span className="text-[10px] text-blue-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Order
            </span>
          ) : (
            <span className="text-[10px] text-green-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              Active
            </span>
          )}
        </div>
      </div>
    </div>
  );
}