import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import Plans from "./pages/Plans"
import Restaurants from './pages/Restaurants';
import Login from './pages/Login';
import Register from './pages/Register';
import RestaurantRegister from './pages/RestaurantRegister';

import DeliveryStaffRegistration from './pages/DeliveryStaffRegistration';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CustomerDashboard from './pages/CustomerDashboard';
import RestaurantDashboard from './pages/RestaurantDashboard';
import DeliveryStaffDashboard from './pages/DeliveryStaffDashboard';
import DeliveryStaffReviewSection from './pages/DeliveryStaffReviewSection';
import DeliveryStaffViewReview from './pages/DeliveryStaffViewReview';
import DeliveryStaffDeliveries from './pages/DeliveryStaffDeliveries';
import KitchenProfile from './pages/KitchenProfile';
import ManageMenu from './pages/ManageMenu';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/Orders';
import CustomerOrders from './pages/CustomerOrders';
import ReviewSection from './pages/ReviewSection';
import ViewReview from './pages/ViewReview';
import Wallet from './pages/Wallet';
import ReferralRewards from './pages/ReferralRewards';

// Admin Layout and Pages
import AdminLayout from './components/AdminLayout';
import Overview from './pages/admin/Overview';
import Users from './pages/admin/Users';
import Orders from './pages/admin/Orders';
import Deliveries from './pages/admin/Deliveries';
import Subscriptions from './pages/admin/Subscriptions';
import Meals from './pages/admin/Meals';
import Reports from './pages/admin/Reports';
import Referrals from './pages/admin/Referrals';
import Rewards from './pages/admin/Rewards';
import Reviews from './pages/admin/Reviews';

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/restaurants" element={<Restaurants />} />
          <Route path="/restaurants/:id" element={<KitchenProfile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/restaurant-signup" element={<RestaurantRegister />} />
          <Route path="/delivery-staff-signup" element={<DeliveryStaffRegistration />} />

          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard/customer" element={<CustomerDashboard />} />
          <Route path="/dashboard/restaurant" element={<RestaurantDashboard />} />
          <Route path="/dashboard/delivery-staff" element={<DeliveryStaffDashboard />} />
          
          {/* Admin Routes with Nested Layout */}
          <Route path="/dashboard/admin" element={<AdminLayout />}>
            <Route index element={<Overview />} />
            <Route path="users" element={<Users />} />
            <Route path="orders" element={<Orders />} />
            <Route path="deliveries" element={<Deliveries />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="meals" element={<Meals />} />
            <Route path="reports" element={<Reports />} />
            <Route path="referrals" element={<Referrals />} />
            <Route path="rewards" element={<Rewards />} />
            <Route path="reviews" element={<Reviews />} />
          </Route>
          
          <Route path="/restaurant/manage-menu" element={<ManageMenu />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/my-orders" element={<CustomerOrders />} />
          <Route path="/restaurants/:id/add-review" element={<ReviewSection />} />
          <Route path="/restaurants/:id/reviews" element={<ViewReview />} />
          <Route path="/delivery-staff/:id/add-review/:orderId" element={<DeliveryStaffReviewSection />} />
          <Route path="/delivery-staff/:id/reviews" element={<DeliveryStaffViewReview />} />
          <Route path="/delivery-staff/my-deliveries" element={<DeliveryStaffDeliveries />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/referrals" element={<ReferralRewards />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
