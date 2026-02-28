import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handler = app.getRequestHandler();

const onlineUsers = new Map(); // userId -> socketId

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("Connected:", socket.id);

    socket.on("register", (userId) => {
      onlineUsers.set(userId, socket.id);
      io.emit("online-users", Array.from(onlineUsers.keys()));
    });

    socket.on("private-message", ({ to, message, from }) => {
      const targetSocket = onlineUsers.get(to);

      if (targetSocket) {
        io.to(targetSocket).emit("receive-message", {
          from,
          message,
        });
      }
    });

    socket.on("disconnect", () => {
      for (let [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }

      io.emit("online-users", Array.from(onlineUsers.keys()));
    });
  });

  httpServer.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
  });
});