const express = require('express');
const router = express.Router();
const Investment = require('../models/investment');
const Loan = require('../models/loan');
const matcher = require('../services/matcher');
const {
    coerceNumber,
    coerceDate,
    ensureFields
} = require('../utils/validate');

// Tạo Investment và match Loan
router.post('/', async (req, res) => {
    try {
        const missingRoot = ensureFields(req.body, ['info', 'lender', 'investmentContract']);
        const missingInfo = req.body.info ? ensureFields(req.body.info, [
            'rate', 'capital', 'periodMonth', 'createdDate'
        ], 'info') : ['info'];
        const missing = [...missingRoot, ...missingInfo];
        if (missing.length) {
            return res.status(400).json({
                mess: `Thiếu dữ liệu: ${missing.join(', ')}`,
                httpStatus: 400,
                data: {}
            });
        }

        // Ép kiểu
        const rate = coerceNumber(req.body.info.rate, 'info.rate');
        const capital = coerceNumber(req.body.info.capital, 'info.capital');
        const periodMonth = coerceNumber(req.body.info.periodMonth, 'info.periodMonth');
        const createdDate = coerceDate(req.body.info.createdDate, 'info.createdDate');

        const investment = new Investment({
            info: {
                rate,
                capital,
                periodMonth,
                createdDate
            },
            lender: req.body.lender,
            investmentContract: req.body.investmentContract,
            status: 'waiting'
        });
        await investment.save();

        const now = new Date();
        const loan = await Loan.findOne({
                status: 'waiting',
                'info.rate': rate,
                'info.periodMonth': periodMonth,
                'info.investingEndDate': {
                    $gte: now
                },
                'info.capital': {
                    $gt: 0
                }
            })
            .select('_id loanContract') // <-- cần cả loanContract để trả về
            .sort({
                createdAt: 1
            })
            .lean();
        if (loan) {
            const result = await matcher.matchOrder({
                loanId: loan._id,
                investmentId: investment._id,
                capital: investment.info.capital
            });

            return res.status(201).json({
                mess: 'Investment đã tạo và khớp lệnh thành công',
                httpStatus: 201,
                data: {
                    loanContract: loan.loanContract, // dùng field đã select
                    investmentContract: investment.investmentContract,
                    matchingId: result.matchingId,
                    capital: result.capital ?? investment.info.capital
                }
            });
        }

        // KHÔNG truy cập loan.* vì loan = null
        return res.status(201).json({
            mess: 'Investment đã tạo nhưng chưa match được loan nào',
            httpStatus: 201,
            data: {
                investmentContract: investment.investmentContract
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