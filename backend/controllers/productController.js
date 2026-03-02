const Product = require('../models/Product');
const Joi = require('joi');

const productSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  price: Joi.number().required(),
  stock: Joi.number().required(),
  image: Joi.string().optional()
});

// Export getProducts function to retrieve all products from database
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Export createProduct function to add a new product to the database
exports.createProduct = async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ msg: 'Admin only' });

    const { error } = productSchema.validate(req.body);
    if (error) return res.status(400).json({ msg: error.details[0].message });

    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Export updateProduct function to modify an existing product
exports.updateProduct = async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ msg: 'Admin only' });

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ msg: 'Product not found' });

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Export deleteProduct function to remove a product from the database
exports.deleteProduct = async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ msg: 'Admin only' });

    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ msg: 'Product not found' });
    res.json({ msg: 'Deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('reviews');
    if (!product) return res.status(404).json({ msg: 'Product not found' });
    return res.status(200).json(product);
  } catch (error) {
    console.error(error);
    return res.status(400).json({ msg: 'Invalid product id' });
  }
};