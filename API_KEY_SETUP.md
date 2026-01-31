# 🔑 API Key Setup - FAL.ai VEO_API_KEY

## The Short Answer

**You need VEO_API_KEY from FAL.ai to generate halftime videos.**

Format: `key:secret` (includes both parts with colon)

Example: `08396e9f-eb45-4076-b61b-f0dda2dc8779:6c089c17067dd4cbe58bc3045e9cb1af`

---

## Step-by-Step Setup

### 1. Create FAL Account
- Go to https://fal.ai
- Click "Sign Up"
- Register with email

### 2. Get API Key
- Log in to FAL.ai
- Click "Settings" or "Dashboard"
- Look for "API Keys" or "Keys" section
- Click "Create API Key" or see existing key
- **Copy the ENTIRE key:secret string**

### 3. Add to Project
Edit `backend/.env`:
```env
VEO_API_KEY=08396e9f-eb45-4076-b61b-f0dda2dc8779:6c089c17067dd4cbe58bc3045e9cb1af
```

### 4. Verify
```bash
curl http://localhost:8000/video_generation_status
```

Should show: `"veo_enabled": true`

---

## ⚠️ Important Notes

### Format is CRITICAL
- ✅ CORRECT: `key:secret` (with colon and both parts)
- ❌ WRONG: `key` (missing secret part)
- ❌ WRONG: `key:` (missing secret)

### Copy Carefully
- Include the colon `:` separator
- Include both UUID parts
- No spaces
- No extra characters

### If Generation Fails
1. Double-check format in .env
2. Try creating a new API key
3. Restart backend after adding key
4. Check console for error messages

---

## What Happens After Setup

**With VEO_API_KEY configured:**

```
4+ Frame Captures
    ↓
Trigger halftime video generation
    ↓
Sends 4 reference images to FAL.ai/Veo 3.1
    ↓
Veo generates 8-second video with:
  - Reference images as context
  - Auto-generated background music
  - Dynamic camera movements
  - Professional sports video quality
    ↓
Video URL returned to app
    ↓
Play button appears in media section
    ↓
User clicks to view video
```

---

## Free Tier

FAL.ai offers a free tier with:
- Limited API calls
- Test account recommended
- Check dashboard for current limits

---

## Related APIs You May Also Need

| API | Purpose | Format | Where |
|-----|---------|--------|-------|
| **GEMINI_API_KEY** | AI image generation & analysis | Single string | https://ai.google.dev |
| **VEO_API_KEY** | Halftime video generation | key:secret | https://fal.ai |
| **STREAM_API_KEY** | Real-time audio | Single string | https://getstream.io |

Only VEO_API_KEY is required for halftime videos.

---

## Minimal Setup (Capture Only - No Video)

If you don't want to set up halftime video:

```env
GEMINI_API_KEY=your_key
# Leave VEO_API_KEY empty or commented out
```

This will still allow:
- ✅ Live frame capture
- ✅ Event analysis
- ✅ AI image generation
- ❌ Halftime video generation (disabled)

---

## Troubleshooting

**Q: Where do I find my API key?**
A: FAL Dashboard → Settings → API Keys section

**Q: Why key:secret format?**
A: FAL requires both key and secret for authentication

**Q: Can I use a different format?**
A: No, Veo API requires exactly: `key:secret`

**Q: My video generation times out**
A: Check FAL.ai account status and rate limits

**Q: Still not working?**
A: Check backend logs for error messages:
```bash
# Look for "Veo 3.1 API configured" when starting
# Or "VEO_API_KEY not set" if key is missing
```

---

**Everything set? Check your console logs to confirm it's working!** ✅
