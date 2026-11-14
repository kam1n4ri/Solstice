// Force browser runtime detection for client-side web packages (e.g. transformers.js / onnxruntime-web) in Electron
if (typeof process !== 'undefined' && process.release?.name === 'node') {
  try {
    Object.defineProperty(process, 'release', {
      value: { ...process.release, name: 'browser' },
      configurable: true,
      writable: true,
    });
  } catch {
    // ignore
  }
}

import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Apply saved theme preferences on boot
const savedTheme = localStorage.getItem('solstice-theme');
if (
  savedTheme === 'dark' ||
  (savedTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<App />);
}
