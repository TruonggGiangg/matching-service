const express = require('express');
const router = express.Router();
const Loan = require('../models/loan');
const Investment = require('../models/investment');
const matcher = require('../services/matcher');

// Tạo Loan
router.post('/', async (req, res) => {
    try {
        const requiredFields = ['rate', 'capital', 'periodMonth', 'willing', 'createdDate', 'investingEndDate'];
        const missing = requiredFields.filter(f => !req.body.info?. [f]);
        if (!req.body.borrower) missing.push('borrower');
        if (missing.length) {
            return res.status(400).json({
                mess: `Thiếu dữ liệu: ${missing.join(', ')}`,
                httpStatus: 400,
                data: {}
            });
        }

        // Log chi tiết giá trị đầu vào
        console.log('=== DEBUG Loan Input ===');
        console.log('req.body.info:', req.body.info);
        console.log('rate:', req.body.info.rate);
        console.log('capital:', req.body.info.capital);
        console.log('periodMonth:', req.body.info.periodMonth);

        const rate = Number(req.body.info.rate);
        const capital = Number(req.body.info.capital);
        const periodMonth = Number(req.body.info.periodMonth);

        if ([rate, capital, periodMonth].some(v => isNaN(v))) {
            console.log('=== DEBUG Loan Input Error ===');
            console.log('rate:', rate, 'capital:', capital, 'periodMonth:', periodMonth);
            return res.status(400).json({
                mess: 'Dữ liệu số không hợp lệ (rate/capital/periodMonth)',
                httpStatus: 400,
                data: {}
            });
        }


        const loan = new Loan({
            info: {
                rate,
                capital,
                periodMonth,
                willing: req.body.info.willing,
                createdDate: new Date(req.body.info.createdDate),
                investingEndDate: new Date(req.body.info.investingEndDate)
            },
            borrower: req.body.borrower,
            status: 'waiting'
        });
        await loan.save();

        // Tìm Investment phù hợp
        const now = new Date();

        // Debug: in thông tin Loan
        console.log('=== DEBUG Loan ===');
        console.log('loan.info.rate:', loan.info.rate);
        console.log('loan.info.periodMonth:', loan.info.periodMonth);
        console.log('loan.info.capital:', loan.info.capital);
        console.log('now:', now);

        // Tìm Investment phù hợp
        const investment = await Investment.findOne({
            status: 'waiting', // quan trọng: chỉ match các Investment đang chờ
            'info.rate': Number(loan.info.rate),
            'info.periodMonth': Number(loan.info.periodMonth),

        }).sort({
            createdAt: 1
        });

        // Debug: in kết quả query
        console.log('=== DEBUG Investment ===');
        if (investment) {
            console.log('Investment tìm thấy:', investment._id);
        } else {
            console.log('Không tìm thấy Investment nào phù hợp');
        }

        // Nếu tìm được, match
        if (investment) {
            const result = await matcher.matchOrder({
                loanId: loan._id,
                investmentId: investment._id,
                capital: loan.info.capital
            });
            console.log('=== DEBUG matcher result ===', result);
            return res.status(201).json({
                mess: 'Loan đã tạo và khớp lệnh thành công',
                httpStatus: 201,
                data: {
                    loan: result.loan,
                    investment: result.investment,
                    matching: result.matching
                }
            });
        }

        return res.status(201).json({
            mess: 'Loan đã tạo nhưng chưa match được investment nào',
            httpStatus: 201,
            data: {
                loan
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