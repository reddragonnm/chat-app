import Peer from "peerjs";
import { useEffect, useRef, useState } from "react";

import { supabase } from "@/contexts/AuthContext";

const VideoCall = ({ userId, chatListData, selectedUser }) => {
  const peer = useRef(null);
  const [peerId, setPeerId] = useState(null);

  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const currentCall = useRef(null);
  const [inCall, setInCall] = useState(false);

  const stopStreams = () => {
    if (myVideoRef.current?.srcObject) {
      myVideoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      myVideoRef.current.srcObject = null;
      myVideoRef.current.oncanplay = null;
    }

    if (remoteVideoRef.current?.srcObject) {
      remoteVideoRef.current.srcObject
        .getTracks()
        .forEach((track) => track.stop());
      remoteVideoRef.current.srcObject = null;
      remoteVideoRef.current.oncanplay = null;
    }
  };

  const getStream = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    myVideoRef.current.srcObject = stream;
    myVideoRef.current.oncanplay = () => {
      myVideoRef.current.play();
    };

    return stream;
  };

  const onRemoteStream = (remoteStream) => {
    if (!remoteVideoRef.current) return;

    remoteVideoRef.current.srcObject = remoteStream;

    remoteVideoRef.current.oncanplay = () => {
      remoteVideoRef.current.play();
    };
  };

  const handleIncomingCall = async (payload) => {
    const callData = payload.new;

    if (callData.receiver_id !== userId) return;

    if (payload.eventType === "INSERT" && callData.status === "ringing") {
      const accept = window.confirm(
        `${
          chatListData[callData.caller_id]?.username || "Someone"
        } is calling you. Accept?`
      );

      if (accept) {
        await supabase
          .from("calls")
          .update({
            status: "ongoing",
          })
          .eq("id", callData.id);

        const call = peer.current.call(
          callData.caller_peer_id,
          await getStream()
        );

        currentCall.current = call;
        setInCall(true);

        call.on("stream", onRemoteStream);

        call.on("close", () => {
          stopStreams();
          setInCall(false);

          supabase
            .from("calls")
            .update({
              status: "ended",
            })
            .eq("id", callData.id);
        });
      } else {
        await supabase
          .from("calls")
          .update({ status: "rejected" })
          .eq("id", callData.id);
      }
    }
  };

  const makeCall = async () => {
    if (!peerId) return;

    await supabase.from("calls").insert([
      {
        caller_id: userId,
        receiver_id: chatListData[selectedUser].user_id,
        caller_peer_id: peerId,
        status: "ringing",
      },
    ]);
  };

  useEffect(() => {
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
        }
      )
      .subscribe();

    const newPeer = new Peer();
    newPeer.on("open", (id) => {
      setPeerId(id);
    });

    newPeer.on("call", async (call) => {
      call.answer(await getStream());

      currentCall.current = call;
      setInCall(true);

      call.on("stream", onRemoteStream);

      call.on("close", () => {
        stopStreams();
        setInCall(false);
      });
    });

    peer.current = newPeer;

    return () => {
      supabase.removeChannel(callSubscription);

      if (peer.current) {
        peer.current.destroy();
        peer.current = null;
      }
    };
  }, []);

  if (!selectedUser) return null;

  return (
    <>
      <div>
        <h3>Video Call</h3>
        <video ref={myVideoRef} autoPlay muted style={{ width: "200px" }} />
        <video ref={remoteVideoRef} autoPlay style={{ width: "200px" }} />
      </div>

      {!inCall ? (
        <button onClick={() => makeCall()}>📹 Call</button>
      ) : (
        <button
          onClick={() => {
            if (currentCall.current) {
              currentCall.current.close();
              currentCall.current = null;
            }
          }}
        >
          🔴 Hang Up
        </button>
      )}
    </>
  );
};

export default VideoCall;
