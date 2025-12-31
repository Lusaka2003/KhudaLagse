import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaCalendarAlt, 
  FaShoppingCart, 
  FaCreditCard, 
  FaTruck, 
  FaUtensils, 
  FaStar,
  FaClock,
  FaCheckCircle,
  FaRegCalendarCheck
} from 'react-icons/fa';

export default function Plans() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    { number: 1, title: "Browse & Select", icon: <FaCalendarAlt /> },
    { number: 2, title: "Add to Cart", icon: <FaShoppingCart /> },
    { number: 3, title: "Checkout", icon: <FaCreditCard /> },
    { number: 4, title: "Delivery", icon: <FaTruck /> },
    { number: 5, title: "Enjoy!", icon: <FaUtensils /> }
  ];

  const subscriptionPlans = [
    {
      name: "Casual Eater",
      price: "399",
      period: "week",
      description: "Perfect for trying out different restaurants",
      features: [
        "3 meals per week",
        "Free delivery",
        "Choose between lunch/dinner",
        "Flexible scheduling",
        "Cancel anytime"
      ],
      popular: false,
      color: "bg-violet-50 border-violet-200"
    },
    {
      name: "Regular Foodie",
      price: "699",
      period: "week",
      description: "For those who love variety in their meals",
      features: [
        "7 meals per week",
        "Free priority delivery",
        "Mix & match restaurants",
        "Early access to new menus",
        "10% discount on extras",
        "Cancel anytime"
      ],
      popular: true,
      color: "bg-violet-100 border-violet-300"
    },
    {
      name: "Ultimate Gourmet",
      price: "2499",
      period: "month",
      description: "Unlimited access to premium dining experience",
      features: [
        "Unlimited meals (2 per day)",
        "Free express delivery",
        "Access to all premium restaurants",
        "Personalized meal planning",
        "20% discount on all orders",
        "Priority customer support",
        "Free weekly dessert"
      ],
      popular: false,
      color: "bg-violet-50 border-violet-200"
    }
  ];

  const orderingInstructions = [
    {
      step: 1,
      title: "Browse Restaurants & Menus",
      description: "Explore our curated list of restaurants. View their weekly/monthly menus, read reviews, and check ratings.",
      details: [
        "Click on 'Restaurants' in the navigation",
        "Browse different cuisines and chefs",
        "Check the 'Today', 'Weekly', or 'Monthly' menu view",
        "Read customer reviews and ratings"
      ],
      tip: "Use the filter options to find restaurants near you or by cuisine type."
    },
    {
      step: 2,
      title: "Select Your Meals",
      description: "Choose your preferred meals for specific dates. Remember our ordering deadlines!",
      details: [
        "Lunch orders must be placed before 10:00 AM",
        "Dinner orders must be placed before 4:00 PM",
        "You can order for future dates anytime",
        "Add multiple items from different restaurants"
      ],
      warning: "⚠️ Orders placed after deadlines will be scheduled for the next available day."
    },
    {
      step: 3,
      title: "Review Your Cart",
      description: "Check your selected items, quantities, and delivery dates before proceeding.",
      details: [
        "Review all items in your cart",
        "Check delivery dates and times",
        "Modify quantities if needed",
        "Apply promo codes if available"
      ],
      tip: "The floating cart icon shows your current order total and item count."
    },
    {
      step: 4,
      title: "Complete Checkout",
      description: "Enter delivery details, choose payment method, and confirm your order.",
      details: [
        "Verify your delivery address",
        "Select payment method (Wallet/Card/COD)",
        "Add special instructions if needed",
        "Review the final total"
      ],
      note: "Wallet balance can be topped up in your dashboard for faster checkout."
    },
    {
      step: 5,
      title: "Track & Enjoy",
      description: "Track your order status and get ready for delicious food delivery!",
      details: [
        "Receive order confirmation",
        "Track delivery in real-time",
        "Rate your meals after enjoying",
        "Save favorite restaurants for next time"
      ],
      tip: "Enable notifications for order updates and delivery status."
    }
  ];

  const benefits = [
    {
      icon: <FaClock className="text-violet-600" />,
      title: "Save Time",
      description: "No more daily meal decisions. Plan your meals in advance."
    },
    {
      icon: <FaStar className="text-amber-500" />,
      title: "Quality Guaranteed",
      description: "All restaurants are vetted for quality and hygiene standards."
    },
    {
      icon: <FaRegCalendarCheck className="text-green-600" />,
      title: "Flexible Scheduling",
      description: "Order for specific dates or set up automatic subscriptions."
    },
    {
      icon: <FaCheckCircle className="text-blue-600" />,
      title: "Hassle-Free",
      description: "No cooking, no cleaning, just delicious food delivered."
    }
  ];

  return (
    <div 
      className="min-h-screen bg-cover bg-fixed"
      style={{ backgroundImage: `url(/background.png)` }}
    >
      <div className="pt-28 pb-16 px-4 max-w-7xl mx-auto">
        
        {/* Hero Section */}
        <div className="text-center mb-16">
        {/* Transparent backdrop container */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 md:p-12 shadow-lg border border-white/20 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Simple Plans, <span className="text-violet-600">Delicious Results</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Choose from flexible subscription plans or order à la carte. Either way, 
            you get fresh, home-cooked meals delivered right to your door.
            </p>
        </div>
        </div>

        {/* How to Order Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-16 border border-gray-200">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">How to Order</h2>
            <p className="text-gray-600">Follow these simple steps to get your delicious meals</p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-between mb-12 relative">
            <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200 -z-10"></div>
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold mb-3 transition-all duration-300 ${
                    activeStep >= step.number 
                      ? 'bg-violet-600 text-white shadow-lg scale-110' 
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step.icon}
                </div>
                <span className={`text-sm font-medium ${
                  activeStep >= step.number ? 'text-violet-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>

          {/* Step Navigation */}
          <div className="flex justify-center gap-4 mb-12">
            <button
              onClick={() => setActiveStep(prev => prev > 1 ? prev - 1 : 1)}
              disabled={activeStep === 1}
              className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous Step
            </button>
            <button
              onClick={() => setActiveStep(prev => prev < 5 ? prev + 1 : 5)}
              disabled={activeStep === 5}
              className="px-6 py-2 rounded-lg bg-violet-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-violet-700"
            >
              Next Step
            </button>
          </div>

          {/* Step Details */}
          <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-xl text-violet-600">
                {orderingInstructions[activeStep - 1].step}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">
                  {orderingInstructions[activeStep - 1].title}
                </h3>
                <p className="text-gray-600">
                  {orderingInstructions[activeStep - 1].description}
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">What to do:</h4>
                <ul className="space-y-3">
                  {orderingInstructions[activeStep - 1].details.map((detail, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5 flex-shrink-0">
                        <span className="text-green-600 text-xs">✓</span>
                      </div>
                      <span className="text-gray-700">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-blue-500">💡</span> 
                  Pro Tip
                </h4>
                <p className="text-gray-600 text-sm">
                  {orderingInstructions[activeStep - 1].tip}
                </p>
                
                {orderingInstructions[activeStep - 1].warning && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-700 font-medium">
                      <span>⚠️</span> Important Note
                    </div>
                    <p className="text-amber-600 text-sm mt-1">
                      {orderingInstructions[activeStep - 1].warning}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Visual Demo */}
            {activeStep === 1 && (
              <div className="mt-8 p-6 bg-gradient-to-r from-violet-50 to-blue-50 rounded-xl border border-violet-200">
                <h4 className="font-semibold text-gray-700 mb-4">Quick Demo:</h4>
                <div className="flex items-center justify-center gap-8">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-xl bg-white border-2 border-violet-300 flex items-center justify-center text-2xl mb-2">
                      🏠
                    </div>
                    <p className="text-sm text-gray-600">Browse Restaurants</p>
                  </div>
                  <div className="text-2xl text-gray-400">→</div>
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-xl bg-white border-2 border-violet-300 flex items-center justify-center text-2xl mb-2">
                      📅
                    </div>
                    <p className="text-sm text-gray-600">View Menus</p>
                  </div>
                  <div className="text-2xl text-gray-400">→</div>
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-xl bg-white border-2 border-violet-300 flex items-center justify-center text-2xl mb-2">
                      ⭐
                    </div>
                    <p className="text-sm text-gray-600">Check Reviews</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">
            Why Choose Khudalagse
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-4">{benefit.icon}</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

    
        {/* Subscription Plans */}
        <div className="mb-16">
        <div className="text-center mb-10">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 max-w-3xl mx-auto mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Flexible Subscription Plans</h2>
            <p className="text-gray-600">Choose how often you want delicious meals delivered</p>
            </div>
            <div className="bg-violet-50 rounded-xl p-4 max-w-2xl mx-auto border border-violet-200">
            <p className="text-sm text-violet-700">
                💡 <span className="font-semibold">Note:</span> Subscription prices vary by restaurant. 
                Each restaurant sets their own subscription prices based on their menu and quality.
            </p>
            </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
            {/* Daily Plan */}
            <div className="relative rounded-2xl p-8 border-2 border-amber-200 bg-gradient-to-b from-amber-50 to-white transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-amber-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Flexible
                </span>
            </div>
            
            <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-2xl mb-4 mx-auto">
                📅
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Daily Orders</h3>
                <p className="text-gray-600 text-sm mb-4">Perfect for spontaneous cravings</p>
                <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-gray-800">Restaurant</span>
                <span className="text-gray-500">Pricing</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">Pay per meal, no commitment</p>
                <p className="text-xs text-gray-500 mt-2">Pay Minimal Delivery Fee</p>
            </div>

            <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-xs">✓</span>
                </div>
                <span className="text-gray-700 text-sm">Order lunch or dinner daily</span>
                </li>
                <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-xs">✓</span>
                </div>
                <span className="text-gray-700 text-sm">Choose different restaurants each day</span>
                </li>
                <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-xs">✓</span>
                </div>
                <span className="text-gray-700 text-sm">No subscription required</span>
                </li>
                <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-xs">✓</span>
                </div>
                <span className="text-gray-700 text-sm">Pay as you go</span>
                </li>
                <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-xs">✓</span>
                </div>
                <span className="text-gray-700 text-sm">Perfect for new customers</span>
                </li>
            </ul>

            <button
                onClick={() => navigate('/register')}
                className="w-full py-3 rounded-lg font-semibold transition bg-amber-100 text-amber-700 hover:bg-amber-200"
            >
                Get Started
            </button>
            </div>

            {/* Weekly Plan */}
            <div className="relative rounded-2xl p-8 border-2 border-violet-500 shadow-lg bg-gradient-to-b from-violet-50 to-white transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-violet-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
                </span>
            </div>
            
            <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center text-2xl mb-4 mx-auto">
                📦
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Weekly Subscription</h3>
                <p className="text-gray-600 text-sm mb-4">Save time with weekly meal planning</p>
                <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-gray-800">Free Delivery</span>
             
                </div>
                <p className="text-sm text-gray-500 mt-2">Per restaurant weekly pricing</p>
            </div>

            <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-xs">✓</span>
                </div>
                <span className="text-gray-700 text-sm">Plan meals for the entire week</span>
                </li>
                <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-xs">✓</span>
                </div>
                <span className="text-gray-700 text-sm">Order lunch and dinner for the week</span>
                </li>
                <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-xs">✓</span>
                </div>
                <span className="text-gray-700 text-sm">Free delivery on all weekly orders</span>
                </li>
                <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-xs">✓</span>
                </div>
                <span className="text-gray-700 text-sm">Priority scheduling</span>
                </li>
                <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-xs">✓</span>
                </div>
                <span className="text-gray-700 text-sm">Pause or cancel anytime</span>
                </li>
            </ul>

            <button
                onClick={() => navigate('/register')}
                className="w-full py-3 rounded-lg font-semibold transition bg-violet-600 text-white hover:bg-violet-700"
            >
                Get Started
            </button>
            </div>

            {/* Monthly Plan */}
            <div className="relative rounded-2xl p-8 border-2 border-blue-200 bg-gradient-to-b from-blue-50 to-white transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Best Value
                </span>
            </div>
            
            <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl mb-4 mx-auto">
                🏆
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Monthly Subscription</h3>
                <p className="text-gray-600 text-sm mb-4">Maximum savings for regular customers</p>
                <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-gray-800">10%</span>
                <span className="text-gray-500">Discount</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">Per restaurant monthly pricing</p>
            </div>

            <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-xs">✓</span>
                </div>
                <span className="text-gray-700 text-sm">Get 10% discount on monthly orders</span>
                </li>
                <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-xs">✓</span>
                </div>
                <span className="text-gray-700 text-sm">Free express delivery</span>
                </li>
                <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-xs">✓</span>
                </div>
                <span className="text-gray-700 text-sm">Priority access to new menu items</span>
                </li>
                <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-xs">✓</span>
                </div>
                <span className="text-gray-700 text-sm">Free weekly dessert or appetizer</span>
                </li>
                <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-xs">✓</span>
                </div>
                <span className="text-gray-700 text-sm">Dedicated customer support</span>
                </li>
                <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-xs">✓</span>
                </div>
                <span className="text-gray-700 text-sm">Flexible pause up to 7 days/month</span>
                </li>
            </ul>

            <button
                onClick={() => navigate('/register')}
                className="w-full py-3 rounded-lg font-semibold transition bg-blue-100 text-blue-700 hover:bg-blue-200"
            >
                Get Started
            </button>
            </div>
        </div>

        {/* How It Works Section */}
        <div className="mt-12 bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">How Restaurant Pricing Works</h3>
            <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4">
                <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-xl text-violet-600 mb-4 mx-auto">
                1
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">Restaurant Sets Prices</h4>
                <p className="text-gray-600 text-sm">
                Each restaurant determines their own subscription prices based on their menu quality, ingredients, and portion sizes.
                </p>
            </div>
            <div className="text-center p-4">
                <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-xl text-violet-600 mb-4 mx-auto">
                2
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">View Restaurant Plans</h4>
                <p className="text-gray-600 text-sm">
                When you visit a restaurant's page, you'll see their specific daily, weekly, and monthly pricing options.
                </p>
            </div>
            <div className="text-center p-4">
                <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-xl text-violet-600 mb-4 mx-auto">
                3
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">Subscribe & Save</h4>
                <p className="text-gray-600 text-sm">
                Choose your preferred subscription frequency and enjoy exclusive discounts from that restaurant.
                </p>
            </div>
            </div>
            
            <div className="mt-8 text-center">
            <button
                onClick={() => navigate('/restaurants')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
            >
                <span>Explore Restaurant Plans</span>
                <span>→</span>
            </button>
            <p className="text-gray-500 text-sm mt-4">
                Different restaurants offer different subscription benefits. Browse to find your perfect match!
            </p>
            </div>
        </div>
        </div>
        {/* CTA Section */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-10 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Food Journey?</h2>
          <p className="text-violet-100 mb-8 max-w-2xl mx-auto">
            Join thousands of happy customers who have simplified their meal planning with Khudalagse.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => navigate('/restaurants')}
              className="px-8 py-3 bg-white text-violet-600 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Browse Restaurants
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition"
            >
              Sign Up Free
            </button>
          </div>
          <p className="text-violet-200 text-sm mt-6">
            No credit card required to browse. Start ordering in minutes!
          </p>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Frequently Asked Questions
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-4">
                <h4 className="font-semibold text-gray-800 mb-2">Can I change my order after placing it?</h4>
                <p className="text-gray-600 text-sm">
                  Yes, you can modify or cancel your order up to 2 hours before the delivery time.
                </p>
              </div>
              <div className="border-b border-gray-200 pb-4">
                <h4 className="font-semibold text-gray-800 mb-2">What if I'm not home for delivery?</h4>
                <p className="text-gray-600 text-sm">
                  Our delivery partners will contact you. You can reschedule or leave delivery instructions.
                </p>
              </div>
              <div className="border-b border-gray-200 pb-4">
                <h4 className="font-semibold text-gray-800 mb-2">How do subscriptions work?</h4>
                <p className="text-gray-600 text-sm">
                  Choose a plan, select your meals, and we'll deliver on your schedule. Pause or cancel anytime.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-4">
                <h4 className="font-semibold text-gray-800 mb-2">Are there any delivery fees?</h4>
                <p className="text-gray-600 text-sm">
                  Subscriptions include free delivery. À la carte orders may have minimal delivery charges.
                </p>
              </div>
              <div className="border-b border-gray-200 pb-4">
                <h4 className="font-semibold text-gray-800 mb-2">Can I order from multiple restaurants?</h4>
                <p className="text-gray-600 text-sm">
                  Absolutely! You can mix and match from different restaurants in the same order.
                </p>
              </div>
              <div className="border-b border-gray-200 pb-4">
                <h4 className="font-semibold text-gray-800 mb-2">What payment methods do you accept?</h4>
                <p className="text-gray-600 text-sm">
                  We accept credit/debit cards, mobile banking, and cash on delivery for most areas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}