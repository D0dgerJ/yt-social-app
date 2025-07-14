import { useContext } from "react";
import { Socket } from "socket.io-client";

import { SocketContext } from "../context/SocketContext";

export const useSocket = () => useContext(SocketContext) as { socket: Socket | null };
