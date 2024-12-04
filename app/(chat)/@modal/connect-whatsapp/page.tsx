"use client";

import { auth } from "@/app/(auth)/auth";
import ConnectWhatsapp from "@/components/custom/connect-whatsapp";
import * as Dialog from "@radix-ui/react-dialog";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Page() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [userId, setUserId] = useState<string | null>(null);

  const handleClose = () => {
    router.back();
    setIsOpen(false)
  }

  return (
    <Dialog.Root defaultOpen={true} open={isOpen} onOpenChange={handleClose}>
      <Dialog.Title>{" "}</Dialog.Title>
      <Dialog.Portal>
        <Dialog.Overlay className={clsx(
          "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        )} />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg"
          onInteractOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => event.preventDefault()}
        >
          <ConnectWhatsapp handleClose={handleClose} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}