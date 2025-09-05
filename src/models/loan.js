const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema({
    info: {
        rate: {
            type: Number,
            required: true
        },
        capital: {
            type: Number,
            min: 0,
            required: true
        }, // còn lại (remaining)
        periodMonth: {
            type: Number,
            min: 0,
            required: true
        },
        willing: {
            type: String
        },
        createdDate: {
            type: Date,
            required: true
        },
        investingEndDate: {
            type: Date,
            required: true
        },
        node: {
            type: Number,
        },
        investedNode: {
            type: Number,
            default: 0
        }
    },
    status: {
        type: String,
        enum: ['waiting', 'filled', 'cancelled'],
        default: 'waiting',
        index: true
    },
    borrower: {
        type: String,
        required: true
    },
    loanContract: {
        type: String,
        required: true
    },


}, {
    timestamps: true
});

LoanSchema.index({
    status: 1,
    createdAt: 1
});

LoanSchema.index({
    rate: 1,
    periodMonth: 1,
    investingEndDate: 1,
    createdAt: 1
}, {
    partialFilterExpression: {
        status: 'waiting',
        capitalRemaining: {
            $gt: 0
        }
    }
});


module.exports = mongoose.model('Loan', LoanSchema);