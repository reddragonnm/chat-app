import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";

import { useAuth, supabase } from "@/contexts/AuthContext";

import VideoCall from "@/components/VideoCall";
import ChatList from "@/components/ChatList";

import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { Send, Phone, MoreVertical } from "lucide-react";

import LoadingSpinner from "@/components/LoadingSpinner";

const Chat = () => {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const chatList = useRef({});
  const messagesEndRef = useRef(null);

  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState("");

  const [loading, setLoading] = useState(true);

  const [videoDialogOpen, setVideoDialogOpen] = useState(false);

  const scrollToBottom = (timeout, behavior) => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({
          behavior: behavior || "smooth",
        });
      }
    }, timeout);
  };

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

    chatList.current = chatMap;
    setLoading(false);
  }, [session?.user?.id]);

  const setMessageSeen = async (messageId) => {
    const { error } = await supabase
      .from("messages")
      .update({ seen: true })
      .eq("id", messageId);

    if (error) {
      console.error("Error marking message as seen:", error.message);
    }
  };

  const handleSendMessage = useCallback(
    async (e) => {
      e.preventDefault();
      if (!newMessage.trim() || !selectedUser || !session?.user?.id) return;

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
    },
    [newMessage, selectedUser, session?.user?.id]
  );

  useEffect(() => {
    if (!session) {
      navigate("/login");
    } else {
      fetchMessages();
    }
  }, [session, navigate, fetchMessages]);

  useEffect(() => {
    if (!session) return;

    const handleRealtimeMessageChange = (payload) => {
      if (payload.eventType === "INSERT") {
        setMessages((prev) => [...prev, payload.new]);

        if (
          payload.new.sender_id === session.user.id ||
          payload.new.sender_id === selectedUser
        ) {
          scrollToBottom(100);
        }
      } else if (payload.eventType === "UPDATE") {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === payload.new.id ? payload.new : msg))
        );
      }
    };

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
  }, [session?.user?.id, selectedUser, scrollToBottom]);

  useEffect(() => {
    if (selectedUser && messages.length > 0) {
      const unseenMessages = messages.filter(
        (msg) => msg.sender_id === selectedUser && !msg.seen
      );

      unseenMessages.forEach((msg) => setMessageSeen(msg.id));
    }
  }, [selectedUser, messages, setMessageSeen]);

  useEffect(() => {
    if (selectedUser) {
      scrollToBottom(0, "auto");
    }
  }, [selectedUser, scrollToBottom]);

  if (loading || !session || !chatList.current) {
    return <LoadingSpinner />;
  }

  return (
    <SidebarProvider>
      <ChatList
        userId={session.user.id}
        chatListData={chatList.current}
        onChatSelect={setSelectedUser}
        selectedUserId={selectedUser}
      />

      <main className="flex flex-col h-screen w-full">
        {/* <SidebarTrigger /> */}

        <VideoCall
          userId={session.user.id}
          chatListData={chatList.current}
          selectedUser={selectedUser}
          videoDialogOpen={videoDialogOpen}
          setVideoDialogOpen={setVideoDialogOpen}
        />

        {selectedUser ? (
          <>
            <div className="flex items-center justify-between py-3 px-20 border-b w-full">
              <div className="flex items-center gap-5">
                <Avatar className="h-11 w-11">
                  <AvatarImage
                    src={chatList.current[selectedUser]?.avatar_url}
                  />
                  <AvatarFallback>
                    {chatList.current[selectedUser]?.username
                      ?.charAt(0)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h2 className="font-bold text-lg">
                  {chatList.current[selectedUser]?.username}
                </h2>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setVideoDialogOpen(true)}
                className="h-9 w-auto p-2 font-semibold"
              >
                <Phone className="h-4 w-4" />
                Video Call
              </Button>
            </div>

            <ScrollArea className="overflow-scroll px-20 py-4">
              <div className="flex flex-col gap-3">
                {messages
                  .filter(
                    (msg) =>
                      (msg.sender_id === session.user.id &&
                        msg.receiver_id === selectedUser) ||
                      (msg.receiver_id === session.user.id &&
                        msg.sender_id === selectedUser)
                  )
                  .map((msg) => {
                    const isCurrentUser = msg.sender_id === session.user.id;
                    const sender = chatList.current[msg.sender_id];

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-5 ${
                          isCurrentUser ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!isCurrentUser && (
                          <Avatar className="h-10 w-10 mt-1">
                            <AvatarImage src={sender?.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {sender?.username?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}

                        <div
                          className={`flex flex-col ${
                            isCurrentUser ? "items-end" : "items-start"
                          }`}
                        >
                          <Card
                            className={`${
                              isCurrentUser
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            } min-w-40 max-w-100 rounded-lg py-4`}
                          >
                            <CardContent>
                              <p className="text-sm">{msg.message}</p>
                            </CardContent>
                          </Card>

                          {isCurrentUser && (
                            <Badge
                              variant={msg.seen ? "secondary" : "outline"}
                              className="text-xs px-1 py-0"
                            >
                              {msg.seen ? "Seen" : "Sent"}
                            </Badge>
                          )}
                        </div>

                        {isCurrentUser && (
                          <Avatar className="h-10 w-10 mt-1">
                            <AvatarImage
                              src={
                                chatList.current[session.user.id]?.avatar_url
                              }
                            />
                            <AvatarFallback className="text-xs">
                              {chatList.current[session.user.id]?.username
                                ?.charAt(0)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    );
                  })}
              </div>

              <div ref={messagesEndRef} />
            </ScrollArea>

            <div className="py-7 px-20 border-t">
              <form onSubmit={handleSendMessage} className="flex gap-4">
                <Input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1"
                  required
                />
                <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Send className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Select a conversation
              </h3>
              <p className="text-muted-foreground">
                Choose a contact from the sidebar to start chatting
              </p>
            </div>
          </div>
        )}
      </main>
    </SidebarProvider>
  );
};

export default Chat;
