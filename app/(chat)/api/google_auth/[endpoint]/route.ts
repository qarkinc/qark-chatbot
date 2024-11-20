import { google, Auth } from "googleapis";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidV4 } from "uuid";

// Add an empty line between different import groups
import { auth } from "@/app/(auth)/auth";
import { getUserById, updateUser } from "@/db/queries";

const scopes = [
  'https://www.googleapis.com/auth/gmail.readonly'
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ endpoint: string }> }
) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Extract endpoint and cookies
  const endpoint = (await params).endpoint;
  const cookieStore = await cookies();

  // Parse request URL for origin and query parameters
  const { origin, searchParams } = new URL(request.url);

  let redirect_uri = '';
  // console.log("process.env.NODE_ENV: ", process.env.NODE_ENV);
  if (process.env.NODE_ENV === 'development') {
    redirect_uri = `${origin}/${process.env.REDIRECT_URI}`;
  }
  else {
    redirect_uri = `${process.env.PROD_APP_URL}/${process.env.REDIRECT_URI}`;
  }

  // Handle the "authorize" endpoint
  if (endpoint === "authorize") {
    const { authorization_url, state } = await getAuthorizationUrl(redirect_uri);

    // Store state and user_id in cookies to validate callback later
    cookieStore.set("state", state);
    cookieStore.set("user_id", session.user.id!);

    // Redirect to Google authorization URL
    return NextResponse.redirect(new URL(authorization_url, request.url));
  }

  // Handle the "oauth2callback" endpoint
  if (endpoint === "oauth2callback") {
    const code = searchParams.get("code")!;
    const state = searchParams.get("state")!;
    const { value: cookie_state }: any = cookieStore.get("state");
    const { value: user_id }: any = cookieStore.get("user_id");

    // Removing Cookies after getting
    cookieStore.delete("state");
    cookieStore.delete("user_id");

    if (state !== cookie_state) {
      console.log("AuthorizationRequest Reject!! May be CSRF Attack");
      return NextResponse.redirect(new URL("/?authorization_status=failed", request.url));
    }

    // Proceed if "code" is present in the callback
    if (searchParams.has("code")) {
      const credentials: Auth.Credentials | null = await handleOAuthCallback(code, redirect_uri);

      // If credentials are valid, update the user in the database
      if (
        credentials &&
        (credentials.access_token || credentials.refresh_token)
      ) {
        await updateUser(user_id, {
          gmailToken: credentials ?? null,
          gmailTokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
          isGmailConnected: true,
          gmailConnectedOn: new Date(),
        });

        return NextResponse.redirect(new URL("/?authorization_status=success", request.url));
      } else {
        return NextResponse.redirect(new URL("/?authorization_status=failed", request.url));
      }
    } else {
      // Handle case where "code" is missing
      console.error("Missing code in OAuth2 callback.");
      return NextResponse.redirect(new URL("/?authorization_status=failed", request.url));
    }
  }

  if (endpoint === "revoke-access") {
    // Extract the user_id from the search parameters
    const user_id = session.user.id!;

    // Fetch the user data using the provided user_id
    // Replace the database query function with your actual implementation
    const user = (await getUserById(user_id) ?? [])[0] ?? null;

    // If the user does not exist or the Gmail access token is missing,
    // redirect to the homepage with a failure status
    if (!user || !user.gmailToken) {
      return NextResponse.redirect(new URL("/?revoke_access_status=failed", request.url));
    }

    // Revoke the Gmail access token via the revokeUserAccess function
    const isSuccessful = await revokeUserAccess(user.gmailToken);

    if (isSuccessful) {
      // If the revocation is successful, update the user's database record
      // Remove all Gmail-related fields to indicate revocation
      await updateUser(user_id, {
        gmailToken: null,             // Clear the Gmail access token
        gmailTokenExpiry: null,       // Clear the token expiry date
        isGmailConnected: false,      // Mark Gmail as disconnected
        gmailConnectedOn: null,       // Clear the Gmail connection timestamp
      });

      // Redirect to the homepage with a success status
      return NextResponse.redirect(new URL("/?revoke_access_status=success", request.url));
    } else {
      // If the revocation fails, redirect to the homepage with a failure status
      return NextResponse.redirect(new URL("/?revoke_access_status=failed", request.url));
    }
  }

  // Fallback for unknown endpoints
  console.error("Unknown endpoint accessed:", endpoint);
  return NextResponse.redirect(new URL("/", request.url));

}

// Generates the Google authorization URL and a state token for validation
async function getAuthorizationUrl(redirect_uri: string): Promise<{
  authorization_url: string;
  state: string;
}> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri
  );

  const state = uuidV4(); // Generate a unique state token

  // Generate the authorization URL
  const authorization_url = oauth2Client.generateAuthUrl({
    scope: scopes,
    state,
    redirect_uri,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
  });

  return { authorization_url, state };
}

/**
 * Handles the OAuth2 callback by exchanging the authorization code for credentials.
 *
 * @param code - The authorization code received from Google's OAuth2 server.
 * @param redirect_uri - The authorization code received from Google's OAuth2 server.
 * @returns {Promise<Auth.Credentials | null>} - The OAuth2 credentials (tokens) if successful, otherwise `null`.
 */
async function handleOAuthCallback(code: string, redirect_uri: string): Promise<Auth.Credentials | null> {
  // Initialize the OAuth2 client with Google's client ID and secret
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID, // Google client ID from environment variables
    process.env.GOOGLE_CLIENT_SECRET, // Google client secret from environment variables,
    redirect_uri
  );

  try {
    // Exchange the authorization code for access and refresh tokens
    const { tokens } = await oauth2Client.getToken({ code });

    // Return the credentials (tokens) on successful exchange
    return tokens;
  } catch (error) {
    // Log the error if the token exchange fails
    console.error("Error during OAuth2 token exchange:\n", error);

    // Return null to indicate the failure
    return null;
  }
}

/**
 * Revokes the Gmail access token for a user.
 *
 * @param userAccessToken - The user's Gmail access token to be revoked.
 * @returns {Promise<boolean>} - Returns `true` if the revocation was successful, otherwise `false`.
 */
async function revokeUserAccess(userToken: Auth.Credentials): Promise<boolean> {
  try {
    // Initialize a new OAuth2 client with the Google API credentials
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID, // Google client ID from environment variables
      process.env.GOOGLE_CLIENT_SECRET // Google client secret from environment variables
    );

    // Initialize credentials with the provided user token
    let credentials = userToken;

    // Check if the token has expired
    if (new Date(userToken.expiry_date!).getTime() < new Date().getTime()) {
      // If expired, set the refresh token to get a new access token
      oauth2Client.setCredentials({
        refresh_token: userToken.refresh_token
      });

      // Refresh the access token and update the credentials
      const response = await oauth2Client.refreshAccessToken();
      credentials = response.credentials; // Update credentials with the new token
    }

    // Set the (possibly refreshed) access token for the OAuth2 client
    oauth2Client.setCredentials(credentials);

    // Attempt to revoke the access token using Google's OAuth2 API
    await oauth2Client.revokeCredentials();

    // Return true to indicate the revocation was successful
    return true;
  } catch (ex) {
    // Log the error if something goes wrong during the revocation process
    console.error(">>> Something went wrong!!");
    console.error(ex);

    // Return false to indicate the revocation failed
    return false;
  }
}