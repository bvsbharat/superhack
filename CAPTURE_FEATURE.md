# Live Frame Capture & Instant Analysis Feature

## Overview

The **Frame Capture** feature allows users to manually capture the current video frame during live streaming and immediately analyze it. This is perfect for capturing critical moments that shouldn't be missed due to automatic frame capture intervals.

## Features

✅ **One-Click Capture** - Capture current video frame instantly
✅ **Instant Analysis** - Frame analyzed immediately by backend
✅ **Visual Feedback** - Status indicators and success confirmation
✅ **Highlight Integration** - Captured moments automatically added to highlights
✅ **Multiple Formats** - Support for JPEG, PNG, Base64, and Blob formats

## How It Works

### 1. **User Clicks Capture Button**
During live stream analysis, click the "Capture" button in the bottom-right corner of the video.

### 2. **Frame Extraction**
- Current video frame is extracted using HTML5 Canvas
- Frame dimensions match the video stream resolution
- Quality optimized for analysis (JPEG 0.85 quality)

### 3. **Backend Analysis**
- Frame sent to `/analyze_frame` endpoint as Base64 JPEG
- Backend uses Gemini Vision API for analysis
- Returns detected events with confidence scores

### 4. **Results Integration**
- Analysis events immediately added to Statistics
- Creates new HighlightCapture in the system
- Auto-generates AI-enhanced images using Gemini Image API
- Triggers halftime video generation if 4+ images available

### 5. **Visual Confirmation**
- Capture button shows loading spinner during processing
- Success indicator (green with lightning bolt) appears
- Auto-dismisses after 2 seconds

## UI Components

### Capture Button
Located in the live stream video overlay (bottom-right corner)

**States:**
- **Idle**: Camera icon, "Capture" text
- **Capturing**: Spinning loader, "Capturing..." text
- **Success**: Lightning bolt, "Captured!" text (2 sec)

```
[Capture] [AI Commentary] [Expand] [Stop]
```

### Button Styling
```typescript
// Idle state
bg-white/10 backdrop-blur-md border border-white/20

// Capturing state
+ Loader2 spinning animation

// Success state
bg-green-500 text-white
```

## Service API

### `frameCapture.ts`

#### 1. **captureFrameAsBase64()**
```typescript
function captureFrameAsBase64(
  videoElement: HTMLVideoElement,
  quality?: number
): string | null

// Returns: Base64 encoded JPEG string
```

Used for sending frames to backend for analysis.

#### 2. **captureFrameAsDataUrl()**
```typescript
function captureFrameAsDataUrl(
  videoElement: HTMLVideoElement,
  format?: 'jpeg' | 'png',
  quality?: number
): string | null

// Returns: Data URL (e.g., data:image/jpeg;base64,...)
```

Used for preview display or download.

#### 3. **captureAndAnalyzeFrame()**
```typescript
async function captureAndAnalyzeFrame(
  videoElement: HTMLVideoElement
): Promise<CaptureFrameResult>

// Returns: {
//   success: boolean,
//   imageBase64: string,
//   timestamp: string,
//   analysis: AnalysisEvent[] | null,
//   error?: string
// }
```

Main function that captures and analyzes in one call.

#### 4. **downloadCapturedFrame()**
```typescript
function downloadCapturedFrame(
  videoElement: HTMLVideoElement,
  filename?: string,
  format?: 'jpeg' | 'png'
): void

// Downloads frame as image file to user's computer
```

#### 5. **captureFrameAsBlob()**
```typescript
async function captureFrameAsBlob(
  videoElement: HTMLVideoElement,
  format?: 'jpeg' | 'png'
): Promise<Blob | null>

// Returns: Blob for uploading or further processing
```

## Integration with Highlights

When a frame is captured:

1. **Frame Analysis** → Backend detects events
2. **Event Creation** → New AnalysisEvent created with timestamp
3. **Highlight Capture** → HighlightCapture added to highlights array
4. **AI Generation** → AI-enhanced image generated (async)
5. **Halftime Check** → If 4+ images available, trigger video generation

## Performance Considerations

- **Capture Time**: < 100ms
- **Analysis Time**: 1-3 seconds (backend dependent)
- **Frame Size**: Full video resolution (1280x720 for camera, 1920x1080 for screen)
- **Compression**: JPEG 0.85 quality (~200-400KB per frame)

## Technical Details

### Canvas Frame Extraction

```typescript
const canvas = document.createElement('canvas');
canvas.width = videoElement.videoWidth;    // Match video dimensions
canvas.height = videoElement.videoHeight;

const ctx = canvas.getContext('2d');
ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

// Convert to JPEG Base64
const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
const base64 = dataUrl.split(',')[1];  // Remove "data:image/jpeg;base64," prefix
```

### Backend Endpoint

```
POST /analyze_frame

Request:
{
  "image": "base64-encoded-jpeg-string"
}

Response:
{
  "analysis": [
    {
      "timestamp": "MM:SS",
      "event": "Event Type",
      "details": "Event description",
      "confidence": 0.95,
      ...
    }
  ]
}
```

## Error Handling

### Common Issues

**Video not ready**
- Error: "Video element is not ready or has no dimensions"
- Solution: Wait for video to play before capturing

**Canvas context failed**
- Error: "Failed to get canvas context"
- Solution: Ensure browser supports Canvas API

**Backend analysis error**
- Error: Analysis returns null
- Solution: Check backend logs, verify Gemini API key

**Timeout during analysis**
- Error: Frame capture completes but analysis times out
- Solution: Check network connectivity, try again

### Error State UI

If capture fails:
- Button returns to idle state
- Error logged to console
- User can retry capture

## Usage Examples

### Basic Capture
```typescript
// Click capture button - handled by UI
<button onClick={handleCaptureFrame}>
  Capture
</button>
```

### Manual Capture Function
```typescript
import { captureAndAnalyzeFrame } from './services/frameCapture';

const videoEl = document.querySelector('video');
const result = await captureAndAnalyzeFrame(videoEl);

if (result.success) {
  console.log('Analysis:', result.analysis);
} else {
  console.error('Error:', result.error);
}
```

### Download Capture
```typescript
import { downloadCapturedFrame } from './services/frameCapture';

const videoEl = document.querySelector('video');
downloadCapturedFrame(videoEl, 'superbowl-moment', 'jpeg');
```

## Advanced Usage

### Custom Frame Processing
```typescript
import { captureFrameAsBase64, analyzeFrame } from './services';

const videoEl = document.querySelector('video');
const base64 = captureFrameAsBase64(videoEl);

// Custom processing
const customizedBase64 = await processFrame(base64);

// Send custom frame for analysis
const analysis = await analyzeFrame(customizedBase64);
```

### Batch Capture
```typescript
async function captureBatch(videoEl, count, interval) {
  const captures = [];

  for (let i = 0; i < count; i++) {
    const result = await captureAndAnalyzeFrame(videoEl);
    captures.push(result);
    await sleep(interval);
  }

  return captures;
}

// Capture 5 frames at 2-second intervals
const batch = await captureBatch(videoRef.current, 5, 2000);
```

## Comparison: Auto vs Manual Capture

| Aspect | Auto Capture | Manual Capture |
|--------|--------------|----------------|
| **Trigger** | Every 3 seconds | On-demand button click |
| **Use Case** | Continuous analysis | Critical moments |
| **Latency** | Low (queued) | Immediate |
| **User Control** | Automatic | Full control |
| **Volume** | High (many frames) | Low (selective) |
| **Perfect For** | Game flow | Key plays, scoring moments |

## Future Enhancements

- [ ] Shortcut key for quick capture (spacebar, etc.)
- [ ] Capture history/gallery view
- [ ] Batch multi-frame capture
- [ ] Slow-motion frame extraction
- [ ] Frame annotation before analysis
- [ ] Capture templates/presets
- [ ] Capture comparison mode (before/after)
- [ ] Export capture with analysis metadata

## Browser Compatibility

| Browser | Canvas | getUserMedia | Support |
|---------|--------|--------------|---------|
| Chrome  | ✅     | ✅          | Full    |
| Firefox | ✅     | ✅          | Full    |
| Safari  | ✅     | ✅          | Full    |
| Edge    | ✅     | ✅          | Full    |
| IE 11   | ✅     | ❌          | Partial |

## Troubleshooting

### Capture button disabled
**Cause**: No active video stream
**Solution**: Start camera or screen capture first

### Analysis takes too long
**Cause**: Slow network or backend latency
**Solution**:
- Check network connection
- Try simpler prompt for faster analysis
- Verify backend is responding

### Frame looks pixelated
**Cause**: Quality compression or low resolution
**Solution**:
- Increase JPEG quality (0.85 → 0.95)
- Use higher resolution capture

### Captured frame isn't added to highlights
**Cause**: Analysis events not being processed
**Solution**:
- Check console for errors
- Verify onLiveAnalysis callback is working
- Check Statistics component state management

## Support & Tips

1. **Best For**: Key plays, scoring moments, defensive highlights
2. **Timing**: Click during peak action for best results
3. **Quality**: Higher resolution streams = better analysis
4. **Combinations**: Use with AI Commentary for narration of captured moments
5. **Integration**: Captured moments feed into halftime video generation

---

**Last Updated**: January 31, 2026
**Feature Status**: Ready for Production
