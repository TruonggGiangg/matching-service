const mongoose = require('mongoose');

const MatchingSchema = new mongoose.Schema({
    loanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Loan',
        required: true,
        index: true
    },
    investmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Investment',
        required: true,
        index: true
    },
    amount: {
        type: Number,
        min: 0,
        required: true
    },
    status: {
        type: String,
        enum: ['filled', 'partial', 'cancelled'],
        default: 'filled'
    },

}, {
    timestamps: true
});

module.exports = mongoose.model('Matching', MatchingSchema);