// Match khi tạo loan mới
exports.matchLoanOrder = async ({
    loanContract
}) => {
    const session = await Matching.startSession();
    session.startTransaction();
    try {
        const loan = await Loan.findOne({
            loanContract
        }).session(session);
        if (!loan) {
            await session.abortTransaction();
            session.endSession();
            return {
                mess: 'Không tìm thấy loan',
                httpStatus: 404,
                data: {}
            };
        }
        let remainNode = loan.info.node - (loan.info.investedNode || 0);
        let matched = [];
        // FIFO match từng investment theo node
        const investments = await Investment.find({
            status: 'waiting',
            'info.rate': loan.info.rate,
            'info.periodMonth': loan.info.periodMonth,
            $expr: {
                $lt: ["$info.investedNode", "$info.node"]
            }
        }).sort({
            createdAt: 1
        }).session(session);
        for (const investment of investments) {
            if (remainNode <= 0) break;
            const investNode = investment.info.node;
            const investRemainNode = investNode - (investment.info.investedNode || 0);
            if (investRemainNode <= remainNode) {
                // Match hết investment này
                const matchNode = investRemainNode;
                remainNode -= matchNode;
                investment.info.investedNode = (investment.info.investedNode || 0) + matchNode;
                if (investment.info.investedNode === investment.info.node) investment.status = 'filled';
                await investment.save({
                    session
                });
                matched.push({
                    investmentId: investment._id,
                    matchedNode: matchNode
                });
            } else {
                // Match hết loan
                const matchNode = remainNode;
                investment.info.investedNode = (investment.info.investedNode || 0) + matchNode;
                if (investment.info.investedNode === investment.info.node) investment.status = 'filled';
                await investment.save({
                    session
                });
                matched.push({
                    investmentId: investment._id,
                    matchedNode: matchNode
                });
                remainNode = 0;
                break;
            }
        }
        loan.info.investedNode = loan.info.node - remainNode;
        if (loan.info.investedNode === loan.info.node) loan.status = 'filled';
        await loan.save({
            session
        });
        await session.commitTransaction();
        session.endSession();
        return {
            mess: matched.length > 0 ? 'Loan đã match thành công' : 'Loan đã tạo nhưng chưa match được investment nào',
            httpStatus: 201,
            data: {
                loanContract: loan.loanContract,
                status: loan.status,
                node: loan.info.node,
                investedNode: loan.info.investedNode || 0,
                matched
            }
        };
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
};
// services/matcher.js
const Loan = require('../models/loan');
const Investment = require('../models/investment');
const Matching = require('../models/matching');
const {
    notifyUser
} = require('../notifi/socket');

const formatCurrency = (amount) => amount.toLocaleString('vi-VN') + ' VND';


exports.matchOrder = async ({
    investmentContract
}) => {
    const session = await Matching.startSession();
    session.startTransaction();
    try {
        const investment = await Investment.findOne({
            investmentContract
        }).session(session);
        if (!investment) {
            await session.abortTransaction();
            session.endSession();
            return {
                mess: 'Không tìm thấy investment',
                httpStatus: 404,
                data: {}
            };
        }
        // B1: kiểm tra capital của investment có chia hết cho 500000 không
        if (investment.info.capital % 500000 !== 0) {
            await session.abortTransaction();
            session.endSession();
            return {
                mess: 'Số tiền đầu tư phải chia hết cho 500000',
                httpStatus: 400,
                data: {
                    investmentContract
                }
            };
        }
        let remainNode = investment.info.node - (investment.info.investedNode || 0);
        let matched = [];
        // FIFO match từng loan theo node
        const loans = await Loan.find({
            status: 'waiting',
            'info.rate': investment.info.rate,
            'info.periodMonth': investment.info.periodMonth,
            $expr: {
                $lt: ["$info.investedNode", "$info.node"]
            }
        }).sort({
            createdAt: 1
        }).session(session);
        for (const loan of loans) {
            if (remainNode <= 0) break;
            const loanNode = loan.info.node;
            const loanRemainNode = loanNode - (loan.info.investedNode || 0);
            if (loanRemainNode <= remainNode) {
                // Match hết loan này
                const matchNode = loanRemainNode;
                remainNode -= matchNode;
                loan.info.investedNode = (loan.info.investedNode || 0) + matchNode;
                if (loan.info.investedNode === loan.info.node) loan.status = 'filled';
                await loan.save({
                    session
                });
                matched.push({
                    loanId: loan._id,
                    matchedNode: matchNode
                });
            } else {
                // Match hết investment
                const matchNode = remainNode;
                loan.info.investedNode = (loan.info.investedNode || 0) + matchNode;
                if (loan.info.investedNode === loan.info.node) loan.status = 'filled';
                await loan.save({
                    session
                });
                matched.push({
                    loanId: loan._id,
                    matchedNode: matchNode
                });
                remainNode = 0;
                break;
            }
        }
        investment.info.investedNode = investment.info.node - remainNode;
        if (investment.info.investedNode === investment.info.node) investment.status = 'filled';
        await investment.save({
            session
        });
        await session.commitTransaction();
        session.endSession();
        return {
            mess: matched.length > 0 ? 'Investment đã match thành công' : 'Investment đã tạo nhưng chưa match được loan nào',
            httpStatus: 201,
            data: {
                investmentContract: investment.investmentContract,
                status: investment.status,
                node: investment.info.node,
                investedNode: investment.info.investedNode || 0,
                matched
            }
        };
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
};