import { cookies } from 'next/headers';

import { DEFAULT_MODEL_NAME, models } from '@/ai/models';
import { Chat } from '@/components/custom/chat';
import { generateUUID } from '@/lib/utils';
// import { getUserById } from '@/db/queries';
// import { auth } from '../(auth)/auth';
// import { User } from '@/db/schema';

export default async function Page() {
  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('model-id')?.value;

  const selectedModelId =
    models.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_MODEL_NAME;

    
  // const session = await auth();
  // let user: User | null = null;
  // if (session && session.user) {
  //   user = (await getUserById(session.user.id!))[0] ?? null;
  //   console.log(user);
    
  // }

  return (
    <Chat
      key={id}
      id={id}
      initialMessages={[]}
      selectedModelId={selectedModelId}
      // user={user}
    />
  );
}
