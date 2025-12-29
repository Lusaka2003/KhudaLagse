import { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const FALLBACK_IMAGE = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800';

export default function MealCalendar() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(new Date());

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get('/api/subscriptions');
      setSubscriptions(data.data || []);
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
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

  // Get meals for a specific day
  const getMealsForDay = (dayName, date) => {
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
            status: sub.status,
          });
        }
      });
    });
    
    return meals;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  const activeSubscriptions = subscriptions.filter(s => s.status === 'active' || s.status === 'paused');
  
  if (activeSubscriptions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="text-6xl mb-4">📅</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Subscriptions</h3>
        <p className="text-gray-600">Create a subscription to see your meal calendar</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Meal Calendar</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={prevWeek}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition"
          >
            ← Prev
          </button>
          <span className="text-sm font-medium text-gray-700">
            {weekDates[0].date.toLocaleDateString()} - {weekDates[6].date.toLocaleDateString()}
          </span>
          <button
            onClick={nextWeek}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition"
          >
            Next →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDates.map(({ day, date, dayName }) => {
          const meals = getMealsForDay(day, date);
          const isToday = date.toDateString() === new Date().toDateString();
          
          return (
            <div
              key={day}
              className={`border-2 rounded-lg p-3 min-h-[200px] ${
                isToday ? 'border-violet-500 bg-violet-50' : 'border-gray-200'
              }`}
            >
              <div className="font-bold text-sm mb-2 text-gray-900">
                {dayName}
              </div>
              <div className="text-xs text-gray-500 mb-3">
                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              
              <div className="space-y-2">
                {/* Lunch */}
                <div>
                  <div className="text-xs font-semibold text-violet-700 mb-1">🍽️ Lunch</div>
                  {meals.filter(m => m.mealType === 'lunch').map((meal, idx) => (
                    <MealCard key={idx} meal={meal} />
                  ))}
                  {meals.filter(m => m.mealType === 'lunch').length === 0 && (
                    <div className="text-xs text-gray-400 italic">No meals</div>
                  )}
                </div>
                
                {/* Dinner */}
                <div>
                  <div className="text-xs font-semibold text-violet-700 mb-1">🌙 Dinner</div>
                  {meals.filter(m => m.mealType === 'dinner').map((meal, idx) => (
                    <MealCard key={idx} meal={meal} />
                  ))}
                  {meals.filter(m => m.mealType === 'dinner').length === 0 && (
                    <div className="text-xs text-gray-400 italic">No meals</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MealCard({ meal }) {
  const menuItem = meal.menuItemId;
  const isPaused = meal.status === 'paused';
  
  return (
    <div className={`text-xs p-2 rounded border ${isPaused ? 'bg-gray-100 border-gray-300 opacity-60' : 'bg-white border-gray-200'}`}>
      <div className="flex items-start gap-2">
        <img
          src={menuItem?.imageUrl || FALLBACK_IMAGE}
          alt={menuItem?.name || 'Meal'}
          className="w-8 h-8 object-cover rounded"
        />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 truncate">
            {menuItem?.name || 'Unknown Meal'}
          </div>
          <div className="text-gray-600">
            Qty: {meal.quantity} × {meal.price} BDT
          </div>
          <div className="text-gray-500 text-[10px] truncate">
            {meal.restaurantName}
          </div>
          {isPaused && (
            <div className="text-orange-600 text-[10px] font-semibold mt-1">⏸️ Paused</div>
          )}
        </div>
      </div>
    </div>
  );
}

