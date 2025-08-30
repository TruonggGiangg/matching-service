// routes/investment.js
const express = require('express');
const router = express.Router();
const Investment = require('../models/investment');
const Loan = require('../models/loan');
const matcher = require('../services/matcher');

// Tạo Investment và match Loan
router.post('/', async (req, res) => {
    try {
        const requiredFields = ['rate', 'capital', 'periodMonth', 'createdDate'];
        const missing = requiredFields.filter(f => !req.body.info?. [f]);
        if (!req.body.lender) missing.push('lender');

        if (missing.length) {
            return res.status(400).json({
                mess: `Thiếu dữ liệu: ${missing.join(', ')}`,
                httpStatus: 400,
                data: {}
            });
        }

        const investment = new Investment({
            info: {
                rate: req.body.info.rate,
                capital: req.body.info.capital,
                periodMonth: req.body.info.periodMonth,
                createdDate: req.body.info.createdDate
            },
            lender: req.body.lender,
            status: 'waiting'
        });
        await investment.save();

        // Tìm Loan phù hợp
        const now = new Date();
        const loan = await Loan.findOne({
            status: 'waiting',
            'info.rate': investment.info.rate,
            'info.periodMonth': investment.info.periodMonth,
            'info.investingEndDate': {
                $gte: now
            }
        }).sort({
            createdAt: 1
        });

        if (loan) {
            // Truyền capital thay vì amount
            const result = await matcher.matchOrder({
                loanId: loan._id,
                investmentId: investment._id,
                capital: investment.info.capital
            });

            return res.status(201).json({
                mess: 'Investment đã tạo và khớp lệnh thành công',
                httpStatus: 201,
                data: {
                    loan: result.loan,
                    investment: result.investment,
                    matching: result.matching
                }
            });
        }

        return res.status(201).json({
            mess: 'Investment đã tạo nhưng chưa match được loan nào',
            httpStatus: 201,
            data: {
                investment
            }
        });

    } catch (err) {
        return res.status(400).json({
            mess: 'Lỗi',
            httpStatus: 400,
            data: {
                error: err.message
            }
        });
    }
});

module.exports = router;