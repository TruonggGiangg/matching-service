const Loan = require('../models/loan');
const Investment = require('../models/investment');
const Matching = require('../models/matching');
const logger = require('../utils/logger');
const {
    notifyUser
} = require('../notifi/socket');


const formatCurrency = (amount) => amount.toLocaleString('vi-VN') + ' VND';


/**
 * Match loan and investment orders efficiently without scanning the entire database.
 * This function uses indexed queries to quickly find the earliest matching loan and investment.
 * It also handles transaction integrity and sends notifications to users.
 *
 * @param {Object} params - Parameters for matching
 * @param {string} params.loanId - Loan contract ID to match
 * @param {string} params.investmentId - Investment contract ID to match
 * @param {number} params.amount - Amount to match
 * @returns {Object} Result object with matching info
 */
exports.matchOrder = async ({
    loanId,
    investmentId,
    amount
}) => {
    const session = await Matching.startSession();
    session.startTransaction();
    try {
        // Use indexed queries for fast lookup
        // Find the earliest waiting loan by ID (should be indexed)
        const now = new Date();
        const loan = await Loan.findOneAndUpdate({
            _id: loanId,
            status: 'waiting',
            investingEndDate: {
                $gte: now
            } // Only match loans that have not expired
        }, {
            $set: {
                status: 'filled',
                updatedAt: now
            }
        }, {
            session,
            new: true
        });

        // Find the earliest waiting investment by ID (should be indexed)
        const investment = await Investment.findOneAndUpdate({
            _id: investmentId,
            status: 'waiting_other'
        }, {
            $set: {
                status: 'filled',
                updatedAt: new Date()
            }
        }, {
            session,
            new: true
        });

        if (!loan || !investment) throw new Error('No matching loan or investment found');

        // Data integrity checks (TODO: add more validation as needed)

        // Create matching record
        const [matching] = await Matching.create([{
            loanId: loan._id,
            investmentId: investment._id,
            amount,
            status: 'filled',
            createdAt: new Date(),
            updatedAt: new Date()
        }], {
            session
        });

        // Prepare notification
        const nowStr = new Date().toLocaleString('vi-VN');
        notifyUser('testuser123', {
            type: 'matched',
            messages: [
                `Hợp đồng vay của bạn đã được khớp lúc ${nowStr} với nhà đầu tư ${investment.lender || 'chưa rõ'}, số tiền ${formatCurrency(matching.amount)}.`,
                `Hợp đồng đầu tư của bạn đã được khớp lúc ${nowStr} với người vay ${loan.borrower || 'chưa rõ'}, số tiền ${formatCurrency(matching.amount)}.`
            ],
            matching
        });

        await session.commitTransaction();
        session.endSession();
        return {
            success: true,
            matching
        };
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
};