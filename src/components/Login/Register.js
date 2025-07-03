import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    console.log('[INFO] Tentando registrar novo usuário:', { username, email });

    if (password !== confirmPassword) {
      alert('❌ As senhas não coincidem!');
      console.warn('[WARN] Senhas diferentes.');
      return;
    }

    try {
      const response = await fetch('https://luizaclubbackend.onrender.com/api/auth/register/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const contentType = response.headers.get('content-type');
      let data = {};

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        console.error('[ERROR] Resposta do servidor não é JSON.');
        throw new Error('Resposta inesperada do servidor');
      }

      console.log('[DEBUG] Resposta do back-end:', data);

      if (response.ok) {
        console.log('[SUCCESS] Código enviado para o e-mail:', email);
        alert('✅ Código enviado ao e-mail! Verifique para ativar sua conta.');

        localStorage.setItem('tempEmail', email); // Salva email para verificação
        navigate('/RegisterCodeVerify');
      } else {
        const msg = data.message || 'Erro desconhecido';
        console.error('[ERROR] Erro ao registrar:', msg);

        if (msg.toLowerCase().includes('email')) {
          alert('❌ Este e-mail já está cadastrado.');
        } else {
          alert(`❌ Erro ao registrar: ${msg}`);
        }
      }
    } catch (error) {
      console.error('[EXCEPTION] Falha na requisição de registro:', error);
      alert('❌ Ocorreu um erro interno. Tente novamente mais tarde.');
    }
  };

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleRegister}>
        <h2>Criar Conta</h2>
        <input
          type="text"
          placeholder="Nome de Usuário"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirme a Senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit">Registrar</button>
      </form>
    </div>
  );
};

export default Register;
