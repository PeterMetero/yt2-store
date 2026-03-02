const Order = require('../models/Order');
const Product = require('../models/Product');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Add item to cart (or update quantity if already in cart)
exports.addToCart = async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId) return res.status(400).json({ msg: 'Product ID required' });

  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(400).json({ msg: 'Product not found' });
    if (product.stock < quantity) return res.status(400).json({ msg: 'Not enough stock' });

    // Find user's existing cart (status: 'Cart')
    let cart = await Order.findOne({ user: req.user.id, status: 'Cart' });

    if (!cart) {
      // Create new cart
      cart = new Order({
        user: req.user.id,
        products: [{ product: productId, quantity }],
        total: product.price * quantity,
        status: 'Cart'
      });
    } else {
      // Check if product already in cart
      const itemIndex = cart.products.findIndex(p => p.product.toString() === productId);
      if (itemIndex > -1) {
        // Update quantity
        cart.products[itemIndex].quantity += quantity;
      } else {
        cart.products.push({ product: productId, quantity });
      }
      // Recalculate total
      cart.total = cart.products.reduce((acc, item) => {
        // We'll fetch price later or store it - for simplicity, assume price doesn't change
        return acc + item.quantity * product.price;
      }, 0);
    }
    await cart.save();
    res.json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get user's cart
exports.getCart = async (req, res) => {
  try {
    const cart = await Order.findOne({ user: req.user.id, status: 'Cart' })
      .populate('products.product', 'name price image'); // Populate product details
    if (!cart) return res.json({ products: [], total: 0 }); // Empty cart
    res.json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.checkout = async (req, res) => {
  try {
    const cart = await Order.findOne({ user: req.user.id, status: 'Cart' });
    if (!cart || cart.products.length === 0) return res.status(400).json({ msg: 'Cart empty' });

    // Create Stripe PaymentIntent (simulate payment)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(cart.total * 100), // in cents
      currency: 'usd',
      metadata: { orderId: cart._id.toString() }
    });

    // Update order to Pending (simulate success for now)
    cart.status = 'Pending';
    await cart.save();

    res.json({
      clientSecret: paymentIntent.client_secret, // Send to frontend for confirmation
      order: cart
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
};