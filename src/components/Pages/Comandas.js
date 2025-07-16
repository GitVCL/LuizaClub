import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Comandas.css';
import html2pdf from 'html2pdf.js'; // no topo do arquivo

const Comandas = () => {
  const navigate = useNavigate();
  const [comandas, setComandas] = useState([]);
  const [comandaAberta, setComandaAberta] = useState(null);
  const [valorTotal, setValorTotal] = useState(0);
  const [itens, setItens] = useState([]);
  const [dono, setDono] = useState('');
  const [criando, setCriando] = useState(false);
  const [numeroComanda, setNumeroComanda] = useState('');
  const [produtos, setProdutos] = useState([]);
  const [modalExcluir, setModalExcluir] = useState(false);


  useEffect(() => {
    carregarComandas();
    carregarProdutos();
  }, []);

  const carregarComandas = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const res = await fetch(`https://luizaclubbackend-production.up.railway.app/api/comandas/${userId}`);
      const data = await res.json();
      setComandas(data.filter(c => c.status !== 'finalizada'));
    } catch (err) {
      console.error('Erro ao carregar comandas:', err);
    }
  };

  const carregarProdutos = async () => {
    try {
      const res = await fetch(`https://luizaclubbackend-production.up.railway.app/api/produtos`);
      const data = await res.json();
      setProdutos(data);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
    }
  };

  const criarComanda = async (numero) => {
    const userId = localStorage.getItem('userId');
    const nova = {
      nome: `Comanda #${numero}`,
      itens: [],
      total: 0,
      dono: '',
      userId,
      status: 'aberta',
      criadaEm: new Date()
    };

    try {
      const res = await fetch('https://luizaclubbackend-production.up.railway.app/api/comandas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nova),
      });

      const data = await res.json();
      setComandas([...comandas, data]);
    } catch (err) {
      console.error('Erro ao criar comanda:', err);
    }
  };

  const abrirComanda = (comanda) => {
    setComandaAberta(comanda);
    setValorTotal(comanda.total || 0);
    setItens(comanda.itens || []);
    setDono(comanda.dono || '');
  };

  const fecharComanda = () => {
    setComandaAberta(null);
    setValorTotal(0);
    setItens([]);
    setDono('');
  };

  const salvarComandaNoBanco = async (comanda) => {
    try {
      await fetch(`https://luizaclubbackend-production.up.railway.app/api/comandas/${comanda.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comanda),
      });
    } catch (err) {
      console.error('Erro ao salvar comanda:', err);
    }
  };

  const salvarEEncerrar = async () => {
    const confirmar = window.confirm("Você tem certeza que deseja encerrar essa comanda?");
    if (!confirmar) return;

    const comFinalizada = {
      ...comandaAberta,
      itens,
      total: valorTotal,
      dono,
      status: 'finalizada',
      encerradaEm: new Date()
    };

    try {
      await fetch(`https://luizaclubbackend-production.up.railway.app/api/comandas/${comFinalizada.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comFinalizada)
      });

      const atualizadas = comandas.filter(c => c.id !== comFinalizada.id);
      setComandas(atualizadas);
      fecharComanda();
    } catch (err) {
      console.error('Erro ao encerrar comanda:', err);
    }
  };

  const adicionarItem = (produto) => {
    const itemExistente = itens.find(item => item.descricao === produto.nome);
    let novosItens;

    if (itemExistente) {
      novosItens = itens.map(item =>
        item.descricao === produto.nome
          ? { ...item, qtd: item.qtd + 1 }
          : item
      );
    } else {
      novosItens = [...itens, {
        descricao: produto.nome,
        qtd: 1,
        valorUnit: produto.valor
      }];
    }

    const novoTotal = novosItens.reduce((acc, item) => acc + item.qtd * item.valorUnit, 0);
    setItens(novosItens);
    setValorTotal(novoTotal);

    const comAtualizada = { ...comandaAberta, itens: novosItens, total: novoTotal };
    setComandaAberta(comAtualizada);
    setComandas(comandas.map(c => c.id === comAtualizada.id ? comAtualizada : c));
    salvarComandaNoBanco(comAtualizada);
  };

  const adicionarQuantidade = (idx) => {
    const novosItens = [...itens];
    novosItens[idx].qtd += 1;
    const novoTotal = valorTotal + novosItens[idx].valorUnit;
    setItens(novosItens);
    setValorTotal(novoTotal);
    const comAtualizada = { ...comandaAberta, itens: novosItens, total: novoTotal };
    setComandaAberta(comAtualizada);
    setComandas(comandas.map(c => c.id === comAtualizada.id ? comAtualizada : c));
    salvarComandaNoBanco(comAtualizada);
  };

  const removerQuantidade = (idx) => {
    const novosItens = [...itens];
    if (novosItens[idx].qtd > 1) {
      novosItens[idx].qtd -= 1;
      const novoTotal = valorTotal - novosItens[idx].valorUnit;
      setItens(novosItens);
      setValorTotal(novoTotal);
      const comAtualizada = { ...comandaAberta, itens: novosItens, total: novoTotal };
      setComandaAberta(comAtualizada);
      setComandas(comandas.map(c => c.id === comAtualizada.id ? comAtualizada : c));
      salvarComandaNoBanco(comAtualizada);
    } else {
      removerItem(idx);
    }
  };

  const removerItem = (idx) => {
    const itemRemovido = itens[idx];
    const novosItens = itens.filter((_, i) => i !== idx);
    const novoTotal = valorTotal - (itemRemovido.valorUnit * itemRemovido.qtd);
    setItens(novosItens);
    setValorTotal(novoTotal);
    const comAtualizada = { ...comandaAberta, itens: novosItens, total: novoTotal };
    setComandaAberta(comAtualizada);
    setComandas(comandas.map(c => c.id === comAtualizada.id ? comAtualizada : c));
    salvarComandaNoBanco(comAtualizada);
  };

  const adicionar10PorCento = () => {
  const taxa = valorTotal * 0.10;
  const novosItens = [...itens, {
    descricao: 'Serviço',
    qtd: 1,
    valorUnit: taxa
  }];
  const novoTotal = valorTotal + taxa;

  setItens(novosItens);
  setValorTotal(novoTotal);

  const comAtualizada = { ...comandaAberta, itens: novosItens, total: novoTotal };
  setComandaAberta(comAtualizada);
  setComandas(comandas.map(c => c.id === comAtualizada.id ? comAtualizada : c));
  salvarComandaNoBanco(comAtualizada);
};


const exportarPDF = () => {
  const printContent = document.getElementById('nota-pdf');
  if (!printContent) return alert('Comanda não encontrada.');

  printContent.style.display = 'block';

  const originalContent = document.body.innerHTML;
  const contentToPrint = printContent.innerHTML;

  document.body.innerHTML = contentToPrint;
  window.print();

  // após imprimir, restaura o conteúdo original
  document.body.innerHTML = originalContent;
  window.location.reload(); // recarrega pra evitar bugs de estado
};


  const atualizarDono = (novoNome) => {
    setDono(novoNome);
    const comAtualizada = { ...comandaAberta, dono: novoNome };
    setComandaAberta(comAtualizada);
    setComandas(comandas.map(c => c.id === comAtualizada.id ? comAtualizada : c));
    salvarComandaNoBanco(comAtualizada);
  };

  const confirmarExclusaoComanda = () => {
  setModalExcluir(true);
};

const excluirComandaConfirmada = async () => {
  if (!comandaAberta) return;

  try {
    await fetch(`https://luizaclubbackend-production.up.railway.app/api/comandas/${comandaAberta.id}`, {
      method: 'DELETE'
    });

    const atualizadas = comandas.filter(c => c.id !== comandaAberta.id);
    setComandas(atualizadas);
    fecharComanda();
    setModalExcluir(false);
  } catch (err) {
    console.error('Erro ao excluir comanda:', err);
  }
};


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
        <div className="comandas-header">
          {!criando ? (
            <button onClick={() => setCriando(true)}>+ Nova Comanda</button>
          ) : (
            <div className="input-nova-comanda">
              <label>QUAL NÚMERO DA COMANDA:</label>
              <input
                type="text"
                value={numeroComanda}
                onChange={(e) => setNumeroComanda(e.target.value)}
                placeholder="Ex: 12"
              />
              <button onClick={() => {
                if (numeroComanda.trim() !== '') {
                  criarComanda(numeroComanda);
                  setNumeroComanda('');
                  setCriando(false);
                }
              }}>Confirmar</button>
              <button onClick={() => setCriando(false)}>Cancelar</button>
            </div>
          )}
        </div>

        <div className="comandas-grid">
          {comandas.map((c) => (
            <div key={c.id} className="comanda-card">
              <h3>{c.nome}</h3>
              <p>Total: R$ {c.total.toFixed(2)}</p>
              <p>Dono: {c.dono || '---'}</p>
              <button onClick={() => abrirComanda(c)}>Abrir</button>
            </div>
          ))}
        </div>
      </div>

      {comandaAberta && (
        <div className="modal-overlay" onClick={fecharComanda}>
          <div className="modal-comanda" onClick={(e) => e.stopPropagation()}>
            <h2>{comandaAberta.nome}</h2>
                  <h1></h1>
            <div className="adicionar-item-container">
              <label>Adicionar item:</label>
              <select onChange={(e) => adicionarItem(JSON.parse(e.target.value))}>
                <option value="">Selecione</option>
                {produtos.map((p) => (
                  <option key={p.id} value={JSON.stringify(p)}>
                    {p.nome} - R$ {p.valor}
                  </option>
                ))}
              </select>
            </div>

            <div className="info-topo-comanda">
              <span><strong>Valor Total:</strong> R$ {valorTotal.toFixed(2)}</span>
              <span>
                <strong>Dono:</strong>
                <input
                  className="input-dono"
                  value={dono}
                  onChange={(e) => atualizarDono(e.target.value)}
                />
              </span>
            </div>

            <div className="tabela-itens">
              <table>
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th>Qtd.</th>
                    <th>Vr. Unitário</th>
                    <th>Total</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.descricao}</td>
                      <td>{item.qtd}</td>
                      <td>R$ {item.valorUnit.toFixed(2)}</td>
                      <td>R$ {(item.valorUnit * item.qtd).toFixed(2)}</td>
                      <td>
                        <button onClick={() => adicionarQuantidade(idx)}>+</button>
                        <button onClick={() => removerQuantidade(idx)}>-</button>
                        <button className="btn-trash" onClick={() => removerItem(idx)}>🗑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="botoes-comanda">
              <button onClick={adicionar10PorCento}>Serviço Garçom</button>
              <button onClick={exportarPDF}>Imprimir</button>
              <button className="excluir" onClick={confirmarExclusaoComanda}>Excluir</button>
              <button className="encerrar-btn" onClick={salvarEEncerrar}>Salvar e Encerrar</button>
              <button className="fechar-btn" onClick={fecharComanda}>X</button>

          <div style={{ display: 'none' }} id="nota-pdf">
  <div style={{ width: '80mm', padding: '10px', fontSize: '12px' }}>
    <h3 style={{ textAlign: 'center' }}>{comandaAberta?.nome}</h3>
    <p><strong>Dono:</strong> {dono || '---'}</p>
    <table style={{ width: '100%', marginTop: '10px' }}>
      <thead>
        <tr>
          <th>Desc</th>
          <th>Qtd</th>
          <th>V. Unit</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        {itens.map((item, idx) => (
          <tr key={idx}>
            <td>{item.descricao}</td>
            <td>{item.qtd}</td>
            <td>R$ {item.valorUnit.toFixed(2)}</td>
            <td>R$ {(item.valorUnit * item.qtd).toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <p style={{ marginTop: '10px', fontWeight: 'bold' }}>Total: R$ {valorTotal.toFixed(2)}</p>
    <p style={{ fontSize: '10px', textAlign: 'center', marginTop: '10px' }}>Obrigado pela preferência!</p>
  </div>
</div>

            </div>
          </div>
        </div>
      )}
            {modalExcluir && (
            <div className="modal-overlay" onClick={() => setModalExcluir(false)}>
              <div className="modal-comanda" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
                <h3>Deseja realmente excluir esta comanda?</h3>
                <button className="encerrar-btn" onClick={excluirComandaConfirmada}>Sim</button>
                <button className="fechar-btn" onClick={() => setModalExcluir(false)}>Não</button>
              </div>
            </div>
          )}

    </div>
  );
};
  
export default Comandas;
