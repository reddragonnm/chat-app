import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";

import { useAuth, supabase } from "@/contexts/AuthContext";

import VideoCall from "@/components/VideoCall";
import ChatList from "@/components/ChatList";

import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

const Chat = () => {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const chatList = useRef({});

  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState("");

  const [loading, setLoading] = useState(true);

  const [videoDialogOpen, setVideoDialogOpen] = useState(false);

  const fetchMessages = async () => {
    setLoading(true);

    const { data: messageData, error: messageError } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
      .order("created_at", { ascending: true });

    if (messageError) {
      console.error("Error fetching messages:", messageError.message);
      setMessages([]);
      return;
    }

    setMessages(messageData);

    const userIds = new Set([session.user.id]);
    messageData.forEach((msg) => {
      userIds.add(msg.sender_id);
      userIds.add(msg.receiver_id);
    });

    const { data: userData, error: userError } = await supabase
      .from("userdata")
      .select("*")
      .in("user_id", Array.from(userIds));

    if (userError) {
      console.error("Error fetching chatList:", userError.message);
      chatList.current = {};
      return;
    }

    const chatMap = {};
    userData.forEach((user) => {
      chatMap[user.user_id] = user;
    });

    chatList.current = chatMap;
    setLoading(false);
  };

  const setMessageSeen = async (messageId) => {
    const { error } = await supabase
      .from("messages")
      .update({ seen: true })
      .eq("id", messageId);

    if (error) {
      console.error("Error marking message as seen:", error.message);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    const { error } = await supabase.from("messages").insert([
      {
        sender_id: session.user.id,
        receiver_id: selectedUser,
        message: newMessage,
      },
    ]);

    if (error) {
      console.error("Error sending message:", error.message);
      return;
    }
    setNewMessage("");
  };

  const handleRealtimeMessageChange = (payload) => {
    if (payload.eventType === "INSERT") {
      setMessages((prev) => [...prev, payload.new]);
    } else if (payload.eventType === "UPDATE") {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === payload.new.id ? payload.new : msg))
      );
    }
  };

  useEffect(() => {
    if (!session) {
      navigate("/login");
    } else {
      fetchMessages();

      const subscription = supabase
        .channel("public:messages")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
          },
          handleRealtimeMessageChange
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, []);

  useEffect(() => {
    if (selectedUser) {
      const unseenMessages = messages.filter(
        (msg) => msg.sender_id === selectedUser && !msg.seen
      );

      unseenMessages.forEach((msg) => setMessageSeen(msg.id));
    }
  }, [selectedUser, messages]);

  if (loading || !session || !chatList.current) {
    return <p>Loading...</p>;
  }

  return (
    <SidebarProvider>
      <ChatList
        userId={session.user.id}
        chatListData={chatList.current}
        onChatSelect={setSelectedUser}
        selectedUserId={selectedUser}
      />

      <main>
        <SidebarTrigger />

        <VideoCall
          userId={session.user.id}
          chatListData={chatList.current}
          selectedUser={selectedUser}
          videoDialogOpen={videoDialogOpen}
          setVideoDialogOpen={setVideoDialogOpen}
        />

        {selectedUser && (
          <div>
            <h2>Chat with {chatList.current[selectedUser].username}</h2>

            <Button onClick={() => setVideoDialogOpen(true)}>
              Start Video Call
            </Button>

            <ul>
              {messages
                .filter(
                  (msg) =>
                    (msg.sender_id === session.user.id &&
                      msg.receiver_id === selectedUser) ||
                    (msg.receiver_id === session.user.id &&
                      msg.sender_id === selectedUser)
                )
                .map((msg) => (
                  <li key={msg.id}>
                    <strong>{chatList.current[msg.sender_id].username}:</strong>{" "}
                    {msg.message}
                    {msg.receiver_id !== session.user.id
                      ? msg.seen
                        ? " (seen)"
                        : " (not seen)"
                      : null}
                  </li>
                ))}
            </ul>

            <form onSubmit={handleSendMessage}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message"
                required
              />
              <button type="submit">Send</button>
            </form>
          </div>
        )}
      </main>
    </SidebarProvider>
  );
};

export default Chat;
