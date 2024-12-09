"use client"

import { CircleX, Cog, CogIcon, EllipsisVertical, EllipsisVerticalIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "../ui/card";
import PhoneNumberInput from "react-phone-number-input";
import { useEffect, useState } from "react";

import 'react-phone-number-input/style.css'
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { LoaderIcon } from "./icons";

export type ConnectWhatsappProps = {
  handleClose: () => void
}

export default function ConnectWhatsapp({
  handleClose
}: ConnectWhatsappProps) {
  const searchParams = useSearchParams();

  const [phoneNumber, setPhoneNumber] = useState<any>("");
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [loader, setLoader] = useState<boolean>(false);

  useEffect(() => {
    return;
    if (!isActive) return;
    const endTime = Date.now() + (5 * 60 * 1000); // 5 minutes from now
    let intervalId: NodeJS.Timeout;

    intervalId = setInterval(async () => {
      try {
        if (Date.now() >= endTime) {
          clearInterval(intervalId);
          setIsActive(false);
          handleClose();
        }

        const apiResponse = await fetch("/api/whatsapp_auth/check_status", {
          method: "POST",
          signal: AbortSignal.timeout(5 * 60 * 1000),
          body: JSON.stringify({
            "userPhoneNumber": phoneNumber ?? "",
            db_userId: searchParams.get("userId")
          })
        });
        const response = await apiResponse.json();

        if (response["status"] === "CONNECTED") {
          toast.success("Whatsapp Linked Successfully...");
          clearInterval(intervalId);
          handleClose();
        } else if (response["status"] === "FAILED") {
          toast.error("Whatsapp Linking Failed. Please Try again");
          clearInterval(intervalId);
          handleClose();
        }
      } catch (ex) {
        toast.error("Something went wrong!! Please try again");
        clearInterval(intervalId);
        handleClose()
      }
    }, 300);

    return () => clearInterval(intervalId);

  }, [handleClose, isActive, phoneNumber, searchParams])

  const requestPairingCode = async () => {
    try {
      console.log(phoneNumber.replace(/\D/g, ""));
      setLoader(true);
      const apiResponse = await fetch("/api/whatsapp_auth", {
        method: "POST",
        signal: AbortSignal.timeout(2 * 60 * 1000),
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber.replace(/\D/g, ""),
          userId: searchParams.get("userId")
        })
      });
      const response = await apiResponse.json();
      console.log(response);
      
      if (response["status"] && response["pairing_code"] !== null) {
        setPairingCode(response["pairing_code"]);
        setLoader(false);
        setIsActive(true);
      } else {
        setLoader(false);
        toast.error("Something went wrong!! Please try again");
        handleClose();
        return;
      }

    } catch (ex) {
      setLoader(false);
      toast.error("Something went wrong!! Please try again");
      handleClose();
    }
  }

  return (
    <>
      {isActive ? (
        <>
          <Card className="select-none">
            <CardHeader>
              <div className="flex w-full justify-between items-center">
                <h3 className="font-bold text-2xl">Enter code on phone</h3>
                <CircleX className="text-2xl cursor-pointer" onClick={handleClose} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg flex items-center justify-center gap-4 w-full mb-4">
                {pairingCode?.split("").map((char, idx) => (
                  <div key={idx} className="text-center bg-neutral-100 rounded-lg p-4 border-2 border-black size-full flex items-center justify-center">
                    <span className="text-black font-bold text-2xl ">
                      {char.trim()}
                    </span>
                  </div>
                ))}
              </div>

              <ol className="list-decimal list-inside space-y-2 mb-6">
                <li>Open WhatsApp on your phone</li>
                <li>
                  Tap
                  <span className="font-bold inline-flex items-center gap-1">
                    Menu
                    <EllipsisVerticalIcon size={24} className="bg-muted rounded-lg p-1" />
                  </span> on Android, or{" "}
                  <span className="font-bold inline-flex items-center gap-1">
                    Settings
                    <CogIcon size={24} className="bg-muted rounded-lg p-1" />
                  </span>  on iPhone
                </li>
                <li>
                  Tap <span className="font-bold">Linked devices</span> and then{" "}
                  <span className="font-bold">Link a device</span>
                </li>
                <li>
                  Tap <span className="font-bold">Link with phone number instead</span> and
                  enter this code on your phone
                </li>
              </ol>
            </CardContent>
            <CardFooter>
              <div className="flex w-full items-end justify-end gap-4">
                <Button variant={"ghost"} className="text-red-700 hover:bg-red-400 " onClick={handleClose}>Cancel</Button>
                <Button disabled>
                  <div className="animate-spin tex-white">
                    <LoaderIcon />
                  </div>
                  Waiting For Response
                </Button>
              </div>
            </CardFooter>
          </Card>
        </>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex w-full justify-between items-center">
                <h3 className="font-bold text-2xl">Enter Phone Number with Country</h3>
                <CircleX className="text-2xl cursor-pointer" onClick={handleClose} />
              </div>
            </CardHeader>

            <CardContent>
              <PhoneNumberInput
                international
                defaultCountry="US"
                countryCallingCodeEditable={false}
                value={phoneNumber}
                onChange={setPhoneNumber}
                className="border border-gray-400 p-3 rounded-lg"
              />
            </CardContent>
            <CardFooter>
              <div className="flex w-full items-end justify-end gap-4">
                <Button variant={"ghost"} className="text-red-700 hover:bg-red-400 " onClick={handleClose}>Cancel</Button>
                <Button disabled={phoneNumber === undefined || phoneNumber === "" || loader} onClick={requestPairingCode}>
                  {loader && (
                    <div className="animate-spin tex-white">
                      <LoaderIcon />
                    </div>
                  )}
                  Request Code
                </Button>
              </div>
            </CardFooter>
          </Card>
        </>
      )}
    </>
  );
}