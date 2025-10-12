import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';

const RegisterCodeVerify = () => {
  const [code, setCode] = useState('');
  const [mensagem, setMensagem] = useState('');
  const navigate = useNavigate();
  const email = localStorage.getItem('tempEmail'); // salva esse no momento do "enviar código"

  const verificarCodigo = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/auth/register/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();
      console.log('[VERIFY] Resposta:', data);

      if (response.ok) {
        setMensagem('✅ Conta criada com sucesso!');
        localStorage.removeItem('tempEmail');
        setTimeout(() => navigate('/'), 1500);
      } else {
        setMensagem(`❌ ${data.message}`);
      }
    } catch (err) {
      console.error('[VERIFY] Erro:', err);
      setMensagem('❌ Erro interno ao verificar código.');
    }
  };

  return (
    <div className="register-container">
      <div className="register-form">
        <h2>Verificação de Conta</h2>
       
        <input
          type="text"
          placeholder="Código de Verificação"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button onClick={verificarCodigo}>Ativar Conta</button>
        {mensagem && <p>{mensagem}</p>}
      </div>
    </div>
  );
};

export default RegisterCodeVerify;

