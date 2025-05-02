import { ArrowUpRight, MailIcon, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SmtpMessage() {
  return (
    <Card className="w-full mt-6">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <AlertCircle size={20} className="text-yellow-500 mt-1" />
          <div className="space-y-4 flex-1">
            <div>
              <h3 className="font-semibold text-lg mb-2">Email Delivery Settings</h3>
              <p className="text-sm text-muted-foreground">
                You are currently using the default email service which has rate limits. 
                Consider setting up custom SMTP for better delivery rates and control.
              </p>
            </div>

            <Tabs defaultValue="current" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="current">Current Setup</TabsTrigger>
                <TabsTrigger value="custom">Custom SMTP</TabsTrigger>
              </TabsList>
              
              <TabsContent value="current" className="space-y-4 mt-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MailIcon size={16} />
                    <span className="font-medium">Default Email Service</span>
                  </div>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>• Limited to 4 emails per hour</li>
                    <li>• Basic email templates</li>
                    <li>• Shared IP address pool</li>
                  </ul>
                </div>
              </TabsContent>
              
              <TabsContent value="custom" className="space-y-4 mt-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MailIcon size={16} />
                    <span className="font-medium">Custom SMTP Benefits</span>
                  </div>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>• Unlimited email sending</li>
                    <li>• Custom email templates</li>
                    <li>• Dedicated IP address</li>
                    <li>• Better deliverability</li>
                  </ul>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Link
                    href="https://supabase.com/docs/guides/auth/auth-smtp"
                    target="_blank"
                    className="text-primary hover:text-primary/80 flex items-center text-sm gap-1 font-medium"
                  >
                    Setup Custom SMTP <ArrowUpRight size={14} />
                  </Link>
                  <Link
                    href="https://supabase.com/docs/guides/auth/auth-email-templates"
                    target="_blank"
                    className="text-primary/70 hover:text-primary/90 flex items-center text-sm gap-1"
                  >
                    Customize Email Templates <ArrowUpRight size={14} />
                  </Link>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
