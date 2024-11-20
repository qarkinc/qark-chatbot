import { cookies } from 'next/headers';

import { DEFAULT_MODEL_NAME, models } from '@/ai/models';
import { Chat } from '@/components/custom/chat';
import { generateUUID } from '@/lib/utils';

import { auth } from '../(auth)/auth';
import { getUserById } from '@/db/queries';
import { User } from '@/db/schema';

export default async function Page() {
  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('model-id')?.value;

  const selectedModelId =
    models.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_MODEL_NAME;

    
  const session = await auth();
  let userRecord: User | null = null;
  if (session?.user) {
    const users = await getUserById(session.user.id!) ?? [];
    if (users.length !== 0) userRecord = Object.assign({}, {...users[0]});
  }

  return (
    <Chat
      key={id}
      id={id}
      initialMessages={[]}
      selectedModelId={selectedModelId}
      user={userRecord}
    />
  );
}
