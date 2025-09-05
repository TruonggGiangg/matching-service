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

        if (capital % 500000 !== 0) {
            return res.status(400).json({
                mess: 'Số tiền đầu tư phải chia hết cho 500000',
                httpStatus: 400,
                data: {}
            });
        }
        const node = req.body.info.capital / 500000;

        const investment = new Investment({
            info: {
                rate,
                capital,
                periodMonth,
                createdDate,
                node
            },
            lender: req.body.lender,
            investmentContract: req.body.investmentContract,
            status: 'waiting'
        });
        await investment.save();

        // Gọi matchOrder với investmentContract, trả về response đồng bộ
        let matchResult = null;
        try {
            matchResult = await matcher.matchOrder({
                investmentContract: investment.investmentContract
            });
        } catch (e) {
            // ignore match error, vẫn trả về investment
        }
        if (matchResult) {
            return res.status(matchResult.httpStatus || 201).json(matchResult);
        }
        return res.status(201).json({
            mess: 'Investment đã tạo thành công',
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