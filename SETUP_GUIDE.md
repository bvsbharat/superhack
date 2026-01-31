# Super Bowl Analytics - Complete Setup Guide

## 🔑 API Keys Required

### 1. **GEMINI_API_KEY** (For AI Image Generation & Analysis)
- **Provider**: Google AI
- **Purpose**:
  - Analyze video frames for football events
  - Generate AI-enhanced images of highlights
  - Provide play descriptions and strategic insights

**Get your key:**
1. Go to https://ai.google.dev
2. Click "Get API Key"
3. Create a new project
4. Generate API key for Gemini API

**API Costs**: Free tier available (50 requests/day)

---

### 2. **VEO_API_KEY** (For Halftime Video Generation)
- **Provider**: FAL.ai
- **Purpose**: Generate musical Super Bowl halftime videos from reference images

**Get your key:**

**Step 1: Create FAL.ai Account**
- Go to https://fal.ai
- Click "Sign Up"
- Create account with email

**Step 2: Get API Key**
- After login, go to Dashboard
- Click "Settings" or "API Keys"
- Click "Create API Key" or "Copy API Key"
- You'll see format: `key:secret` (e.g., `08396e9f-eb45-4076-b61b-f0dda2dc8779:6c089c17067dd4cbe58bc3045e9cb1af`)

**Copy the entire `key:secret` string** - this is your VEO_API_KEY

**API Costs**: Free tier available (limited requests)

---

### 3. **STREAM_API_KEY** & **STREAM_API_SECRET** (Optional - For WebRTC Streaming)
- **Provider**: GetStream.io
- **Purpose**: Real-time WebRTC video streaming
- Can skip initially - app works without it

---

## 📝 Configuration

### Backend Setup

**Step 1: Create `.env` file**
```bash
cd backend
cp .env.example .env
```

**Step 2: Edit `backend/.env`**
```bash
# Required - Get from Google AI
GEMINI_API_KEY=your_gemini_api_key_here

# Required - Get from FAL.ai (format: key:secret)
VEO_API_KEY=your_fal_key:your_fal_secret

# Optional - Get from GetStream.io
STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret

# Standard settings
HOST=0.0.0.0
PORT=8000
DEBUG=false
ANALYSIS_FPS=5
CONFIDENCE_THRESHOLD=0.5
```

**Step 3: Verify Configuration**
```bash
cd backend
python3 -c "from config import settings; print('GEMINI:', bool(settings.GEMINI_API_KEY)); print('VEO:', bool(settings.VEO_API_KEY))"
```

Expected output:
```
GEMINI: True
VEO: True
```

---

### Frontend Setup (Optional - Usually works with defaults)

```bash
cd client
npm install
npm run dev
```

Default API endpoint: `http://localhost:8000`

---

## 🚀 Running the Application

### Terminal 1: Backend
```bash
cd backend
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Check backend is running:
```bash
curl http://localhost:8000/health
```

Should see:
```json
{
  "status": "healthy",
  "features": {
    "gemini_enabled": true,
    "veo_video_generation": true,
    ...
  }
}
```

### Terminal 2: Frontend
```bash
cd client
npm run dev
```

Frontend will be at: `http://localhost:5173`

---

## ✅ Verify Setup

### 1. Check Backend Health
```bash
curl http://localhost:8000/health
```

Look for:
```json
{
  "gemini_enabled": true,
  "veo_video_generation": true,
  "stream_enabled": true  // or false if not configured
}
```

### 2. Check Video Generation Capabilities
```bash
curl http://localhost:8000/video_generation_status
```

Should return:
```json
{
  "veo_enabled": true,
  "supported_resolutions": ["720p", "1080p", "4k"],
  ...
}
```

### 3. Test in Browser
1. Open http://localhost:5173
2. Start live camera/screen capture
3. Click "Capture" button
4. Check console (F12) for logs
5. Should see highlight appear
6. AI image should generate
7. After 4 captures, halftime video generation should start

---

## 🐛 Troubleshooting

### Issue: "Veo service is not available"
**Solution:**
1. Check VEO_API_KEY is in `.env`: `grep VEO_API_KEY backend/.env`
2. Verify it has format: `key:secret`
3. Restart backend: `Ctrl+C` and run again
4. Check logs for: `"Veo 3.1 API configured"`

### Issue: Video generation times out
**Solution:**
1. Check internet connection
2. Verify FAL.ai account is active
3. Check API key has no typos (copy from dashboard again)
4. Try simpler test with curl:
   ```bash
   curl -X GET http://localhost:8000/video_generation_status
   ```

### Issue: AI images not generating
**Solution:**
1. Check GEMINI_API_KEY is set
2. Look for console error about Gemini API
3. Verify Google AI API is enabled in Google Cloud Console
4. Check quota/rate limits

### Issue: Frame capture not working
**Solution:**
1. Open browser console (F12)
2. Look for errors about canvas or video
3. Make sure video element has dimensions
4. Try different browser (Chrome recommended)

---

## 📊 API Key Format Reference

```
GEMINI_API_KEY format:
- Single long string
- Example: AIzaSyDjyg-0O...wVlw1R

VEO_API_KEY format:
- key:secret separated by colon
- Example: 08396e9f-eb45-4076:6c089c17067dd4cbe
- IMPORTANT: Include both parts!

STREAM_API_KEY format:
- Single long string
- Example: 1s2d3f4g5h6j7k8l
```

---

## 🔍 Debug Mode

Enable debug logging:
```bash
# backend/.env
DEBUG=true
```

Restart backend and check logs for detailed information.

---

## 📚 Documentation Links

- **VEO 3.1 Docs**: https://docs.fal.ai/model/veo31
- **FAL.ai Platform**: https://fal.ai
- **Gemini AI Docs**: https://ai.google.dev
- **FAL Playground**: https://fal.ai/models/fal-ai/veo3.1/reference-to-video

---

## 💡 Tips

1. **First Time Setup**: Start with just GEMINI_API_KEY, get frame capture working first
2. **Then Add VEO**: Once captures work, add VEO_API_KEY for halftime videos
3. **Monitor Usage**: Both services have free tier but watch your usage
4. **Local Testing**: Use "Screen Capture" instead of camera for easier testing
5. **Check Console**: Browser console (F12) shows detailed logs for debugging

---

## ✨ Features by API Key

| Feature | Requires | API |
|---------|----------|-----|
| Live stream capture | None | WebRTC |
| Frame analysis | GEMINI_API_KEY | Gemini Vision |
| AI image generation | GEMINI_API_KEY | Gemini Image |
| Halftime video | VEO_API_KEY | FAL Veo 3.1 |
| Real-time audio | STREAM_API_KEY | GetStream |

---

**All set! You should be ready to go!** 🎉

If you have issues, check the console logs first - they usually point to the exact problem.
