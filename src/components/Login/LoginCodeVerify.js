// src/pages/LoginCodeVerify.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const LoginCodeVerify = () => {
  const [codigo, setCodigo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const navigate = useNavigate();
  const email = localStorage.getItem('tempEmail');

  const verificarCodigo = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensagem('');

    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/auth/login/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: codigo })
      });

      const data = await res.json();

      if (res.ok) {
        setMensagem('✅ Código verificado! Redirecionando...');
        localStorage.setItem('userId', data.userId);
        localStorage.removeItem('tempEmail');
        setSucesso(true);

        setTimeout(() => {
          navigate('/comandas');
        }, 2000); // espera 2 segundos antes de redirecionar
      } else {
        setMensagem(`❌ ${data.message}`);
      }
    } catch (err) {
      setMensagem('❌ Erro na verificação.');
    }

    setLoading(false);
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={verificarCodigo}>
        <h2>Código de Login</h2>
        <input
          type="text"
          placeholder="Digite o código"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          required
          disabled={loading || sucesso}
        />
        <button type="submit" disabled={loading || sucesso}>
          {loading ? 'Verificando...' : sucesso ? 'Sucesso!' : 'Verificar'}
        </button>
        {loading && <div className="spinner"></div>}
        <p>{mensagem}</p>
      </form>
    </div>
  );
};

export default LoginCodeVerify;

