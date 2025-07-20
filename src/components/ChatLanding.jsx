import { Send } from "lucide-react";

const ChatLanding = () => {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Send className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
        <p className="text-muted-foreground">
          Choose a contact from the sidebar to start chatting
        </p>
      </div>
    </div>
  );
};

export default ChatLanding;
