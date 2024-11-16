import { JSONValue, Message } from 'ai';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useSWRConfig } from 'swr';

import { Suggestion } from '@/db/schema';

import { UIBlock } from './block';
import { QarkMessage } from './message';

type StreamingDelta = {
  type: 'text-delta' | 'title' | 'id' | 'suggestion' | 'clear' | 'finish' | 'citation';
  content: string | Suggestion;
};

export function useBlockStream({
  streamingData,
  setBlock,
  setMessages,
  setCitations
}: {
  streamingData: JSONValue[] | undefined;
  setBlock: Dispatch<SetStateAction<UIBlock>>;
  setMessages: Dispatch<SetStateAction<Message[]>>;
  setCitations: Dispatch<SetStateAction<{ [key: string]: Array<any> }>>;
}) {
  const { mutate } = useSWRConfig();
  const [optimisticSuggestions, setOptimisticSuggestions] = useState<
    Array<Suggestion>
  >([]);

  useEffect(() => {
    if (optimisticSuggestions && optimisticSuggestions.length > 0) {
      const [optimisticSuggestion] = optimisticSuggestions;
      const url = `/api/suggestions?documentId=${optimisticSuggestion.documentId}`;
      mutate(url, optimisticSuggestions, false);
    }
  }, [optimisticSuggestions, mutate]);

  useEffect(() => {
    const mostRecentDelta = streamingData?.at(-1);
    console.log('\nstreamingData: ');
    console.log(streamingData);
    console.log('mostRecentDelta: ');
    console.log(mostRecentDelta);
    if (!mostRecentDelta) return;

    const delta = mostRecentDelta as StreamingDelta;

    setBlock((draftBlock) => {
      switch (delta.type) {
        case 'id':
          return {
            ...draftBlock,
            documentId: (delta.content as any)["message_id"] as string, // TODO: fix this if Vercel APIs send an ID to process here.
          };

        case 'title':
          return {
            ...draftBlock,
            title: delta.content as string,
          };

        case 'text-delta':
          return {
            ...draftBlock,
            content: draftBlock.content + (delta.content as string),
            isVisible:
              draftBlock.status === 'streaming' &&
                draftBlock.content.length > 200 &&
                draftBlock.content.length < 250
                ? true
                : draftBlock.isVisible,
            status: 'streaming',
          };

        case 'suggestion':
          setTimeout(() => {
            setOptimisticSuggestions((currentSuggestions) => [
              ...currentSuggestions,
              delta.content as Suggestion,
            ]);
          }, 0);

          return draftBlock;

        case 'citation': {
          // console.log('\ncitation received: ');
          // console.log(delta.content);
          setTimeout(() => {
            setCitations((prevCitations) => {
              const { chat_id }: any = delta.content; // chat_id is sent from the server
              if (prevCitations[chat_id] === undefined) {
                return {
                  ...prevCitations,
                  [chat_id]: [delta.content] // delta.content contains chat_id, message_id, and email subject
                }
              } else {
                return {
                  ...prevCitations,
                  [chat_id]: Array.from(new Set([...prevCitations[chat_id], delta.content]))
                }
              }
            });

            setMessages((messages) => {
              messages[messages.length - 1].id = draftBlock.documentId;
              return messages;
            });
          }, 0);
          return draftBlock;
        }

        case 'clear':
          return {
            ...draftBlock,
            content: '',
            status: 'streaming',
          };

        case 'finish':
          return {
            ...draftBlock,
            status: 'idle',
          };

        default:
          return draftBlock;
      }
    });
  }, [streamingData, setBlock]);
}
