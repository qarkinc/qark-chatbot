import { saveUserCredentials } from "@/db/queries";

export const getGoogleAuthorizationUrl = async () => {
  try {
    const response = await fetch("/api/auth");
    const responseJSON = await response.json();

    return responseJSON;
  } catch (ex) {
    return null;
  }
}

export const saveCredentials = (user_id: string | undefined, params: any) => saveUserCredentials(user_id!, params);