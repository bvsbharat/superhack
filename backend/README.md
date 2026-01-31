# Super Bowl Analytics Backend

A production-ready backend for real-time Super Bowl video analysis using **Gemini 2.0 Pro** with the vision-agents framework and WebRTC streaming capabilities.

## 🚀 Features

- **Real-time Video Analysis**: Process live or recorded Super Bowl video feeds
- **AI-Powered Insights**: Advanced tactical analysis using Gemini 2.0 Pro
- **Deep Research**: RAG-based strategy recommendations and player analysis
- **WebSocket Support**: Real-time game state updates and event streaming
- **Database Persistence**: PostgreSQL integration for game data storage
- **WebRTC Streaming**: Optional live streaming with GetStream integration
- **RESTful API**: Comprehensive endpoints for video analysis and game management

## 📋 Tech Stack

- **Framework**: FastAPI with async/await support
- **AI Models**: Gemini 2.0 Pro for vision and language understanding
- **Video Processing**: OpenCV (cv2) for frame extraction and analysis
- **Database**: PostgreSQL with SQLAlchemy ORM
- **WebSockets**: Real-time communication with websockets library
- **Vision Framework**: vision-agents (optional) for advanced streaming
- **Deployment**: Uvicorn ASGI server

## 🔧 Installation

### Prerequisites

- Python 3.12+
- PostgreSQL (optional, for data persistence)
- Gemini API Key ([Get API Key](https://ai.google.dev))
- GetStream API credentials (optional, for WebRTC streaming)

### Setup

1. **Clone the repository** (if applicable)
   ```bash
   cd /Users/bharatbvs/Desktop/SuperBowl/backend
   ```

2. **Create virtual environment**
   ```bash
   python3.12 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Optional: Install vision-agents for WebRTC streaming**
   ```bash
   pip install 'vision-agents[gemini,getstream]'
   ```

5. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

   **Required variables:**
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   STREAM_API_KEY=your_getstream_api_key_here (optional)
   POSTGRES_URL=postgresql://user:password@localhost/superbowl (optional)
   ```

## 🏃 Running the Server

### Development Mode (with hot reload)

```bash
source venv/bin/activate
python3.12 main.py
```

The server will start on `http://0.0.0.0:8000`

### Production Mode (background)

Using `nohup`:
```bash
cd /Users/bharatbvs/Desktop/SuperBowl/backend
source venv/bin/activate
nohup python3.12 main.py > server.log 2>&1 &
```

Using `screen`:
```bash
screen -S superbowl python3.12 main.py
# Detach: Ctrl+A then D
# Reattach: screen -r superbowl
```

## 📡 API Endpoints

### Health & Status
- `GET /` - Health check with feature status
- `GET /health` - Detailed component health

### Video Analysis
- `POST /analyze/video` - Upload and analyze video file
- `GET /analysis/{analysis_id}` - Get analysis results
- `WS /ws/analysis/{analysis_id}` - WebSocket for real-time results

### Game Management
- `POST /match/start` - Start new match
- `PUT /match/{match_id}/state` - Update game state
- `GET /match/{match_id}` - Get match details

### WebRTC Streaming (if enabled)
- `POST /stream/start` - Start WebRTC stream
- `POST /stream/stop` - Stop WebRTC stream
- `WS /ws/stream` - Stream video feed

## 🤖 Model Configuration

The backend uses the latest available Gemini preview models for optimal performance:

### Model References

| Service | Model | Purpose |
|---------|-------|---------|
| Deep Research | `gemini-3-pro-preview` | Strategic analysis & RAG context |
| Tactical Analysis | `gemini-3-flash-preview` / `gemini-3-pro-preview` | Halftime and real-time tactics |
| Vision Analysis | `gemini-3-pro-preview` | Frame analysis & game state detection |
| LLM Service | `gemini-3-pro-preview` | General language understanding |

### Model Strategy

- **Primary**: `gemini-3-pro-preview` - Advanced reasoning for complex analysis
- **Fast Fallback**: `gemini-3-flash-preview` - Quick processing for real-time updates

### Files Using These Models

- `services/deep_research.py` - Uses `gemini-3-pro-preview`
- `services/deep_think_tactics.py` - Uses `gemini-3-flash-preview` with `gemini-3-pro-preview` for deep thinking
- `services/llm_service.py` - Uses `gemini-3-pro-preview`
- `core/vision_agent.py` - Uses `gemini-3-pro-preview`

## 🔍 Key Features

### 1. Real-time Video Analysis

Upload Super Bowl footage for instant AI-powered analysis:

```bash
curl -X POST http://localhost:8000/analyze/video \
  -F "video=@game_footage.mp4"
```

### 2. Deep Research Service

Get strategic recommendations based on game context:

- Player performance analysis
- Formation recommendations
- Tactical play suggestions
- Opponent weakness identification

### 3. Deep Think Tactics

Advanced halftime analysis using extended reasoning:

- Comprehensive game plan generation
- Formation recommendations
- Personnel adjustments
- Counter-strategy planning

### 4. WebSocket Real-time Updates

Connect to live game updates:

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/analysis/abc123');
ws.onmessage = (event) => {
  console.log('New analysis event:', JSON.parse(event.data));
};
```

## 📊 Database Schema

PostgreSQL tables (auto-created on startup):

- `matches` - Game/match information
- `analysis_results` - Video analysis results
- `game_events` - Live event tracking
- `player_stats` - Player performance data
- `formations` - Formation library

## ⚙️ Configuration

### Environment Variables

```bash
# API Keys
GEMINI_API_KEY=sk-...              # Required: Google Gemini API
STREAM_API_KEY=sk-...              # Optional: GetStream API

# Server
HOST=0.0.0.0                       # Server host
PORT=8000                          # Server port
DEBUG=true                         # Debug mode

# Analysis
ANALYSIS_FPS=2                     # Frames per second to analyze
CONFIDENCE_THRESHOLD=0.5           # Minimum confidence for results

# Database
POSTGRES_URL=postgresql://...      # Optional: PostgreSQL connection

# AI
MAX_TOKENS=4000                    # Max output tokens for responses
TEMPERATURE=0.8                    # Model creativity (0.0-1.0)
```

## 🚨 Troubleshooting

### ModuleNotFoundError: No module named 'cv2'

Solution: Reinstall requirements
```bash
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### Gemini API 404 Error

**Error**: `models/gemini-1.5-pro is not found`

**Solution**: All models have been updated to `gemini-2-0-pro`. Make sure you:
1. Have the latest backend code
2. Restarted the server after pulling changes
3. Have a valid Gemini API key with access to latest models

### Database Connection Error

Solution: Set `POSTGRES_URL` in `.env` or remove it to run without persistence:
```bash
unset POSTGRES_URL  # Run without database
```

### Vision-agents Not Available

This is optional. The backend will fall back to direct Gemini API:
```bash
# Optional: Install for WebRTC streaming
pip install 'vision-agents[gemini,getstream]'
```

## 📈 Performance Tips

1. **Reduce analysis FPS** for slower systems:
   ```bash
   ANALYSIS_FPS=1  # Analyze every other frame
   ```

2. **Use smaller video files** for faster processing

3. **Enable database persistence** for result caching

4. **Monitor server logs** for bottlenecks:
   ```bash
   tail -f server.log
   ```

## 🔐 Security Notes

- ✅ API keys stored in `.env` (not in version control)
- ✅ CORS configured for development (`*` origins)
- ⚠️ Change CORS settings for production
- ✅ Input validation on all endpoints
- ✅ Error handling prevents information leakage

## 🤝 Contributing

For issues or improvements, please:
1. Check existing documentation
2. Review recent commits
3. Test changes locally before committing
4. Update this README if adding new features

## 📝 Changelog

### Version 2.0.0 (Current)
- ✨ Updated all models to **Gemini 2.0 Pro**
- 🔧 Improved error handling and fallbacks
- 📚 Added comprehensive README documentation
- 🚀 Enhanced performance with async processing
- 🔒 Better security with environment variables

### Version 1.0.0
- Initial release with Gemini 3 Flash/Pro support
- Basic video analysis functionality
- WebSocket support

## 📞 Support

For API documentation and examples, start the server and visit:
- **API Docs**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

## 📄 License

See LICENSE file for details.

---

**Last Updated**: January 31, 2026
**Model Version**: Gemini 2.0 Pro
