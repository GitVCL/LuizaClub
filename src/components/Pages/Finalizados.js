import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Comandas.css';

const Finalizados = () => {
  const navigate = useNavigate();
  const [comandas, setComandas] = useState([]);
  const [finalizados, setFinalizados] = useState([]);

  useEffect(() => {
    const carregarComandasFinalizadas = async () => {
      try {
        const userId = localStorage.getItem('userId');
        const res = await fetch(`https://luizaclubbackend-production.up.railway.app/api/comandas/${userId}`);
        const data = await res.json();
        const filtradas = data
          .filter(c => c.status === 'finalizada')
          .map(c => ({ ...c, tipo: 'comanda' }));
        setComandas(filtradas);
      } catch (err) {
        console.error('Erro ao carregar comandas finalizadas:', err);
      }
    };

    const carregarQuartosFinalizados = async () => {
      try {
        const userId = localStorage.getItem('userId');
        const res = await fetch(`https://luizaclubbackend-production.up.railway.app/api/finalizados/${userId}`);
        const data = await res.json();
        const comTipo = data.map(q => ({ ...q, tipo: 'quarto' }));
        setFinalizados(comTipo);
      } catch (err) {
        console.error('Erro ao carregar quartos finalizados:', err);
      }
    };

    carregarComandasFinalizadas();
    carregarQuartosFinalizados();
  }, []);

  const todosItens = [...comandas, ...finalizados].sort((a, b) => {
    return new Date(b.encerradaEm) - new Date(a.encerradaEm);
  });

  return (
    <div className="home-containerCOMANDAS">
      <div className="sidebar">
        <button onClick={() => navigate('/comandas')}>Comandas</button>
        
        <button onClick={() => navigate('/cardapio')}>Cardápio</button>
        <button onClick={() => navigate('/relatorio')}>Relatório</button>
        <button onClick={() => navigate('/finalizados')}>Finalizados</button>
        <button onClick={() => navigate('/')}>Logout</button>
         <button onClick={() => window.location.reload()} title="Atualizar" className="botao-atualizar">🔄</button>
      </div>

      <div className="home-content">
        <h2>Finalizados</h2>
        <hr />

        <div className="comandas-grid">
          {todosItens.length === 0 ? (
            <p>Nenhum item finalizado encontrado.</p>
          ) : (
            todosItens.map((item) => (
              <div key={item.id} className="comanda-card">
                <h3>{item.nome}</h3>
                <p>Total: R$ {item.total.toFixed(2)}</p>
                {item.dono && <p>Dono: {item.dono}</p>}
                <p>Encerrado em: {new Date(item.encerradaEm).toLocaleString()}</p>
                <p>Tipo: {item.tipo === 'quarto' ? 'Quarto' : 'Comanda'}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Finalizados;
