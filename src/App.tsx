import { GameProvider, useGame } from './context/GameContext';
import { Lobby } from './components/Lobby';
import { GameBoard } from './components/GameBoard';
const GameContainer = () => {
  const { state } = useGame();

  return (
    <main>
      {state.status === 'LOBBY' ? <Lobby /> : <GameBoard />}
    </main>
  );
};

function App() {
  return (
    <GameProvider>
      <GameContainer />
    </GameProvider>
  );
}

export default App;
