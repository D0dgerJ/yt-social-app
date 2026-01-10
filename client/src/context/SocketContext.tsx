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

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

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

  // === Создание сокета ===
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
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
      auth: { token },
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

    // 🧹 Очистка при размонтировании
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

  // === Logout через localStorage (другая вкладка) ===
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

  // === Обновление токена без перезагрузки ===
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

    // первый прогон
    syncToken();

    // слушаем кастомное событие после логина
    const onCustom = () => syncToken();
    window.addEventListener("token:changed", onCustom);
    return () => window.removeEventListener("token:changed", onCustom);
  }, []);

  // === Управление комнатами ===
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

  // === Подписка на события ===
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

  // === Контекст ===
  const value = useMemo<SocketCtx>(
    () => ({ socket, joinConversation, leaveConversation, on, off }),
    [socket, joinConversation, leaveConversation, on, off]
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

// === Хук для доступа к сокету ===
export const useSocket = () => useContext(SocketContext);
