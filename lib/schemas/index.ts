import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  full_name: z.string().min(2, "Name must be at least 2 characters"),
})

export type SignUpFormValues = z.infer<typeof signUpSchema>

export const signUpSimpleSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["instructor", "student"]),
})

export type SignUpSimpleFormValues = z.infer<typeof signUpSimpleSchema>

export const createBatchSchema = z.object({
  name: z.string().min(2, "Batch name must be at least 2 characters"),
  description: z.string().optional(),
})

export type CreateBatchFormValues = z.infer<typeof createBatchSchema>

export const addMemberSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  role: z.enum(["student", "instructor"]),
})

export type AddMemberFormValues = z.infer<typeof addMemberSchema>

export const assignTrainerSchema = z.object({
  email: z.string().email("Please enter a valid instructor email"),
})

export type AssignTrainerFormValues = z.infer<typeof assignTrainerSchema>
