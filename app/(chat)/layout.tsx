import { cookies } from 'next/headers';

import { AppSidebar } from '@/components/custom/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { getUserById } from '@/db/queries';
import { User } from '@/db/schema';

import { auth } from '../(auth)/auth';
export const experimental_ppr = true;

export default async function Layout({
  children,
  connect,
}: {
  children: React.ReactNode,
  connect: React.ReactNode,
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  let userRecord: User | null = null;
  if (session?.user) {
    const users = await getUserById(session.user.id!) ?? [];
    if (users.length !== 0) userRecord = Object.assign({}, {...users[0]});
  }

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <AppSidebar currentUser={session?.user} userRecord={userRecord} />
      <SidebarInset>
        {children}
        {/* {connect} */}
      </SidebarInset>
    </SidebarProvider>
  );
}
