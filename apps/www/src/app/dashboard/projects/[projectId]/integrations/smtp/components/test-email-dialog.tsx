"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { LoaderCircle, SendHorizontal } from "lucide-react";

const testEmailSchema = z.object({
  recipient: z.string().email("Please enter a valid email address"),
});

type TestEmailFormValues = z.infer<typeof testEmailSchema>;

interface TestEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendTest: (recipient: string) => void;
}

export function TestEmailDialog({ 
  open, 
  onOpenChange,
  onSendTest 
}: TestEmailDialogProps) {
  const [isSending, setIsSending] = useState(false);

  const form = useForm<TestEmailFormValues>({
    resolver: zodResolver(testEmailSchema),
    defaultValues: {
      recipient: "",
    },
  });

  function onSubmit(data: TestEmailFormValues) {
    setIsSending(true);
    
    try {
      onSendTest(data.recipient);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Test Email</DialogTitle>
          <DialogDescription>
            Send a test email to verify your SMTP configuration is working correctly.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="recipient"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="your-email@example.com" 
                      type="email"
                      autoComplete="email"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSending || !form.formState.isValid}
                className="gap-2"
              >
                {isSending ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <SendHorizontal className="h-4 w-4" />
                    Send Test Email
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}