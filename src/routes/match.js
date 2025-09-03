const express = require('express');
const router = express.Router();
const matcher = require('../services/matcher');
const {
    coerceNumber
} = require('../utils/validate');

router.post('/', async (req, res) => {
    try {
        const {
            loanId,
            investmentId,
            capital
        } = req.body || {};
        if (!loanId || !investmentId) {
            return res.status(400).json({
                error: 'Thiếu loanId hoặc investmentId'
            });
        }
        const cap = capital !== undefined ? coerceNumber(capital, 'capital') : undefined;
        const result = await matcher.matchOrder({
            loanId,
            investmentId,
            capital: cap
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

module.exports = router;