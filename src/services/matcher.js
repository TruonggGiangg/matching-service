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

        // Tìm theo ObjectId
        const loan = await Loan.findById(loanId).session(session);
        const investment = await Investment.findById(investmentId).session(session);

        // Nếu không tìm thấy loan hoặc investment thì thôi, không làm gì cả
        if (!loan || !investment) {
            await session.abortTransaction();
            session.endSession();
            return null;
        }

        if (Number(loan.info.rate) !== Number(investment.info.rate) ||
            Number(loan.info.periodMonth) !== Number(investment.info.periodMonth)) {
            // Không match thì thôi, không làm gì cả
            await session.abortTransaction();
            session.endSession();
            return null;
        }

        const matchCapital = Math.min(
            Number(capital) || 0,
            loan.info.capital,
            investment.info.capital
        );
        if (!(matchCapital > 0)) throw new Error('Capital match không hợp lệ');

        // Trừ vốn
        loan.info.capital -= matchCapital;
        investment.info.capital -= matchCapital;

        if (loan.info.capital === 0) loan.status = 'filled';
        if (investment.info.capital === 0) investment.status = 'filled';

        await loan.save({
            session
        });
        await investment.save({
            session
        });

        const [matching] = await Matching.create([{
            loanId: loan._id,
            investmentId: investment._id,
            amount: matchCapital,
            status: 'filled',
        }], {
            session
        });

        await session.commitTransaction();
        session.endSession();

        // Thông báo KHÔNG nằm trong transaction (tránh rollback vì lỗi notify)
        try {
            const nowStr = now.toLocaleString('vi-VN');
            notifyUser(loan.borrower, {
                type: 'matched',
                messages: [
                    `Hợp đồng vay của bạn đã được khớp lúc ${nowStr} với nhà đầu tư ${investment.lender || 'chưa rõ'}, số tiền ${formatCurrency(matchCapital)}.`
                ],
                matching
            });
            notifyUser(investment.lender, {
                type: 'matched',
                messages: [
                    `Hợp đồng đầu tư của bạn đã được khớp lúc ${nowStr} với người vay ${loan.borrower || 'chưa rõ'}, số tiền ${formatCurrency(matchCapital)}.`
                ],
                matching
            });
        } catch (notifyErr) {
            // Ghi log, không throw để tránh ảnh hưởng luồng chính
            console.error('[notifyUser] error:', notifyErr);
        }

        return {
            loanId: loan._id,
            investmentId: investment._id,
            matchingId: matching._id,
            capital: matching.amount
        };
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
};