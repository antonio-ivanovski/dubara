import { useState } from 'react';

import { Screen } from './components/Screen';
import { Header } from './components/Header';
import { ResumeBanner } from './components/ResumeBanner';
import { Scoreboard } from './components/Scoreboard';

import { Lobby } from './components/Lobby';
import { DifficultyPick } from './components/DifficultyPick';
import { RevealQueue } from './components/RevealQueue';
import { RoundOrder } from './components/RoundOrder';
import { Vote } from './components/Vote';
import { Outcome } from './components/Outcome';
import { Finale } from './components/Finale';

import { usePhase, useHistory } from './store/selectors';

function PhaseRouter() {
  const phase = usePhase();
  switch (phase) {
    case 'lobby':
      return <Lobby />;
    case 'difficultyPick':
      return <DifficultyPick />;
    case 'reveal':
      return <RevealQueue />;
    case 'round':
      return <RoundOrder />;
    case 'vote':
      return <Vote />;
    case 'outcome':
      return <Outcome />;
    case 'finale':
      return <Finale />;
  }
}

function App() {
  const [scoreboardOpen, setScoreboardOpen] = useState(false);
  const phase = usePhase();
  const history = useHistory();
  const showScoreboard = history.length > 0;

  return (
    <Screen>
      <ResumeBanner />
      <Header
        showLogo={phase !== 'lobby'}
        onOpenScoreboard={showScoreboard ? () => setScoreboardOpen(true) : undefined}
      />
      <PhaseRouter />
      <Scoreboard open={scoreboardOpen} onClose={() => setScoreboardOpen(false)} />
    </Screen>
  );
}

export default App;