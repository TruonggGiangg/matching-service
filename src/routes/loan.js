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

        const loan = new Loan({
            info: {
                rate,
                capital,
                periodMonth,
                willing: req.body.info.willing,
                createdDate,
                investingEndDate
            },
            borrower: req.body.borrower,
            loanContract: req.body.loanContract,
            status: 'waiting'
        });
        await loan.save();

        // Tìm Investment phù hợp (thêm điều kiện capital>0)
        const investmentMin = await Investment.findOne({
                status: 'waiting',
                'info.rate': rate,
                'info.periodMonth': periodMonth,
                'info.capital': {
                    $gt: 0
                }
            })
            .select('_id investmentContract') // <-- cần investmentContract
            .sort({
                createdAt: 1
            })
            .lean();

        if (investmentMin) {
            const result = await matcher.matchOrder({
                loanId: loan._id,
                investmentId: investmentMin._id,
                capital: loan.info.capital
            });

            return res.status(201).json({
                mess: 'Loan đã tạo và khớp lệnh thành công',
                httpStatus: 201,
                data: {
                    loanContract: loan.loanContract,
                    investmentContract: investmentMin.investmentContract,
                    matchingId: result.matchingId,
                    capital: result.capital ?? loan.info.capital
                }
            });
        }

        return res.status(201).json({
            mess: 'Loan đã tạo nhưng chưa match được investment nào',
            httpStatus: 201,
            data: {
                loanContract: loan.loanContract
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