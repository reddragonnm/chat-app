import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";

import { useAuth, supabase } from "@/contexts/AuthContext";

import VideoCall from "@/components/VideoCall";
import ChatList from "@/components/ChatList";
import Profile from "@/components/Profile";
import NewMessage from "@/components/NewMessage";
import MessageDisplay from "@/components/MessageDisplay";
import LoadingSpinner from "@/components/LoadingSpinner";
import ChatHeader from "@/components/ChatHeader";
import ChatLanding from "@/components/ChatLanding";

import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";

const Chat = () => {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const [chatList, setChatList] = useState({});
  const chatListRef = useRef(chatList);

  const [selectedUser, setSelectedUser] = useState(null);
  const selectedUserRef = useRef(selectedUser);

  const [loading, setLoading] = useState(true);

  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  useEffect(() => {
    chatListRef.current = chatList;
  }, [chatList]);

  const scrollToBottom = useCallback((delay = 0, behavior = "smooth") => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({
          behavior,
        });
      }
    }, delay);
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!session?.user?.id) return;

    setLoading(true);

    const { data: messageData, error: messageError } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
      .order("created_at", { ascending: true });

    if (messageError) {
      console.error("Error fetching messages:", messageError.message);
      setMessages([]);
      setLoading(false);
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
      setLoading(false);
      return;
    }

    const chatMap = {};
    userData.forEach((user) => {
      chatMap[user.user_id] = user;
    });

    setChatList(chatMap);
    setLoading(false);
  }, []);

  const setMessageSeen = useCallback(async (messageId) => {
    const { error } = await supabase
      .from("messages")
      .update({ seen: true })
      .eq("id", messageId);

    if (error) {
      console.error("Error marking message as seen:", error.message);
    }
  }, []);

  const handleSendMessage = useCallback(
    async (newMessage) => {
      if (!selectedUser || !session?.user?.id) return;

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
    },
    [selectedUser]
  );

  const handleRealtimeMessageChange = useCallback((payload) => {
    if (payload.eventType === "INSERT") {
      setMessages((prev) => [...prev, payload.new]);

      if (
        payload.new.sender_id === session.user.id ||
        payload.new.sender_id === selectedUserRef.current
      ) {
        scrollToBottom(100);
      } else {
        toast(
          `New message from ${
            chatListRef.current[payload.new.sender_id]?.username || "Unknown"
          } : ${payload.new.message}`
        );
      }
    } else if (payload.eventType === "UPDATE") {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === payload.new.id ? payload.new : msg))
      );
    }
  }, []);

  useEffect(() => {
    if (!session) {
      navigate("/login");
      return;
    }
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
  }, []);

  useEffect(() => {
    if (selectedUser && messages.length > 0) {
      const unseenMessages = messages.filter(
        (msg) => msg.sender_id === selectedUser && !msg.seen
      );

      unseenMessages.forEach((msg) => setMessageSeen(msg.id));
    }
  }, [selectedUser, messages]);

  useEffect(() => {
    if (selectedUser) {
      scrollToBottom(0, "auto");
    }
  }, [selectedUser]);

  const filteredMessages = useCallback(() => {
    if (!selectedUser || !session?.user?.id) return [];

    return messages.filter(
      (msg) =>
        (msg.sender_id === session.user.id &&
          msg.receiver_id === selectedUser) ||
        (msg.receiver_id === session.user.id && msg.sender_id === selectedUser)
    );
  }, [messages, selectedUser]);

  const currentMessages = filteredMessages();

  if (loading || !session || !chatList) {
    return <LoadingSpinner />;
  }

  return (
    <SidebarProvider>
      <ChatList
        userId={session.user.id}
        chatListData={chatList}
        onChatSelect={setSelectedUser}
        selectedUserId={selectedUser}
        onProfileClick={() => setProfileDialogOpen(true)}
      />

      <main className="flex flex-col h-screen w-full">
        <SidebarTrigger className="lg:hidden md:hidden" />

        <VideoCall
          userId={session.user.id}
          chatListData={chatList.current}
          selectedUser={selectedUser}
          videoDialogOpen={videoDialogOpen}
          setVideoDialogOpen={setVideoDialogOpen}
        />

        <Profile isOpen={profileDialogOpen} setIsOpen={setProfileDialogOpen} />

        <Toaster position="bottom-right" />

        {selectedUser ? (
          <>
            <ChatHeader
              selectedUserData={chatList[selectedUser]}
              onVideoCall={() => setVideoDialogOpen(true)}
            />

            <ScrollArea className="overflow-y-scroll px-5 md:px-10 lg:px-20 py-4">
              <MessageDisplay
                messages={currentMessages}
                chatList={chatList}
                userId={session.user.id}
              />

              <div ref={messagesEndRef} />
            </ScrollArea>

            <NewMessage handleSendMessage={handleSendMessage} />
          </>
        ) : (
          <ChatLanding />
        )}
      </main>
    </SidebarProvider>
  );
};

export default Chat;
