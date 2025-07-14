import { createContext, useEffect, useRef, PropsWithChildren } from "react";
import { io, Socket } from "socket.io-client";
import { useUserStore } from "@/stores/userStore";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

interface SocketContextType {
  socket: Socket | null;
}

export const SocketContext = createContext<SocketContextType>({ socket: null });

export const SocketProvider = ({ children }: PropsWithChildren) => {
  const { currentUser } = useUserStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (currentUser && !socketRef.current) {
      socketRef.current = io(SOCKET_URL, { query: { userId: currentUser.id } });
    }
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [currentUser]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current }}>
      {children}
    </SocketContext.Provider>
  );
};
