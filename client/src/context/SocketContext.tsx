import { createContext, useEffect, useState, PropsWithChildren } from "react";
import { io, Socket } from "socket.io-client";
import { useUserStore } from "@/stores/userStore";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

interface SocketContextType {
  socket: Socket | null;
}

export const SocketContext = createContext<SocketContextType>({ socket: null });

export const SocketProvider = ({ children }: PropsWithChildren) => {
  const { currentUser } = useUserStore();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!currentUser?.id) return;

    const newSocket = io(SOCKET_URL, {
      auth: {
        token: localStorage.getItem("token"),
      },
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [currentUser?.id]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
