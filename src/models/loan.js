const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema({
    info: {
        rate: Number,
        capital: Number,
        periodMonth: Number,
        willing: String,
        createdDate: Date,
        investingEndDate: Date
    },
    status: {
        type: String,
        default: 'waiting'
    },
    borrower: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

LoanSchema.index({
    status: 1,
    createdAt: 1
});

LoanSchema.index({
    'info.rate': 1,
    'info.capital': 1,
    'info.periodMonth': 1,
    status: 1,
    createdAt: 1
});

module.exports = mongoose.model('Loan', LoanSchema);