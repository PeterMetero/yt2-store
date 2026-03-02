const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Detailed request logging for debugging
app.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log(`[${req.method}] ${req.path}`);
    console.log(` Content-Type: ${req.headers['content-type']}`);
    console.log(` Body: ${JSON.stringify(req.body)}`);
  }
  next(); // Fixed: moved next() outside the if block
});

// Routes
//const userRoutes = require('./routes/userRoutes');
//app.use('/api/users', userRoutes);

//const productRoutes = require('./routes/productRoutes');
//app.use('/api/products', productRoutes);

//const orderRoutes = require('./routes/orderRoutes');
//app.use('/api/orders', orderRoutes);

//const reviewRoutes = require('./routes/reviewRoutes');
//app.use('/api/reviews', reviewRoutes);

// Basic health check
app.get('/', (req, res) => res.send('YT2 Store Backend Running'));

// DB + Server start
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Mongo connection error:', err.message);
    process.exit(1);
  });