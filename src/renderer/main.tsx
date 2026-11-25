import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initTauriBridge } from './lib/tauriBridge';

// Initialize the native Tauri bridge for window.solsticeAPI
initTauriBridge();

// Apply saved theme preferences on boot and follow OS changes in 'system' mode
const applySavedTheme = () => {
  const savedTheme = localStorage.getItem('solstice-theme');
  if (
    savedTheme === 'dark' ||
    (savedTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  ) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

applySavedTheme();
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (localStorage.getItem('solstice-theme') === 'system') {
    applySavedTheme();
  }
});

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<App />);
}
