
import { notFound } from "next/navigation";

import { auth } from "@/app/(auth)/auth";
import GoogleAuthContent from "@/components/custom/google-auth-connect";


export default async function GoogleAuthenication() {
  const session = await auth();
  if (!session || !session.user) {
    return notFound();
  }
  return <div className="flex flex-col items-center justify-center min-h-screen">
    <GoogleAuthContent user={session.user} title="Google Authorization" />
  </div>;
}

