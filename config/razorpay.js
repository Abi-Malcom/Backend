// config/razorpay.js
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: 'rzp_test_YOUR_API_KEY',
  key_secret: 'YOUR_API_SECRET'
});

// Verify payment signature (for webhooks)
const verifyPayment = (webhookBody, signature) => {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(JSON.stringify(webhookBody))
    .digest('hex');
    
  return expectedSignature === signature;
};

module.exports = {
  razorpay,
  verifyPayment
};