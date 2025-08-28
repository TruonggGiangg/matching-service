const mongoose = require('mongoose');

const MatchingSchema = new mongoose.Schema({
    loanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Loan'
    },
    investmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Investment'
    },
    amount: Number,
    status: {
        type: String,
        default: 'filled'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Matching', MatchingSchema);