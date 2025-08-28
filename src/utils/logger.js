exports.logEscrow = async (matchedEscrow, order) => {
    // Ghi log vào escrowlogs hoặc console
    console.log('Log giao dịch:', {
        matchedEscrow,
        order
    });
    // Có thể ghi vào DB nếu cần
};