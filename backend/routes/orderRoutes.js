const express = require('express');
const { addToCart, getCart, checkout } = require('../controllers/orderController');

const auth = require('../middleware/auth');

const router = express.Router();

router.post('/cart/add', auth, addToCart);
router.get('/cart', auth, getCart);

// Wait, use the function name
router.post('/checkout', auth, checkout);

module.exports = router;
