const express = require('express');
const router = express.Router();
const Investment = require('../models/investment');
const Loan = require('../models/loan');

// Tạo hợp đồng đầu tư
router.post('/', async (req, res) => {
    try {
        const investment = new Investment(req.body);
        await investment.save();
        // Tìm loan đang chờ, ưu tiên FIFO
        const loan = await Loan.findOne({
                status: 'waiting',
                'info.periodMonth': investment.info.periodMonth,
                'info.capital': investment.info.capital,
                'info.rate': investment.info.rate
            })
            .sort({
                createdAt: 1
            })
            .select('_id info createdAt')
            .lean();
        if (loan) {
            const matcher = require('../services/matcher');
            await matcher.matchOrder({
                loanId: loan._id,
                investmentId: investment._id,
                amount: investment.info.capital // đã trùng khớp
            });
        }
        res.status(201).json(investment);
    } catch (err) {
        res.status(400).json({
            error: err.message
        });
    }
});


module.exports = router;