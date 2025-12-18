import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  DATABASE_URL: string;
  PORT: number;
  NODE_ENV: string;
  LOG_LEVEL: string;
}

function validateEnv(): EnvConfig {
  const requiredEnvVars = ['DATABASE_URL'];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    PORT: parseInt(process.env.PORT || '3000', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  };
}

export const env = validateEnv();
