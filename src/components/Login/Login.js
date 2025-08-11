import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [manterLogado, setManterLogado] = useState(false);
  const navigate = useNavigate();

  // Verificar se já está logado ao carregar
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const manterLogadoSalvo = localStorage.getItem('manterLogado');
    
    if (userId && manterLogadoSalvo === 'true') {
      navigate('/comandas');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('https://luizaclubbackend-production.up.railway.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha: password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('userId', data.userId);
        
        // Salvar preferência "manter logado"
        if (manterLogado) {
          localStorage.setItem('manterLogado', 'true');
        } else {
          localStorage.removeItem('manterLogado');
        }
        
        alert('✅ Login realizado com sucesso!');
        navigate('/comandas');
      } else {
        alert(`❌ Erro: ${data.message || 'Falha no login.'}`);
      }
    } catch (error) {
      console.error('Erro ao logar:', error);
      alert('❌ Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
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
        
        <div className="manter-logado">
          <input
            type="checkbox"
            id="manterLogado"
            checked={manterLogado}
            onChange={(e) => setManterLogado(e.target.checked)}
          />
          <label htmlFor="manterLogado">Manter logado</label>
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? <span className="spinner" /> : 'Entrar'}
        </button>

        <div className="extra-options">
          
        </div>
      </form>
    </div>
  );
};

export default Login;
