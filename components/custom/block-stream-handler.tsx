import { JSONValue, Message } from 'ai';
import { Dispatch, memo, SetStateAction } from 'react';

import { UIBlock } from './block';
import { useBlockStream } from './use-block-stream';

interface BlockStreamHandlerProps {
  setBlock: Dispatch<SetStateAction<UIBlock>>;
  setCitations: Dispatch<SetStateAction<{ [key: string]: Array<any> }>>;
  streamingData: JSONValue[] | undefined;
}

export function PureBlockStreamHandler({
  setBlock,
  setCitations,
  streamingData,
}: BlockStreamHandlerProps) {
  useBlockStream({
    streamingData,
    setBlock,
    setCitations
  });

  return null;
}

function areEqual(
  prevProps: BlockStreamHandlerProps,
  nextProps: BlockStreamHandlerProps
) {
  if (!prevProps.streamingData && !nextProps.streamingData) {
    return true;
  }

  if (!prevProps.streamingData || !nextProps.streamingData) {
    return false;
  }

  if (prevProps.streamingData.length !== nextProps.streamingData.length) {
    return false;
  }

  return true;
}

export const BlockStreamHandler = memo(PureBlockStreamHandler, areEqual);
