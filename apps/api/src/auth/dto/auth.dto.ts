import { LoginInput, RegisterInput } from '@branik/contracts';
import { z } from 'zod';

/**
 * DTOs are the compile-time contract; runtime validation uses the Zod schemas
 * from @branik/contracts via ZodValidationPipe (TODO: wire pipe).
 */
export type LoginDto = z.infer<typeof LoginInput>;
export type RegisterDto = z.infer<typeof RegisterInput>;

export { LoginInput, RegisterInput };
