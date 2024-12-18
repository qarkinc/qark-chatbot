"use server";

import { z } from "zod";

import { createUser, getUser } from "@/db/queries";

import { signIn } from "./auth";

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string()
    .min(8, "Password must be at least 8 characters long")
    .max(20, "Password must be at most 20 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  // .regex(
  //   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{10,}$/,
  //   "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character"
  // ),
});

export interface LoginActionState {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_data";
  errors?: string[];
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    await signIn("credentials", {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return { status: "success" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        status: "invalid_data",
        errors: error.errors.map(err => err.message)
      };
    }

    console.log(error);
    
    return { status: "failed" };
  }
};

export interface RegisterActionState {
  status:
  | "idle"
  | "in_progress"
  | "success"
  | "failed"
  | "user_exists"
  | "invalid_data";
  errors?: string[];
}

export const register = async (
  _: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    let [user] = await getUser(validatedData.email);

    if (user) {
      return { status: "user_exists" } as RegisterActionState;
    } else {
      await createUser(validatedData.email, validatedData.password);
      await signIn("credentials", {
        email: validatedData.email,
        password: validatedData.password,
        redirect: false,
      });

      return { status: "success" };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        status: "invalid_data",
        errors: error.errors.map(err => err.message)
      };
    }
    console.log(error);
    
    return { status: "failed" };
  }
};
