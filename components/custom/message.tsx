'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Message } from 'ai';
import cx from 'classnames';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Dispatch, SetStateAction, useState } from 'react';

import { Vote } from '@/db/schema';

import { UIBlock } from './block';
import { DocumentToolCall, DocumentToolResult } from './document';
import { CrossIcon, LogoGMail, SparklesIcon } from './icons';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';
import { PreviewAttachment } from './preview-attachment';
import { Weather } from './weather';
import { Card, CardContent } from '../ui/card';


export type QarkMessage = Message & {
  citations?: Array<any>
}

export const PreviewMessage = ({
  chatId,
  message,
  block,
  setBlock,
  vote,
  isLoading,
  citations
}: {
  chatId: string;
  message: QarkMessage;
  block: UIBlock;
  citations: { [key: string]: Array<any> };
  setBlock: Dispatch<SetStateAction<UIBlock>>;
  setCitations: Dispatch<SetStateAction<{ [key: string]: Array<any> }>>;
  vote: Vote | undefined;
  isLoading: boolean;
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <>
      <Dialog.Root>
        <motion.div
          className="w-full mx-auto max-w-3xl px-4 group/message"
          initial={{ y: 5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          data-role={message.role}
        >
          <div
            className={cx(
              'group-data-[role=user]/message:bg-primary group-data-[role=user]/message:text-primary-foreground flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl'
            )}
          >
            {message.role === 'assistant' && (
              <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
                <SparklesIcon size={14} />
              </div>
            )}

            <div className="flex flex-col gap-2 w-full">
              {message.content && (
                <div className="flex flex-col gap-4">
                  <Markdown>{message.content as string}</Markdown>
                </div>
              )}

              {message.toolInvocations && message.toolInvocations.length > 0 && (
                <div className="flex flex-col gap-4">
                  {message.toolInvocations.map((toolInvocation) => {
                    const { toolName, toolCallId, state, args } = toolInvocation;

                    if (state === 'result') {
                      const { result } = toolInvocation;

                      return (
                        <div key={toolCallId}>
                          {toolName === 'getWeather' ? (
                            <Weather weatherAtLocation={result} />
                          ) : toolName === 'createDocument' ? (
                            <DocumentToolResult
                              type="create"
                              result={result}
                              block={block}
                              setBlock={setBlock}
                            />
                          ) : toolName === 'updateDocument' ? (
                            <DocumentToolResult
                              type="update"
                              result={result}
                              block={block}
                              setBlock={setBlock}
                            />
                          ) : toolName === 'requestSuggestions' ? (
                            <DocumentToolResult
                              type="request-suggestions"
                              result={result}
                              block={block}
                              setBlock={setBlock}
                            />
                          ) : (
                            <pre>{JSON.stringify(result, null, 2)}</pre>
                          )}
                        </div>
                      );
                    } else {
                      return (
                        <div
                          key={toolCallId}
                          className={cx({
                            skeleton: ['getWeather'].includes(toolName),
                          })}
                        >
                          {toolName === 'getWeather' ? (
                            <Weather />
                          ) : toolName === 'createDocument' ? (
                            <DocumentToolCall type="create" args={args} />
                          ) : toolName === 'updateDocument' ? (
                            <DocumentToolCall type="update" args={args} />
                          ) : toolName === 'requestSuggestions' ? (
                            <DocumentToolCall
                              type="request-suggestions"
                              args={args}
                            />
                          ) : null}
                        </div>
                      );
                    }
                  })}
                </div>
              )}

              {message.experimental_attachments && (
                <div className="flex flex-row gap-2">
                  {message.experimental_attachments.map((attachment) => (
                    <PreviewAttachment
                      key={attachment.url}
                      attachment={attachment}
                    />
                  ))}
                </div>
              )}

              {(() => {
                const _citations = citations[message.id]

                if ((message.role === 'assistant' || message.role === 'system') && _citations && _citations.length > 0) {
                  return (
                    <>
                      <h4 className='font-bold mt-3 text-xl'>Sources</h4>
                      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 select-none'>
                        {_citations.slice(0, 3).map((ele, idx) => {
                          if (String(ele.subject).length === 0) return null;

                          const mailLink = `https://mail.google.com/mail/u/0/#all/${ele.appMessageId}`
                          return (
                            <Link href={mailLink} key={`${ele.appMessageId}-${idx}`} target='_blank'>
                              <Card className='p-2 size-full hover:bg-muted-foreground/20 bg-muted'>
                                <span className='text-sm'>
                                  {String(ele.subject).substring(0, 30)}...
                                </span>
                                <div className="flex text-xs items-center gap-1">
                                  <LogoGMail />
                                  <span>gmail</span>
                                </div>
                              </Card>
                            </Link>
                          )
                        })}
                        {_citations.length > 4 && (
                          <Dialog.Trigger asChild>
                            <Card className='p-2 hover:bg-muted-foreground/20 bg-muted size-full rounded-lg cursor-pointer select-none'>
                              <span>More Sources</span>
                            </Card>
                          </Dialog.Trigger>
                        )}
                      </div>
                    </>
                  );
                }

                return null;
              })()}

              <MessageActions
                key={`action-${message.id}`}
                chatId={chatId}
                message={message}
                vote={vote}
                isLoading={isLoading}
              />
            </div>
          </div>
        </motion.div>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 w-full z-10" />
          <Dialog.Content className="fixed top-0 right-0 h-full w-1/3 bg-sidebar shadow-lg p-6 z-50 rounded-ss-lg rounded-es-lg">
            <Dialog.Title className='mb-2'>Sourcees</Dialog.Title>

            {
              <div className='h-full overflow-y-auto'>
                {Array.from(citations[message?.id] ?? []).map((ele, idx) => {
                  if (String(ele.subject).trim().length === 0) return null;

                  const mailLink = `https://mail.google.com/mail/u/0/#all/${ele.appMessageId}`
                  return (
                    <Link href={mailLink} key={`${ele.appMessageId}-${idx}`} target='_blank'>
                      <Card className='p-2 w-full border-muted hover:bg-muted-foreground/20 bg-muted mb-4'>
                        <span>{ele.subject}</span>
                        <div className="flex text-xs w-full items-center gap-1">
                          <LogoGMail />
                          <span>gmail</span>
                        </div>
                      </Card>
                    </Link>
                  )
                })}
              </ div>
            }

            <Dialog.Close asChild>
              <button className="absolute right-2.5 top-2.5 inline-flex size-[25px] appearance-none items-center justify-center rounded-full text-violet11 hover:bg-violet4 focus:shadow-[0_0_0_2px] focus:shadow-violet7 focus:outline-none">
                <CrossIcon />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
};

export const ThinkingMessage = () => {
  const role = 'assistant';

  return (
    <motion.div
      className="w-full mx-auto max-w-3xl px-4 group/message "
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div
        className={cx(
          'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
          {
            'group-data-[role=user]/message:bg-muted': true,
          }
        )}
      >
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
          <SparklesIcon size={14} />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-4 text-muted-foreground">
            Thinking...
          </div>
        </div>
      </div>
    </motion.div>
  );
};
