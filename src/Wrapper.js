import React from 'react';
import App from './App';

function Wrapper({ colors }) {
  return (
    <div
      style={{
        background: `linear-gradient(to bottom, ${colors.color1}, ${colors.color2})`,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <App colors={colors} />
    </div>
  );
}

export default Wrapper;