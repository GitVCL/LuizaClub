import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    username: 'Nome Exemplo',
    email: 'exemplo@email.com',
    createdAt: '2024-01-01',
  });
  const [editingField, setEditingField] = useState('');
  const [fieldValue, setFieldValue] = useState('');

  useEffect(() => {
    // Aqui futuramente você pode buscar os dados reais do usuário no backend
  }, []);

  const handleLogout = () => {
    alert('🔒 Logout efetuado!');
    navigate('/');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  const handleEdit = (field) => {
    setEditingField(field);
    setFieldValue(user[field]);
  };

  const handleSave = () => {
    setUser({ ...user, [editingField]: fieldValue });
    setEditingField('');
    alert('✅ Dados atualizados (simulação)');
  };

  return (
    <div className="profile-container">
      <div className="sidebar">

          <button onClick={() => navigate('/home')}>Início</button>      
        <button onClick={() => navigate('/profile')}>Perfil</button>
         <button onClick={() => navigate('/settings')}>Settings</button>
        <button onClick={handleLogout}>Logout</button>


      </div>

      <div className="profile-content">
        <h2>👤 Meu Perfil</h2>

        <div className="profile-item">
          <span>Nome de Usuário:</span>
          {editingField === 'username' ? (
            <>
              <input
                type="text"
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value)}
              />
              <button onClick={handleSave}>Salvar</button>
            </>
          ) : (
            <>
              <strong>{user.username}</strong>
              <button onClick={() => handleEdit('username')}>Alterar</button>
            </>
          )}
        </div>

        <div className="profile-item">
          <span>Email:</span>
          {editingField === 'email' ? (
            <>
              <input
                type="email"
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value)}
              />
              <button onClick={handleSave}>Salvar</button>
            </>
          ) : (
            <>
              <strong>{user.email}</strong>
              <button onClick={() => handleEdit('email')}>Alterar</button>
            </>
          )}
        </div>

        <div className="profile-item">
          <span>Data de Criação:</span>
          <strong>{user.createdAt}</strong>
        </div>
      </div>
    </div>
  );
};

export default Profile;

