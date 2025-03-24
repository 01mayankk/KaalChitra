import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Wrapper from './Wrapper';
import reportWebVitals from './reportWebVitals';

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function getGradientColors() {
  const color1 = getRandomColor();
  const color2 = getRandomColor();
  return { color1, color2 };
}

async function renderApp() {
  const colors = getGradientColors();
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <Wrapper colors={colors} />
    </React.StrictMode>
  );
}

renderApp();
reportWebVitals();