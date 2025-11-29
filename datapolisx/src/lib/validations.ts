import { z } from 'zod'

// Shared schemas (frontend + backend)
export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional()
})

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  name: z.string().min(2, 'Name must be at least 2 characters').optional()
})

// Type inference từ schema
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>

// Backend validation helper
export const validateCreateUser = (data: any) => {
  const validData = createUserSchema.parse(data) // Throw ZodError nếu fail
  return validData
}

export const validateUpdateUser = (data: any) => {
  const validData = updateUserSchema.parse(data) // Throw ZodError nếu fail
  return validData
}
