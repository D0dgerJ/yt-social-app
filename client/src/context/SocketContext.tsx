import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  PropsWithChildren,
  useCallback,
} from "react";
import { io, Socket } from "socket.io-client";
import { getToken } from "@/utils/authStorage";
import { env } from "@/config/env";

const SOCKET_URL = env.SOCKET_URL;

type SocketCtx = {
  socket: Socket | null;
  joinConversation: (conversationId: number) => void;
  leaveConversation: (conversationId: number) => void;
  on: <T = any>(event: string, handler: (payload: T) => void) => void;
  off: <T = any>(event: string, handler: (payload: T) => void) => void;
};

const SocketContext = createContext<SocketCtx>({
  socket: null,
  joinConversation: () => {},
  leaveConversation: () => {},
  on: () => {},
  off: () => {},
});

export { SocketContext };

export const SocketProvider = ({ children }: PropsWithChildren) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const listenersAttachedRef = useRef(false);
  const joinedRoomsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const token = getToken();

    if (socketRef.current) {
      socketRef.current.auth = { token };
      if (!socketRef.current.connected && !socketRef.current.active) {
        socketRef.current.connect();
      }
      setSocket(socketRef.current);
      return;
    }

    const s = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: { token },
      withCredentials: true,
    });

    if (!listenersAttachedRef.current) {
      s.on("connect", () => {
        console.log("[socket] connected");
        for (const room of joinedRoomsRef.current) {
          s.emit("joinConversation", room);
        }
      });

      s.on("connect_error", (err) => {
        console.warn("[socket] connect_error:", err?.message ?? err);
      });

      s.on("disconnect", (reason) => {
        console.log("[socket] disconnected:", reason);
      });

      listenersAttachedRef.current = true;
    }

    socketRef.current = s;
    setSocket(s);

    if (token) {
      s.connect();
    }

    return () => {
      try {
        s.removeAllListeners();
        s.disconnect();
      } finally {
        socketRef.current = null;
        listenersAttachedRef.current = false;
        joinedRoomsRef.current.clear();
        setSocket(null);
      }
    };
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "user" && !e.newValue) {
        if (socketRef.current) {
          try {
            socketRef.current.removeAllListeners();
            socketRef.current.disconnect();
          } finally {
            socketRef.current = null;
            listenersAttachedRef.current = false;
            joinedRoomsRef.current.clear();
            setSocket(null);
          }
        }
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const syncToken = () => {
      const token = getToken();
      const s = socketRef.current;
      if (!s) return;

      const current = (s.auth as any)?.token;

      if (!token) {
        s.auth = { token: undefined };
        if (s.connected) s.disconnect();
        return;
      }

      if (token !== current) {
        s.auth = { token };
        if (s.connected) s.disconnect();
        s.connect();
        return;
      }

      if (!s.connected && !s.active) {
        s.connect();
      }
    };

    syncToken();

    const onCustom = () => syncToken();
    window.addEventListener("token:changed", onCustom);
    return () => window.removeEventListener("token:changed", onCustom);
  }, []);

  const joinConversation = useCallback((conversationId: number) => {
    if (!Number.isFinite(conversationId) || conversationId <= 0) return;
    joinedRoomsRef.current.add(conversationId);
    const s = socketRef.current;
    if (s?.connected) {
      s.emit("joinConversation", conversationId);
    }
  }, []);

  const leaveConversation = useCallback((conversationId: number) => {
    if (!Number.isFinite(conversationId) || conversationId <= 0) return;
    joinedRoomsRef.current.delete(conversationId);
    const s = socketRef.current;
    s?.emit?.("leaveConversation", conversationId);
  }, []);

  const on = useCallback(<T,>(event: string, handler: (payload: T) => void) => {
    const s = socketRef.current;
    if (!s) return;
    s.on(event, handler as any);
  }, []);

  const off = useCallback(<T,>(event: string, handler: (payload: T) => void) => {
    const s = socketRef.current;
    if (!s) return;
    s.off(event, handler as any);
  }, []);

  const value = useMemo<SocketCtx>(
    () => ({ socket, joinConversation, leaveConversation, on, off }),
    [socket, joinConversation, leaveConversation, on, off]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => useContext(SocketContext);