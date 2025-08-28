const express = require('express');
const router = express.Router();
const Loan = require('../models/loan');
const Investment = require('../models/investment');

// Tạo hợp đồng vay
router.post('/', async (req, res) => {
    try {
        const loan = new Loan(req.body);
        await loan.save();
        // Tìm investment đang chờ, ưu tiên FIFO
        const investment = await Investment.findOne({
                status: 'waiting_other',
                'info.periodMonth': loan.info.periodMonth,
                'info.capital': loan.info.capital,
                'info.rate': loan.info.rate
            })
            .sort({
                createdAt: 1
            })
            .select('_id info createdAt')
            .lean();
        if (investment) {
            const matcher = require('../services/matcher');
            await matcher.matchOrder({
                loanId: loan._id,
                investmentId: investment._id,
                amount: loan.info.capital // đã trùng khớp
            });
        }
        res.status(201).json(loan);
    } catch (err) {
        res.status(400).json({
            error: err.message
        });
    }
});


module.exports = router;