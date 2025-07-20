import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { Send } from "lucide-react";

const NewMessage = ({ handleSendMessage }) => {
  const [newMessage, setNewMessage] = useState("");

  return (
    <div className="py-7 px-5 md:px-10 lg:px-20 border-t">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (newMessage.trim()) {
            handleSendMessage(newMessage);
            setNewMessage("");
          }
        }}
        className="flex gap-4"
      >
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
  );
};

export default NewMessage;
