'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { type User } from 'next-auth';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { LogoGMail, LogoGoogle, LogoWhatsapp, PlusIcon } from '@/components/custom/icons';
import { SidebarHistory } from '@/components/custom/sidebar-history';
import { SidebarUserNav } from '@/components/custom/sidebar-user-nav';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import { BetterTooltip } from '@/components/ui/tooltip';
import { User as pgUser } from '@/db/schema';


export function AppSidebar({
  currentUser,
  userRecord
}: {
  currentUser: User | undefined,
  userRecord: pgUser | null,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setOpenMobile } = useSidebar();

  useEffect(() => {
    const handleToastNotifications = (
      key: string,
      successMessage: string,
      failureMessage: string
    ) => {
      const status = searchParams.get(key);

      if (status === "success") {
        toast.success(successMessage);
      } else if (status === "failed") {
        toast.error(failureMessage);
      }

      // Remove the query parameter from the URL after handling
      if (status) {
        router.replace("/");
      }
    };

    // Handle notifications for authorization and revoke-access
    handleToastNotifications("authorization_status", "Gmail linked successfully!", "Gmail linking failed. Please try again.");
    handleToastNotifications("revoke_access_status", "Gmail unlinked successfully!", "Failed to unlink Gmail access. Please try again.");
  }, [router, searchParams]);

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center">
            <div
              onClick={() => {
                setOpenMobile(false);
                router.push('/');
                router.refresh();
              }}
              className="flex flex-row gap-3 items-center"
            >
              <span className="text-lg font-semibold px-2 hover:bg-muted rounded-md cursor-pointer">
                Qark
              </span>
            </div>
            <BetterTooltip content="New Chat" align="start">
              <Button
                variant="ghost"
                className="p-2 h-fit"
                onClick={() => {
                  setOpenMobile(false);
                  router.push('/');
                  router.refresh();
                }}
              >
                <PlusIcon />
              </Button>
            </BetterTooltip>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <Link
            href={`/api/google_auth/${(userRecord?.isGmailConnected ?? false) ? "revoke-access" : "authorize"}?user_id=${currentUser?.id}`}
            target="_blank"
            className="w-full"
          >
            <Button variant="outline" className="mb-2 flex justify-start w-full">
              <LogoGMail size={44} />
              <span >{(userRecord?.isGmailConnected ?? false) ? "Unlink" : "Link"} Gmail</span>
            </Button>
          </Link>
          <Button variant="outline" className="flex justify-start" onClick={() => toast.warning("Under Development")}>
            <LogoWhatsapp size={44} />
            <span >Link Whatsapp</span>
          </Button>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarHistory user={currentUser} />
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="gap-0">
        {currentUser && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarUserNav user={currentUser} />
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
