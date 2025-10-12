import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ResponsiveLayout from '../Layout/ResponsiveLayout';
import '../GlobalLayout.css';

function Cardapio() {
  const navigate = useNavigate();
  const [itens, setItens] = useState([]);
  const [novoItem, setNovoItem] = useState({
    nome: '',
    valor: '',
    unidades: '',
    variantes: ''
  });

  const API_URL = 'http://localhost:5000/api/produtos';
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        const res = await fetch(API_URL);
        const data = await res.json();
        setItens(data);
      } catch (err) {
        console.error('Erro ao buscar produtos:', err);
      }
    };
    fetchProdutos();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNovoItem({ ...novoItem, [name]: value });
  };

  const handleAdicionarItem = async () => {
    const nome = novoItem.nome.trim();
    const valor = parseFloat(novoItem.valor);
    const unidades = parseInt(novoItem.unidades);

    if (!nome || isNaN(valor) || isNaN(unidades)) {
      alert('Preencha todos os campos corretamente.');
      return;
    }

    const novo = {
      nome,
      valor,
      unidades,
      variantes: novoItem.variantes
        ? novoItem.variantes.split(',').map((v) => v.trim())
        : [],
      userId
    };

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novo)
      });

      const data = await res.json();

      if (res.ok) {
        setItens([data, ...itens]);
        setNovoItem({ nome: '', valor: '', unidades: '', variantes: '' });
      } else {
        console.error('Erro ao salvar:', data);
        alert('Erro ao adicionar produto.');
      }
    } catch (err) {
      console.error('Erro ao adicionar:', err);
    }
  };

  const handleExcluirItem = async (id) => {
    if (!window.confirm('Você tem certeza que deseja excluir este item?')) return;

    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });

      if (res.ok) {
        setItens(itens.filter((item) => item.id !== id));
      } else {
        alert('Erro ao excluir item.');
      }
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
  };

  return (
    <ResponsiveLayout title="Cardápio">
      {/* Formulário de cadastro */}
      <div style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        border: '2px solid #00ff00',
        borderRadius: '12px',
        padding: '25px',
        marginBottom: '30px'
      }}>
        <h2 style={{ 
          color: '#00ff00', 
          marginBottom: '20px',
          fontSize: '22px'
        }}>
          Cadastrar novo item no cardápio
        </h2>

        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '20px'
        }}>
          <input
            type="text"
            name="nome"
            placeholder="Nome do produto"
            value={novoItem.nome}
            onChange={handleChange}
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid #00ff00',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: '#00ff00',
              fontSize: '16px'
            }}
          />
          <input
            type="number"
            name="valor"
            placeholder="Valor (R$)"
            value={novoItem.valor}
            onChange={handleChange}
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid #00ff00',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: '#00ff00',
              fontSize: '16px'
            }}
          />
          <input
            type="number"
            name="unidades"
            placeholder="Unidades"
            value={novoItem.unidades}
            onChange={handleChange}
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid #00ff00',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: '#00ff00',
              fontSize: '16px'
            }}
          />
          <input
            type="text"
            name="variantes"
            placeholder="Variações (separadas por vírgula)"
            value={novoItem.variantes}
            onChange={handleChange}
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid #00ff00',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: '#00ff00',
              fontSize: '16px'
            }}
          />
        </div>
        
        <button 
          className="btn-primary"
          onClick={handleAdicionarItem}
          style={{ width: '100%' }}
        >
          Adicionar Produto
        </button>
      </div>

      {/* Título do estoque */}
      <h3 style={{ 
        color: '#00ff00', 
        fontSize: '24px',
        marginBottom: '20px',
        borderBottom: '2px solid #00ff00',
        paddingBottom: '10px'
      }}>
        Estoque Atual
      </h3>

      {/* Grid responsivo de produtos */}
      <div className="responsive-grid">
        {itens.map((item) => (
          <div key={item.id} className="card">
            <h3 style={{ 
              color: '#00ff00', 
              marginBottom: '15px',
              fontSize: '18px'
            }}>
              {item.nome}
            </h3>
            <p style={{ 
              color: 'white', 
              marginBottom: '8px',
              fontSize: '16px'
            }}>
              <strong>Valor:</strong> R$ {item.valor}
            </p>
            <p style={{ 
              color: 'white', 
              marginBottom: '15px',
              fontSize: '16px'
            }}>
              <strong>Unidades:</strong> {item.unidades}
            </p>
            
            {item.variantes && item.variantes.length > 0 && (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ 
                  color: '#00ff00', 
                  fontWeight: 'bold',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  Variações:
                </label>
                <ul style={{ 
                  color: 'white',
                  paddingLeft: '20px'
                }}>
                  {item.variantes.map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <button
              style={{
                backgroundColor: '#ff4444',
                color: 'white',
                border: 'none',
                padding: '10px 15px',
                borderRadius: '8px',
                cursor: 'pointer',
                width: '100%',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'all 0.3s ease'
              }}
              onClick={() => handleExcluirItem(item.id)}
              onMouseOver={(e) => e.target.style.backgroundColor = '#cc3333'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#ff4444'}
            >
              🗑️ Excluir
            </button>
          </div>
        ))}
      </div>
    </ResponsiveLayout>
  );
}

export default Cardapio;

