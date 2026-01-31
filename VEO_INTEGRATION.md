# Veo 3.1 Video Generation Integration

## Overview

This document describes the integration of Google's Veo 3.1 model for generating Super Bowl halftime highlight videos from reference images. The system automatically creates cinematic halftime videos when 4+ reference images are available during live analysis.

## Architecture

### Backend Components

#### 1. **Veo Service** (`backend/services/veo_service.py`)
Handles all interactions with the Veo 3.1 API:
- Initializes API credentials from `VEO_API_KEY`
- Generates videos from reference images with configurable parameters
- Supports halftime highlight video generation with game context
- Includes error handling and logging

**Key Methods:**
- `generate_video_from_images()` - Generic video generation
- `generate_halftime_video()` - Super Bowl specific video with game context

#### 2. **Video Generation Routes** (`backend/api/routes/video_generation.py`)
RESTful endpoints for video generation:
- `POST /generate_video` - Generate video from images and prompt
- `POST /generate_halftime_video` - Generate Super Bowl halftime video
- `GET /video_generation_status` - Check capabilities and status

#### 3. **Configuration** (`backend/config.py`)
- `VEO_API_KEY` - API credentials from environment

### Frontend Components

#### 1. **Video Generation Service** (`client/services/videoGeneration.ts`)
Client-side API wrapper with methods:
- `generateVideo()` - Call video generation endpoint
- `generateHalftimeVideo()` - Generate halftime video with game context
- `getVideoGenerationStatus()` - Check service availability

#### 2. **UI Integration** (`client/components/CombinedStatus.tsx`)
Enhanced media display component:
- Auto-triggers video generation when 4+ images available
- Shows generation status indicator
- Displays play button for generated videos
- Tracks video generation state per highlight

#### 3. **Type Updates** (`client/types.ts`)
Extended `HighlightCapture` interface with video fields:
```typescript
videoUrl?: string;              // Generated video URL
videoGenerating?: boolean;      // Currently generating
videoError?: string;            // Error message if failed
```

## Setup Instructions

### 1. Get Veo API Key

1. Visit [fal.ai](https://fal.ai)
2. Sign up and get API key from your dashboard
3. API Key format: `key:secret` (provided in your account)

### 2. Configure Environment Variables

Create or update `.env` file in backend directory:

```bash
# .env or backend/.env
VEO_API_KEY=your_key_here:your_secret_here
```

Or update `.env.example`:

```bash
cp backend/.env.example backend/.env
# Then edit backend/.env and add your VEO_API_KEY
```

### 3. Update App.tsx (or parent component)

Pass `gameState` prop to CombinedStatus component:

```typescript
<CombinedStatus
  image={image}
  loading={loading}
  winProb={winProb}
  player={player}
  isLiveMode={isLiveMode}
  highlights={highlights}
  isExpanded={isExpanded}
  onToggleExpand={onToggleExpand}
  gameState={{
    homeTeam: gameState.homeTeam,
    awayTeam: gameState.awayTeam,
    quarter: gameState.quarter,
    score: gameState.score
  }}
/>
```

## Video Generation Flow

### Automatic Halftime Video Generation

1. **Image Capture Phase**
   - Video frames are captured and analyzed
   - Reference images stored in `HighlightCapture.imageUrl`
   - AI-enhanced images generated in `HighlightCapture.aiImageUrl`

2. **Trigger Threshold**
   - When 4+ reference images are available
   - In live mode (`isLiveMode = true`)
   - With valid game state (teams, scores, quarter)

3. **Video Generation**
   - Service builds dynamic prompt based on game context:
     ```
     "Create an exciting Super Bowl halftime action video featuring [Team1] vs [Team2].
     Score: [Team1] [Score1] - [Score2] [Team2], Quarter [Q].
     Show dynamic football action with athletes in motion..."
     ```
   - Sends 4 reference images to Veo API
   - Configuration:
     - Duration: 8 seconds (only available duration)
     - Resolution: 720p (configurable to 1080p, 4k)
     - Aspect Ratio: 16:9 (or 9:16)
     - Audio: Enabled (generates background music)

4. **Completion & Playback**
   - Video URL returned from Veo API
   - Green indicator shows "Halftime Video Ready"
   - Play button appears in header
   - Click to open video in new window

## API Endpoints

### POST /generate_video

Generate a video from reference images with custom prompt.

**Request:**
```json
{
  "prompt": "Description of video content",
  "image_urls": ["url1", "url2", "url3"],
  "duration": "8s",
  "resolution": "720p",
  "aspect_ratio": "16:9",
  "generate_audio": true
}
```

**Response:**
```json
{
  "status": "success",
  "video_url": "https://...",
  "message": "Video generated successfully with 3 reference images"
}
```

### POST /generate_halftime_video

Generate a Super Bowl halftime video with automatic prompt based on game context.

**Request:**
```json
{
  "reference_image_urls": ["url1", "url2", "url3", "url4"],
  "home_team": "Kansas City Chiefs",
  "away_team": "San Francisco 49ers",
  "quarter": 2,
  "home_score": 10,
  "away_score": 7
}
```

**Response:**
```json
{
  "status": "success",
  "video_url": "https://...",
  "message": "Halftime video generated successfully"
}
```

### GET /video_generation_status

Check video generation capabilities and current status.

**Response:**
```json
{
  "veo_enabled": true,
  "supported_resolutions": ["720p", "1080p", "4k"],
  "supported_aspect_ratios": ["16:9", "9:16"],
  "video_duration": "8s",
  "recommended_reference_images": 4,
  "features": [
    "Image-to-video generation",
    "Halftime highlight videos",
    "Audio generation",
    "Multiple resolution options"
  ]
}
```

## Configuration Options

### Video Generation Parameters

```typescript
interface VideoGenerationOptions {
  duration?: "8s";              // Only duration available
  resolution?: "720p" | "1080p" | "4k";
  aspect_ratio?: "16:9" | "9:16";
  generate_audio?: boolean;     // Default: true
}
```

### Backend Service Configuration

In `backend/services/veo_service.py`:
- `_base_url` - Veo API endpoint (default: https://fal.run)
- `_model_id` - Model identifier (fal-ai/veo3.1/reference-to-video)
- API timeout: 600 seconds

## Error Handling

### Common Errors

1. **VEO_API_KEY not set**
   - Check `.env` file has `VEO_API_KEY` configured
   - Restart backend server after adding key
   - Service logs: "VEO_API_KEY not set. Veo features disabled."

2. **Failed to generate video**
   - Insufficient reference images (need 4+)
   - Images may not be loading properly
   - Check browser console for detailed errors
   - Verify image URLs are publicly accessible

3. **Request timeout**
   - Video generation takes time (30-60+ seconds)
   - Default timeout: 600 seconds
   - Check network connectivity

### Logging

Enable debug logging to troubleshoot:

```bash
# backend/.env
DEBUG=true
```

Check logs for:
- "Requesting video generation..."
- "Video generated successfully"
- Error messages with full context

## Testing

### Test Video Generation Endpoint

```bash
curl -X POST http://localhost:8000/video_generation_status

# Response should show veo_enabled: true if API key is set
```

### Test with Sample Images

```bash
curl -X POST http://localhost:8000/generate_video \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A football player making an incredible catch",
    "image_urls": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
  }'
```

## Performance Considerations

- **Video generation time**: 30-120 seconds per video
- **API rate limits**: Check Veo API documentation for limits
- **Concurrent requests**: Service handles one generation at a time
- **File size**: Generated videos ~50-200MB depending on resolution

## Feature Flags & Fallbacks

- If `VEO_API_KEY` is missing: Feature silently disabled
- If API call fails: Component displays error indicator
- Highlights continue to work without video generation
- Existing image features unaffected

## Future Enhancements

- [ ] Support for multiple video styles/effects
- [ ] Custom music selection for halftime videos
- [ ] Video editing/trimming UI
- [ ] Download generated videos
- [ ] Video history/archive
- [ ] Real-time generation progress updates
- [ ] Support for slow-motion video generation
- [ ] Multi-angle video generation

## Troubleshooting

### Video generation triggered but no URL returned

1. Check backend logs for error messages
2. Verify API key is valid: `VEO_API_KEY=key:secret`
3. Ensure images are accessible (public URLs)
4. Check if Veo API has rate limits

### Indicator shows "Generating" but never completes

1. Check network tab for stuck requests
2. Look for 504/408 timeout errors
3. Verify API key works: test with direct API call
4. Check Veo API status page

### Video button appears but doesn't play

1. Try right-click → "Open in new tab"
2. Check if video URL is valid (visit directly)
3. Browser may have video format support issues
4. Try different browser/device

## Support & Resources

- Veo API Docs: https://docs.fal.ai/model/veo31
- FAL.ai Platform: https://fal.ai
- Model Playground: https://fal.ai/models/fal-ai/veo3.1/reference-to-video
