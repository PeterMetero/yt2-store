const Review = require('../models/Review');
const Product = require('../models/Product');
const Joi = require('joi');

const reviewSchema = Joi.object({
  productId: Joi.string().required(),
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().allow('')
});

exports.addReview = async (req, res) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) return res.status(400).json({ msg: error.details[0].message });

  const { productId, rating, comment } = req.body;

  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ msg: 'Product not found' });

    // Check if user already reviewed (optional - prevent duplicates)
    const existing = await Review.findOne({ user: req.user.id, product: productId });
    if (existing) return res.status(400).json({ msg: 'You already reviewed this product' });

    const review = new Review({
      user: req.user.id,
      product: productId,
      rating,
      comment
    });

    await review.save();

    // Add review ref to product
    product.reviews.push(review._id);
    await product.save();

    res.json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get reviews for a product
exports.getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'name'); // Show reviewer name
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};