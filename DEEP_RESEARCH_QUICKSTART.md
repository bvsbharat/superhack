# Deep Research RAG - Quick Start Guide

## Installation & Setup

### 1. Backend Dependencies

The deep research feature is built on existing FastAPI infrastructure. No new dependencies needed beyond what's already configured.

```bash
# Already included:
# - google.generativeai (for Gemini API)
# - fastapi (for API endpoints)
# - pydantic (for data validation)
```

### 2. Environment Configuration

Ensure your `.env` file has:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

The backend automatically initializes deep research when Gemini API is available.

### 3. Backend Startup

```bash
# Backend is ready to go - no code changes needed
# Deep research router is included in main.py

cd backend
python -m uvicorn main:app --reload --port 8000
```

Check that `/api/deep-research/*` endpoints are available at: http://localhost:8000/docs

## Frontend Setup

### 1. Import the Hook

```typescript
import { useDeepResearch } from '../hooks/useDeepResearch';
```

### 2. Import Components

```typescript
import { HalftimeStrategyPanel } from '../components/HalftimeStrategyPanel';
import { PlayerRecommendationsOverlay } from '../components/PlayerRecommendationsOverlay';
```

### 3. Use in Your Component

```typescript
export const MyComponent: React.FC = () => {
  const gameState = {/* ... */};
  const { analyzeStrategy, getPlayerRecommendations, loading } = useDeepResearch();

  return (
    <div>
      <HalftimeStrategyPanel gameState={gameState} />
      <PlayerRecommendationsOverlay gameState={gameState} />
    </div>
  );
};
```

## Basic Usage

### Adding a Live Event

```typescript
const { addEvent } = useDeepResearch();

await addEvent(
  'pass',                                    // Event type
  'Completion to Travis Kelce for 12 yards', // Description
  '5:23',                                    // Timestamp MM:SS
  'KC',                                      // Team
  'Patrick Mahomes',                         // Player name (optional)
  { confidence: 0.95, yards: 12, epa: 0.8 }  // Details
);
```

### Analyzing Strategy

```typescript
const { analyzeStrategy, strategy, loading } = useDeepResearch();

const insight = await analyzeStrategy(
  "How should we attack their weak secondary?",  // User query
  gameState,                                      // Current game state
  'KC'                                            // Focus team
);

// Result:
if (insight) {
  console.log(insight.title);                    // "Attack Deep Sidelines"
  console.log(insight.confidence);               // 0.87
  console.log(insight.player_recommendations);   // [...]
  console.log(insight.play_types);               // ["Deep Routes", ...]
}
```

### Getting Player Recommendations

```typescript
const { getPlayerRecommendations, recommendations } = useDeepResearch();

const recs = await getPlayerRecommendations(gameState, 'KC');

// Result: [
//   {name: "Travis Kelce", position: "TE", action: "Deep route left sideline"},
//   {name: "Rashid Rice", position: "WR", action: "Quick slant underneath"},
//   ...
// ]
```

## Common Workflows

### Workflow 1: Halftime Strategy Discussion

```typescript
// Component: HalftimeStrategyPanel
// The component handles everything!

<HalftimeStrategyPanel
  gameState={gameState}
  isVisible={gameState.quarter === 2 && gameState.clock === "0:00"}
/>

// Features:
// - User types questions
// - Automatic strategy analysis
// - Player recommendations displayed
// - Score/stats shown
// - All animations included
```

### Workflow 2: Live Event Integration

```typescript
// In your live analysis handler
import { deepResearchIntegration } from '../services/deepResearchIntegration';

const handleLiveAnalysis = async (events: AnalysisResult[]) => {
  const { addEvent } = useDeepResearch();

  for (const event of events) {
    // Let the integration service handle categorization
    await deepResearchIntegration.processDetectedEvent(
      event,
      gameState,
      useDeepResearch()
    );
  }
};
```

### Workflow 3: Field Overlay with Recommendations

```typescript
// Component: PlayerRecommendationsOverlay
// Shows recommended players directly on field

<div className="relative">
  <FieldSVG gameState={gameState} />

  <PlayerRecommendationsOverlay
    gameState={gameState}
    isVisible={showRecommendations}
  />
</div>

// Features:
// - Player badges with recommendations
// - Priority indicators
// - Tooltip details
// - Auto-loads recommendations
```

## Testing the Integration

### Test 1: Add Event via API

```bash
curl -X POST http://localhost:8000/api/deep-research/add-event \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "pass",
    "description": "Completion to Kelce for 15 yards",
    "timestamp": "5:23",
    "team": "KC",
    "player_name": "Patrick Mahomes",
    "details": {"yards": 15, "confidence": 0.95}
  }'
```

Expected: `{"status": "success", "message": "Event added to context"}`

### Test 2: Analyze Strategy

```bash
curl -X POST http://localhost:8000/api/deep-research/analyze-strategy \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are their weaknesses?",
    "game_state": {
      "quarter": 2,
      "clock": "5:23",
      "possession": "KC",
      "score": {"home": 10, "away": 7},
      "down": 1,
      "distance": 10,
      "winProb": 55.0
    },
    "focus_team": "KC"
  }'
```

Expected: Strategy insight with recommendations

### Test 3: Get Player Recommendations

```bash
curl "http://localhost:8000/api/deep-research/player-recommendations?game_state_quarter=2&game_state_clock=5:23&game_state_possession=KC"
```

Expected: List of player recommendations

### Test 4: Context Stats

```bash
curl http://localhost:8000/api/deep-research/context-stats
```

Expected: Store statistics with item counts

## UI Components at a Glance

### HalftimeStrategyPanel
- **Location**: `client/components/HalftimeStrategyPanel.tsx`
- **Props**: `gameState`, `isVisible`
- **Features**: Chat interface, strategy analysis, player recs, score summary
- **Output**: StrategyInsight with recommendations

### PlayerRecommendationsOverlay
- **Location**: `client/components/PlayerRecommendationsOverlay.tsx`
- **Props**: `gameState`, `isVisible`, `onDismiss`
- **Features**: Field visualization, player badges, priority indicators, tooltips
- **Output**: Visual overlay on field

### useDeepResearch Hook
- **Location**: `client/hooks/useDeepResearch.ts`
- **Methods**: `addEvent`, `analyzeStrategy`, `askQuestion`, `getPlayerRecommendations`
- **State**: `loading`, `error`, `strategy`, `recommendations`, `contextStats`
- **Return**: All methods and state

## Real Data Example

### From Vision AI → Deep Research Pipeline

```
Vision AI detects: "Patrick Mahomes 15-yard completion to Travis Kelce over middle"
                   ↓
AnalysisResult created:
{
  event: "Pass Completion",
  details: "15-yard completion to Kelce over the middle",
  player_name: "Patrick Mahomes",
  team: "KC",
  yards: 15,
  confidence: 0.94,
  epa_value: 0.8
}
                   ↓
deepResearchIntegration.processDetectedEvent()
                   ↓
addEvent() API call:
{
  event_type: "pass",
  description: "15-yard completion to Kelce over the middle",
  timestamp: "5:23",
  team: "KC",
  player_name: "Patrick Mahomes"
}
                   ↓
Context Store (Ranked):
- Event stored with HIGH importance (high confidence)
- Recency score: 1.0 (brand new)
- Relevance score: 0.8 (good match)
- Total rank: 0.9
                   ↓
Later, when user asks:
"How's the passing attack looking?"
                   ↓
Context retrieved (top-K ranked items)
Including this event with highest score
                   ↓
Gemini analyzes with context:
"Their passing attack is effective, especially over the middle.
Travis Kelce has been a reliable target with 15+ yard completions.
Recommend continuing vertical threats to Kelce..."
```

## Monitoring & Debugging

### Check Context Store Health

```typescript
const { getContextStats } = useDeepResearch();

const stats = await getContextStats();
console.log(`Total events: ${stats.total_items}`);
console.log(`By importance:`, stats.items_by_importance);

// Expected:
// Total events: 23
// By importance: {
//   critical: 4,
//   high: 6,
//   medium: 10,
//   low: 3
// }
```

### Check Strategy Analysis Quality

```typescript
const { strategy } = useDeepResearch();

if (strategy) {
  console.log(`Confidence: ${strategy.confidence}`);        // Should be > 0.7
  console.log(`Players: ${strategy.player_recommendations.length}`);  // Should be 3+
  console.log(`Plays: ${strategy.play_types.length}`);      // Should be 2+
}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Deep research service not initialized" | Set `GEMINI_API_KEY` environment variable |
| No recommendations returned | Add 5+ events to context store first |
| Slow analysis | Context store may be large, try reset |
| Low confidence scores | Ensure events have high confidence (>0.7) |
| Recommendations not showing on field | Check `isVisible` prop on overlay component |

## Next Steps

1. **Integrate with Live Stream**: Connect `useDeepResearch` to your analysis events
2. **Add to App Layout**: Place `HalftimeStrategyPanel` and `PlayerRecommendationsOverlay` in your main layout
3. **Test User Queries**: Have users ask strategic questions during halftime
4. **Monitor Performance**: Watch context store stats and analysis latency
5. **Gather Feedback**: Refine prompts based on recommendation quality

## Key Files

- Backend:
  - `backend/services/rag_context_store.py` - Context ranking
  - `backend/services/deep_research.py` - Strategy analysis
  - `backend/api/routes/deep_research.py` - API endpoints

- Frontend:
  - `client/hooks/useDeepResearch.ts` - React hook
  - `client/components/HalftimeStrategyPanel.tsx` - UI component
  - `client/components/PlayerRecommendationsOverlay.tsx` - Field overlay
  - `client/services/deepResearchIntegration.ts` - Event processing

- Documentation:
  - `DEEP_RESEARCH_IMPLEMENTATION.md` - Full architecture
  - `DEEP_RESEARCH_INTEGRATION_EXAMPLES.md` - Detailed examples
  - `DEEP_RESEARCH_QUICKSTART.md` - This file

## Support

For questions or issues, refer to:
1. `DEEP_RESEARCH_IMPLEMENTATION.md` for architecture details
2. `DEEP_RESEARCH_INTEGRATION_EXAMPLES.md` for code examples
3. API documentation at http://localhost:8000/docs
