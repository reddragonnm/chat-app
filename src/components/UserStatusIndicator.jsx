import { useState, useEffect } from "react";
import { supabase, useAuth } from "../contexts/AuthContext";

const UserStatusIndicator = ({ userId }) => {
  const [isOnline, setIsOnline] = useState(false);

  const { session } = useAuth();

  useEffect(() => {
    if (!session || !userId) return;

    const channelName = `presence:${[session.user.id, userId]
      .sort()
      .join("-")}`;

    const channel = supabase.channel(channelName);

    channel
      .on("presence", { event: "sync" }, () => {
        const newState = channel.presenceState();

        if (Object.values(newState).some((p) => p.user_id === userId)) {
          setIsOnline(true);
        }
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        if (newPresences.some((p) => p.user_id === userId)) {
          setIsOnline(true);
        }
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        if (leftPresences.some((p) => p.user_id === userId)) {
          setIsOnline(false);
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: session.user.id,
            status: "online",
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div
      className={`w-2 h-2 rounded-full ${
        isOnline ? "bg-green-500" : "bg-red-500"
      }`}
    />
  );
};

export default UserStatusIndicator;
