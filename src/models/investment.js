const mongoose = require('mongoose');

const InvestmentSchema = new mongoose.Schema({
    info: {
        periodMonth: {
            type: Number,
            min: 0,
            required: true
        },
        capital: {
            type: Number,
            min: 0,
            required: true
        }, // còn lại (remaining)
        createdDate: {
            type: Date,
            required: true
        },
        rate: {
            type: Number,
            required: true
        }
    },
    status: {
        type: String,
        default: 'waiting'
    },
    status: {
        type: String,
        enum: ['waiting', 'filled', 'cancelled'],
        default: 'waiting',
        index: true
    },
    lender: {
        type: String,
        required: true
    },
    investmentContract: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

InvestmentSchema.index({
    status: 1,
    createdAt: 1
});

InvestmentSchema.index({
    rate: 1,
    periodMonth: 1,
    createdAt: 1
}, {
    partialFilterExpression: {
        status: 'waiting',
        capitalRemaining: {
            $gt: 0
        }
    }
});

module.exports = mongoose.model('Investment', InvestmentSchema);