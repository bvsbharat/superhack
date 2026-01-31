import { analyzeFrame } from './stream';
import { AnalysisEvent } from './stream';

export interface CaptureFrameResult {
  success: boolean;
  imageBase64: string;
  timestamp: string;
  analysis: AnalysisEvent[] | null;
  error?: string;
}

/**
 * Capture a single frame from a video element
 * @param videoElement - The video element to capture from
 * @param quality - JPEG quality (0-1), default 0.85
 * @returns Base64 encoded image or null if capture failed
 */
export function captureFrameAsBase64(
  videoElement: HTMLVideoElement,
  quality: number = 0.85
): string | null {
  try {
    if (!videoElement || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      console.error('Video element is not ready or has no dimensions');
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get canvas context');
      return null;
    }

    // Draw the current video frame
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // Convert to base64 JPEG
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    const base64 = dataUrl.split(',')[1];

    return base64;
  } catch (error) {
    console.error('Error capturing frame:', error);
    return null;
  }
}

/**
 * Capture a frame and get its data URL (for preview/download)
 * @param videoElement - The video element to capture from
 * @param format - Image format ('jpeg', 'png'), default 'jpeg'
 * @param quality - Quality (0-1) for JPEG, default 0.85
 * @returns Data URL or null if capture failed
 */
export function captureFrameAsDataUrl(
  videoElement: HTMLVideoElement,
  format: 'jpeg' | 'png' = 'jpeg',
  quality: number = 0.85
): string | null {
  try {
    if (!videoElement || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      console.error('Video element is not ready or has no dimensions');
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get canvas context');
      return null;
    }

    // Draw the current video frame
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // Convert to data URL
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    return format === 'png'
      ? canvas.toDataURL(mimeType)
      : canvas.toDataURL(mimeType, quality);
  } catch (error) {
    console.error('Error capturing frame:', error);
    return null;
  }
}

/**
 * Capture a frame and analyze it immediately
 * @param videoElement - The video element to capture from
 * @returns Analysis results
 */
export async function captureAndAnalyzeFrame(
  videoElement: HTMLVideoElement
): Promise<CaptureFrameResult> {
  try {
    const timestamp = new Date().toLocaleTimeString();

    // Capture frame as base64
    const imageBase64 = captureFrameAsBase64(videoElement, 0.85);
    if (!imageBase64) {
      return {
        success: false,
        imageBase64: '',
        timestamp,
        analysis: null,
        error: 'Failed to capture frame from video'
      };
    }

    // Send to backend for analysis
    const analysis = await analyzeFrame(imageBase64);

    return {
      success: true,
      imageBase64,
      timestamp,
      analysis: analysis || []
    };
  } catch (error) {
    console.error('Error in captureAndAnalyzeFrame:', error);
    return {
      success: false,
      imageBase64: '',
      timestamp: new Date().toLocaleTimeString(),
      analysis: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Download captured frame as an image file
 * @param videoElement - The video element to capture from
 * @param filename - Optional filename (without extension)
 * @param format - Image format ('jpeg' or 'png')
 */
export function downloadCapturedFrame(
  videoElement: HTMLVideoElement,
  filename?: string,
  format: 'jpeg' | 'png' = 'jpeg'
): void {
  try {
    const dataUrl = captureFrameAsDataUrl(videoElement, format);
    if (!dataUrl) {
      console.error('Failed to capture frame for download');
      return;
    }

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename ? `${filename}.${format}` : `capture-${Date.now()}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`Frame downloaded: ${link.download}`);
  } catch (error) {
    console.error('Error downloading frame:', error);
  }
}

/**
 * Create a blob from captured frame for upload
 * @param videoElement - The video element to capture from
 * @param format - Image format ('jpeg' or 'png')
 * @returns Blob or null if capture failed
 */
export async function captureFrameAsBlob(
  videoElement: HTMLVideoElement,
  format: 'jpeg' | 'png' = 'jpeg'
): Promise<Blob | null> {
  try {
    return new Promise((resolve) => {
      const dataUrl = captureFrameAsDataUrl(videoElement, format);
      if (!dataUrl) {
        resolve(null);
        return;
      }

      fetch(dataUrl).then(res => res.blob()).then(resolve).catch(() => resolve(null));
    });
  } catch (error) {
    console.error('Error creating blob from frame:', error);
    return null;
  }
}
