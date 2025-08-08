import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ResponsiveLayout from '../Layout/ResponsiveLayout';
import '../GlobalLayout.css';
import ProductSearch from '../ProductSearch';
import html2pdf from 'html2pdf.js';

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
  if (!comandaAberta) return alert('Comanda não encontrada.');

  // Cria uma nova janela para impressão
  const printWindow = window.open('', '_blank');
  
  // Conteúdo HTML para a nova janela
  const printHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Comanda - ${comandaAberta?.nome}</title>
      <style>
        @page {
          size: 80mm auto;
          margin: 0;
        }
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 3mm;
          width: 80mm;
          max-width: 80mm;
          font-size: 12px;
          text-align: center;
          color: black;
          background: white;
        }
        .nota-container {
          width: 80mm;
          max-width: 300px;
          margin: 0 auto;
        }
        h3 {
          text-align: center;
          font-size: 16px;
          margin-bottom: 10px;
          font-weight: bold;
        }
        p {
          font-size: 10px;
          margin-bottom: 8px;
          text-align: center;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 5px;
          font-size: 10px;
        }
        th, td {
          padding: 1px 2px;
          font-size: 10px;
          line-height: 1.0;
          border: none;
        }
        th:first-child, td:first-child {
          text-align: left;
          width: 40%;
        }
        th:nth-child(2), td:nth-child(2) {
          text-align: center;
          width: 15%;
        }
        th:nth-child(3), td:nth-child(3) {
          text-align: right;
          width: 20%;
        }
        th:last-child, td:last-child {
          text-align: right;
          width: 25%;
        }
        th {
          font-weight: bold;
          border-bottom: 1px solid #000;
        }
        .total {
          margin-top: 8px;
          font-weight: bold;
          font-size: 14px;
          text-align: right;
          border-top: 1px solid #000;
          padding-top: 5px;
        }
        .footer {
          font-size: 8px;
          text-align: center;
          margin-top: 10px;
          font-style: italic;
        }
        @media print {
          body { margin: 0; }
          .nota-container { width: 100%; max-width: none; }
        }
      </style>
    </head>
    <body>
      <div class="nota-container">
         <h3>${comandaAberta?.nome}</h3>
        <table>
          <thead>
            <tr>
              <th>Desc</th>
              <th>Qtd</th>
              <th>V. Unit</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${itens.map(item => `
              <tr>
                <td>${item.descricao}</td>
                <td style="text-align: center">${item.qtd}</td>
                <td style="text-align: right">R$ ${item.valorUnit.toFixed(2)}</td>
                <td style="text-align: right">R$ ${(item.valorUnit * item.qtd).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total">Total: R$ ${valorTotal.toFixed(2)}</div>
        <div class="footer">Obrigado pela preferência!</div>
      </div>
    </body>
    </html>
  `;

  // Escreve o conteúdo na nova janela
  printWindow.document.write(printHTML);
  printWindow.document.close();
  
  // Aguarda o carregamento e imprime
  printWindow.onload = () => {
    printWindow.print();
    printWindow.close();
  };
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
    <ResponsiveLayout title="Comandas">
      <>
        {/* Header com botão de nova comanda */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '25px',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        {!criando ? (
          <button 
            className="btn-primary"
            onClick={() => setCriando(true)}
          >
            + Nova Comanda
          </button>
        ) : (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            <label style={{ color: '#00ff00', fontWeight: 'bold' }}>
              QUAL NÚMERO DA COMANDA:
            </label>
            <input
              type="text"
              value={numeroComanda}
              onChange={(e) => setNumeroComanda(e.target.value)}
              placeholder="Ex: 12"
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '2px solid #00ff00',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: '#00ff00',
                minWidth: '120px'
              }}
            />
            <button 
              className="btn-primary"
              onClick={() => {
                if (numeroComanda.trim() !== '') {
                  criarComanda(numeroComanda);
                  setNumeroComanda('');
                  setCriando(false);
                }
              }}
            >
              Confirmar
            </button>
            <button 
              className="btn-secondary"
              onClick={() => setCriando(false)}
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* Grid de comandas responsivo */}
      <div className="responsive-grid">
        {comandas.map((c) => (
          <div key={c.id} className="card">
            <h3 style={{ 
              margin: '0 0 15px', 
              fontSize: '20px',
              color: '#00ff00'
            }}>
              {c.nome}
            </h3>
            <p style={{ 
              fontSize: '16px', 
              marginBottom: '10px',
              color: 'white'
            }}>
              <strong>Total:</strong> R$ {c.total.toFixed(2)}
            </p>
            <p style={{ 
              fontSize: '16px', 
              marginBottom: '15px',
              color: 'white'
            }}>
              <strong>Dono:</strong> {c.dono || '---'}
            </p>
            <button 
              className="btn-primary"
              onClick={() => abrirComanda(c)}
              style={{ width: '100%' }}
            >
              Abrir
            </button>
          </div>
        ))}
      </div>

      {comandaAberta && (
        <div className="modal-overlay" onClick={fecharComanda}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ 
            width: '95vw', 
            maxWidth: '1000px',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '20px',
            backgroundColor: '#1a1a2e',
            border: '2px solid #00ff00',
            borderRadius: '12px'
          }}>
            {/* Header da Comanda */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '25px',
              paddingBottom: '15px',
              borderBottom: '2px solid #00ff00'
            }}>
              <h2 style={{ 
                margin: 0, 
                color: '#00ff00', 
                fontSize: 'clamp(20px, 4vw, 28px)',
                fontWeight: 'bold'
              }}>
                {comandaAberta.nome}
              </h2>
              <button 
                onClick={fecharComanda}
                style={{
                  background: '#ff4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  fontSize: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            {/* Seção Adicionar Item */}
            <div style={{
              marginBottom: '25px',
              padding: '20px',
              backgroundColor: 'rgba(0, 255, 0, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(0, 255, 0, 0.3)'
            }}>
              <label style={{ 
                color: '#00ff00', 
                fontWeight: 'bold',
                marginBottom: '12px',
                display: 'block',
                fontSize: '16px'
              }}>
                Adicionar item:
              </label>
              <ProductSearch 
                produtos={produtos} 
                onAddProduct={adicionarItem}
              />
            </div>

            {/* Info Topo - Valor Total */}
            <div style={{
              marginBottom: '25px',
              padding: '20px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}>
                <span style={{ 
                  color: '#00ff00', 
                  fontWeight: 'bold',
                  fontSize: '18px'
                }}>
                  Valor Total:
                </span>
                <span style={{ 
                  color: 'white', 
                  fontSize: '20px',
                  fontWeight: 'bold'
                }}>
                  R$ {valorTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Tabela de Itens - Responsiva */}
            <div style={{
              marginBottom: '25px',
              overflowX: 'auto',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              border: '1px solid rgba(0, 255, 0, 0.3)'
            }}>
              {window.innerWidth <= 768 ? (
                // Layout Mobile - Cards
                <div style={{ padding: '15px' }}>
                  {itens.map((item, idx) => (
                    <div key={idx} style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.4)',
                      padding: '15px',
                      marginBottom: '15px',
                      borderRadius: '8px',
                      border: '1px solid rgba(0, 255, 0, 0.2)'
                    }}>
                      <div style={{ 
                        color: '#00ff00', 
                        fontWeight: 'bold', 
                        marginBottom: '10px',
                        fontSize: '16px'
                      }}>
                        {item.descricao}
                      </div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '10px',
                        marginBottom: '15px',
                        color: 'white'
                      }}>
                        <div><strong>Qtd:</strong> {item.qtd}</div>
                        <div><strong>Unit:</strong> R$ {item.valorUnit.toFixed(2)}</div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <strong>Total:</strong> R$ {(item.valorUnit * item.qtd).toFixed(2)}
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        justifyContent: 'center'
                      }}>
                        <button 
                          onClick={() => adicionarQuantidade(idx)}
                          style={{
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: 'bold'
                          }}
                        >
                          +
                        </button>
                        <button 
                          onClick={() => removerQuantidade(idx)}
                          style={{
                            background: '#ffc107',
                            color: 'black',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: 'bold'
                          }}
                        >
                          -
                        </button>
                        <button 
                          onClick={() => removerItem(idx)}
                          style={{
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            fontSize: '16px'
                          }}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Layout Desktop - Tabela
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  fontSize: '14px'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(0, 255, 0, 0.1)' }}>
                      <th style={{ 
                        padding: '12px 8px', 
                        color: '#00ff00', 
                        fontWeight: 'bold',
                        textAlign: 'left',
                        borderBottom: '2px solid #00ff00'
                      }}>
                        Descrição
                      </th>
                      <th style={{ 
                        padding: '12px 8px', 
                        color: '#00ff00', 
                        fontWeight: 'bold',
                        textAlign: 'center',
                        borderBottom: '2px solid #00ff00'
                      }}>
                        Qtd.
                      </th>
                      <th style={{ 
                        padding: '12px 8px', 
                        color: '#00ff00', 
                        fontWeight: 'bold',
                        textAlign: 'right',
                        borderBottom: '2px solid #00ff00'
                      }}>
                        Vr. Unitário
                      </th>
                      <th style={{ 
                        padding: '12px 8px', 
                        color: '#00ff00', 
                        fontWeight: 'bold',
                        textAlign: 'right',
                        borderBottom: '2px solid #00ff00'
                      }}>
                        Total
                      </th>
                      <th style={{ 
                        padding: '12px 8px', 
                        color: '#00ff00', 
                        fontWeight: 'bold',
                        textAlign: 'center',
                        borderBottom: '2px solid #00ff00'
                      }}>
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {itens.map((item, idx) => (
                      <tr key={idx} style={{ 
                        borderBottom: '1px solid rgba(0, 255, 0, 0.2)',
                        '&:hover': { backgroundColor: 'rgba(0, 255, 0, 0.05)' }
                      }}>
                        <td style={{ 
                          padding: '12px 8px', 
                          color: 'white',
                          fontWeight: '500'
                        }}>
                          {item.descricao}
                        </td>
                        <td style={{ 
                          padding: '12px 8px', 
                          color: 'white',
                          textAlign: 'center'
                        }}>
                          {item.qtd}
                        </td>
                        <td style={{ 
                          padding: '12px 8px', 
                          color: 'white',
                          textAlign: 'right'
                        }}>
                          R$ {item.valorUnit.toFixed(2)}
                        </td>
                        <td style={{ 
                          padding: '12px 8px', 
                          color: 'white',
                          textAlign: 'right',
                          fontWeight: 'bold'
                        }}>
                          R$ {(item.valorUnit * item.qtd).toFixed(2)}
                        </td>
                        <td style={{ 
                          padding: '12px 8px',
                          textAlign: 'center'
                        }}>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                            <button 
                              onClick={() => adicionarQuantidade(idx)}
                              style={{
                                background: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '6px 10px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 'bold'
                              }}
                            >
                              +
                            </button>
                            <button 
                              onClick={() => removerQuantidade(idx)}
                              style={{
                                background: '#ffc107',
                                color: 'black',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '6px 10px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 'bold'
                              }}
                            >
                              -
                            </button>
                            <button 
                              onClick={() => removerItem(idx)}
                              style={{
                                background: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '6px 8px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Botões de Ação */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '12px',
              marginTop: '20px'
            }}>
              <button 
                onClick={adicionar10PorCento}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease'
                }}
              >
                Serviço Garçom
              </button>
              <button 
                onClick={exportarPDF}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#6f42c1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease'
                }}
              >
                Imprimir
              </button>
              <button 
                onClick={confirmarExclusaoComanda}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease'
                }}
              >
                Excluir
              </button>
              <button 
                onClick={salvarEEncerrar}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease'
                }}
              >
                Salvar e Encerrar
              </button>
            </div>


          </div>
        </div>
      )}
      {modalExcluir && (
        <div className="modal-overlay" onClick={() => setModalExcluir(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '20px', color: '#ff4444' }}>
              Deseja realmente excluir esta comanda?
            </h3>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button className="btn-primary" onClick={excluirComandaConfirmada}>
                Sim
              </button>
              <button className="btn-secondary" onClick={() => setModalExcluir(false)}>
                Não
              </button>
            </div>
          </div>
        </div>
      )}
      </>
    </ResponsiveLayout>
  );
};

export default Comandas;
