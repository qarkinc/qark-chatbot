"use client";
import { citation } from "@/db/schema";
import { Message } from "ai";
import Link from "next/link";
import { ReactNode, useCallback } from "react";
import { Card } from "../ui/card";
import { LogoGMail } from "./icons";
import { Skeleton } from "../ui/skeleton";
import { TooltipTrigger, Tooltip, TooltipContent, BetterTooltip } from "../ui/tooltip";

export default function MessageCitations({
  citations = [],
  message,
  content,
  isDesktop = false,
  isLoading = false
}: {
  citations: Array<any>,
  message: Message,
  content: ReactNode,
  isDesktop?: boolean
  isLoading?: boolean
}) {
  const renderCentiations = useCallback((ele: any, idx: number) => {
    if (String(ele.subject).length === 0) return null;

    let mailLink;
    if (isDesktop) {
      mailLink = `https://mail.google.com/mail/u/0/#all/${ele.appMessageId}`;
    } else {
      mailLink = `https://mail.google.com/mail/mu/mp/#cv/All%20Mail/${ele.appMessageId}`;
    }

    return (
      <Link href={mailLink} key={`${ele.appMessageId}-${idx}`} target='_blank'>
        <Card className='p-2 size-full hover:bg-muted-foreground/30 bg-muted'>
          <span className='text-sm text-ellipsis line-clamp-2 w-full'>
            {ele.subject}
          </span>
          <div className="flex text-xs items-center gap-1 mt-3">
            <LogoGMail />
            <span>gmail</span>
          </div>
        </Card>
      </Link>
    )
  }, [isDesktop]);

  if (isLoading || message.role === 'user' || citations.length === 0) return null;
  return (
    <>
      <h4 className='font-bold mt-3 text-xl'>Sources</h4>
      {(
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 select-none'>
          {citations.slice(0, 3).map(renderCentiations)}
          {citations.length > 4 && (<>{content}</>)}
        </div>
      )}
    </>
  );
}