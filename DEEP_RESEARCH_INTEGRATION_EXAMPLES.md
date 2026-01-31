# Deep Research Integration Examples

## Frontend Integration Examples

### 1. Adding Events from Live Stream

```typescript
// In your component that receives analysis events
import { useDeepResearch } from '../hooks/useDeepResearch';
import { deepResearchIntegration } from '../services/deepResearchIntegration';
import { AnalysisEvent } from '../types';

export const LiveStreamComponent: React.FC = () => {
  const { addEvent } = useDeepResearch();

  const handleAnalysisEvent = async (analysisEvents: AnalysisEvent[]) => {
    for (const event of analysisEvents) {
      // Automatically add to deep research context
      await addEvent(
        event.eventType,                    // 'pass', 'run', 'turnover', etc.
        event.details,                      // Full event description
        event.timestamp,                    // 'MM:SS' format
        event.team,                         // 'KC', 'PHI', etc.
        event.playerName,                   // Player name if available
        {
          confidence: event.confidence,
          yards: event.yards,
          epa: event.epa,
          play_type: event.playType,
          formation: event.formation,
        }
      );
    }
  };

  return (
    <div>
      {/* Your live stream UI */}
    </div>
  );
};
```

### 2. Halftime Strategy Analysis

```typescript
import { HalftimeStrategyPanel } from './components/HalftimeStrategyPanel';
import { GameState } from './types';

export const HalftimeBreak: React.FC<{ gameState: GameState }> = ({ gameState }) => {
  const [showStrategy, setShowStrategy] = useState(false);

  // Show strategy panel at halftime
  useEffect(() => {
    if (gameState.quarter === 2 && gameState.clock === '0:00') {
      setShowStrategy(true);
    }
  }, [gameState.quarter, gameState.clock]);

  return (
    <div>
      {showStrategy && (
        <HalftimeStrategyPanel
          gameState={gameState}
          isVisible={true}
        />
      )}
    </div>
  );
};
```

### 3. Player Recommendations on Field

```typescript
import { PlayerRecommendationsOverlay } from './components/PlayerRecommendationsOverlay';
import { FieldSVG } from './components/FieldSVG';

export const FieldVisualization: React.FC = () => {
  const [showRecs, setShowRecs] = useState(false);

  return (
    <div className="relative">
      <FieldSVG gameState={gameState} />

      <PlayerRecommendationsOverlay
        gameState={gameState}
        isVisible={showRecs}
        onDismiss={() => setShowRecs(false)}
      />

      <button onClick={() => setShowRecs(!showRecs)}>
        {showRecs ? 'Hide' : 'Show'} Recommendations
      </button>
    </div>
  );
};
```

### 4. Custom Strategy Query

```typescript
import { useDeepResearch } from '../hooks/useDeepResearch';

export const StrategyQueryComponent: React.FC = () => {
  const { analyzeStrategy, loading, strategy } = useDeepResearch();

  const handleCustomQuery = async () => {
    const query = "Their secondary is getting exposed deep. How do we attack vertically?";

    const insight = await analyzeStrategy(query, gameState, 'KC');

    if (insight) {
      console.log('Strategy:', insight.title);
      console.log('Confidence:', insight.confidence);
      console.log('Players to involve:', insight.player_recommendations);
      console.log('Plays to run:', insight.play_types);
    }
  };

  return (
    <div>
      <button onClick={handleCustomQuery} disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze Strategy'}
      </button>

      {strategy && (
        <div>
          <h3>{strategy.title}</h3>
          <p>Confidence: {Math.round(strategy.confidence * 100)}%</p>
          <ul>
            {strategy.player_recommendations.map((player) => (
              <li key={player.name}>
                {player.name} ({player.position}): {player.action}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
```

## Backend Integration Examples

### 1. Processing Analysis Results

```python
from services.deep_research import deep_research_service
from models.schemas import AnalysisResult, GameState

# When you receive analysis results from vision agent
async def handle_analysis_results(
    results: list[AnalysisResult],
    game_state: GameState
):
    # Add each important event to context
    for result in results:
        if result.confidence > 0.7:  # Only high-confidence events
            deep_research_service.add_live_event(
                event_type=result.play_type or result.event,
                description=result.details,
                timestamp=result.timestamp,
                team=result.team,
                player_name=result.player_name,
                details={
                    "confidence": result.confidence,
                    "yards": result.yards,
                    "epa": result.epa_value,
                    "formation": result.formation,
                    "is_explosive": result.is_explosive,
                    "is_turnover": result.is_turnover,
                    "is_scoring": result.is_scoring,
                }
            )
```

### 2. Strategy Endpoint Integration

```python
from api.routes.deep_research import router
from services.deep_research import deep_research_service

@router.post("/analyze-strategy")
async def analyze_strategy_endpoint(request: DeepResearchQuery):
    """
    Example: User asks "What should we do about their weak run defense?"

    Process:
    1. Retrieve top-20 ranked context items
    2. Build context summary with recent plays
    3. Query Gemini with context
    4. Extract strategy insights and player recommendations
    5. Return structured response
    """

    # Service handles all the complexity
    insight = deep_research_service.analyze_strategy(
        query=request.query,
        game_state=request.game_state
    )

    return StrategyInsightResponse(
        title=insight.title,                           # Main recommendation
        description=insight.description,                # 1-2 sentences
        confidence=insight.confidence,                  # 0-1 score
        player_recommendations=[                        # Specific players
            {"name": "Patrick Mahomes", "position": "QB", "action": "Attack deep sidelines"},
            {"name": "Travis Kelce", "position": "TE", "action": "Run vertical routes"},
            {"name": "Rashid Rice", "position": "WR", "action": "Quick slants underneath"},
        ],
        play_types=["Play Action Pass", "Deep Routes", "Spread Formation"],  # Recommended plays
        reasoning=insight.reasoning,                    # Detailed explanation
        quarter_context=f"Q{game_state.quarter} {game_state.clock}",
    )
```

### 3. Context Management

```python
from services.deep_research import deep_research_service
from services.rag_context_store import ContextImportance

# Add critical event
deep_research_service.add_live_event(
    event_type="turnover",
    description="Fumble recovered by defense at the 20 yard line",
    timestamp="7:45",
    team="KC",
    player_name="Patrick Mahomes",
    details={"yards_lost": 0, "field_position": 20}
)

# Get ranked context for analysis
context_items = deep_research_service.context_store.retrieve_ranked_context(
    query="defensive strategy",
    top_k=15,
    importance_filter=ContextImportance.HIGH  # Only important plays
)

# Get stats
stats = deep_research_service.get_context_stats()
print(f"Total events: {stats['total_items']}")
print(f"Critical: {stats['items_by_importance'].get('critical', 0)}")
print(f"High: {stats['items_by_importance'].get('high', 0)}")
```

## Real-World Scenarios

### Scenario 1: Halftime Adjustment

```typescript
// At start of Q3
const handleThirdQuarterStrategy = async () => {
  // Generate context summary from first half
  const halfContext = deepResearchIntegration.buildHalftimeContext(
    gameState,
    liveAnalysisEvents.filter(e => e.timestamp.quarter === 1 || e.timestamp.quarter === 2)
  );

  console.log(halfContext.summary);
  // Output: "Q2 Summary: 42 plays (3 turnovers, 2 scoring plays) 285 total yards..."

  // Ask strategic question
  const answer = await askQuestion(
    "Their left cornerback got exposed repeatedly. How do we continue to attack that side?",
    gameState,
    'KC'
  );

  // Answer uses ranked context to provide specific recommendations
};
```

### Scenario 2: 4th Quarter Comeback

```typescript
// Team is down, need aggressive strategy
const handleComebackStrategy = async () => {
  const insight = await analyzeStrategy(
    "We're down 4 with 2 minutes left. What's our best path to tie or win?",
    gameState,
    'KC'
  );

  // Receive specific recommendations:
  // - Feature your fastest WRs for quick slants
  // - Use hurry-up offense with quick passes
  // - Save timeouts for 2-minute drill
  // - Consider going for it on 4th down near red zone

  const recs = insight.player_recommendations;
  // [
  //   {name: "Travis Kelce", position: "TE", action: "Slide route to sideline"},
  //   {name: "Rashid Rice", position: "WR", action: "Quick slant and get out of bounds"},
  //   {name: "Patrick Mahomes", position: "QB", action: "Find checkdown quickly to save clock"}
  // ]
};
```

### Scenario 3: Red Zone Efficiency

```typescript
// Inside the 20 yard line - critical scoring opportunity
const handleRedZoneAnalysis = async () => {
  // Context includes only recent red zone plays
  const rdContext = deepResearchIntegration.context_store.retrieve_ranked_context(
    query="red zone scoring formation",
    top_k=10,
    importance_filter=ContextImportance.HIGH
  );

  const suggestion = await analyzeStrategy(
    "We're at the 15 yard line. Their safety is playing deep. How do we punch this in?",
    gameState,
    'KC'
  );

  // Specific feedback for tight space:
  // Play types: ["Goal line plays", "Short passing routes", "Power running"]
  // Players: ["Travis Kelce - float route in corner", "Isiah Pacheco - power running between tackles"]
};
```

### Scenario 4: Two-Minute Drill

```typescript
// Late game clock management
const handleTwoMinuteDrill = async () => {
  const strategicQuestions = deepResearchIntegration.generateStrategicQuestions(
    gameState,
    'KC'
  );

  // Auto-generated questions:
  // [
  //   "How should we manage the clock in critical situations?",
  //   "What's our best strategy for a close finish?",
  //   "What play has the best chance of success here?"
  // ]

  // Coach can select one of these or ask custom question
  const chosen = strategicQuestions[0];
  const answer = await askQuestion(chosen, gameState, 'KC');

  // Get specific play recommendations for time management
};
```

## Data Examples

### Example Context Store Event

```python
{
    "id": "event_42_0523",
    "timestamp": "05:23",
    "event_type": "turnover",
    "description": "Interception by safety on deep route, returned to 30 yard line",
    "importance": "critical",
    "team": "PHI",
    "player_name": "C.J. Gardner-Johnson",
    "details": {
        "confidence": 0.92,
        "yards": 0,
        "play_type": "pass",
        "formation": "spread",
        "is_explosive": false,
        "is_turnover": true,
        "is_scoring": false,
        "epa_value": -2.1
    },
    "recency_score": 0.94,
    "relevance_score": 0.88,
    "rank_score": 0.89  # (0.94 + 0.88) × 1.0 / 2
}
```

### Example Strategy Insight

```typescript
{
    title: "Attack Weak Pass Coverage Over the Middle",
    description: "Their safeties are playing too deep. Use tight end routes and slot receivers to exploit the middle of the field.",
    confidence: 0.87,
    player_recommendations: [
        {
            name: "Travis Kelce",
            position: "TE",
            action: "Cross field 12-15 yards over middle"
        },
        {
            name: "Rashid Rice",
            position: "WR",
            action: "Slant route in coverage gaps"
        },
        {
            name: "Patrick Mahomes",
            position: "QB",
            action: "Look middle first, delivery timing critical"
        }
    ],
    play_types: ["All Slant", "Mesh Concept", "Cover 2 Beater"],
    reasoning: "Recent defensive coverage analysis shows excessive depth...",
    quarter_context: "Q2 8:15"
}
```

## Performance Monitoring

```typescript
// Monitor context store health
const monitorContextHealth = async () => {
  const stats = await getContextStats();

  if (stats.total_items > stats.max_items * 0.8) {
    console.warn('Context store approaching capacity');
  }

  const criticalCount = stats.items_by_importance.critical || 0;
  console.log(`Critical events: ${criticalCount}`);

  if (criticalCount === 0) {
    console.warn('No critical events recorded - may affect strategy quality');
  }
};

// Monitor strategy analysis performance
const monitorAnalysisPerformance = async () => {
  const startTime = performance.now();

  const insight = await analyzeStrategy(query, gameState);

  const duration = performance.now() - startTime;
  console.log(`Strategy analysis took ${duration}ms`);
  console.log(`Confidence: ${insight?.confidence}`);
  console.log(`Player recommendations: ${insight?.player_recommendations.length}`);
};
```

## Troubleshooting

### No Recommendations Returned

```typescript
// Check if context store has enough data
const stats = await getContextStats();
if (stats.total_items < 5) {
  console.log("Insufficient context data - accumulating...");
  // Need to wait for more events
}
```

### Slow Analysis

```typescript
// Check context store compression
const stats = await getContextStats();
if (stats.total_items > 400) {
  console.log("Large context store - performance may be impacted");
  // Manual compression may help
  await resetContext();
}
```

### Irrelevant Recommendations

```typescript
// Verify context relevance
const contextItems = context_store.retrieve_ranked_context(
    query=query,
    top_k=20
);

for item in contextItems:
    print(f"{item.event_type}: {item.get_rank_score():.2f}")

// If scores are low, context may not match query
```
