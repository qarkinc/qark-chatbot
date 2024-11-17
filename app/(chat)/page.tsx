import { cookies } from 'next/headers';

import { DEFAULT_MODEL_NAME, models } from '@/ai/models';
import { Chat } from '@/components/custom/chat';
import { generateUUID } from '@/lib/utils';
import { auth } from '../(auth)/auth';

export default async function Page() {
  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('model-id')?.value;

  const selectedModelId =
    models.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_MODEL_NAME;

    
  const session = await auth();

  return (
    <Chat
      key={id}
      id={id}
      initialMessages={[]}
      selectedModelId={selectedModelId}
      userId={session?.user?.id}
    />
  );
}
