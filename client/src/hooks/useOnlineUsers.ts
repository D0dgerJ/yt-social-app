import { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";

export function useOnlineUsers() {
  const { socket, on, off } = useSocket();
  const [onlineUserIds, setOnlineUserIds] = useState<number[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleOnlineUsers = (payload: unknown) => {
      let ids: unknown;

      if (Array.isArray(payload)) {
        ids = payload;
      } else if (
        payload &&
        typeof payload === "object" &&
        Array.isArray((payload as any).users)
      ) {
        ids = (payload as any).users;
      }

      if (!Array.isArray(ids)) return;

      const normalized = ids
        .map((v) => Number(v))
        .filter((v) => Number.isFinite(v) && v > 0);

      setOnlineUserIds(normalized);
    };

    on("onlineUsers", handleOnlineUsers);

    try {
      socket.emit("getOnlineUsers");
    } catch (e) {
      console.warn("[useOnlineUsers] failed to emit getOnlineUsers", e);
    }

    return () => {
      off("onlineUsers", handleOnlineUsers);
    };
  }, [socket, on, off]);

  return onlineUserIds;
}

export default useOnlineUsers;
