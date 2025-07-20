import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const MessageDisplay = ({ messages, chatList, userId }) => {
  return (
    <div className="flex flex-col gap-3">
      {messages.map((msg) => {
        const isCurrentUser = msg.sender_id === userId;
        const sender = chatList[msg.sender_id];

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
                <AvatarImage src={chatList[userId]?.avatar_url} />
                <AvatarFallback className="text-xs">
                  {chatList[userId]?.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MessageDisplay;
