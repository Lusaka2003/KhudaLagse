import { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const FALLBACK_IMAGE = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800';

export default function MealCalendar() {
  const [mealsByDate, setMealsByDate] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('Selected week changed to:', selectedWeek);
    fetchMealsForWeek();
  }, [selectedWeek]);

  const fetchMealsForWeek = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Calculate date range for the week based on selectedWeek
      const weekStart = getWeekStart(selectedWeek);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      console.log('Fetching meals for week:', {
        selectedWeek: selectedWeek.toDateString(),
        weekStart: weekStart.toDateString(),
        weekEnd: weekEnd.toDateString(),
        startDate: formatDateForAPI(weekStart),
        endDate: formatDateForAPI(weekEnd)
      });
      
      const response = await axiosInstance.get('/api/orders/calendar', {
        params: {
          startDate: formatDateForAPI(weekStart),
          endDate: formatDateForAPI(weekEnd)
        }
      });
      
      console.log('API Response:', response.data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'API returned unsuccessful');
      }
      
      // Process the data
      const mealsMap = {};
      
      if (response.data.data && Array.isArray(response.data.data)) {
        response.data.data.forEach(dayData => {
          if (dayData.date && Array.isArray(dayData.orders)) {
            const dateStr = dayData.date.split('T')[0];
            
            mealsMap[dateStr] = dayData.orders.map(item => ({
              ...item,
              mealType: (item.mealType || 'lunch').toLowerCase(),
              quantity: item.quantity || 1,
              price: item.price || 0,
              status: item.status || 'pending',
              isSubscription: item.isSubscription || false,
              itemId: item.itemId || {},
              restaurant: item.restaurant || {}
            }));
          }
        });
      }
      
      console.log('Processed meals for dates:', Object.keys(mealsMap));
      setMealsByDate(mealsMap);
      
    } catch (error) {
      console.error('API Error:', error);
      setError(error.message || 'Failed to load meal calendar');
      setMealsByDate({});
    } finally {
      setLoading(false);
    }
  };

  // Format date for API as YYYY-MM-DD
  const formatDateForAPI = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get start of week (Sunday) for any given date
  const getWeekStart = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day;
    const weekStart = new Date(d.getFullYear(), d.getMonth(), diff);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  };

  // Get dates for the week based on selectedWeek
  const getWeekDates = () => {
    const weekStart = getWeekStart(selectedWeek);
    
    return DAYS.map((day, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      date.setHours(0, 0, 0, 0);
      return { 
        day, 
        date, 
        dayName: DAY_NAMES[index],
        display: date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        })
      };
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setSelectedWeek(today);
  };

  // Get meals for a specific date
  const getMealsForDate = (date) => {
    const dateStr = formatDateForAPI(date);
    return mealsByDate[dateStr] || [];
  };

  // Check if a date is today
  const isTodayDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate.getTime() === today.getTime();
  };

  // Check if a date is in the past
  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  // Helper to get week range display
  const getWeekRangeDisplay = () => {
    if (weekDates.length === 0) return '';
    const firstDay = weekDates[0];
    const lastDay = weekDates[6];
    return `${firstDay.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${lastDay.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
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

  if (error) {
    return (
      <div className="bg-red-50 rounded-2xl shadow-md p-6 text-center border border-red-200">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-2xl mb-4 mx-auto">
          ⚠️
        </div>
        <h3 className="text-xl font-bold text-red-900 mb-3">Error Loading Calendar</h3>
        <p className="text-red-700 mb-4">
          {error}
        </p>
        <button
          onClick={fetchMealsForWeek}
          className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Meal Calendar</h2>
          <p className="text-gray-600 text-sm mt-1">Your scheduled meals for the week</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={prevWeek}
            className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center"
            title="Previous week"
          >
            <span className="text-lg font-bold">←</span>
          </button>
          
          <div className="text-center min-w-[200px]">
            <div className="font-semibold text-gray-900 text-lg">
              {getWeekRangeDisplay()}
            </div>
            <div className="text-sm text-gray-500">
              Week of {weekDates[0]?.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </div>
          </div>
          
          <button
            onClick={nextWeek}
            className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center"
            title="Next week"
          >
            <span className="text-lg font-bold">→</span>
          </button>
          
          <button
            onClick={goToToday}
            className="ml-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-semibold hover:bg-violet-700 transition"
          >
            Today
          </button>
        </div>
      </div>

      {/* Week Calendar Grid - ALWAYS SHOW THIS */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDates.map(({ day, date, dayName, display }) => {
          const meals = getMealsForDate(date);
          const isToday = isTodayDate(date);
          const isPast = isPastDate(date);
          const hasMeals = meals.length > 0;
          
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
                <div className={`text-xl font-bold mt-1 flex items-center gap-2 ${
                  isToday ? 'text-violet-700' : 'text-gray-800'
                }`}>
                  {date.getDate()}
                  {isToday && (
                    <span className="px-2 py-1 bg-violet-100 text-violet-700 text-xs font-semibold rounded">
                      TODAY
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {display}
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
                    {hasMeals && (
                      <span className="text-xs text-gray-500">
                        ({meals.filter(m => m.mealType === 'lunch').length})
                      </span>
                    )}
                  </div>
                  
                  {hasMeals ? (
                    <>
                      {meals.filter(m => m.mealType === 'lunch').map((meal, idx) => (
                        <MealCard key={`lunch-${meal._id || meal.orderId || idx}`} meal={meal} isToday={isToday} />
                      ))}
                      {meals.filter(m => m.mealType === 'lunch').length === 0 && (
                        <div className="text-xs text-gray-400 italic pl-2">No lunch scheduled</div>
                      )}
                    </>
                  ) : (
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
                    {hasMeals && (
                      <span className="text-xs text-gray-500">
                        ({meals.filter(m => m.mealType === 'dinner').length})
                      </span>
                    )}
                  </div>
                  
                  {hasMeals ? (
                    <>
                      {meals.filter(m => m.mealType === 'dinner').map((meal, idx) => (
                        <MealCard key={`dinner-${meal._id || meal.orderId || idx}`} meal={meal} isToday={isToday} />
                      ))}
                      {meals.filter(m => m.mealType === 'dinner').length === 0 && (
                        <div className="text-xs text-gray-400 italic pl-2">No dinner scheduled</div>
                      )}
                    </>
                  ) : (
                    <div className="text-xs text-gray-400 italic pl-2">No dinner scheduled</div>
                  )}
                </div>
              </div>
              
              {/* Day Summary - Only show when there are meals */}
              {hasMeals && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500 flex items-center justify-between">
                    <span>Total Meals:</span>
                    <span className="font-semibold text-gray-700">{meals.length}</span>
                  </div>
                </div>
              )}
              
              {/* Empty state message for entire day */}
              {!hasMeals && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500 italic text-center">
                    No meals scheduled for {dayName}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Info message when no meals in the entire week */}
      {Object.keys(mealsByDate).length === 0 && (
        <div className="bg-gradient-to-br from-white to-violet-50 rounded-2xl shadow-md p-6 text-center border border-violet-100">
          <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-xl mb-3 mx-auto">
            📅
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No Meals This Week</h3>
          <p className="text-gray-600 text-sm mb-4">
            You don't have any meals scheduled for {getWeekRangeDisplay()}.
            Browse restaurants to place an order!
          </p>
          <button
            onClick={() => window.location.href = '/restaurants'}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg font-semibold hover:bg-violet-700 transition text-sm"
          >
            Browse Restaurants
          </button>
        </div>
      )}
    </div>
  );
}

function MealCard({ meal, isToday }) {
  if (!meal) return null;
  
  const menuItem = meal.itemId || {};
  const isSubscriptionOrder = meal.isSubscription || false;
  const imageUrl = menuItem?.imageUrl || FALLBACK_IMAGE;
  const badgeColor = meal.mealType === 'lunch' ? 'bg-orange-500' : 'bg-indigo-500';
  const badgeText = meal.mealType === 'lunch' ? 'LUNCH' : 'DINNER';
  
  return (
    <div className={`group relative overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-md mb-2 ${
      isToday
        ? 'bg-gradient-to-r from-violet-50 to-white border-violet-200'
        : 'bg-white border-gray-200 hover:border-violet-200'
    }`}>
      
      <div className="relative h-16 overflow-hidden">
        <img
          src={imageUrl}
          alt={menuItem?.name || 'Meal'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = FALLBACK_IMAGE;
          }}
        />
        
        {/* Meal Type Badge */}
        <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold text-white ${badgeColor}`}>
          {badgeText}
        </div>
        
        {/* Order Type Badge */}
        {isSubscriptionOrder && (
          <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-green-500 text-white">
            SUB
          </div>
        )}
        
        {/* Price Badge */}
        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] font-bold">
          {meal.price || menuItem?.price || 0} ৳
        </div>
      </div>
      
      <div className="p-2">
        <h4 className="font-bold text-gray-900 text-xs mb-1 line-clamp-1">
          {menuItem?.name || 'Meal'}
        </h4>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[8px]">
              🍴
            </div>
            <span className="text-[10px] text-gray-700 font-medium truncate max-w-[70px]">
              {meal.restaurant?.name || 'Restaurant'}
            </span>
          </div>
          
          {meal.quantity > 1 && (
            <span className="text-[10px] font-bold text-violet-700">×{meal.quantity}</span>
          )}
        </div>
        
        <div className="mt-1.5 pt-1.5 border-t border-gray-100">
          <span className={`text-[9px] font-medium flex items-center gap-1 ${
            meal.status === 'pending' ? 'text-yellow-600' :
            meal.status === 'cooking' ? 'text-blue-600' :
            meal.status === 'ready' ? 'text-green-600' :
            meal.status === 'completed' ? 'text-gray-600' :
            'text-gray-600'
          }`}>
            <span className={`w-1 h-1 rounded-full ${
              meal.status === 'pending' ? 'bg-yellow-500' :
              meal.status === 'cooking' ? 'bg-blue-500' :
              meal.status === 'ready' ? 'bg-green-500' :
              meal.status === 'completed' ? 'bg-gray-500' :
              'bg-gray-500'
            }`}></span>
            {(meal.status || 'pending').toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}