import UserStatusIndicator from "@/components/UserStatusIndicator";

import { useNavigate } from "react-router";
import { useAuth } from "@/contexts/AuthContext";

import {
  Sidebar,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import { Settings } from "lucide-react";

import { cn } from "@/lib/utils";

const ChatList = ({ userId, chatListData, onChatSelect, selectedUserId }) => {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <Sidebar>
      <SidebarHeader className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9">
            <AvatarImage
              src={chatListData[userId]?.avatar_url || "/placeholder.svg"}
              alt={chatListData[userId]?.username}
            />
            <AvatarFallback>
              {chatListData[userId]?.username?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <h1 className="text-xl font-bold">
            {chatListData[userId]?.username}
          </h1>
        </div>
      </SidebarHeader>

      <SidebarContent className="">
        <SidebarMenu>
          {Object.values(chatListData)
            .filter((user) => user.user_id !== userId)
            .map((user) => (
              <SidebarMenuItem key={user.user_id} className="w-full h-16">
                <SidebarMenuButton
                  onClick={() => onChatSelect(user.user_id)}
                  className={`
                    flex items-center gap-3 w-full p-4 rounded-lg hover:bg-muted transition-colors h-full
                    ${selectedUserId === user.user_id && "bg-muted/50"}
                  `}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user.avatar_url} alt={user.username} />
                    <AvatarFallback className="text-base font-semibold">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <span className="flex-1 font-semibold text-base">
                    {user.username}
                  </span>

                  <UserStatusIndicator userId={user.user_id} />
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="px-6 py-4 border-t flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Welcome back,{" "}
          <span className="font-semibold text-foreground">
            {chatListData[userId]?.username}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="font-bold"
        >
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default ChatList;
