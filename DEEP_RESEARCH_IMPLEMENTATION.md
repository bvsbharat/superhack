# Deep Research RAG Implementation Guide

## Overview

The Deep Research RAG system integrates real-time game analysis with retrieval-augmented generation (RAG) to provide:
- **Strategic Analysis**: Context-aware strategy recommendations
- **Player Recommendations**: Specific, actionable player assignments
- **Real-time Context**: Ranked live event storage for fast retrieval
- **Halftime Intelligence**: Deep insights for coaching decisions

## Architecture

### Backend Components

#### 1. RAG Context Store (`backend/services/rag_context_store.py`)

Manages live match events with importance-based ranking.

**Key Features:**
- **Event Storage**: Stores play-by-play events with metadata
- **Importance Ranking**: Critical, High, Medium, Low classification
- **Relevance Scoring**: Content-based relevance calculation
- **Automatic Compression**: Keeps top-ranked items, removes low-value events
- **Time-based Decay**: Recent events get higher recency scores

**Event Types (by importance):**
```
CRITICAL: Turnovers, Interceptions, Fumbles, Sacks, Scoring Plays, Touchdowns, Field Goals
HIGH: Formation Changes, Explosive Plays
MEDIUM: Standard Passes, Runs, Tackles
LOW: Minor Events, Routine Plays
```

**Ranking Algorithm:**
```
rank_score = (recency_score + relevance_score) × importance_multiplier / 2

where:
- recency_score ∈ [0, 1] (based on timestamp)
- relevance_score ∈ [0, 1] (based on event type and query match)
- importance_multiplier ∈ {0.4, 0.6, 0.8, 1.0}
```

#### 2. Deep Research Service (`backend/services/deep_research.py`)

Orchestrates RAG analysis with LLM.

**Core Methods:**
- `add_live_event()`: Add events to context store
- `analyze_strategy()`: Generate strategy insights based on context
- `answer_question()`: Answer user questions with RAG
- `get_player_recommendations()`: Get specific player assignments

**Context Retrieval:**
1. Retrieve top-K ranked items from store
2. Build context summary with game state
3. Include query in retrieval scoring
4. Generate LLM prompt with context
5. Parse response into structured insights

**Conversation Management:**
- Multi-turn conversation history (max 10 turns)
- Context window management
- Automatic history trimming

#### 3. Deep Research API Routes (`backend/api/routes/deep_research.py`)

RESTful endpoints for integration.

**Endpoints:**
```
POST   /api/deep-research/add-event                    # Add event to context
POST   /api/deep-research/analyze-strategy             # Get strategy analysis
POST   /api/deep-research/ask-question                 # Answer question with RAG
GET    /api/deep-research/player-recommendations       # Get player assignments
GET    /api/deep-research/context-stats                # View context store stats
POST   /api/deep-research/clear-conversation           # Clear history
POST   /api/deep-research/reset-context                # Reset for new match
```

### Frontend Components

#### 1. useDeepResearch Hook (`client/hooks/useDeepResearch.ts`)

React hook for deep research integration.

**Features:**
- Automatic event addition to context
- Strategy analysis with confidence scores
- Player recommendations retrieval
- Context statistics
- Conversation management

**Usage:**
```typescript
const {
  analyzeStrategy,
  getPlayerRecommendations,
  addEvent,
  loading,
  strategy,
  recommendations
} = useDeepResearch();

// Add event
await addEvent(eventType, description, timestamp, team, playerName, details);

// Analyze strategy
const insight = await analyzeStrategy(query, gameState, focusTeam);

// Get player recs
const recs = await getPlayerRecommendations(gameState, focusTeam);
```

#### 2. HalftimeStrategyPanel (`client/components/HalftimeStrategyPanel.tsx`)

UI component for halftime strategy discussions.

**Features:**
- Real-time strategy analysis chat
- Player recommendations display
- Game score/stats summary
- Loading states
- Message history with animations

**Example Queries:**
- "What's their defensive weakness?"
- "How should we attack in the second half?"
- "Which players should we feature more?"
- "What adjustments should we make?"

#### 3. PlayerRecommendationsOverlay (`client/components/PlayerRecommendationsOverlay.tsx`)

Field visualization with player recommendations.

**Features:**
- Positioned player badges on field
- Priority indicators (High/Medium/Low)
- Tooltip recommendations
- Summary card with key players
- Animated entrance/exit

#### 4. Deep Research Integration Service (`client/services/deepResearchIntegration.ts`)

Utility service for event processing.

**Functions:**
- `processDetectedEvent()`: Add live events to context
- `generateEventSummary()`: Create text summaries
- `buildHalftimeContext()`: Prepare halftime analysis
- `generateStrategicQuestions()`: Suggest questions based on game state
- `formatPlayerForDisplay()`: Format player recommendations for UI

## Data Flow

### Live Event Processing

```
1. Event Detected (Vision AI)
   ↓
2. Analysis Result Created
   ↓
3. deepResearchIntegration.processDetectedEvent()
   ↓
4. addEvent() via API
   ↓
5. Context Store Ranked
   ↓
6. Stored for Later Retrieval
```

### Strategy Analysis

```
1. User Asks Question
   ↓
2. HalftimeStrategyPanel.handleSubmit()
   ↓
3. analyzeStrategy() Hook Called
   ↓
4. Context Store Retrieval (top-K ranked items)
   ↓
5. Context Summary Built
   ↓
6. Gemini LLM Generates Response
   ↓
7. Response Parsed into StrategyInsight
   ↓
8. Displayed in UI with Player Recommendations
```

## Implementation Example

### Adding to App.tsx

```typescript
import { HalftimeStrategyPanel } from './components/HalftimeStrategyPanel';
import { PlayerRecommendationsOverlay } from './components/PlayerRecommendationsOverlay';
import { useDeepResearch } from './hooks/useDeepResearch';

export const App: React.FC = () => {
  const [liveAnalysis, setLiveAnalysis] = useState<AnalysisEvent[]>([]);
  const { addEvent } = useDeepResearch();

  // When events are detected
  const handleAnalysisEvent = (event: AnalysisEvent) => {
    setLiveAnalysis(prev => [...prev, event]);

    // Add to deep research context
    addEvent(
      event.eventType,
      event.details,
      event.timestamp,
      event.team,
      event.playerName,
      { confidence: event.confidence, epa: event.epa }
    );
  };

  return (
    <div>
      {/* Existing components */}

      {/* Halftime Strategy Panel */}
      {gameState.quarter === 2 && (
        <HalftimeStrategyPanel
          gameState={gameState}
          isVisible={showHalftime}
        />
      )}

      {/* Player Recommendations Overlay */}
      <PlayerRecommendationsOverlay
        gameState={gameState}
        isVisible={showRecommendations}
      />
    </div>
  );
};
```

### Integrating with Live Stream Analysis

```typescript
// In LiveStreamAnalysis component
import { deepResearchIntegration } from '../services/deepResearchIntegration';
import { useDeepResearch } from '../hooks/useDeepResearch';

export const LiveStreamAnalysis: React.FC = () => {
  const { addEvent } = useDeepResearch();

  const handleAnalysisEvents = async (events: AnalysisResult[]) => {
    for (const event of events) {
      // Process each event for deep research
      await deepResearchIntegration.processDetectedEvent(
        event,
        gameState,
        useDeepResearch() // Hook instance
      );
    }
  };
};
```

## Configuration

### Context Store Settings

```python
# In backend initialization
context_store = RAGContextStore(
    max_items=500,                    # Maximum events to keep
    compression_threshold=100         # Compress when size exceeds this
)
```

### LLM Settings

```python
# Uses Gemini 3 Flash for speed
model = genai.GenerativeModel("gemini-3-flash-preview")
```

### Frontend Hook Settings

```typescript
const API_BASE = 'http://localhost:8000/api/deep-research';
```

## Performance Considerations

### Backend

1. **Context Compression**: Automatic cleanup keeps memory usage bounded
2. **Ranking Efficiency**: O(n log k) for top-K retrieval
3. **Relevance Scoring**: Fast text matching with keyword analysis
4. **LLM Throttling**: Conversation history management prevents token overflow

### Frontend

1. **Event Throttling**: 500ms minimum between event additions
2. **Lazy Loading**: Only load player recommendations when needed
3. **Memoization**: Recommendation calculations cached
4. **Animation Optimization**: Motion.dev handles smooth 60fps animations

## Testing

### Backend API Tests

```bash
# Test context store
curl -X POST http://localhost:8000/api/deep-research/add-event \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "turnover",
    "description": "Interception by safety",
    "timestamp": "5:23",
    "team": "KC",
    "player_name": "Nick Bolton",
    "details": {"yards": 0}
  }'

# Test strategy analysis
curl -X POST http://localhost:8000/api/deep-research/analyze-strategy \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What defensive weakness can we exploit?",
    "game_state": {"quarter": 2, "clock": "8:15", ...},
    "focus_team": "KC"
  }'

# Get player recommendations
curl "http://localhost:8000/api/deep-research/player-recommendations?game_state_quarter=2&game_state_clock=8:15&game_state_possession=KC"

# Check context stats
curl http://localhost:8000/api/deep-research/context-stats
```

## Monitoring & Debugging

### Context Store Health

```typescript
const stats = await getContextStats();
console.log(`Total items: ${stats.total_items}/${stats.max_items}`);
console.log(`Items by importance:`, stats.items_by_importance);
```

### Strategy Analysis Debugging

```typescript
const insight = await analyzeStrategy(query, gameState);
console.log(`Confidence: ${insight.confidence}`);
console.log(`Players recommended: ${insight.player_recommendations.length}`);
console.log(`Play types: ${insight.play_types.join(', ')}`);
```

## Error Handling

### Common Issues

**Issue**: "Deep research service not initialized"
- **Solution**: Ensure GEMINI_API_KEY is set in environment

**Issue**: No player recommendations returned
- **Solution**: Ensure sufficient events in context store (minimum 5-10 events)

**Issue**: Slow strategy analysis
- **Solution**: Check context store size, may need compression; verify API latency

## Future Enhancements

1. **Multi-Model RAG**: Support multiple embedding models
2. **Opponent Profiles**: Store opponent weakness patterns
3. **Historical Context**: Reference past matchups for context
4. **Real-time Coaching Hints**: Automated suggestions without query
5. **Video Context**: Include video frame analysis in context
6. **Player Tracking**: Track individual player performance trends
7. **Formation Database**: Recognize and store formation patterns

## References

- **FlashRAG**: https://github.com/RUC-NLPIR/FlashRAG
- **Open Agent SDKs**: https://github.com/bvsbharat/open-agent-sdks
- **Gemini API Docs**: https://ai.google.dev/gemini-2/docs
- **Motion.dev**: https://motion.dev/docs

## Support & Questions

For questions or issues:
1. Check the error logs in console
2. Review context store stats for debugging
3. Verify API connectivity
4. Check LLM model availability
