'use client';

import { Attachment, Message } from 'ai';
import { useChat } from 'ai/react';
import { AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { useWindowSize } from 'usehooks-ts';

import { ChatHeader } from '@/components/custom/chat-header';
import { PreviewMessage, ThinkingMessage } from '@/components/custom/message';
import { useScrollToBottom } from '@/components/custom/use-scroll-to-bottom';
import { User, Vote } from '@/db/schema';
import { fetcher } from '@/lib/utils';

import { Block, UIBlock } from './block';
import { BlockStreamHandler } from './block-stream-handler';
import { MultimodalInput } from './multimodal-input';
import { Overview } from './overview';
import ConfirmationModal from './confirmation-modal';
import { handleGmailAuthorize } from './app-sidebar';

export function Chat({
  id,
  initialMessages,
  selectedModelId,
  user,
  messageCitations = {}
}: {
  id: string;
  initialMessages: Array<Message>;
  selectedModelId: string;
  user: User | null,
  messageCitations?: { [key: string]: Array<string> },
}) {
  const { mutate } = useSWRConfig();

  const {
    messages,
    error,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    isLoading,
    stop,
    data: streamingData,
  } = useChat({
    api: process.env.NODE_ENV === 'development' ? "/api/chat" : "https://api.qarkx.com/api/chat",
    body: { id, modelId: selectedModelId, userId: user?.id },
    initialMessages,
    onFinish: () => {
      mutate('/api/history');
    },
  });

  const { width: windowWidth = 1920, height: windowHeight = 1080 } =
    useWindowSize();

  const [block, setBlock] = useState<UIBlock>({
    documentId: 'init',
    content: '',
    title: '',
    status: 'idle',
    isVisible: false,
    boundingBox: {
      top: windowHeight / 4,
      left: windowWidth / 4,
      width: 250,
      height: 50,
    },
  });

  const [isErrorModalOpen, setIsErrorModalOpen] = useState<boolean>(false);

  const [errorTitle, setErrorTitle] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // React to changes in the `error` variable
  useEffect(() => {
    if (error) {
      console.log(`Error in chat: ${error}, error message: ${error.message}`)
      if (error.message === "1001") {
        setErrorTitle("Relink your Gmail");
        setErrorMessage("Your Gmail token expired because sometimes Google can invalidate your token. Please relink your Gmail now to avoid service interruption.");
        setIsErrorModalOpen(true); // Open modal if there's an error
      }
    }
  }, [error]); // Trigger this effect when `error` changes
  
  const [citations, setCitations] = useState<{ [key: string]: Array<any> }>({ ...messageCitations });

  const { data: votes } = useSWR<Array<Vote>>(
    `/api/vote?chatId=${id}`,
    fetcher
  );

  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader selectedModelId={selectedModelId} />
        <div
          ref={messagesContainerRef}
          className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4"
        >
          {messages.length === 0 && <Overview />}


          {messages.map((message, index) => {
            // if (message.role === "assistant") {
            //   console.log(message.content);
            // }
            return (
              <PreviewMessage
                key={message.id}
                chatId={id}
                message={{ ...message }}
                block={block}
                setBlock={setBlock}
                citations={citations}
                setCitations={setCitations}
                isLoading={isLoading && messages.length - 1 === index}
                vote={
                  votes
                    ? votes.find((vote) => vote.messageId === message.id)
                    : undefined
                }
              />
            )
          })}

          <ConfirmationModal
            isOpen={isErrorModalOpen}
            onClose={() => setIsErrorModalOpen(false)}
            title={errorTitle}
            message={errorMessage}
            yesBtnText="Proceed"
            buttonType="primary"
            needNoBtn={false}
            isAcceptedCallback={(isAccepted) => {
              if (isAccepted) {
                handleGmailAuthorize();
              }
              setIsErrorModalOpen(false);
            }}
          />

          {isLoading &&
            messages.length > 0 &&
            messages[messages.length - 1].role === 'user' && (
              <ThinkingMessage />
            )}

          <div
            ref={messagesEndRef}
            className="shrink-0 min-w-[24px] min-h-[24px]"
          />
        </div>
        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          <MultimodalInput
            chatId={id}
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            stop={stop}
            attachments={attachments}
            setAttachments={setAttachments}
            messages={messages}
            setMessages={setMessages}
            append={append}
            user={user}
          />
        </form>
      </div>

      <AnimatePresence>
        {block && block.isVisible && (
          <Block
            chatId={id}
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            stop={stop}
            attachments={attachments}
            setAttachments={setAttachments}
            append={append}
            block={block}
            setBlock={setBlock}
            messages={messages}
            setMessages={setMessages}
            citations={citations}
            setCitations={setCitations}
            votes={votes}
            user={user}
          />
        )}
      </AnimatePresence>

      <BlockStreamHandler streamingData={streamingData} setBlock={setBlock} setCitations={setCitations} setMessages={setMessages} />
    </>
  );
}
