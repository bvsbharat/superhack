export interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  timeoutMs: number;
}

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {
    maxAttempts: 3,
    delayMs: 2000,
    timeoutMs: 30000
  }
): Promise<T | null> {
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      console.log(`AI generation attempt ${attempt}/${config.maxAttempts}`);

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), config.timeoutMs);
      });

      const result = await Promise.race([
        operation(),
        timeoutPromise
      ]);

      console.log(`Attempt ${attempt} succeeded`);
      return result;
    } catch (error) {
      console.warn(`Attempt ${attempt} failed:`, error);

      if (attempt < config.maxAttempts) {
        console.log(`Retrying in ${config.delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, config.delayMs));
      }
    }
  }

  console.error(`All ${config.maxAttempts} attempts failed`);
  return null;
}
