import React, { useState, useEffect } from 'react';
import ResponsiveLayout from '../Layout/ResponsiveLayout';
import '../GlobalLayout.css';

function Cardapio() {
  const [itens, setItens] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [novoItem, setNovoItem] = useState({
    nome: '',
    valor: '',
    unidades: '',
    variantes: '',
    comissionado: false
  });

  const API_URL = `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000'}/api/produtos`;
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        const url = userId ? `${API_URL}?userId=${userId}` : API_URL;
        console.log('Buscando produtos de:', url);
        const res = await fetch(url);
        const data = await res.json();
        if (Array.isArray(data)) {
          setItens(data);
        } else {
          console.error('Resposta da API não é uma lista:', data);
          setItens([]);
        }
      } catch (err) {
        console.error('Erro ao buscar produtos:', err);
        setItens([]);
      }
    };
    fetchProdutos();
  }, [userId, API_URL]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNovoItem({ 
      ...novoItem, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleAdicionarItem = async () => {
    const nome = novoItem.nome.trim();
    const valor = parseFloat(novoItem.valor);
    const unidades = parseInt(novoItem.unidades);

    if (!nome || isNaN(valor) || isNaN(unidades)) {
      alert('Preencha todos os campos corretamente.');
      return;
    }

    const payload = {
      nome,
      valor,
      unidades,
      variantes: novoItem.variantes
        ? (Array.isArray(novoItem.variantes) ? novoItem.variantes : novoItem.variantes.split(',').map((v) => v.trim()))
        : [],
      comissionado: novoItem.comissionado,
      userId
    };

    try {
      const method = editandoId ? 'PUT' : 'POST';
      const url = editandoId ? `${API_URL}/${editandoId}` : API_URL;

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        if (editandoId) {
          setItens(itens.map(item => item.id === editandoId ? data : item));
          setEditandoId(null);
          alert('Produto atualizado com sucesso!');
        } else {
          setItens([data, ...itens]);
          alert('Produto adicionado com sucesso!');
        }
        
        setNovoItem({ 
          nome: '', 
          valor: '', 
          unidades: '', 
          variantes: '',
          comissionado: false 
        });
      } else {
        console.error('Erro ao salvar:', data);
        alert('Erro ao salvar produto.');
      }
    } catch (err) {
      console.error('Erro ao processar:', err);
    }
  };

  const handleEditarItem = (item) => {
    setEditandoId(item.id);
    setNovoItem({
      nome: item.nome,
      valor: item.valor,
      unidades: item.unidades,
      variantes: Array.isArray(item.variantes) ? item.variantes.join(', ') : '',
      comissionado: !!item.comissionado
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setNovoItem({ 
      nome: '', 
      valor: '', 
      unidades: '', 
      variantes: '',
      comissionado: false 
    });
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
          {editandoId ? 'Editar item do cardápio' : 'Cadastrar novo item no cardápio'}
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
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            color: '#00ff00' 
          }}>
            <input
              type="checkbox"
              name="comissionado"
              checked={novoItem.comissionado}
              onChange={handleChange}
              id="comissionado-check"
              style={{ width: '20px', height: '20px' }}
            />
            <label htmlFor="comissionado-check">Produto com comissão?</label>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn-primary"
            onClick={handleAdicionarItem}
            style={{ flex: 2 }}
          >
            {editandoId ? 'Salvar Alterações' : 'Adicionar Produto'}
          </button>
          
          {editandoId && (
            <button 
              className="btn-secondary"
              onClick={cancelarEdicao}
              style={{ flex: 1 }}
            >
              Cancelar
            </button>
          )}
        </div>
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
        {Array.isArray(itens) && itens.map((item) => (
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
            
            {item.comissionado && (
              <p style={{ 
                color: '#ffff00', 
                fontWeight: 'bold', 
                fontSize: '14px',
                marginBottom: '15px'
              }}>
                💰 Produto Comissionado
              </p>
            )}
            
            {Array.isArray(item.variantes) && item.variantes.length > 0 && (
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
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                style={{
                  backgroundColor: '#00ff00',
                  color: 'black',
                  border: 'none',
                  padding: '10px 15px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  flex: 1,
                  fontSize: '16px',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => handleEditarItem(item)}
                onMouseOver={(e) => e.target.style.backgroundColor = '#00cc00'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#00ff00'}
              >
                ✏️ Editar
              </button>
              
              <button
                style={{
                  backgroundColor: '#ff4444',
                  color: 'white',
                  border: 'none',
                  padding: '10px 15px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  flex: 1,
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
          </div>
        ))}
      </div>
    </ResponsiveLayout>
  );
}

export default Cardapio;

