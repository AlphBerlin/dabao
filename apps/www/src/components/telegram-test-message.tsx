"use client";

import React, { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "@workspace/ui/components/sonner";

type TestMessageProps = {
  projectId: string;
  telegramCampaignId: string;
  disabled?: boolean;
};

export function TelegramTestMessage({ projectId, telegramCampaignId, disabled = false }: TestMessageProps) {
  const [open, setOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState("");

  const handleSendTest = async () => {
    if (!telegramUsername) {
      toast.error("Please enter a Telegram username");
      return;
    }

    try {
      setIsSending(true);
      const response = await fetch(
        `/api/projects/${projectId}/integrations/telegram/campaigns/${telegramCampaignId}/test`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            telegramUsername,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send test message");
      }

      toast.success( "Test message sent successfully");
      setOpen(false);
    } catch (error) {
      console.error("Error sending test message:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send test message");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          <MessageSquare className="mr-2 h-4 w-4" />
          Send Test Message
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Test Message</DialogTitle>
          <DialogDescription>
            Send a test message to a Telegram user to preview your campaign
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="telegramUsername" className="text-right">
              Username
            </Label>
            <Input
              id="telegramUsername"
              placeholder="@username"
              className="col-span-3"
              value={telegramUsername}
              onChange={(e) => setTelegramUsername(e.target.value)}
            />
          </div>
          <div className="col-span-4 text-sm text-muted-foreground">
            <p>The user must have already started a conversation with your bot.</p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSendTest} disabled={isSending}>
            {isSending ? "Sending..." : "Send Test"}
            {!isSending && <Send className="ml-2 h-4 w-4" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}