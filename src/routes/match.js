const express = require('express');
const router = express.Router();
const matcher = require('../services/matcher');

router.post('/', async (req, res) => {
    try {
        const result = await matcher.matchOrder(req.body);
        res.json(result);
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

module.exports = router;