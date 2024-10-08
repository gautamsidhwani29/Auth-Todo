import { genSalt } from 'bcrypt';
import { z } from 'zod';

export const signupSchema = z.object({
  username : z.string().min(2).max(30),
  email : z.string().min(5).max(100),
  password : z.string().min(8).max(50),
  gender : z.enum(['male','female'])

})

export const loginSchema = z.object({
  email : z.string(),
  password : z.string()
})

