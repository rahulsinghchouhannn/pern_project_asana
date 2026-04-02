const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const logger = require("./logger");

let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:5173",
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Authentication token required"));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    logger.info({ message: "Socket connected", userId: socket.userId, socketId: socket.id });

    // Join personal room for targeted notifications
    socket.join(socket.userId);

    // Join org room if orgId provided
    const orgId = socket.handshake.auth?.orgId;
    if (orgId) {
      socket.join(orgId);
    }

    socket.on("join_project", (projectId) => {
      if (projectId) socket.join(projectId);
    });

    socket.on("leave_project", (projectId) => {
      if (projectId) socket.leave(projectId);
    });

    socket.on("disconnect", () => {
      logger.info({ message: "Socket disconnected", userId: socket.userId, socketId: socket.id });
    });
  });

  return io;
};

const emitToUser = (userId, event, data) => {
  if (!io) return;
  io.to(userId).emit(event, data);
};

const emitToOrg = (orgId, event, data) => {
  if (!io) return;
  io.to(orgId).emit(event, data);
};

const emitToProject = (projectId, event, data) => {
  if (!io) return;
  io.to(projectId).emit(event, data);
};

module.exports = { initSocket, emitToUser, emitToOrg, emitToProject };
