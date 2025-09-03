const express = require('express');
const mongoose = require('mongoose');
const matchRoutes = require('./routes/match');
const loanRoutes = require('./routes/loan');

const investmentRoutes = require('./routes/investment');
require('dotenv').config();
const {
    init
} = require('./notifi/socket'); // đường dẫn đúng tới socket.js
const app = express();
const http = require('http');
const cors = require('cors');
app.use(express.json());
app.use(cors());
app.use('/api/match', matchRoutes);
app.use('/api/loan', loanRoutes);
app.use('/api/investment', investmentRoutes);

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/matching', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    const server = http.createServer(app);
    init(server); // gắn socket.io
    server.listen(3001, () => console.log('Matching server running on port 3001'));
});

module.exports = app;