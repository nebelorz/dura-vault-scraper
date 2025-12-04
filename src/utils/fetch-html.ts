import { config } from '../config';
import { logger } from './logger';
import axios, { AxiosError } from 'axios';

const MAX_RETRIES = config.fetchHTML.maxRetries;
const TIMEOUT_MS = config.fetchHTML.timeoutMs;
const RETRY_DELAY_MS = config.fetchHTML.retryDelayMs;

/**
 * Delays execution for a specified amount of time.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetches HTML from a URL with retry logic, timeout, and status code validation.
 * @param url - The URL to fetch
 * @param retries - Number of retries remaining (default: MAX_RETRIES)
 * @returns The HTML content as a string
 * @throws Error if all retries fail or if the response is invalid
 */
export async function fetchHTML(url: string, retries = MAX_RETRIES): Promise<string> {
  try {
    const response = await axios.get(url, {
      timeout: TIMEOUT_MS,
      validateStatus: (status) => status >= 200 && status < 300,
    });

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;

    // Dont retry on 4xx errors
    if (
      axiosError.response?.status &&
      axiosError.response.status >= 400 &&
      axiosError.response.status < 500
    ) {
      throw new Error(`Client error ${axiosError.response.status}: ${axiosError.message}`);
    }

    if (retries > 0) {
      logger.warn(
        `Fetch failed for ${url}, retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`,
      );
      await delay(RETRY_DELAY_MS);
      return fetchHTML(url, retries - 1);
    }

    throw new Error(`Failed to fetch ${url} after ${MAX_RETRIES} retries: ${axiosError.message}`);
  }
}
