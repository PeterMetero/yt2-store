const express = require('express');
const router = express.Router();

const { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} = require('../controllers/productController');
const auth = require('../middleware/auth');

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', auth, createProduct);
router.put('/:id', auth, updateProduct);
router.delete('/:id', auth, deleteProduct);
// Removed duplicate routes

module.exports = router;