import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import './styles/global.css';

if (import.meta.env.DEV) {
  void Promise.all([
    import('./store/gameStore'),
    import('./game/fishing/fishingRuntime'),
    import('./game/fishing/fishingEngine'),
  ]).then(([store, runtime, engine]) => {
    Object.assign(window, { __fishing: { store: store.useGameStore, runtime: runtime.runtime, engine } });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
