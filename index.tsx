import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; 
import localforage from 'localforage';

// Configuração silenciosa do banco de dados para o teu App usar quando quiseres
localforage.config({
  name: "AgenteMNG",
  storeName: "transacoes"
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Não foi possível encontrar o elemento root");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);