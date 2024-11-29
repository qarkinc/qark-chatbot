"use client";
import Form from 'next/form';

import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useEffect, useState } from 'react';
import { PasswordValidation } from './password-validation';
import { toast } from 'sonner';
import Link from 'next/link';

export function AuthForm({
  action,
  children,
  defaultEmail = '',
  isAccountCreation = false,
}: {
  action: any;
  children: React.ReactNode;
  defaultEmail?: string;
  isAccountCreation?: boolean;
}) {
  const [password, setPassword] = useState("");
  const [isPasswordValid, setIsPasswordValid] = useState(false);

  // Add this effect for initial password validation
  useEffect(() => {
    // Add setTimeout to wait for browser auto-fill
    setTimeout(() => {
      const passwordInput = document.querySelector('input[name="password"]') as HTMLInputElement;
      if (passwordInput?.value) {
        setPassword(passwordInput.value);
      }

      // const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
      // if (emailInput?.value) {
      //   setEmail(emailInput.value);
      //   setIsEmailValid(authFormSchema.shape.email.safeParse(emailInput.value).success);
      // }
    }, 100)
  }, []); // Runs once on mount

  return (
    <Form
      action={action}
      onSubmit={(e) => {
        if (isAccountCreation && !isPasswordValid) {
          toast.error("Password length must be at least 8 to 20 characters and contains at least one uppercase letter, one lowercase letter, one number, and one special character.");
          e.preventDefault();
        }
      }}
      className="flex flex-col gap-4 px-4 sm:px-16"
    >
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="email"
          className="text-zinc-600 font-normal dark:text-zinc-400"
        >
          Email Address
        </Label>

        <Input
          id="email"
          name="email"
          className="bg-muted text-md md:text-sm"
          type="email"
          placeholder="user@acme.com"
          autoComplete="email"
          required
          autoFocus
          defaultValue={defaultEmail}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label
          htmlFor="password"
          className="text-zinc-600 font-normal dark:text-zinc-400"
        >
          Password
        </Label>

        <Input
          id="password"
          name="password"
          className="bg-muted text-md md:text-sm"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {isAccountCreation && <PasswordValidation password={password} onValidationChange={setIsPasswordValid} />}
      </div>
      {isAccountCreation && (
        <p>
          You&apos;ve read <Link href="https://www.qarkx.com/terms" target="_blank" className="font-medium text-blue-400 hover:text-blue-600">Qark&apos;s Terms of Service</Link>
          {' '}and{' '} <Link href="https://www.qarkx.com/privacy" target="_blank" className="font-medium text-blue-400 hover:text-blue-600">Privacy Policy</Link>, and
          you consent to receive all communications electronically.
        </p>
      )}

      {children}
    </Form>
  );
}
