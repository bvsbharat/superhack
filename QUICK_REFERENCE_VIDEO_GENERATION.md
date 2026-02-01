# Quick Reference: Manual Video Generation

## Two Ways to Generate Videos

### 1️⃣ Media Section (Statistics.tsx) - Full Featured

**Location**: Click "Highlights" tab in left panel → Media section

**Features**:
- ✅ Purple button with clear text label
- ✅ Shows error messages in red box
- ✅ Help text (tooltip) on hover
- ✅ Shows capture count
- ✅ Best for: Detailed control and feedback

**Button Behavior**:
```
0-3 Highlights:  [GRAY - DISABLED] "Generate Video"
4+ Highlights:   [PURPLE - ENABLED] "Generate Video"
Generating:      [PURPLE - DISABLED] "Generating..."
Done:            [PURPLE - ENABLED] "Generate Video" (ready to use again)
```

**Layout**:
```
┌─────────────────────────────────────────┐
│ [📷] 4 Captures  [Generate Video] [Capture Now] │
│                                         │
│ ❌ Error message (if any)              │
│                                         │
│ [Highlight preview images]              │
└─────────────────────────────────────────┘
```

---

### 2️⃣ Expanded View (CombinedStatus.tsx) - Quick Access

**Location**: Click expand button (⬆️) on right side panel

**Features**:
- ✅ Purple icon button in floating header
- ✅ Minimal UI (icon only, no text)
- ✅ Quick access from fullscreen view
- ✅ Best for: Quick generation while viewing

**Button Behavior**:
```
< 4 Highlights:  [HIDDEN] - Not shown
4+ Highlights:   [PURPLE ICON] Generate (clickable)
Generating:      [BLUE SPINNER] Loading... (disabled)
Done:            [PURPLE ICON] Generate (ready to use)
```

**Layout**:
```
┌──────────────────────────────────────────────────┐
│ [▶️] [💫] [🎬] [⬇️] [⬜]              [fullscreen]│
│      ready loading generate download expand      │
└──────────────────────────────────────────────────┘
```

---

## Step-by-Step Usage

### Method 1: From Media Section

1. Click **"Highlights"** tab (yellow button in left panel)
2. Capture 4+ moments (auto-capture or click "Capture Now")
3. Click **"Generate Video"** button (purple)
4. Wait 8-30 seconds for generation
5. See first 4 highlights get green **"Ready"** badge
6. Click play icon on any of the first 4 to watch video

### Method 2: From Expanded View

1. Click **expand arrow** (top right of media panel)
2. View goes fullscreen
3. Capture 4+ moments if needed
4. Click **purple video icon** in top-right floating header
5. Wait 8-30 seconds for generation
6. Collapse back to see highlight details with video badges
7. Click play button to watch video

---

## What Happens After Clicking "Generate Video"

### During Generation (8-30 seconds):
```
Button State:    LOADING SPINNER (blue, spinning)
Can Click?:      NO - Button disabled
What's Happening?: Backend generating video with VEO 3.1 model
Console Log:     "Generating video with 4 reference images..."
```

### After Generation:
```
Button State:    NORMAL (purple, ready to click)
Can Click?:      YES - Button enabled again
Highlights:      First 4 get GREEN "Ready" badge ✅
Video URL:       Stored in highlight data
Console Log:     "Video generated successfully!"
```

### On Error:
```
Media Section:   RED ERROR MESSAGE appears below header
                 Message auto-dismisses after 3 seconds
                 Button returns to normal state

Expanded View:   CONSOLE ERROR logged
                 Button returns to normal state
                 No error message visible (check console)
```

---

## Reference Images

### Media Section - Button States

```
DISABLED (< 4 highlights):
┌──────────────────────┐
│ 🎬 Generate Video    │  ← GRAY background
└──────────────────────┘

ENABLED (4+ highlights):
┌──────────────────────┐
│ 🎬 Generate Video    │  ← PURPLE background
└──────────────────────┘
   ↓ HOVER shows: purple-600

GENERATING:
┌──────────────────────┐
│ 🎬 Generating...     │  ← PURPLE, button disabled
└──────────────────────┘
```

### Expanded View - Button in Floating Header

```
NORMAL (4+ highlights, not generating):
    ▶️  💫  🎬  ⬇️  ⬜
    ↑         ↑
   play    generate (PURPLE)

GENERATING:
    ▶️  🔄  ⬇️  ⬜
         ↑
     loading spinner (BLUE)

NOT VISIBLE (< 4 highlights):
    ▶️  ⬇️  ⬜
    (no generate button)
```

---

## Troubleshooting

### Button Not Visible in Expanded View
**Possible Causes:**
- Less than 4 highlights captured → Capture more moments
- Not in expanded view → Click expand button (⬆️)
- Wrong tab selected → Switch between tabs to refresh

**Fix:**
1. Capture 4+ highlights
2. Click expand button
3. Refresh page if still not showing

---

### Video Generation Takes Too Long
**Normal Times:**
- With API available: 8-15 seconds
- With rate limiting: 15-30 seconds
- Timeout occurs: ~45 seconds (shows error)

**If Stuck:**
1. Wait 45 seconds - error message will appear
2. Check backend: `curl http://localhost:8000/health`
3. Check VEO API key: `echo $VEO_API_KEY`
4. Click generate button again (retry)

---

### Error Message After Clicking Generate
**Media Section:**
- Red error box appears below header
- Read the message (it describes the problem)
- Auto-dismisses after 3 seconds
- Check these common issues:
  - "Need at least 4 highlights" → Capture more
  - "Failed to generate video" → Backend issue
  - "Not enough valid images" → Image loading issue

**Expanded View:**
- No error message visible
- Check browser console (F12 → Console tab)
- Look for red error logs
- Button will return to normal after timeout

---

### Generated Video Won't Play
**Possible Causes:**
- Video URL invalid → Backend issue
- Browser doesn't support format → Try different browser
- Pop-up blocked → Allow pop-ups in browser settings

**Check:**
1. Click play button on "Ready" badge
2. New tab should open with video
3. If nothing happens → Check browser console
4. If new tab appears but no video → Backend issue

---

## Keyboard Shortcuts

Currently supported:
- **None** - Use mouse clicks to interact with buttons

Future enhancements could add:
- `V` - Generate Video (when 4+ highlights)
- `E` - Toggle Expand mode
- `M` - Switch to Media section

---

## Tips & Tricks

### Pro Tips:
1. **Capture before generating** - Get all moments first, then generate once
2. **Use AI images** - Let AI image generation complete for better quality
3. **Check console** - For detailed logs if something goes wrong
4. **Fullscreen view** - Generate from expanded view for immersive experience
5. **Refresh if stuck** - F5 or Cmd+R to refresh and retry

### Performance:
- Video generation is network-bound (waiting on backend)
- UI stays responsive during generation
- Can interact with other parts of app while waiting
- Multiple generations: Wait for first to complete before starting another

### Quality:
- First 4 highlights used as reference
- AI-enhanced images preferred over raw frames
- Game context (team, quarter, score) included
- Output: 720p MP4 video (~8 seconds)

---

## State Diagram

```
                    START
                     ↓
          ┌─ Less than 4 Highlights ─┐
          │                          │
          ↓                          ↓
      [HIDDEN]              [DISABLED BUTTON]
      No button              Gray, not clickable
      shown
                             ↑         ↓
                         User adds more highlights
                             ↑         ↓
                             └────────┘
                                   ↓
                    4+ Highlights Available
                             ↓
                      [ENABLED BUTTON]
                     Purple, clickable
                             ↓
                     User Clicks Button
                             ↓
                    [GENERATING STATE]
                  Loading Spinner (Blue)
                    Button Disabled
                             ↓
                      Wait 8-30 seconds
                      ↓              ↓
                    SUCCESS        ERROR
                     ↓               ↓
             [Video Ready]    [Error Message]
            Green Badges       or Console Log
             in highlights     ↓
                   ↓       Button Returns to
              Can Play      Normal State
              Video         ↓
                   ↓     [ENABLED BUTTON]
            [ENABLED BUTTON]
            Ready to
            Generate again
```

---

## FAQ

**Q: Can I generate multiple videos?**
A: Yes! Generate video once, then capture more highlights and generate again. Each generation updates the first 4 highlights with new video URL.

**Q: What if I have 10 highlights?**
A: First 4 get video URL, remaining 6 don't. This is by design - one video per 4-highlight set.

**Q: Can I cancel video generation?**
A: Not yet - button is disabled during generation. Wait for it to complete or timeout (~45 seconds).

**Q: Does video generation work offline?**
A: No - requires backend API and VEO API key. Backend must be running.

**Q: Can I use the button from multiple places?**
A: Yes! Both Media section and Expanded view buttons trigger same video generation. Use whichever is convenient.

**Q: What's the video quality?**
A: 720p resolution, ~8 seconds duration, H.264 codec (MP4 format).

**Q: Do videos persist after refresh?**
A: Yes - video URL stored in highlight data. Persists until new video generated.

---

## Summary Checklist

- ✅ Found the "Generate Video" button (Media section tab - purple, top right)
- ✅ Captured 4+ highlights
- ✅ Clicked "Generate Video" button
- ✅ Waited for generation to complete
- ✅ Saw first 4 highlights get "Ready" badge
- ✅ Clicked play button to watch video
- ✅ Video opened in new window

You're all set! Enjoy generating Super Bowl highlight videos! 🏈🎬

---

**Last Updated**: January 31, 2026
**Version**: 1.0
**Status**: Production Ready ✅
