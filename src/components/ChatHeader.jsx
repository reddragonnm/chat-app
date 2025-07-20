import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

const ChatHeader = ({ selectedUserData, onVideoCall }) => {
  return (
    <div className="flex items-center justify-between py-3 px-5 md:px-10 lg:px-20 border-b w-full">
      <div className="flex items-center gap-5">
        <Avatar className="h-11 w-11">
          <AvatarImage src={selectedUserData?.avatar_url} />
          <AvatarFallback>
            {selectedUserData?.username?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <h2 className="font-bold text-lg">{selectedUserData?.username}</h2>
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={onVideoCall}
        className="h-9 w-auto p-2 font-semibold"
      >
        <Phone className="h-4 w-4" />
        Video Call
      </Button>
    </div>
  );
};

export default ChatHeader;
