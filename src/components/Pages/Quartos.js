import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Quartos.css';

const Quartos = () => {
  const navigate = useNavigate();
  const [funcionarias, setFuncionarias] = useState([]);
  const [quartoAberto, setQuartoAberto] = useState(null);
  const [valorTotal, setValorTotal] = useState(0);
  const [itens, setItens] = useState([]);
  const [novaNome, setNovaNome] = useState('');
  const [criando, setCriando] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  const userId = localStorage.getItem('userId');

  useEffect(() => {
    carregarFuncionarias();
  }, []);

  const carregarFuncionarias = async () => {
    try {
      const res = await fetch(`https://luizaclubbackend.onrender.com/api/quartos/${userId}`);
      const data = await res.json();
      setFuncionarias(data);
    } catch (err) {
      console.error('Erro ao carregar funcionárias:', err);
    }
  };

  const adicionarFuncionario = async () => {
    if (novaNome.trim() === '') return;
    try {
      const res = await fetch('https://luizaclubbackend.onrender.com/api/quartos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          nome: novaNome,
          total: 0,
          itens: [],
        }),
      });
      const data = await res.json();
      setFuncionarias([...funcionarias, data]);
      setNovaNome('');
      setCriando(false);
    } catch (err) {
      console.error('Erro ao adicionar funcionária:', err);
    }
  };

  const excluirFuncionario = async (id) => {
    try {
      await fetch(`https://luizaclubbackend.onrender.com/api/quartos/${id}`, {
        method: 'DELETE',
      });
      setFuncionarias(funcionarias.filter((f) => f._id !== id));
      if (quartoAberto?._id === id) fecharQuarto();
    } catch (err) {
      console.error('Erro ao excluir funcionária:', err);
    }
  };

  const abrirQuarto = (quarto) => {
    setQuartoAberto(quarto);
    setValorTotal(quarto.total || 0);
    setItens(quarto.itens || []);
    setConfirmandoExclusao(false);
  };

  const fecharQuarto = () => {
    setQuartoAberto(null);
    setValorTotal(0);
    setItens([]);
    setConfirmandoExclusao(false);
  };

  const salvarAlteracoes = async () => {
    try {
      await fetch(`https://luizaclubbackend.onrender.com/api/quartos/${quartoAberto._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total: valorTotal,
          itens,
        }),
      });
      carregarFuncionarias(); // Atualiza os cards
    } catch (err) {
      console.error('Erro ao salvar alterações:', err);
    }
  };

  const encerrarQuarto = async () => {
    try {
      await fetch('https://luizaclubbackend.onrender.com/api/finalizados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          nome: quartoAberto.nome,
          total: valorTotal,
          itens,
          tipo: 'quarto',
          createdAt: new Date()
        }),
      });

      await fetch(`https://luizaclubbackend.onrender.com/api/quartos/${quartoAberto._id}`, {
        method: 'DELETE',
      });

      fecharQuarto();
      carregarFuncionarias();
    } catch (err) {
      console.error('Erro ao encerrar o quarto:', err);
    }
  };

  const adicionarQuantidade = (idx) => {
    const novosItens = [...itens];
    novosItens[idx].qtd += 1;
    const novoTotal = valorTotal + novosItens[idx].valorUnit;
    setItens(novosItens);
    setValorTotal(novoTotal);
  };

  const removerItem = (idx) => {
    const itemRemovido = itens[idx];
    const novosItens = itens.filter((_, i) => i !== idx);
    const novoTotal = valorTotal - (itemRemovido.valorUnit * itemRemovido.qtd);
    setItens(novosItens);
    setValorTotal(novoTotal);
  };

  const adicionarItem = async (descricao, valorUnit) => {
    const agora = new Date().toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const novoItem = { descricao, qtd: 1, valorUnit, hora: agora };
    const novosItens = [...itens, novoItem];
    const novoTotal = valorTotal + valorUnit;

    setItens(novosItens);
    setValorTotal(novoTotal);

    try {
      await fetch(`https://luizaclubbackend.onrender.com/api/quartos/${quartoAberto._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total: novoTotal,
          itens: novosItens,
        }),
      });
    } catch (err) {
      console.error('Erro ao salvar no banco:', err);
    }
  };

  const programasTotal = itens.reduce((sum, item) => sum + item.qtd, 0);

  const exportarPDF = () => {
    const printContent = document.getElementById('nota-pdf');
    if (!printContent) return alert('Nota não encontrada.');

    printContent.style.display = 'block';
    const originalContent = document.body.innerHTML;
    const contentToPrint = printContent.innerHTML;
    document.body.innerHTML = contentToPrint;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  const confirmarExclusao = () => {
    setConfirmandoExclusao(true);
  };

  return (
    <div className="home-containerQUARTOS">
      <div className="RELATORIO-sidebar">
        <button onClick={() => navigate('/comandas')}>Comandas</button>
        <button onClick={() => navigate('/quartos')}>Quartos</button>
        <button onClick={() => navigate('/cardapio')}>Cardápio</button>
        <button onClick={() => navigate('/relatorio')}>Relatório</button>
        <button onClick={() => navigate('/finalizados')}>Finalizados</button>
        <button onClick={() => navigate('/')}>Logout</button>
      </div>

      <div className="home-contentQUARTOS">
        <div className="comandas-headerQUARTOS">
          <h1></h1>
          {!criando ? (
            <button onClick={() => setCriando(true)}>+ Adicionar Funcionária</button>
          ) : (
            <div className="input-nova-comanda">
              <label>Nome:</label>
              <input
                type="text"
                value={novaNome}
                onChange={(e) => setNovaNome(e.target.value)}
                placeholder="Digite o nome"
              />
              <button onClick={adicionarFuncionario}>Confirmar</button>
              <button onClick={() => setCriando(false)}>Cancelar</button>
            </div>
          )}
        </div>

        <div className="comandas-gridQUARTOS">
          {funcionarias.map((f) => (
            <div key={f._id} className="comanda-cardQUARTOS">
              <h3>{f.nome}</h3>
              <p>Total: R$ {f.total.toFixed(2)}</p>
              <button onClick={() => abrirQuarto(f)}>Abrir</button>
            </div>
          ))}
        </div>
      </div>

      {quartoAberto && (
        <div className="modal-overlayQUARTOS" onClick={fecharQuarto}>
          <div className="modal-comandaQUARTOS" onClick={(e) => e.stopPropagation()}>
            <h2>{quartoAberto.nome}</h2>

            <div className="info-topo-comandaQUARTOS">
              <span><strong>Valor Total:</strong> R$ {valorTotal.toFixed(2)}</span>
              <span><strong>Programas:</strong> {programasTotal}</span>
            </div>

            <div className="tabela-itensQUARTOS">
              <table>
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th>Qtd.</th>
                    <th>Total / Hora</th>
                    <th style={{ width: '80px' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.descricao}</td>
                      <td>{item.qtd}</td>
                      <td>
                        R$ {(item.valorUnit * item.qtd).toFixed(2)}<br />
                        <small style={{ color: 'lime' }}>{item.hora}</small>
                      </td>
                      <td>
                        <button onClick={() => adicionarQuantidade(idx)}>+</button>
                        <button onClick={() => removerItem(idx)}>🗑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="botoes-comandaQUARTOS">
              <button onClick={() => adicionarItem("20 minutos", 100)}>20 minutos</button>
              <button onClick={() => adicionarItem("40 minutos", 150)}>40 minutos</button>
              <button onClick={() => adicionarItem("60 minutos", 200)}>60 minutos</button>
              <button onClick={() => adicionarItem("20 minutos pix pra ela", -50)}>20 minutos pix pra ela</button>
              <button onClick={() => adicionarItem("40 minutos pix pra ela", -50)}>40 minutos pix pra ela</button>
              <button onClick={() => adicionarItem("60 minutos pix pra ela", -100)}>60 minutos pix pra ela</button>
              <button onClick={salvarAlteracoes}>💾 Salvar</button>
              <button onClick={exportarPDF}>Imprimir</button>
              <button onClick={encerrarQuarto} style={{ backgroundColor: '#444', color: '#fff' }}>
                Salvar e Encerrar
              </button>

              {!confirmandoExclusao ? (
                <button onClick={confirmarExclusao} style={{ backgroundColor: 'red' }}>Excluir</button>
              ) : (
                <>
                  <button onClick={() => excluirFuncionario(quartoAberto._id)} style={{ backgroundColor: 'red' }}>TEM CERTEZA? SIM</button>
                  <button onClick={() => setConfirmandoExclusao(false)}>NÃO</button>
                </>
              )}

              <button className="fechar-btnQUARTOS" onClick={fecharQuarto}>X</button>

              <div style={{ display: 'none' }} id="nota-pdf">
                <div style={{ width: '80mm', padding: '10px', fontSize: '12px' }}>
                  <h3 style={{ textAlign: 'center' }}>{quartoAberto?.nome}</h3>
                  <p><strong>Programas:</strong> {programasTotal}</p>
                  <table style={{ width: '100%', marginTop: '10px' }}>
                    <thead>
                      <tr>
                        <th>Desc</th>
                        <th>Qtd</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itens.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.descricao}</td>
                          <td>{item.qtd}</td>
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
    </div>
  );
};

export default Quartos;
