import { Server as NetServer } from "http";
import { Server as ServerIO } from "socket.io";
import { NextApiResponse } from "next";

declare module "http" {
  interface Server {
    io?: ServerIO;
  }
}

declare module "next" {
  interface NextApiResponse {
    socket: {
      server: NetServer & { io?: ServerIO };
    };
  }
}
