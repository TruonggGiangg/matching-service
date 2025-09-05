const express = require('express');
const router = express.Router();
const Loan = require('../models/loan');
const Investment = require('../models/investment');
const matcher = require('../services/matcher');
const {
    coerceNumber,
    coerceDate,
    ensureFields
} = require('../utils/validate');

// Tạo Loan
router.post('/', async (req, res) => {
    try {
        const missingRoot = ensureFields(req.body, ['info', 'borrower', 'loanContract']);
        const missingInfo = req.body.info ? ensureFields(req.body.info, [
            'rate', 'capital', 'periodMonth', 'willing', 'createdDate', 'investingEndDate',
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
        const investingEndDate = coerceDate(req.body.info.investingEndDate, 'info.investingEndDate');



        if (capital % 500000 !== 0) {
            return res.status(400).json({
                mess: 'Số tiền đầu tư phải chia hết cho 500000',
                httpStatus: 400,
                data: {}
            });
        }
        const node = req.body.info.capital / 500000;
        const loan = new Loan({
            info: {
                rate,
                capital,
                periodMonth,
                willing: req.body.info.willing,
                createdDate,
                investingEndDate,
                node
            },
            borrower: req.body.borrower,
            loanContract: req.body.loanContract,
            status: 'waiting'
        });
        await loan.save();

        // Sau khi tạo loan, tự động match với investment nếu có
        let matchResult = null;
        try {
            matchResult = await matcher.matchLoanOrder({
                loanContract: loan.loanContract
            });
        } catch (e) {
            // ignore match error, vẫn trả về loan
        }
        if (matchResult) {
            return res.status(matchResult.httpStatus || 201).json(matchResult);
        }
        return res.status(201).json({
            mess: 'Loan đã tạo thành công',
            httpStatus: 201,
            data: {
                loanContract: loan.loanContract,
                node: loan.info.node
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