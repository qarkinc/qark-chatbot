"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { User } from "next-auth";
import { useEffect, useState } from "react";


export default function GoogleAuthContent({ 
  title = "Secure Your Access",
  user
}: { title?: string, user: User | null }) {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState("Processing your request...");
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    debugger;
    // Parse the URL hash into an object
    const hash = window.location.hash.substring(1); // Remove the leading '#'
    const params = Object.fromEntries(new URLSearchParams(hash)); // Convert hash to an object

    const { state, access_token: token } = params; // Retrieve state and token from parsed params
    const savedState = localStorage.getItem("generated_uuid"); // Retrieve the stored state
    console.log(savedState);
    console.log(params);
    

    // Check if savedState is missing
    if (!savedState) {
      setStatusMessage("Authorization state not found. Redirecting to the homepage...");
      setTimeout(() => window.close(), 3000);
      return;
    }

    // Check if state or token is missing in the callback
    if (!state || !token) {
      setStatusMessage("Invalid callback parameters. Redirecting to the homepage...");
      setTimeout(() => window.close(), 3000);
      return;
    }

    if (state === savedState) {
      // If state matches, proceed to save token in the database
      fetch("/api/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user?.id!,
          credentials: params
        }),
      })
        .then((response) => {
          if (response.ok) {
            setStatusMessage("Authorization successful! Redirecting...");
            setIsAuthorized(true);
            sessionStorage.removeItem("generated_uuid"); // Clear state after validation
            setTimeout(() => window.close(), 1000); // Redirect to dashboard
          } else {
            setStatusMessage("Error saving authorization data. Redirecting to the homepage...");
            localStorage.removeItem("generated_uuid");
            setTimeout(() => window.close(), 1000); // Redirect to homepage on failure
          }
        })
        .catch(() => {
          setStatusMessage("An unexpected error occurred. Redirecting to the homepage...");
          localStorage.removeItem("generated_uuid");
          setTimeout(() => window.close(), 1000);
        });
    } else {
      // If state doesn't match, show rejection message and redirect to homepage
      setStatusMessage("Invalid/Rejected authorization request. Redirecting to the homepage...");
      localStorage.removeItem("generated_uuid");
      setTimeout(() => window.close(), 1000);
    }
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center  rounded-lg p-8 max-w-md w-full">
      <h2 className="text-2xl font-semibold mb-4">{title}</h2>
      <p className="text-center">{statusMessage}</p>
      {isAuthorized && <p className="text-green-500 mt-4">Authorization Successful!</p>}
    </div>
  );
}