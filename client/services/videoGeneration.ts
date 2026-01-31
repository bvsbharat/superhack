const API_BASE = "http://localhost:8000";

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
 * Generate a Super Bowl halftime highlight video
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

    const request: HalftimeVideoRequest = {
      reference_image_urls: referenceImageUrls,
      home_team: gameContext.homeTeam,
      away_team: gameContext.awayTeam,
      quarter: gameContext.quarter || 2,
      home_score: gameContext.homeScore || 0,
      away_score: gameContext.awayScore || 0,
    };

    console.log("Requesting halftime video generation...", {
      imageCount: referenceImageUrls.length,
      homeTeam: gameContext.homeTeam,
      awayTeam: gameContext.awayTeam,
    });

    const response = await fetch(`${API_BASE}/generate_halftime_video`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Halftime video generation failed:", error);
      return null;
    }

    const data: VideoGenerationResponse = await response.json();

    if (data.status === "success" && data.video_url) {
      console.log("Halftime video generated successfully:", data.video_url);
      return data.video_url;
    } else {
      console.error("Halftime video generation returned no URL:", data.message);
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
