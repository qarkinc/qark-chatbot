'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { type User } from 'next-auth';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { LogoGMail, LogoWhatsapp, PlusIcon } from '@/components/custom/icons';
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
import { Accounts, User as pgUser } from '@/db/schema';

import ConfirmationModal from './confirmation-modal';
import { QarkAccountLinkingStatus, QarkAccountProviders } from '@/lib/variables';
import { LoaderIcon } from 'lucide-react';
import { getUserAccountsFromDB } from '@/app/(chat)/actions';


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
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const { isMobile, toggleSidebar } = useSidebar();

  const [isWhatsappConnected, setIsWhatsappConnected] = useState<boolean>(false);
  const [activeUserWhatsappAccount, setActiveUserWhatsappAccount] = useState<Accounts | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [dialogContent, setDialogContent] = useState<{
    title?: string,
    message: string,
    callbackRef: () => void,
    yesBtnText?: string,
    noBtnText?: string,
  }>({
    message: "Do you want to proceed with unlinking Gmail?",
    yesBtnText: "Proceed",
    noBtnText: "Cancel",
    callbackRef: () => console.log("Default Callback")
  });

  const checkWhatsappLinkingStatus = useCallback(async () => {
    const userAccounts = await getUserAccountsFromDB(currentUser!.id!);
    const accountIdx = userAccounts.findIndex((ele) => ele.user_id === currentUser?.id && ele.provider === QarkAccountProviders.WHATSAPP);
    if (accountIdx !== -1) {
      const userAccount = Object.assign({}, { ...userAccounts[accountIdx] });
      setIsWhatsappConnected(userAccount.account_linking_status === QarkAccountLinkingStatus.ACCOUNT_LINKING_SUCCESS);
      setActiveUserWhatsappAccount({ ...userAccount })
    }
  }, [currentUser])

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
    checkWhatsappLinkingStatus();
  }, [checkWhatsappLinkingStatus, router, searchParams]);

  // Function to handle revoke-access logic
  const handleRevokeAccess = () => {
    const url = `${window.location.origin}/api/google_auth/revoke-access`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Function to handle authorize logic
  const handleAuthorize = () => {
    const url = `${window.location.origin}/api/google_auth/authorize`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleWhatsappUnlink = async () => {
    try {
      setIsLoading(true);
      const apiReponse = await fetch("/api/whatsapp_auth/unlink", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          userId: activeUserWhatsappAccount?.user_id,
          phoneNumber: activeUserWhatsappAccount?.app_user_id
        })
      });

      if (apiReponse.ok) {
        // const response = await apiReponse.json();
        toast.success("Whatsapp unlinking is successfull")
        setIsLoading(false);
        window.location.reload()
        checkWhatsappLinkingStatus();
      } else {
        toast.error("Something went wrong")
        setIsLoading(false);
      }
    } catch (error) {
      console.log(error);
      
      setIsLoading(false);
      toast.error("Something went wrong")
    }
  }

  const openConfirmationModal = ({ title = "Confirm Action", message, callbackRef }: {
    title?: string,
    message: string,
    callbackRef: () => void,
  }) => {
    setDialogContent((prev) => ({
      ...prev,
      message: message,
      title,
      callbackRef
    }));
    setIsModalOpen(true);
  }

  return (
    <>
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
                <span className="text-3xl px-2 hover:bg-muted rounded-md cursor-pointer font-instrument" style={{ color: '#d73301' }}>
                  QARK
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
            <Button variant="outline" className="mb-2 flex justify-start w-full" onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              if (isMobile) toggleSidebar();
              if (currentUser) {
                if (userRecord?.isGmailConnected ?? false) {
                  openConfirmationModal({
                    message: "Do you want to proceed with unlinking Gmail?",
                    callbackRef: handleRevokeAccess
                  });
                } else {
                  handleAuthorize();
                }
              } else {
                toast.info("Please login first before linking any account with QARK")
              }
            }}>
              <LogoGMail size={44} />
              <span>{(userRecord?.isGmailConnected ?? false) ? "Unlink" : "Link"} Gmail</span>
            </Button>
            <Button variant="outline" className="flex justify-start items-center"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (isMobile) toggleSidebar();
                if (currentUser) {
                  if (isWhatsappConnected) {
                    openConfirmationModal({
                      message: "Do you want to proceed with unlinking Whatapp?",
                      callbackRef: handleWhatsappUnlink
                    })
                  } else {
                    const url = new URL("connect-whatsapp", window.location.origin);
                    url.searchParams.set("userId", currentUser.id!);
                    url.searchParams.set("returnUrl", window.location.href);

                    router.push(url.toString());
                  }
                } else {
                  toast.info("Please login first before linking any account with QARK")
                }
              }}
            >
              <LogoWhatsapp size={44} />
              <span className="flex-1 text-start">{isWhatsappConnected ? "Unlink" : "Link"} Whatsapp</span>
              {isLoading && (
                <div className="animate-spin tex-white self-center">
                  <LoaderIcon />
                </div>
              )}
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
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={dialogContent.title}
        message={dialogContent?.message ?? "Do you really want to do this action?"}
        yesBtnText={dialogContent?.yesBtnText ?? "Proceed"}
        noBtnText={dialogContent?.noBtnText ?? "Cancel"}
        isAcceptedCallback={(isAccpted) => {
          if (isAccpted) {
            dialogContent.callbackRef();
          }
          setIsModalOpen(false);
        }}
      />
    </>

  );
}
