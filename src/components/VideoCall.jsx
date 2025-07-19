import Peer from "peerjs";
import { useEffect, useRef, useState } from "react";

import { supabase } from "@/contexts/AuthContext";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import IncomingCall from "./IncomingCall";

const VideoCall = ({
  userId,
  chatListData,
  selectedUser,
  videoDialogOpen,
  setVideoDialogOpen,
}) => {
  const peer = useRef(null);
  const [peerId, setPeerId] = useState(null);

  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const currentCall = useRef(null);
  const [inCall, setInCall] = useState(false);

  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [callData, setCallData] = useState(null);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);

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
      video: isVideoOn,
      audio: isMicOn,
    });

    if (myVideoRef.current) {
      myVideoRef.current.srcObject = stream;
      myVideoRef.current.oncanplay = () => {
        myVideoRef.current.play();
      };
    }

    return stream;
  };

  const onRemoteStream = (remoteStream) => {
    if (!remoteVideoRef.current) return;

    remoteVideoRef.current.srcObject = remoteStream;

    remoteVideoRef.current.oncanplay = () => {
      remoteVideoRef.current.play();
    };
  };

  const toggleMic = () => {
    if (myVideoRef.current?.srcObject) {
      const audioTracks = myVideoRef.current.srcObject.getAudioTracks();

      audioTracks.forEach((track) => {
        track.enabled = !isMicOn;
      });
    }

    setIsMicOn(!isMicOn);
  };

  const toggleVideo = async () => {
    if (myVideoRef.current?.srcObject) {
      const videoTracks = myVideoRef.current.srcObject.getVideoTracks();

      videoTracks.forEach((track) => {
        track.enabled = !isVideoOn;
      });
    }
    setIsVideoOn(!isVideoOn);
  };

  const handleIncomingCall = async (payload) => {
    const data = payload.new;

    if (data.receiver_id !== userId) return;

    if (payload.eventType === "INSERT" && data.status === "ringing") {
      setCallData({
        callerName: chatListData[data.caller_id]?.username || "Unknown",
        callerAvatar: chatListData[data.caller_id]?.avatar_url || "",

        onAccept: async () => {
          setCallDialogOpen(false);
          setInCall(true);
          setVideoDialogOpen(true);

          await supabase
            .from("calls")
            .update({
              status: "ongoing",
            })
            .eq("id", data.id);

          const call = peer.current.call(
            data.caller_peer_id,
            await getStream()
          );

          currentCall.current = call;

          call.on("stream", onRemoteStream);

          call.on("close", () => {
            stopStreams();
            setInCall(false);

            supabase
              .from("calls")
              .update({
                status: "ended",
              })
              .eq("id", data.id);
          });
        },

        onReject: async () => {
          setCallDialogOpen(false);
          setCallData(null);

          await supabase
            .from("calls")
            .update({ status: "rejected" })
            .eq("id", data.id);
        },
      });

      setCallDialogOpen(true);
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

    setVideoDialogOpen(true);
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

  const closeCall = () => {
    if (currentCall.current) {
      currentCall.current.close();
      currentCall.current = null;
    }
    setIsMicOn(true);
    setIsVideoOn(true);
    setVideoDialogOpen(false);
    setCallData(null);
  };

  return (
    <>
      <IncomingCall isOpen={callDialogOpen} callData={callData} />

      {(callData || selectedUser) && (
        <Dialog open={videoDialogOpen} onOpenChange={closeCall}>
          <DialogContent className="w-full max-w-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-center mb-1">
                {inCall ? "In Call" : "Start a Video Call"}
              </DialogTitle>
              <DialogDescription className="text-center text-muted-foreground">
                {inCall
                  ? `You are in a call with ${
                      callData?.callerName ||
                      chatListData[selectedUser].username
                    }`
                  : "Tap below to initiate a video call."}
              </DialogDescription>
            </DialogHeader>

            {inCall ? (
              <div className="flex flex-col lg:flex-row items-center justify-center gap-6 mt-4">
                <div className="relative w-full lg:w-1/2 aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    ref={myVideoRef}
                    autoPlay
                    muted
                    className="w-full h-full object-cover"
                  />
                  {!isVideoOn && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Avatar className="w-24 h-24">
                        <AvatarImage
                          src={chatListData[userId].avatar_url}
                          alt="Avatar"
                        />
                        <AvatarFallback className="text-3xl font-semibold">
                          {chatListData[userId].username
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                </div>

                <div className="w-full lg:w-1/2 aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ) : (
              <Button
                onClick={makeCall}
                className="mt-6 w-full text-base font-medium"
              >
                Start Call
              </Button>
            )}

            <div className="flex flex-wrap justify-center gap-4 mt-6">
              <Button variant="secondary" onClick={toggleMic}>
                {isMicOn ? (
                  <Mic className="mr-2" />
                ) : (
                  <MicOff className="mr-2" />
                )}
                {isMicOn ? "Mute Mic" : "Unmute Mic"}
              </Button>

              <Button variant="secondary" onClick={toggleVideo}>
                {isVideoOn ? (
                  <Video className="mr-2" />
                ) : (
                  <VideoOff className="mr-2" />
                )}
                {isVideoOn ? "Hide Video" : "Show Video"}
              </Button>

              {inCall && (
                <Button
                  onClick={closeCall}
                  variant="destructive"
                  className="font-semibold"
                >
                  <PhoneOff className="mr-2" />
                  Hang Up
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default VideoCall;
