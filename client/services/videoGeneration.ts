const API_BASE = "http://localhost:8000";
const FAL_API_KEY = process.env.FAL_KEY;
const FAL_API_ENDPOINT = "https://api.fal.ai/v1/queues/fal-ai/veo3.1/reference-to-video/submit";

export interface VideoGenerationRequest {
  prompt: string;
  image_urls: string[];
  duration?: string;
  resolution?: string;
  aspect_ratio?: string;
  generate_audio?: boolean;
}

export interface VideoGenerationResponse {
  status: string;
  video_url?: string;
  message: string;
}

export interface HalftimeVideoRequest {
  reference_image_urls: string[];
  home_team: string;
  away_team: string;
  quarter?: number;
  home_score?: number;
  away_score?: number;
}

/**
 * Generate a video from reference images using Veo 3.1
 * @param prompt - Description of the desired video
 * @param imageUrls - List of reference image URLs
 * @param options - Optional parameters (duration, resolution, etc.)
 * @returns Generated video URL or null on error
 */
export async function generateVideo(
  prompt: string,
  imageUrls: string[],
  options?: {
    duration?: string;
    resolution?: string;
    aspect_ratio?: string;
    generate_audio?: boolean;
  }
): Promise<string | null> {
  try {
    if (!imageUrls || imageUrls.length === 0) {
      console.error("At least one reference image URL is required");
      return null;
    }

    if (!prompt || prompt.trim().length === 0) {
      console.error("Prompt cannot be empty");
      return null;
    }

    const request: VideoGenerationRequest = {
      prompt,
      image_urls: imageUrls,
      duration: options?.duration || "8s",
      resolution: options?.resolution || "720p",
      aspect_ratio: options?.aspect_ratio || "16:9",
      generate_audio: options?.generate_audio !== false,
    };

    console.log("Requesting video generation...", {
      promptLength: prompt.length,
      imageCount: imageUrls.length,
      ...options,
    });

    const response = await fetch(`${API_BASE}/generate_video`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Video generation failed:", error);
      return null;
    }

    const data: VideoGenerationResponse = await response.json();

    if (data.status === "success" && data.video_url) {
      console.log("Video generated successfully:", data.video_url);
      return data.video_url;
    } else {
      console.error("Video generation returned no URL:", data.message);
      return null;
    }
  } catch (error) {
    console.error("Video generation error:", error);
    return null;
  }
}

/**
 * Generate a Super Bowl halftime highlight video using fal-ai Veo 3.1
 * @param referenceImageUrls - List of highlight image URLs (4+ recommended)
 * @param gameContext - Current game state (teams, scores, quarter)
 * @returns Generated video URL or null on error
 */
export async function generateHalftimeVideo(
  referenceImageUrls: string[],
  gameContext: {
    homeTeam: string;
    awayTeam: string;
    quarter?: number;
    homeScore?: number;
    awayScore?: number;
  }
): Promise<string | null> {
  try {
    if (!referenceImageUrls || referenceImageUrls.length === 0) {
      console.error("At least one reference image URL is required");
      return null;
    }

    if (!FAL_API_KEY) {
      console.error("FAL_KEY environment variable not set");
      return null;
    }

    // Create detailed prompt for the video generation
    const prompt = `Create an exciting Super Bowl LIX halftime highlight reel video.

Game Context: ${gameContext.homeTeam} vs ${gameContext.awayTeam}, Quarter ${gameContext.quarter || 2}, Score: ${gameContext.homeTeam} ${gameContext.homeScore || 0} - ${gameContext.awayTeam} ${gameContext.awayScore || 0}

Action: Smoothly transition between key highlight moments from the game, showing epic plays, big catches, and intense moments
Style: Professional NFL broadcast highlights with dynamic camera movements and smooth transitions
Camera motion: Zoom in on key players, pan across field action, follow the ball movement
Ambiance: High-energy stadium atmosphere, dramatic lighting, professional sports broadcast feel
Duration: 8 seconds
Output: 720p video quality with natural motion and realistic animations`;

    console.log("Requesting halftime video generation from fal-ai...", {
      imageCount: referenceImageUrls.length,
      homeTeam: gameContext.homeTeam,
      awayTeam: gameContext.awayTeam,
    });

    const falRequest = {
      prompt,
      image_urls: referenceImageUrls,
      duration: "8s",
      resolution: "720p",
      aspect_ratio: "16:9",
      generate_audio: true,
    };

    const response = await fetch(FAL_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Key ${FAL_API_KEY}`,
      },
      body: JSON.stringify(falRequest),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("fal-ai halftime video generation failed:", error);
      return null;
    }

    const data = await response.json();

    // fal-ai returns a request_id, we need to poll for the result
    if (data.request_id) {
      console.log("Video generation submitted with request_id:", data.request_id);

      // Poll for result (max 30 attempts, 2 second intervals)
      for (let i = 0; i < 30; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const statusResponse = await fetch(
          `https://api.fal.ai/v1/queues/default/requests/${data.request_id}/status`,
          {
            headers: {
              "Authorization": `Key ${FAL_API_KEY}`,
            },
          }
        );

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();

          if (statusData.status === "COMPLETED" && statusData.output?.video?.url) {
            console.log("Halftime video generated successfully:", statusData.output.video.url);
            return statusData.output.video.url;
          } else if (statusData.status === "FAILED") {
            console.error("Video generation failed:", statusData.error);
            return null;
          }
        }
      }

      console.error("Video generation timeout after polling");
      return null;
    } else {
      console.error("No request_id returned from fal-ai");
      return null;
    }
  } catch (error) {
    console.error("Halftime video generation error:", error);
    return null;
  }
}

/**
 * Check if video generation is available
 * @returns Status object with capabilities
 */
export async function getVideoGenerationStatus() {
  try {
    const response = await fetch(`${API_BASE}/video_generation_status`);

    if (!response.ok) {
      console.error("Failed to get video generation status");
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error checking video generation status:", error);
    return null;
  }
}
