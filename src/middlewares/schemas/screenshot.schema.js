import { z } from 'zod';

export const captureShema = z.object({
  url: z.string().url({ message: 'Invalid URL format' }),
});

export const statusSchema = z.object({
  jobId: z.string().uuid({ message: 'Invalid job ID' }),
});