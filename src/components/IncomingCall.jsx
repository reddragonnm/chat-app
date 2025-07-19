import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { Phone, PhoneOff, Minimize2 } from "lucide-react";

const IncomingCall = ({ callData, isOpen }) => {
  if (!callData || !isOpen) return null;

  const { callerName, callerAvatar, onAccept, onReject } = callData;

  return (
    <Dialog open={isOpen} onOpenChange={onReject}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-center">
            Incoming Call
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground text-center">
            {callerName} is calling you
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6 py-6">
          <Avatar className="h-24 w-24 ring-4 ring-primary/20">
            <AvatarImage src={callerAvatar} />
            <AvatarFallback className="text-2xl font-semibold">
              {callerName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="text-center space-y-1">
            <h3 className="text-xl font-semibold">{callerName}</h3>
          </div>

          <DialogFooter className="flex items-center space-x-8">
            <Button
              onClick={onAccept}
              className="h-14 w-14 rounded-full p-0 bg-green-500 hover:bg-green-600"
              size="lg"
            >
              <Phone className="h-6 w-6" />
            </Button>

            <Button
              onClick={onReject}
              variant="destructive"
              size="lg"
              className="h-14 w-14 rounded-full p-0 transition-all duration-150 active:scale-95 hover:scale-105 active:bg-red-600"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IncomingCall;
