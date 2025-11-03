import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login/Login.js';
import Register from './components/Login/Register.js';

import { SettingsProvider } from './context/SettingsContext';
import LoginCodeRequest from './components/Login/LoginCodeRequest.js';
import LoginCodeVerify from './components/Login/LoginCodeVerify.js';
import RegisterCodeVerify from './components/Login/RegisterCodeVerify.js';

import Comandas from './components/Pages/Comandas.js';
import Cardapio from './components/Pages/Cardapio.js'
import Relatorio from './components/Pages/Relatorio.js'
// import Finalizados from './components/Pages/Finalizados.js'; // removido
import Drinks from './components/Pages/Drinks.js';
import Quartos from './components/Pages/Quartos.js';
import DrinksPublic from './components/Pages/DrinksPublic.js';


function App() {
  const [metas, setMetas] = useState({
    study: 5,
    leisure: 5,
    dev: 5,
  });

  return (
    <SettingsProvider>
      <Router>
        <Routes>
          {/* Rota para Login */}
          <Route path="/" element={<Login />} />

          {/* Rota para Registrar Usuário */}
          <Route path="/register" element={<Register />} />

          
           {/* Rota para Perfil */}
          <Route path="/logincodeverify" element={<LoginCodeVerify />} />

            {/* Rota para Perfil */}
          <Route path="/logincoderequest" element={<LoginCodeRequest />} />

            {/* Rota para Codigo de criação */}
          <Route path="/RegisterCodeVerify" element={<RegisterCodeVerify />} />


                {/* Rota para a Comandas */}
          <Route path="/comandas" element={<Comandas metas={metas} />} />
          
               {/* Rota para Cardapio */}
          <Route path="/cardapio" element={<Cardapio />} />

                 {/* Rota para Relatorio */}
          <Route path="/relatorio" element={<Relatorio />} />

                  {/* Rota para Finalizados */}
          {/* <Route path="/finalizados" element={<Finalizados />} /> */}
          {/* Rota para Drinks */}
          <Route path="/drinks" element={<Drinks />} />
          {/* Rota pública read-only para Drinks */}
          <Route path="/drinks-public" element={<DrinksPublic />} />
          {/* Rota para Quartos */}
          <Route path="/quartos" element={<Quartos />} />








      
        
        </Routes>
      </Router>
    </SettingsProvider>
  );
}

export default App;

