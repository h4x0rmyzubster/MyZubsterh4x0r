// routes/orders.js - Gestione ordini con integrazione MyZubster
const express = require('express');
const { Op } = require('sequelize');
const axios = require('axios');
const { ServiceOrder, Skill, User } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();
const MYZUBSTER_API_URL = process.env.MYZUBSTER_API_URL || 'http://localhost:3000';

// Crea un ordine (acquisto di una competenza)
router.post('/', auth, async (req, res) => {
  try {
    const { skillId, requirements } = req.body;

    if (!skillId) {
      return res.status(400).json({ error: 'SkillId obbligatorio' });
    }

    const skill = await Skill.findByPk(skillId, {
      include: [{ model: User, as: 'seller', attributes: ['id', 'username', 'moneroAddress'] }]
    });

    if (!skill) {
      return res.status(404).json({ error: 'Competenza non trovata' });
    }

    if (skill.sellerId === req.user.id) {
      return res.status(400).json({ error: 'Non puoi acquistare la tua stessa competenza' });
    }

    // 1. Crea l'ordine locale
    const serviceOrder = await ServiceOrder.create({
      buyerId: req.user.id,
      sellerId: skill.sellerId,
      skillId: skill.id,
      amount: skill.price,
      currency: skill.currency || 'USD',
      status: 'pending',
      paymentStatus: 'pending',
      requirements
    });

    // 2. Chiama MyZubster per creare un ordine di pagamento
    try {
      const myZubsterToken = process.env.MYZUBSTER_API_TOKEN;
      
      if (!myZubsterToken) {
        throw new Error('MYZUBSTER_API_TOKEN non configurato');
      }

      const paymentOrder = await axios.post(
        `${MYZUBSTER_API_URL}/api/orders`,
        {
          amount: skill.price,
          currency: skill.currency || 'USD',
          customerEmail: req.user.email,
        },
        {
          headers: {
            'Authorization': `Bearer ${myZubsterToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      serviceOrder.paymentOrderId = paymentOrder.data.id;
      serviceOrder.moneroAddress = paymentOrder.data.moneroAddress;
      serviceOrder.moneroAmount = paymentOrder.data.moneroAmount;
      serviceOrder.status = 'awaiting_payment';
      await serviceOrder.save();

      res.status(201).json({
        order: serviceOrder,
        payment: {
          moneroAddress: paymentOrder.data.moneroAddress,
          moneroAmount: paymentOrder.data.moneroAmount,
          status: 'awaiting_payment'
        }
      });

    } catch (paymentError) {
      console.error('❌ Errore creazione pagamento MyZubster:', paymentError.response?.data || paymentError.message);
      
      serviceOrder.status = 'cancelled';
      await serviceOrder.save();
      
      return res.status(500).json({
        error: 'Errore creazione pagamento',
        details: paymentError.response?.data || paymentError.message
      });
    }

  } catch (error) {
    console.error('❌ Errore creazione ordine:', error);
    res.status(500).json({ error: 'Errore creazione ordine' });
  }
});

// Verifica lo stato del pagamento di un ordine
router.get('/:id/payment-status', auth, async (req, res) => {
  try {
    const order = await ServiceOrder.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }

    if (order.buyerId !== req.user.id && order.sellerId !== req.user.id) {
      return res.status(403).json({ error: 'Accesso non autorizzato' });
    }

    if (order.paymentOrderId) {
      try {
        const myZubsterToken = process.env.MYZUBSTER_API_TOKEN;
        const response = await axios.get(
          `${MYZUBSTER_API_URL}/api/orders/${order.paymentOrderId}`,
          { headers: { 'Authorization': `Bearer ${myZubsterToken}` } }
        );

        if (response.data.status === 'completed') {
          order.paymentStatus = 'confirmed';
          order.status = 'paid';
          order.paidAt = response.data.paidAt || new Date();
          order.txHash = response.data.txHash;
          order.confirmations = response.data.confirmations || 0;
          await order.save();
        }

        return res.json({
          orderId: order.id,
          paymentStatus: order.paymentStatus,
          orderStatus: order.status,
          moneroAddress: order.moneroAddress,
          moneroAmount: order.moneroAmount,
          txHash: order.txHash,
          confirmations: order.confirmations
        });

      } catch (error) {
        console.error('❌ Errore verifica pagamento MyZubster:', error.message);
        return res.json({
          orderId: order.id,
          paymentStatus: order.paymentStatus,
          orderStatus: order.status,
          moneroAddress: order.moneroAddress,
          moneroAmount: order.moneroAmount
        });
      }
    }

    res.json({
      orderId: order.id,
      paymentStatus: order.paymentStatus,
      orderStatus: order.status
    });

  } catch (error) {
    console.error('❌ Errore verifica stato pagamento:', error);
    res.status(500).json({ error: 'Errore verifica stato pagamento' });
  }
});

// Recupera tutti gli ordini dell'utente
router.get('/my-orders', auth, async (req, res) => {
  try {
    const orders = await ServiceOrder.findAll({
      where: {
        [Op.or]: [
          { buyerId: req.user.id },
          { sellerId: req.user.id }
        ]
      },
      include: [
        { model: Skill, as: 'skill', attributes: ['id', 'title', 'category'] },
        { model: User, as: 'buyer', attributes: ['id', 'username', 'fullName'] },
        { model: User, as: 'seller', attributes: ['id', 'username', 'fullName'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(orders);
  } catch (error) {
    console.error('❌ Errore recupero ordini:', error);
    res.status(500).json({ error: 'Errore recupero ordini' });
  }
});

module.exports = router;