import { Server as NetServer } from "http";
import { NextApiRequest } from "next";
import { Server as ServerIO } from "socket.io";

export default function SocketEmitHandler(req: NextApiRequest, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!res.socket?.server?.io) {
    const httpServer: NetServer = res.socket.server;
    const io = new ServerIO(httpServer, {
      path: "/api/socket",
      addTrailingSlash: false,
    });
    res.socket.server.io = io;
  }

  const io: ServerIO = res.socket.server.io;
  const { event, data } = req.body;
  io.emit(event, data);
  res.status(200).json({ success: true });
}
