import { useEffect } from 'react';
import { Toasts } from './components/ui';
import { useRoute } from './lib/router';
import { ensureConnected, game, getGame } from './lib/store';
import { Home } from './screens/Home';
import { Room } from './screens/Room';

export function App() {
  const route = useRoute();

  useEffect(() => {
    ensureConnected();
  }, []);

  // Leaving a room page (e.g. browser back) forgets it locally; the stored session still
  // lets the player come back with one tap.
  useEffect(() => {
    if (route.name === 'home' && getGame().session) game.detachLocal();
  }, [route]);

  return (
    <div className="app">
      {route.name === 'home' ? <Home /> : <Room key={route.code} code={route.code} />}
      <Toasts />
    </div>
  );
}
