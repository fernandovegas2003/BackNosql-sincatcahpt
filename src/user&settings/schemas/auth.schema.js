import { z } from 'zod';

export const registerSchema = z.object({
  roleName: z.string().nonempty({ message: "Role name is required" }),
  username: z.string()
    .nonempty({ message: "Username is required" })
    .trim()
    .min(3, { message: "Username must be at least 3 characters long" }),
  email: z.string()
    .nonempty({ message: "Email is required" })
    .email({ message: "Invalid email format" }),
  password: z.string()
    .nonempty({ message: "Password is required" })
    .min(10, { message: "Password must be at least 10 characters long" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one symbol" }),
  confirmPassword: z.string()
    .nonempty({ message: "Please confirm your password" }),
  firstName: z.string()
    .nonempty({ message: "First name is required" })
    .trim(),
  lastName: z.string()
    .nonempty({ message: "Last name is required" })
    .trim(),
  age: z.number()
    .int({ message: "Age must be an integer" })
    .positive({ message: "Age must be a positive number" })
    .min(18, { message: "Age must be at least 18" }),
  country: z.string()
    .nonempty({ message: "Country is required" })
    .trim(),
  state: z.string()
    .nonempty({ message: "State is required" })
    .trim(),
  city: z.string()
    .nonempty({ message: "City is required" })
    .trim(),
  birthDate: z.string()
    .nonempty({ message: "Birth date is required" })
    .refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format" }),
  cedula: z.string()
    .nonempty({ message: "Cedula is required" })
    .trim(),
  registrationDate: z.string()
    .nonempty({ message: "Registration date is required" })
    .refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format" }),
  status: z.string()
    .nonempty({ message: "Status is required" })
    .trim()
    .refine((status) => ["active", "inactive", "suspended"].includes(status), {
      message: "Status must be one of: active, inactive, suspended",
    }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  emailOrUsername: z
    .string()
    .nonempty({ message: 'Email or username is required' })
    .trim(),
  password: z
    .string()
    .nonempty({ message: 'Password is required' })
    .min(6, { message: 'Password must be at least 6 characters long' }),
  rememberMe: z.boolean().optional(), // Campo opcional para indicar si la sesión es persistente
});