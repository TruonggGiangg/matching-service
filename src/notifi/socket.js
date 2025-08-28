const socketio = require('socket.io');
let io;
const userSockets = {};

function init(server) {
    io = socketio(server, {
        cors: {
            origin: '*'
        }
    });
    io.on('connection', (socket) => {
        // Nhận userId từ client khi kết nối
        socket.on('register', (userId) => {
            userSockets[userId] = socket.id;
        });
        socket.on('disconnect', () => {
            for (const [userId, id] of Object.entries(userSockets)) {
                if (id === socket.id) delete userSockets[userId];
            }
        });
    });
}

function notifyUser(userId, data) {
    if (io && userSockets[userId]) {
        io.to(userSockets[userId]).emit('matched', data);
    }
}

module.exports = {
    init,
    notifyUser
};