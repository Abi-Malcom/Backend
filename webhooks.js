// webhooks.js
const express = require('express');
const router = express.Router();
const { verifyPayment } = require('../config/razorpay');
const Order = require('../models/Order');

router.post('/razorpay', async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  
  if (!verifyPayment(req.body, signature)) {
    return res.status(400).json({ message: 'Invalid signature' });
  }

  const event = req.body.event;
  const paymentId = req.body.payload.payment.entity.id;

  try {
    if (event === 'payment.captured') {
      const order = await Order.findOne({ 'payment.paymentId': paymentId });
      
      if (order && order.status === 'pending') {
        order.status = 'processing';
        order.payment.status = 'completed';
        await order.save();
      }
    }
    
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

module.exports = router;