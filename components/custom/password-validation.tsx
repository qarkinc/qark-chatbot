import { Close } from "@radix-ui/react-dialog";
import { clsx } from "clsx";
import { Check, CheckCircle, CircleCheck, CircleX, CrossIcon } from "lucide-react";
import { useEffect } from "react";
import { z } from "zod";

interface PasswordValidationProps {
  password: string;
  onValidationChange?: (isValid: boolean) => void;  // Add this line
}

const criteria = [
  {
    id: "length",
    label: "Between 8 to 20 characters",
    validator: (password: string) => password.length >= 8 && password.length <= 20,
  },
  {
    id: "uppercase",
    label: "Contains at least one uppercase letter",
    validator: (password: string) => /[A-Z]/.test(password),
  },
  {
    id: "lowercase",
    label: "Contains at least one lowercase letter",
    validator: (password: string) => /[a-z]/.test(password),
  },
  {
    id: "number",
    label: "Contains at least one number",
    validator: (password: string) => /[0-9]/.test(password),
  },
  {
    id: "special",
    label: "Contains at least one special character",
    validator: (password: string) => /[^A-Za-z0-9]/.test(password),
  },
];

export function PasswordValidation({ password, onValidationChange }: PasswordValidationProps) {
  // Add this at the start of the component
  const isAllValid = criteria.every((criterion) => criterion.validator(password));
  // Add this effect
  useEffect(() => {
    onValidationChange?.(isAllValid);
  }, [isAllValid, onValidationChange, password]);


  return (
    <div className="space-y-2 text-sm mt-2">
      {criteria.map((criterion) => {
        const isValid = criterion.validator(password);
        return (
          <div
            key={criterion.id}
            className={clsx(
              "flex items-center gap-2 transition-colors",
              isValid ? "text-green-500" : "text-gray-400 dark:text-zinc-500"
            )}
          >
            {isValid ? <CircleCheck className="size-4" /> : <CircleX className="size-4" />}
            <span>{criterion.label}</span>
          </div>
        );
      })}
    </div>
  );
} 