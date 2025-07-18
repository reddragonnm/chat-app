import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import Peer from "peerjs";

import { useAuth, supabase } from "../AuthContext";
import UserStatusIndicator from "../components/UserStatusIndicator";

const Chat = () => {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [chatlist, setChatlist] = useState({});

  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState("");

  const [loading, setLoading] = useState(true);

  const peer = useRef(null);
  const [peerId, setPeerId] = useState(null);
  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const fetchUserData = async (userId) => {
    const { data, error } = await supabase
      .from("userdata")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!error && data) {
      setChatlist((prev) => ({ ...prev, [data.user_id]: data }));
    }
  };

  const fetchMessages = async () => {
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
      console.error("Error fetching chatlist:", userError.message);
      setChatlist(null);
      return;
    }

    const chatMap = {};
    userData.forEach((user) => {
      chatMap[user.user_id] = user;
    });

    setChatlist(chatMap);
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

      const newMessage = payload.new;
      const involvedUsers = [newMessage.sender_id, newMessage.receiver_id];

      involvedUsers.forEach((userId) => {
        if (!chatlist[userId]) {
          fetchUserData(userId);
        }
      });
    } else if (payload.eventType === "UPDATE") {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === payload.new.id ? payload.new : msg))
      );
    }
  };

  const handleIncomingCall = async (payload) => {
    const callData = payload.new;

    // Check if current user is the receiver
    if (callData.receiver_id !== session.user.id) return;

    if (payload.eventType === "INSERT" && callData.status === "ringing") {
      const accept = window.confirm(
        `${
          chatlist[callData.caller_id]?.username || "Someone"
        } is calling you. Accept?`
      );

      if (accept) {
        // Update status to accepted
        await supabase
          .from("calls")
          .update({
            status: "accepted",
            receiver_peer_id: peerId, // important!
          })
          .eq("id", callData.id);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        myVideoRef.current.srcObject = stream;
        myVideoRef.current.play();

        // Call the caller using their peerId
        const call = peer.current.call(callData.caller_peer_id, stream);

        call.on("stream", (remoteStream) => {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play();
        });

        call.on("close", () => {
          remoteVideoRef.current.srcObject = null;
        });
      } else {
        // optionally: reject call
        await supabase
          .from("calls")
          .update({ status: "rejected" })
          .eq("id", callData.id);
      }
    }
  };

  const handleCallStatusUpdate = async (payload) => {
    const updatedCall = payload.new;
    if (
      updatedCall.status === "accepted" &&
      updatedCall.caller_id === session.user.id
    ) {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      myVideoRef.current.srcObject = stream;
      myVideoRef.current.play();

      const call = peer.current.call(updatedCall.receiver_peer_id, stream);

      call.on("stream", (remoteStream) => {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play();
      });

      call.on("close", () => {
        remoteVideoRef.current.srcObject = null;
      });
    }
  };

  useEffect(() => {
    if (!session) {
      navigate("/login");
    } else {
      fetchMessages().then(() => {
        setLoading(false);
      });

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

      const callSubscription = supabase
        .channel("public:calls")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "calls",
          },
          (payload) => {
            handleIncomingCall(payload);
            handleCallStatusUpdate(payload);
          }
        )
        .subscribe();

      const newPeer = new Peer();
      newPeer.on("open", (id) => {
        setPeerId(id);
      });

      newPeer.on("call", async (call) => {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        myVideoRef.current.srcObject = stream;
        myVideoRef.current.play();

        call.answer(stream);
        call.on("stream", (remoteStream) => {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play();
        });
      });

      peer.current = newPeer;

      return () => {
        supabase.removeChannel(subscription);
        supabase.removeChannel(callSubscription);

        if (peer.current) {
          peer.current.destroy();
          peer.current = null;
        }
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

  if (loading || !session) {
    return <p>Loading...</p>;
  }

  return (
    <>
      <h1>Chat page</h1>

      <p>Welcome back: {chatlist[session.user.id].username}</p>
      <button
        onClick={() => {
          logout();
          navigate("/login");
        }}
      >
        Logout
      </button>

      <ul>
        {Object.values(chatlist)
          .filter((user) => user.user_id !== session.user.id)
          .map((user) => (
            <li key={user.user_id}>
              <img
                src={
                  user.avatarUrl ||
                  `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${user.username}`
                }
                width="50"
                height="50"
                alt=""
              />

              <button onClick={() => setSelectedUser(user.user_id)}>
                {user.username}
              </button>

              <UserStatusIndicator userId={user.user_id} />
            </li>
          ))}
      </ul>

      {selectedUser && (
        <div>
          <h2>Chat with {chatlist[selectedUser].username}</h2>

          <div>
            <h3>Video Call</h3>
            <video ref={myVideoRef} autoPlay muted style={{ width: "200px" }} />
            <video ref={remoteVideoRef} autoPlay style={{ width: "200px" }} />
          </div>

          <button
            style={{ marginLeft: "10px" }}
            onClick={async () => {
              if (!peerId) return;

              await supabase.from("calls").insert([
                {
                  caller_id: session.user.id,
                  receiver_id: chatlist[selectedUser].user_id,
                  caller_peer_id: peerId,
                  status: "ringing",
                },
              ]);
            }}
          >
            📹 Call
          </button>

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
                  <strong>{chatlist[msg.sender_id].username}:</strong>{" "}
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
    </>
  );
};

export default Chat;
