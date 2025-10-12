// src/pages/LoginCodeRequest.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const LoginCodeRequest = () => {
  const [email, setEmail] = useState('');
  const [mensagem, setMensagem] = useState('');
  const navigate = useNavigate();

  const solicitarCodigo = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/auth/login/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      setMensagem(data.message);

      if (res.ok) {
        localStorage.setItem('tempEmail', email);
        setTimeout(() => navigate('/verificar-codigo-login'), 2000);
      }
    } catch (err) {
      setMensagem('Erro ao solicitar código.');
    }
  };

return (
     <div className="login-container">
    
    </div>
  );
};

export default LoginCodeRequest;

