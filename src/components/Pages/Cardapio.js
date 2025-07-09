import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Cardapio.css';

function Cardapio() {
  const navigate = useNavigate();
  const [itens, setItens] = useState([]);
  const [novoItem, setNovoItem] = useState({
    nome: '',
    valor: '',
    unidades: '',
    variantes: ''
  });

  const API_URL = 'https://luizaclubbackend-production.up.railway.app/api/produtos';
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
    <div className="CARDAPIO-container">
      <div className="sidebar">
        <button onClick={() => navigate('/comandas')}>Comandas</button>
        <button onClick={() => navigate('/cardapio')}>Cardápio</button>
        <button onClick={() => navigate('/relatorio')}>Relatório</button>
        <button onClick={() => navigate('/finalizados')}>Finalizados</button>
        <button onClick={() => navigate('/')}>Logout</button>
      </div>

      <div className="CARDAPIO-content">
        <h2 className="CARDAPIO-titulo">Cadastrar novo item no cardápio</h2>

        <div className="CARDAPIO-form">
          <input
            type="text"
            name="nome"
            placeholder="Nome do produto"
            value={novoItem.nome}
            onChange={handleChange}
          />
          <input
            type="number"
            name="valor"
            placeholder="Valor (R$)"
            value={novoItem.valor}
            onChange={handleChange}
          />
          <input
            type="number"
            name="unidades"
            placeholder="Unidades"
            value={novoItem.unidades}
            onChange={handleChange}
          />
          <input
            type="text"
            name="variantes"
            placeholder="Variações (separadas por vírgula)"
            value={novoItem.variantes}
            onChange={handleChange}
          />
          <button onClick={handleAdicionarItem}>Adicionar Produto</button>
        </div>

        <h3 className="CARDAPIO-subtitulo">Estoque Atual</h3>

        <div className="CARDAPIO-scroll">
          {itens.map((item) => (
            <div key={item.id} className="CARDAPIO-item-card">
              <h3>{item.nome}</h3>
              <p>Valor: R$ {item.valor}</p>
              <p>Unidades: {item.unidades}</p>
              {item.variantes && item.variantes.length > 0 && (
                <div className="CARDAPIO-variantes">
                  <label>Variações:</label>
                  <ul>
                    {item.variantes.map((v, i) => (
                      <li key={i}>{v}</li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                className="CARDAPIO-excluir-btn"
                onClick={() => handleExcluirItem(item.id)}
              >
                🗑️ Excluir
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Cardapio;
