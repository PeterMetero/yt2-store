const express = require('express');
const { addReview, getProductReviews } = require('../controllers/reviewController');
const auth = require('../middleware/auth');


const router = express.Router();


router.post('/', auth, addReview);
router.get('/:productId', getProductReviews);


module.exports = router;
