// controllers/adminController.js
const User = require('../models/User');
const Order = require('../models/Order');

// ========== STATISTICHE ==========
exports.getDashboardStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments();
    const paidOrders = await Order.countDocuments({ status: 'paid' });
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    
    // Calcola totale incasso (da ordini pagati)
    const orders = await Order.find({ status: 'paid' });
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    
    // Ultimi 10 ordini
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name email');
    
    res.json({
      success: true,
      stats: {
        totalOrders,
        totalUsers,
        paidOrders,
        pendingOrders,
        totalRevenue,
        conversionRate: totalOrders > 0 ? (paidOrders / totalOrders * 100).toFixed(1) : 0
      },
      recentOrders
    });
  } catch (error) {
    console.error('Errore dashboard admin:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
};

// ========== LISTA ORDINI (TUTTI) ==========
exports.getAllOrders = async (req, res) => {
  try {
    const { limit = 50, page = 1, status, paymentStatus, search, email } = req.query;
    const skip = (page - 1) * limit;
    
    const query = {};
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    
    // Ricerca per orderNumber (case-insensitive)
    if (search) {
      query.orderNumber = { $regex: search, $options: 'i' };
    }
    
    // Ricerca per email utente
    let userIds = [];
    if (email) {
      const users = await User.find({ email: { $regex: email, $options: 'i' } }).select('_id');
      userIds = users.map(u => u._id);
      if (userIds.length > 0) {
        query.userId = { $in: userIds };
      } else {
        // Se non trova utenti con quella email, non restituisce ordini
        return res.json({
          success: true,
          orders: [],
          pagination: { total: 0, page: parseInt(page), limit: parseInt(limit), pages: 0 }
        });
      }
    }
    
    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'name email'),
      Order.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Errore lista ordini admin:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
};

// ========== AGGIORNA ORDINE ==========
exports.updateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, paymentStatus, notes } = req.body;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }
    
    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (notes) order.notes = notes;
    order.updatedAt = new Date();
    
    await order.save();
    
    // Emetti evento WebSocket per aggiornamento ordine
    const io = require('../services/websocket').getIO();
    io.to(`order_${orderId}`).emit('order:updated', {
      orderId,
      status: order.status,
      paymentStatus: order.paymentStatus,
      updatedAt: order.updatedAt,
      updatedBy: 'admin'
    });
    
    res.json({
      success: true,
      message: 'Ordine aggiornato con successo',
      order
    });
  } catch (error) {
    console.error('Errore aggiornamento ordine admin:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
};

// ========== ELIMINA ORDINE ==========
exports.deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }
    
    await order.deleteOne();
    
    res.json({
      success: true,
      message: 'Ordine eliminato con successo'
    });
  } catch (error) {
    console.error('Errore eliminazione ordine admin:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
};

// ========== LISTA UTENTI ==========
exports.getAllUsers = async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      User.find()
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments()
    ]);
    
    res.json({
      success: true,
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Errore lista utenti admin:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
};

// ========== PROMUOVI UTENTE AD ADMIN ==========
exports.promoteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }
    
    user.role = 'admin';
    await user.save();
    
    res.json({
      success: true,
      message: 'Utente promosso ad amministratore',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Errore promozione utente:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
};