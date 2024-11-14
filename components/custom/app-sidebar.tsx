'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type User } from 'next-auth';
import { v4 as uudiV4 } from "uuid";

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


export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  const handleGoogleConnection = async () => {
    // Generate a unique UUID for the state parameter to prevent CSRF attacks
    const stateUUID = uudiV4();

    // Store the generated UUID in localstorage to validate the state upon callback
    localStorage.setItem("generated_uuid", stateUUID);

    // Initialize the base URL for Google's OAuth2 authorization endpoint
    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");

    // Set the client ID parameter for your Google app (stored in environment variables)
    googleAuthUrl.searchParams.set("client_id", process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!);

    // Set the redirect URI to handle the response from Google after authentication
    googleAuthUrl.searchParams.set("redirect_uri", `${window.location.origin}/google_auth`);

    // Set the response type to "token" to use the implicit flow, which returns an access token directly
    googleAuthUrl.searchParams.set("response_type", "token");

    // Specify the OAuth scope, which in this case allows reading Gmail messages
    googleAuthUrl.searchParams.set("scope", "https://www.googleapis.com/auth/gmail.readonly");

    // Include previously granted scopes to avoid redundant permission prompts
    googleAuthUrl.searchParams.set("include_granted_scopes", "true");

    // Set the unique state value to protect against CSRF; Google will return this exact value
    googleAuthUrl.searchParams.set("state", stateUUID);

    // Set prompt to "consent" to ensure Google shows the permission screen each time
    googleAuthUrl.searchParams.set("prompt", "consent");

    // Open the Google authorization URL in a new tab with security options
    window.open(googleAuthUrl, "_blank", "noopener,noreferrer");
  }

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
          <Button variant="outline" className="mb-2 flex justify-start" onClick={handleGoogleConnection}>
            <LogoGMail size={44} />
            <span >Connect Gmail</span>
          </Button>
          {/* <Link href={"/google"} passHref>
          </Link> */}
          <Button variant="outline" className="flex justify-start">
            <LogoWhatsapp size={44} />
            <span >Connect Whatsapp</span>
          </Button>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarHistory user={user} />
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="gap-0">
        {user && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarUserNav user={user} />
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
