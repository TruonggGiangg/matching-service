const mongoose = require('mongoose');

const InvestmentSchema = new mongoose.Schema({
    info: {
        periodMonth: Number,
        capital: Number,
        createdDate: Date,
        rate: Number
    },
    status: {
        type: String,
        default: 'waiting_other'
    },
    lender: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

InvestmentSchema.index({
    status: 1,
    createdAt: 1
});

InvestmentSchema.index({
    'info.rate': 1,
    'info.capital': 1,
    'info.periodMonth': 1,
    status: 1,
    createdAt: 1
});

module.exports = mongoose.model('Investment', InvestmentSchema);