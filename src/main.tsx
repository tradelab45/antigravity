import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { prepareOfflineAcademy } from './utils/pwa';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);


window.addEventListener('load', () => void prepareOfflineAcademy());
window.addEventListener('online', () => void prepareOfflineAcademy());
