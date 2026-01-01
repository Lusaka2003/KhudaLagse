import Order from '../models/Order.js';
import User from '../models/User.js';
import MenuItem from '../models/MenuItem.js';
import Subscription from '../models/Subscription.js';
import Wallet from '../models/Wallet.js';

// Create a new order
export const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      restaurantId, 
      items, 
      total, 
      deliveryDateTime, 
      paymentMethod = 'wallet',
      subscriptionId 
    } = req.body;

    // Validation
    if (!restaurantId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Restaurant ID and at least one item are required' 
      });
    }

    // Verify restaurant exists
    const restaurant = await User.findById(restaurantId);
    if (!restaurant || restaurant.role !== 'restaurant') {
      return res.status(404).json({ 
        success: false, 
        message: 'Restaurant not found' 
      });
    }

    // Validate and enrich items with menu data
    const enrichedItems = [];
    let calculatedTotal = 0;

    for (const item of items) {
      if (!item.itemId || !item.quantity || item.quantity < 1) {
        return res.status(400).json({ 
          success: false, 
          message: 'Each item must have a valid itemId and quantity' 
        });
      }

      // Get menu item details
      const menuItem = await MenuItem.findById(item.itemId).lean();
      if (!menuItem) {
        return res.status(404).json({ 
          success: false, 
          message: `Menu item ${item.itemId} not found` 
        });
      }

      // Verify menu item belongs to the restaurant
      if (menuItem.restaurant.toString() !== restaurantId) {
        return res.status(400).json({ 
          success: false, 
          message: `Menu item ${menuItem.name} does not belong to this restaurant` 
        });
      }

      // Use menu item price if not provided
      const price = item.price || menuItem.price;
      
      enrichedItems.push({
        itemId: item.itemId,
        quantity: item.quantity,
        price,
        mealType: item.mealType || menuItem.mealType || 'lunch',
        day: item.day || menuItem.day || null,
        // Store snapshot for quick reference
        menuSnapshot: {
          name: menuItem.name,
          imageUrl: menuItem.imageUrl,
          description: menuItem.description,
          calories: menuItem.calories
        }
      });

      calculatedTotal += price * item.quantity;
    }

    // Validate total
    if (total && Math.abs(total - calculatedTotal) > 0.01) {
      return res.status(400).json({ 
        success: false, 
        message: `Total mismatch. Calculated: ${calculatedTotal}, Provided: ${total}` 
      });
    }

    // Check wallet balance for wallet payments
    if (paymentMethod === 'wallet') {
      const wallet = await Wallet.findOne({ user: userId });
      if (!wallet || wallet.balance < calculatedTotal) {
        return res.status(400).json({ 
          success: false, 
          message: 'Insufficient wallet balance',
          required: calculatedTotal,
          current: wallet?.balance || 0
        });
      }

      // Deduct from wallet
      wallet.balance -= calculatedTotal;
      await wallet.save();
    }

    // Parse delivery date
    const deliveryDate = deliveryDateTime ? new Date(deliveryDateTime) : new Date();
    deliveryDate.setHours(13, 0, 0, 0); // Default to 1 PM if not specified

    // Create the order
    const order = await Order.create({
      restaurantId,
      userId,
      items: enrichedItems,
      total: calculatedTotal,
      status: paymentMethod === 'wallet' ? 'pending' : 'unpaid',
      deliveryDateTime: deliveryDate,
      subscriptionId,
      paymentStatus: paymentMethod === 'wallet' ? 'paid' : 'unpaid',
      isSubscription: !!subscriptionId
    });

    // Populate for response
    const populatedOrder = await Order.findById(order._id)
      .populate('restaurantId', 'name imageUrl')
      .populate('userId', 'name email')
      .lean();

    res.status(201).json({ 
      success: true, 
      data: populatedOrder,
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to create order' 
    });
  }
};

// Get orders for the current user
// In orderController.js - getOrders function
export const getOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      startDate, 
      endDate, 
      status, 
      mealType,
      populate = 'true', // Default to true
      limit = 50,
      page = 1 
    } = req.query;

    // Build query
    let query = { userId };
    
    // Date range filter
    if (startDate || endDate) {
      query.deliveryDateTime = {};
      if (startDate) {
        query.deliveryDateTime.$gte = new Date(startDate);
      }
      if (endDate) {
        query.deliveryDateTime.$lte = new Date(endDate);
      }
    }
    
    // Status filter
    if (status && ['pending', 'cooking', 'ready', 'completed', 'cancelled'].includes(status)) {
      query.status = status;
    }
    
    // Meal type filter
    if (mealType && ['lunch', 'dinner'].includes(mealType)) {
      query['items.mealType'] = mealType;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build base query - ALWAYS POPULATE!
    let orderQuery = Order.find(query)
      .populate('restaurantId', 'name imageUrl address phone')
      .populate('subscriptionId')
      .populate({
        path: 'items.itemId', // THIS IS CRITICAL
        select: 'name description price calories ingredients imageUrl mealType day date restaurant',
        model: 'MenuItem'
      })
      .sort({ deliveryDateTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const [orders, total] = await Promise.all([
      orderQuery.lean(),
      Order.countDocuments(query)
    ]);

    // Calculate upcoming and past orders
    const now = new Date();
    const upcomingOrders = orders.filter(order => 
      new Date(order.deliveryDateTime) > now && 
      order.status !== 'cancelled'
    ).length;

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      summary: {
        totalOrders: total,
        upcomingOrders,
        pastOrders: total - upcomingOrders
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch orders' 
    });
  }
};

// Get orders for calendar view
export const getOrdersForCalendar = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Start date and end date are required' 
      });
    }

    const orders = await Order.find({
      userId,
      deliveryDateTime: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    })
    .populate('restaurantId', 'name imageUrl')
    .populate({
      path: 'items.itemId',
      select: 'name price imageUrl description calories mealType',
      model: 'MenuItem'
    })
    .select('-paymentStatus -isSubscription') // Exclude unnecessary fields
    .lean();

    // Format for calendar
    const calendarData = {};
    orders.forEach(order => {
      const dateStr = new Date(order.deliveryDateTime).toISOString().split('T')[0];
      
      if (!calendarData[dateStr]) {
        calendarData[dateStr] = {
          date: dateStr,
          orders: [],
          totalMeals: 0,
          totalAmount: 0
        };
      }

      // Flatten items for easier display
      const flattenedItems = order.items.map(item => ({
        ...item,
        orderId: order._id,
        restaurant: order.restaurantId,
        status: order.status,
        deliveryDateTime: order.deliveryDateTime
      }));

      calendarData[dateStr].orders.push(...flattenedItems);
      calendarData[dateStr].totalMeals += order.items.reduce((sum, item) => sum + item.quantity, 0);
      calendarData[dateStr].totalAmount += order.total;
    });

    // Convert to array
    const result = Object.values(calendarData).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    res.json({
      success: true,
      data: result,
      totalDays: result.length,
      totalOrders: orders.length
    });
  } catch (error) {
    console.error('Error fetching calendar orders:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch calendar data' 
    });
  }
};

// Get orders for a restaurant
export const getRestaurantOrders = async (req, res) => {
  try {
    const restaurantId = req.user.id; // Restaurant owner's ID
    
    // Verify user is a restaurant
    const user = await User.findById(restaurantId);
    if (!user || user.role !== 'restaurant') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only restaurants can view their orders' 
      });
    }

    const { 
      date, 
      status, 
      mealType,
      sort = 'deliveryDateTime',
      order = 'asc'
    } = req.query;

    let query = { restaurantId };
    
    // Date filter
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      
      query.deliveryDateTime = {
        $gte: startDate,
        $lt: endDate
      };
    }
    
    // Status filter
    if (status && ['pending', 'cooking', 'ready', 'completed', 'cancelled'].includes(status)) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('userId', 'name email phone')
      .populate({
        path: 'items.itemId',
        select: 'name price imageUrl mealType',
        model: 'MenuItem'
      })
      .sort({ [sort]: order === 'desc' ? -1 : 1 })
      .lean();

    // Group by meal type for summary
    const summary = {
      pending: orders.filter(o => o.status === 'pending').length,
      cooking: orders.filter(o => o.status === 'cooking').length,
      ready: orders.filter(o => o.status === 'ready').length,
      total: orders.length,
      totalAmount: orders.reduce((sum, order) => sum + order.total, 0)
    };

    res.json({
      success: true,
      data: orders,
      summary
    });
  } catch (error) {
    console.error('Error fetching restaurant orders:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch restaurant orders' 
    });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!status || !['pending', 'cooking', 'ready', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid status is required' 
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Check permissions
    const user = await User.findById(userId);
    if (user.role === 'restaurant' && order.restaurantId.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this order' 
      });
    }

    if (user.role === 'customer' && order.userId.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this order' 
      });
    }

    // Update status
    order.status = status;
    await order.save();

    res.json({
      success: true,
      data: order,
      message: `Order status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update order status' 
    });
  }
};

// Cancel order
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Verify ownership
    if (order.userId.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to cancel this order' 
      });
    }

    // Check if order can be cancelled
    const now = new Date();
    const deliveryTime = new Date(order.deliveryDateTime);
    const hoursDiff = (deliveryTime - now) / (1000 * 60 * 60);

    if (hoursDiff < 3) {
      return res.status(400).json({ 
        success: false, 
        message: 'Orders can only be cancelled at least 3 hours before delivery' 
      });
    }

    // Update status
    order.status = 'cancelled';
    await order.save();

    // Refund wallet if paid
    if (order.paymentStatus === 'paid') {
      const wallet = await Wallet.findOne({ user: userId });
      if (wallet) {
        wallet.balance += order.total;
        await wallet.save();
      }
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      refunded: order.paymentStatus === 'paid' ? order.total : 0
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to cancel order' 
    });
  }
};

// Get single order with details
export const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findById(id)
      .populate('restaurantId', 'name imageUrl address phone')
      .populate('userId', 'name email phone')
      .populate('subscriptionId')
      .populate({
        path: 'items.itemId',
        select: 'name description price calories ingredients imageUrl mealType day date restaurant',
        populate: {
          path: 'restaurant',
          select: 'name imageUrl'
        }
      })
      .lean();

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Check permissions
    const user = await User.findById(userId);
    const isOwner = order.userId._id.toString() === userId;
    const isRestaurantOwner = user.role === 'restaurant' && 
      order.restaurantId._id.toString() === userId;
    
    if (!isOwner && !isRestaurantOwner) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to view this order' 
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch order details' 
    });
  }
};

// Get today's orders
export const getTodaysOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let query = { deliveryDateTime: { $gte: today, $lt: tomorrow } };

    // Filter by role
    if (user.role === 'restaurant') {
      query.restaurantId = userId;
    } else if (user.role === 'customer') {
      query.userId = userId;
    } else {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }

    const orders = await Order.find(query)
      .populate(user.role === 'restaurant' ? 'userId' : 'restaurantId', 'name imageUrl')
      .populate({
        path: 'items.itemId',
        select: 'name price imageUrl mealType',
        model: 'MenuItem'
      })
      .sort({ deliveryDateTime: 1 })
      .lean();

    // Group by meal type
    const lunchOrders = orders.filter(order => 
      order.items.some(item => 
        item.itemId?.mealType === 'lunch' || 
        item.mealType === 'lunch'
      )
    );
    
    const dinnerOrders = orders.filter(order => 
      order.items.some(item => 
        item.itemId?.mealType === 'dinner' || 
        item.mealType === 'dinner'
      )
    );

    res.json({
      success: true,
      data: {
        all: orders,
        lunch: lunchOrders,
        dinner: dinnerOrders,
        summary: {
          total: orders.length,
          lunch: lunchOrders.length,
          dinner: dinnerOrders.length,
          totalAmount: orders.reduce((sum, order) => sum + order.total, 0)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching today\'s orders:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch today\'s orders' 
    });
  }
};

// Get upcoming orders (next 7 days)
export const getUpcomingOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 7 } = req.query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + parseInt(days));

    const orders = await Order.find({
      userId,
      deliveryDateTime: { $gte: today, $lt: endDate },
      status: { $ne: 'cancelled' }
    })
    .populate('restaurantId', 'name imageUrl')
    .populate({
      path: 'items.itemId',
      select: 'name price imageUrl mealType description',
      model: 'MenuItem'
    })
    .sort({ deliveryDateTime: 1 })
    .lean();

    // Group by date
    const ordersByDate = {};
    orders.forEach(order => {
      const dateStr = new Date(order.deliveryDateTime).toISOString().split('T')[0];
      if (!ordersByDate[dateStr]) {
        ordersByDate[dateStr] = [];
      }
      ordersByDate[dateStr].push(order);
    });

    res.json({
      success: true,
      data: orders,
      groupedByDate: ordersByDate,
      totalDays: Object.keys(ordersByDate).length,
      totalOrders: orders.length
    });
  } catch (error) {
    console.error('Error fetching upcoming orders:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch upcoming orders' 
    });
  }
};