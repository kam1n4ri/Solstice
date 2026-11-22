import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initTauriBridge } from './lib/tauriBridge';

// Initialize the native Tauri bridge for window.solsticeAPI
initTauriBridge();

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
