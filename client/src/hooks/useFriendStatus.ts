import { useEffect, useState } from "react";
import {
  sendFriendRequest,
  cancelFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getIncomingFriendRequests,
  getOutgoingFriendRequests,
  getUserFriends,
  getFollowers,
  getFollowings,
} from "../utils/api/user.api";

export type FriendStatus =
  | "not_friends"
  | "request_sent"
  | "request_received"
  | "friends"
  | "following"
  | "follower";

interface UseFriendStatusProps {
  currentUserId: number;
  targetUserId: number;
}

export const useFriendStatus = ({ currentUserId, targetUserId }: UseFriendStatusProps) => {
  const [status, setStatus] = useState<FriendStatus>("not_friends");
  const [friendRequestId, setFriendRequestId] = useState<number | null>(null);

  useEffect(() => {
    const checkFriendStatus = async () => {
      try {
        if (currentUserId === targetUserId) return;

        const [
          friends = [],
          outgoing = [],
          incoming = [],
          followings = [],
          followers = [],
        ] = await Promise.all([
          getUserFriends(currentUserId),
          getOutgoingFriendRequests(),
          getIncomingFriendRequests(),
          getFollowings(currentUserId),
          getFollowers(currentUserId),
        ]);

        console.log("👥 Друзья:", friends);
        console.log("📤 Отправленные:", outgoing);
        console.log("📥 Полученные:", incoming);
        console.log("➡️ Подписки:", followings);
        console.log("⬅️ Подписчики:", followers);

        const isFriend = friends.some((f: any) => f.id === targetUserId);
        if (isFriend) {
          setStatus("friends");
          return;
        }

        const sent = outgoing.find((r: any) => r.receiverId === targetUserId);
        if (sent) {
          setStatus("request_sent");
          setFriendRequestId(sent.id);
          return;
        }

        const received = incoming.find((r: any) => r.senderId === targetUserId);
        if (received) {
          setStatus("request_received");
          setFriendRequestId(received.id);
          return;
        }

        const isFollowing = followings.some((f: any) => f.id === targetUserId);
        if (isFollowing) {
          setStatus("following");
          return;
        }

        const isFollower = followers.some((f: any) => f.id === targetUserId);
        if (isFollower) {
          setStatus("follower");
          return;
        }

        setStatus("not_friends");
      } catch (error) {
        console.error("❌ Ошибка при проверке статуса дружбы:", error);
      }
    };

    checkFriendStatus();
  }, [currentUserId, targetUserId]);

  const sendRequest = async () => {
    const request = await sendFriendRequest(targetUserId);
    setFriendRequestId(request.id);
    setStatus("request_sent");
  };

  const cancelRequest = async () => {
    await cancelFriendRequest(targetUserId);
    setFriendRequestId(null);
    setStatus("not_friends");
  };

  const acceptRequest = async () => {
    if (!friendRequestId) return;
    await acceptFriendRequest(friendRequestId);
    setStatus("friends");
  };

  const rejectRequest = async () => {
    if (!friendRequestId) return;
    await rejectFriendRequest(friendRequestId);
    setFriendRequestId(null);
    setStatus("not_friends");
  };

  return {
    status,
    sendRequest,
    cancelRequest,
    acceptRequest,
    rejectRequest,
  };
};
