// services/matcher.js
const Loan = require('../models/loan');
const Investment = require('../models/investment');
const Matching = require('../models/matching');
const {
    notifyUser
} = require('../notifi/socket');

const formatCurrency = (amount) => amount.toLocaleString('vi-VN') + ' VND';

exports.matchOrder = async ({
    loanId,
    investmentId,
    capital
}) => {
    const session = await Matching.startSession();
    session.startTransaction();

    try {
        const now = new Date();

        const loan = await Loan.findById(loanId).session(session);
        const investment = await Investment.findById(investmentId).session(session);

        if (!loan || !investment || loan.info.capital <= 0 || investment.info.capital <= 0) {
            throw new Error('Loan hoặc Investment không còn capital để match');
        }

        if (Number(loan.info.rate) !== Number(investment.info.rate) ||
            Number(loan.info.periodMonth) !== Number(investment.info.periodMonth)) {
            throw new Error('Loan và Investment không cùng kỳ hạn hoặc lãi suất');
        }

        const matchCapital = Math.min(capital, loan.info.capital, investment.info.capital);
        if (matchCapital <= 0) throw new Error('Capital match không hợp lệ');

        loan.info.capital -= matchCapital;
        investment.info.capital -= matchCapital;

        if (loan.info.capital === 0) loan.status = 'filled';
        if (investment.info.capital === 0) investment.status = 'filled';

        loan.updatedAt = now;
        investment.updatedAt = now;

        await loan.save({
            session
        });
        await investment.save({
            session
        });

        const [matching] = await Matching.create([{
            loanId: loan.borrower,
            investmentId: investment.lender,
            capital: matchCapital,
            status: 'filled',
            createdAt: now,
            updatedAt: now
        }], {
            session
        });

        // Notification
        const nowStr = now.toLocaleString('vi-VN');
        notifyUser(loan.borrower, {
            type: 'matched',
            messages: [`Hợp đồng vay của bạn đã được khớp lúc ${nowStr} với nhà đầu tư ${investment.lender || 'chưa rõ'}, số tiền ${formatCurrency(matchCapital)}.`],
            matching
        });
        notifyUser(investment.lender, {
            type: 'matched',
            messages: [`Hợp đồng đầu tư của bạn đã được khớp lúc ${nowStr} với người vay ${loan.borrower || 'chưa rõ'}, số tiền ${formatCurrency(matchCapital)}.`],
            matching
        });

        await session.commitTransaction();
        session.endSession();

        return {
            loan,
            investment,
            matching
        };
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
};