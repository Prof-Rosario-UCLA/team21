require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

const mongoose = require('mongoose');

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));