import React from 'react';
import ReactDOM from 'react-dom/client';
import Home from './App.tsx';
import './index.css';
import 'uplot/dist/uPlot.min.css';
import 'react-toastify/dist/ReactToastify.css';
import SelfHostedProvider from './components/SelfHostedProvider.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SelfHostedProvider>
      <Home />
    </SelfHostedProvider>
  </React.StrictMode>,
);
