import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // <- ADICIONADO
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); // <- ativa o loading

    try {
      const response = await fetch('https://luizaclubbackend.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        await fetch('https://luizaclubbackend.onrender.com/api/auth/login/send-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        localStorage.setItem('tempEmail', email);
        alert('✅ Verifique seu e-mail e insira o código.');
        navigate('/LoginCodeVerify');
      } else {
        alert(`❌ Erro: ${data.message}`);
      }
    } catch (error) {
      console.error('Erro ao logar:', error);
      alert('❌ Erro de conexão com o servidor.');
    } finally {
      setLoading(false); // <- desativa o loading
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Login</h2>
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

        <button type="submit" disabled={loading}>
          {loading ? <span className="spinner" /> : 'Entrar'}
        </button>

        <div className="extra-options">
          <a href="/register">Criar Conta</a>
          <a href="#">Esqueceu a Senha ?</a>
        </div>
      </form>
    </div>
  );
};

export default Login;
