# Super Anyaltics : Real-Time Sports Analytics & Strategy Platform

> **The Playbook** - A computational sports system that sits on the sideline, providing real-time analytics and strategic insights for teams, coaches, players, and analysts during live matches.

## 🎯 Vision

SuperBowl is a comprehensive real-time sports analytics platform designed to empower teams with instant, data-driven insights during live matches. Built with modern AI (Google Gemini), real-time streaming (WebRTC/GetStream), and advanced sports analytics, the platform transforms raw game footage into actionable intelligence.

**Core Principle**: Build tools *for people in the game* - coaches need strategy answers at halftime, teams need live positional analytics, and analysts need visual decision matrices to drive winning plays.

## 📚 Documentation

- [**Deep Analytics Guide**](./DEEP_ANALYTICS_GUIDE.md): Learn how to use the Deep Research Chat, Strategy Analysis, and more.
- [**Motion Animation Guide**](./client/MOTION_ANIMATION_GUIDE.md): Guide for the frontend animations.
- [**Video Generation Guide**](./EXPANDED_VIEW_VIDEO_GENERATION.md): Details on the video generation capabilities.

---

## 🚀 Key Features

### 1. **Real-Time Deep Research & Strategy Analysis**
- **Halftime Intelligence**: Teams ask specific strategy questions mid-match
- **Gemini-Powered Analysis**: Deep research on opponent weaknesses, player positioning, and tactical recommendations
- **Live RAG Integration**: Context-aware insights based on live match data
- **Player-Specific Recommendations**: Named player suggestions for tactical adjustments

### 2. **Live Social Media Content Generation**
- **Automated Highlights**: System generates shareable content as events occur
- **AI-Generated Sports Imagery**: Google Vision creates visual assets for social sharing
- **Real-Time Event Tracking**: Immediate capture of crucial moments
- **Multi-Platform Ready**: Content formatted for different social channels

### 3. **Live Match Commentary & Feed**
- **Real-Time Event Stream**: Live updates on every action with low latency
- **AI Commentary**: Natural language analysis of plays as they happen
- **Event Classification**: Automatic detection of passes, runs, interceptions, touchdowns
- **Timestamp Tracking**: Every event linked to exact game moment

### 4. **Advanced Analytics Dashboard**
- **EPA (Expected Points Added)**: Calculates value of every play
- **Win Probability Models**: Real-time win probability visualization
- **Player Performance Matrix**: Data-driven metrics on individual player performance
- **Field Heatmaps**: Visual representation of play concentration areas
- **Live Statistics**: Updating team and player statistics throughout the match

### 5. **Interactive Field Visualization**
- **Player Position Tracking**: Real-time display of all player positions
- **Strategy Visualization**: Show recommended formations and play diagrams
- **Live WebRTC Stream**: Integrated video feed on the field overlay
- **Frame Analysis**: Extract insights directly from video frames

### 6. **Team Pre-Configuration & Personalization**
- **Team Selection UI**: Easily switch between team dashboards
- **Custom Analytics Settings**: Configure which metrics matter most
- **Persist User Preferences**: Dashboard syncs with user selections
- **Multi-Team Support**: Support for analyzing both offense and defense perspectives

### 7. **Smooth, Production-Grade UI**
- **Motion.dev Animations**: Polished transitions and microinteractions
- **Real-Time Data Visualization**: Charts and graphs with live updates
- **Responsive Layout**: Works seamlessly across devices
- **Accessibility**: Built with inclusive design principles

---

## 🏗️ Architecture Overview

### Frontend Stack (React + TypeScript)
```
UI/
├── components/
│   ├── App.tsx                    # Main application orchestrator
│   ├── MatchOverview.tsx          # Field visualization + WebRTC stream
│   ├── Statistics.tsx             # Analytics dashboard (EPA, win probability)
│   ├── AIInsightPanel.tsx         # Gemini-powered deep research
│   ├── LiveCommentaryPanel.tsx    # Real-time event stream
│   ├── DeepResearch.tsx           # Halftime strategy analysis
│   ├── TeamSelector.tsx           # Team configuration UI
│   ├── LoginPage.tsx              # Authentication
│   ├── AnimatedComponents.tsx     # Motion.dev animations
│   └── AnimatedChart.tsx          # Animated data visualizations
├── services/
│   ├── gemini.ts                  # Google Generative AI integration
│   ├── geminiChat.ts              # AI commentary & insights
│   ├── deepAnalytics.ts           # Advanced analytics calculations
│   ├── liveCommentary.ts          # Commentary generation
│   ├── stream.ts                  # WebRTC stream management
│   └── match.ts                   # Match data management
├── hooks/
│   ├── useDeepAnalytics.ts        # Analytics data handling
│   └── useLiveCommentary.ts       # Commentary state management
└── config/
    └── nflTeams.ts                # Team configurations & colors
```

**Key Technologies:**
- **React 19.2.3** - UI framework
- **TypeScript 5.8.2** - Type safety
- **Recharts 3.7.0** - Data visualization
- **Motion 12.29.2** - Smooth animations
- **Google Generative AI** - Gemini Vision & Text models
- **GetStream Video SDK** - WebRTC streaming
- **Vite** - Build tool

### Backend Stack (Python + FastAPI)
```
backend2/
├── main.py                        # FastAPI application
├── api/routes/
│   ├── video.py                   # Video analysis endpoints
│   ├── stream.py                  # WebRTC streaming
│   ├── websocket.py               # Real-time WebSocket events
│   ├── game_state.py              # Game state management
│   └── match.py                   # Match operations
├── core/
│   ├── vision_agent.py            # Vision-agents framework
│   ├── football_agent.py          # Football-specific analysis
│   ├── frame_analyzer.py          # Frame-by-frame processing
│   └── video_processor.py         # Video file handling
├── services/
│   ├── llm_service.py             # Gemini Vision API
│   ├── state_manager.py           # State persistence
│   └── match_service.py           # Match management
├── analytics/
│   ├── play_classifier.py         # Play detection (pass, run, etc)
│   ├── epa_calculator.py          # Expected Points Added
│   ├── win_probability.py         # Win probability models
│   └── player_analysis.py         # Player performance metrics
└── database/
    ├── models.py                  # SQLAlchemy ORM
    └── connection.py              # PostgreSQL connection
```

**Key Technologies:**
- **FastAPI 0.109.0+** - Modern Python web framework
- **Google Generative AI** - Gemini Vision for frame analysis
- **GetStream Vision Agents** - Advanced video analysis
- **OpenCV 4.9.0** - Video processing
- **PostgreSQL** - Persistent data storage
- **WebSocket** - Real-time bidirectional communication
- **Uvicorn** - ASGI server

---

## 📊 Data Flow Architecture

### Video Analysis Pipeline
```
Live Video Feed
    ↓
Frontend WebRTC Capture
    ↓
Backend Frame Extraction (5+ FPS)
    ↓
Vision-Agents / Gemini Vision API
    ↓
Event Detection & Classification
    ↓
Analytics Processing (EPA, Win Probability)
    ↓
Real-Time Updates via WebSocket
    ↓
Frontend UI Updates + Animation
```

### Real-Time Analytics Pipeline
```
Raw Frame Data
    ↓
Play Classification (Pass/Run/TD/INT)
    ↓
Player Position Extraction
    ↓
EPA Calculation
    ↓
Win Probability Update
    ↓
Field Heatmap Generation
    ↓
Dashboard Visualization
```

### Deep Research Pipeline (Halftime)
```
Live Match Statistics
    ↓
Opponent Analysis Data
    ↓
Gemini Deep Research Query
    ↓
Strategy Recommendations with Player Names
    ↓
Visual Presentation to Coaching Staff
```

---

## 🎮 User Interface Sections

### Main Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  SuperBowl Analytics                    [Team Selector ▼]   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────┐      ┌─────────────────────────┐  │
│  │  LIVE FIELD VIEW     │      │  DEEP RESEARCH PANEL    │  │
│  │  (WebRTC Stream +    │      │  • Gemini Analysis      │  │
│  │   Player Positions)  │      │  • Strategy Recs        │  │
│  │                      │      │  • Player Suggestions   │  │
│  │  ⚫ QB    ⚫ ⚫    │      │  • Win Strategy          │  │
│  │     ▲          ⚫    │      │                         │  │
│  │  ⚫  ⚫ (WR)   ⚫    │      │  [Ask Halftime Q&A]    │  │
│  │                      │      │                         │  │
│  └──────────────────────┘      └─────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  ANALYTICS METRICS                                      │  │
│  │  EPA: +2.1  │  Win %: 62%  │  Completions: 18/25      │  │
│  │  Yards: 256  │  TDs: 2      │  Avg Yards/Play: 7.2    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  LIVE EVENT FEED                                        │  │
│  │  14:23 - Touchdown! #12 J.Mahomes (2 yd pass)         │  │
│  │  14:05 - Incomplete pass, WR coverage                 │  │
│  │  13:47 - Run play, 4 yards                            │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  Tabs: [Analytics] [Live Feed] [Highlights] [Deep Research] │
└─────────────────────────────────────────────────────────────┘
```

### Key UI Components

1. **Team Selector** (Top Header)
   - Dropdown to switch between teams
   - Syncs entire dashboard with selection
   - Color-coded for team branding

2. **Match Overview** (Left Panel)
   - Live field visualization
   - Integrated WebRTC stream
   - Player position overlays
   - Strategy formation display

3. **Deep Research Panel** (Right Panel)
   - Real-time Gemini analysis
   - Halftime strategy questions & answers
   - Player-specific recommendations
   - Tactical insights with reasoning

4. **Analytics Metrics**
   - EPA tracking per play
   - Win probability model
   - Live statistics updating
   - Performance heatmaps

5. **Live Commentary Feed**
   - Event-by-event description
   - AI-generated commentary
   - Social media content preview
   - Highlight capture button

6. **Matrix/Heatmap Visualization**
   - Player movement patterns
   - Play concentration areas
   - Defensive effectiveness zones
   - Offensive success rates by area

---

## 🔧 Installation & Setup

### Prerequisites
- **Node.js 18+** (Frontend)
- **Python 3.12+** (Backend)
- **PostgreSQL 14+** (Database)
- **Google Cloud API Key** (Gemini Vision)
- **GetStream API Keys** (WebRTC Streaming)

### Environment Variables

**.env (Backend)**
```env
GEMINI_API_KEY=your_google_api_key
STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_secret
POSTGRES_URL=postgresql://user:password@localhost/superbowl
HOST=0.0.0.0
PORT=8000
DEBUG=false
ANALYSIS_FPS=5
CONFIDENCE_THRESHOLD=0.5
```

**.env (Frontend)**
```env
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_API_KEY=your_google_api_key
VITE_STREAM_API_KEY=your_stream_api_key
```

### Frontend Setup

```bash
cd UI
npm install
npm run dev          # Development mode (port 5173)
npm run build        # Production build
npm run preview      # Preview production build
```

### Backend Setup

```bash
cd backend2
python -m venv venv
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate  # Windows

pip install -r requirements.txt
python main.py       # Starts on http://localhost:8000
```

---

## 📡 API Endpoints

### Video Analysis
```
POST /api/analyze_video
- Upload and analyze video file
- Returns: Array of detected events with timestamps, types, confidence scores

GET /api/analysis/{analysis_id}
- Retrieve previous analysis results
```

### Real-Time Streaming
```
WebSocket /ws/stream
- Establishes WebSocket connection for real-time event streaming
- Sends live analysis updates as they occur

POST /api/webrtc/offer
- Initiate WebRTC connection for live streaming
```

### Game State
```
GET /api/game-state
- Get current game state (score, clock, down, distance, possessions)

POST /api/game-state/update
- Update game state with new events

GET /api/game-state/history
- Retrieve historical game state changes
```

### Match Management
```
POST /api/matches
- Create new match session

GET /api/matches/{match_id}
- Retrieve match details and statistics

POST /api/matches/{match_id}/highlight
- Capture and save highlight moment

GET /api/matches/{match_id}/events
- Get all events for a match
```

### Deep Analytics
```
POST /api/analytics/deep-research
- Query Gemini for strategic analysis
- Includes: question, match context, player data
- Returns: Analysis text with reasoning

POST /api/analytics/strategy-recommendation
- Get AI-powered strategy suggestions for next half

GET /api/analytics/epa/{player_id}
- Get EPA statistics for specific player
```

---

## 🎬 Animation System (Motion.dev)

The platform features smooth, production-grade animations powered by Motion.dev:

### Available Animations
- **Fade In/Out** - Smooth opacity transitions
- **Slide In** - Directional entry animations
- **Scale** - Growth/shrink animations
- **Bounce** - Playful motion effects
- **Pulse** - Attention-grabbing animations
- **Glow Effect** - Emphasis with light effects
- **Chart Animations** - Staggered data visualization
- **Player Trajectory** - Smooth movement paths
- **Number Counters** - Animated statistic updates

### Animation Examples
```typescript
// Fade in panel
<FadeIn duration={0.6}>
  <AIInsightPanel />
</FadeIn>

// Animated metric card
<AnimatedStatCard
  label="EPA"
  value={2.1}
  trend="up"
/>

// Live event with stagger
<AnimatedList stagger={0.05}>
  {events.map(event => (
    <EventRow key={event.id} event={event} />
  ))}
</AnimatedList>
```

---

## 📈 Analytics Capabilities

### Play Classification
- **Pass Plays**: Completion, incompletion, interception
- **Run Plays**: Rushing yards, tackles for loss
- **Special Teams**: Field goals, punts, kickoffs
- **Touchdown** detection with automatic highlight capture

### Performance Metrics
- **EPA (Expected Points Added)**: Value calculation per play
- **Win Probability**: Real-time win chance calculation
- **Completion Percentage**: Pass accuracy tracking
- **Yards Per Play**: Offensive efficiency metric
- **Pressure Rate**: Defensive effectiveness

### Player Analysis
- **Individual EPA**: Per-player contribution analysis
- **Position-Specific Stats**: Role-based performance metrics
- **Consistency Score**: Player reliability assessment
- **Matchup Analysis**: Performance vs. specific opponents

### Field Analytics
- **Yardage Heatmap**: Where plays occur on field
- **Success Rate by Area**: Offensive productivity mapping
- **Defensive Strength Zones**: Where defense excels
- **Play Tendency Map**: Offensive philosophy visualization

---

## 🎯 Usage Workflows

### Workflow 1: Pre-Game Team Selection
```
1. Coach/Analyst logs into platform
2. Selects team from dropdown
3. Dashboard loads team-specific configuration
4. Pre-game analytics and opponent analysis available
5. Team colors and branding applied throughout UI
```

### Workflow 2: Live Match Monitoring
```
1. Live video stream activated (WebRTC)
2. Real-time frame analysis begins (5+ FPS)
3. Events detected and displayed in feed
4. Analytics update in real-time
5. Highlights captured automatically on TDs, INTs
6. Social media content generated for important plays
```

### Workflow 3: Halftime Analysis
```
1. Coach asks strategic question via chat
2. Gemini performs deep research on match data
3. Analysis includes player-specific recommendations
4. Strategy visualization generated
5. Formation suggestions displayed on field
6. Coaching staff reviews recommendations
```

### Workflow 4: Post-Game Review
```
1. Match highlights compiled with AI-generated commentary
2. Player performance matrix generated
3. EPA leaders identified
4. Key moments replayed with analysis
5. Social media content package created
6. Report exported for team records
```

---

## 🔐 Security & Performance

### Security Measures
- **Authentication**: Secure login with session management
- **API Key Handling**: Environment variables, never exposed
- **Database**: Encrypted PostgreSQL with access controls
- **WebSocket**: Secure WSS connections in production
- **CORS**: Configured for authorized domains only

### Performance Optimization
- **Frame Skipping**: Analyze every Nth frame for efficiency
- **Caching**: Results cached to avoid re-processing
- **Async Processing**: Non-blocking analysis pipeline
- **WebSocket Batching**: Real-time updates batched for efficiency
- **Lazy Loading**: UI components load on demand

### Scalability
- **Stateless Backend**: FastAPI with async workers
- **Database Connection Pooling**: Efficient resource use
- **Horizontal Scaling**: Add more backend workers
- **CDN Integration**: Static assets distributed globally
- **Load Balancing**: Ready for production deployment

---

## 🚀 Deployment

### Development
```bash
# Terminal 1: Frontend
cd UI && npm run dev

# Terminal 2: Backend
cd backend2 && python main.py
```

### Production (Docker)
```bash
# Build frontend
docker build -t superbowl-ui -f Dockerfile.frontend UI/

# Build backend
docker build -t superbowl-api -f Dockerfile.backend backend2/

# Run with docker-compose
docker-compose up
```

### Cloud Deployment
- **Vercel**: Frontend deployment (React/Vite)
- **Railway/Render**: Backend deployment (FastAPI)
- **Supabase/AWS RDS**: PostgreSQL hosting
- **Google Cloud**: Gemini API integration

---

## 🤝 Contributing

This is a sports analytics platform designed for teams and analysts. Contributions welcome for:
- Analytics algorithms and improvements
- New visualization types
- Animation enhancements
- Performance optimizations
- Additional sports support

---

## 📝 License

Proprietary - Sports Analytics Platform

---

## 🎓 Technology Stack Summary

| Category | Technology | Version |
|----------|-----------|---------|
| **Frontend** | React | 19.2.3 |
| | TypeScript | 5.8.2 |
| | Vite | 6.2.0 |
| | Motion.dev | 12.29.2 |
| | Recharts | 3.7.0 |
| **Backend** | FastAPI | 0.109.0+ |
| | Python | 3.12 |
| | PostgreSQL | 14+ |
| **AI/ML** | Google Generative AI | Latest |
| | GetStream Vision | Latest |
| | OpenCV | 4.9.0 |
| **Infrastructure** | Uvicorn | 0.27.0+ |
| | Docker | Latest |

---

## 🎯 Roadmap

### Phase 1 (Current)
✅ Live video analysis with Gemini Vision
✅ Real-time WebRTC streaming
✅ Basic analytics (EPA, Win Probability)
✅ Team selection and personalization
✅ Motion.dev animation system

### Phase 2 (Planned)
📋 Advanced player tracking with AI
📋 Multi-angle video support
📋 Predictive play modeling
📋 Coach feedback system
📋 Mobile app support

### Phase 3 (Future)
🔮 AR field visualization
🔮 Real-time player bioptics
🔮 Broadcast integration
🔮 Multi-sport support
🔮 AI-powered play calling suggestions

---

**Built with ❤️ for teams that want to win with data-driven decisions.**

For support, questions, or contributions, please reach out to the development team.
