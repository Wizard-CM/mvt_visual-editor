import { z } from 'zod';

/**
 * Environment configuration schema using Zod for validation
 */
const envSchema = z.object({
  // Application Configuration
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),

  // Proxy Configuration
  PROXY_TIMEOUT: z.coerce.number().default(30000),
  PROXY_MAX_REDIRECTS: z.coerce.number().default(5),
  PROXY_USER_AGENT: z
    .string()
    .default(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ),

  // Session Configuration
  SESSION_TTL: z.coerce.number().default(3600),
  SESSION_MAX_LENGTH: z.coerce.number().default(40),

  // Logging Configuration
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'simple']).default('json'),
  LOG_TO_FILE: z.coerce.boolean().default(false),
  LOG_DIR: z.string().default('logs'),

  // Security Configuration
  CORS_ORIGIN: z
    .string()
    .default(
      'http://localhost:3333,http://localhost:3000,http://127.0.0.1:3333,http://127.0.0.1:3000',
    )
    .transform((val) => val.split(',').map((origin) => origin.trim())),
  RATE_LIMIT_WINDOW: z.string().default('15m'),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
});

/**
 * Environment configuration type inferred from the schema
 */
export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validate and parse environment variables
 * @returns Validated environment configuration
 * @throws Error if validation fails
 */
export function validateEnv(): EnvConfig {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        '❌ Invalid environment variables. Check your .env file and ensure all required variables are set.',
      );
    }
    throw error;
  }
}
