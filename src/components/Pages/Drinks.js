import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ResponsiveLayout from '../Layout/ResponsiveLayout';
import ProductSearch from '../ProductSearch';
import '../Layout/GlobalLayout.css';

function Drinks() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  const publicLink = useMemo(() => {
    if (!userId) return '';
    try {
      return `${window.location.origin}/drinks-public?u=${encodeURIComponent(userId)}`;
    } catch {
      return `/drinks-public?u=${encodeURIComponent(userId)}`;
    }
  }, [userId]);

  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(false);
  const [produtos, setProdutos] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [drinksAbertos, setDrinksAbertos] = useState({});
  const [drinkAberta, setDrinkAberta] = useState(null);
  const [form, setForm] = useState({
    funcionaria: '',
    quantidade: 0,
    meta: 20,
    inicio: '',
    fim: '',
  });

  useEffect(() => {
    if (!userId) {
      navigate('/');
      return;
    }
    carregar();
    carregarProdutos();
  }, []);

  // Mantém o modal sincronizado com dados atualizados
  useEffect(() => {
    if (drinkAberta) {
      const atualizada = lista.find((d) => d.id === drinkAberta.id);
      if (atualizada) {
        setDrinkAberta(atualizada);
      } else {
        // Se o registro foi removido, fecha o modal
        setDrinkAberta(null);
      }
    }
  }, [lista]);

  async function carregar() {
    try {
      setErrorMsg('');
      setLoading(true);
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/drinks/${userId}`);
      if (!res.ok) {
        const text = await res.text();
        console.error('Falha ao carregar drinks:', res.status, res.statusText, text);
        setErrorMsg(`Falha ao carregar (HTTP ${res.status}).`);
        setLista([]);
        return;
      }
      const data = await res.json();
      setLista(data);
    } catch (err) {
      console.error('Erro ao carregar drinks:', err);
      setErrorMsg('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  }

  async function carregarProdutos() {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/produtos`);
      const data = await res.json();
      setProdutos(data);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
    }
  }

  function calcComissao(qtd, meta) {
    const extra = Math.max(0, (qtd || 0) - (meta || 20));
    return extra * 5;
  }

  async function criarRegistro(e) {
    e.preventDefault();
    if (!form.funcionaria || !form.inicio || !form.fim) return alert('Preencha funcionária e período');
    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/drinks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          funcionaria: form.funcionaria,
          quantidade: form.quantidade,
          meta: form.meta,
          periodoInicio: form.inicio,
          periodoFim: form.fim,
          userId,
        }),
      });
      if (!res.ok) throw new Error('Erro ao criar');
      await carregar();
      setForm({ funcionaria: '', quantidade: 0, meta: 20, inicio: '', fim: '' });
    } catch (err) {
      console.error(err);
      alert('Erro ao criar registro');
    }
  }

  async function editarRegistro(id, campo, valor) {
    try {
      const body = { [campo]: valor };
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/drinks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Erro ao atualizar');
      await carregar();
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar registro');
    }
  }

  async function addUm(id) {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/drinks/${id}/add`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Erro ao adicionar');
      await carregar();
    } catch (err) {
      console.error(err);
      alert('Erro ao adicionar drink');
    }
  }

  async function removeUm(id) {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/drinks/${id}/remove`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Erro ao remover');
      await carregar();
    } catch (err) {
      console.error(err);
      alert('Erro ao remover drink');
    }
  }

  async function removerRegistro(id) {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/drinks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao deletar');
      await carregar();
    } catch (err) {
      console.error(err);
      alert('Erro ao deletar registro');
    }
  }

  function adicionarProdutoAoRegistro(drink, produto) {
    const itens = Array.isArray(drink.itens) ? [...drink.itens] : [];
    const existente = itens.find((i) => i.descricao === produto.nome);
    if (existente) {
      existente.qtd += 1;
    } else {
      itens.push({ descricao: produto.nome, qtd: 1, valorUnit: produto.valor });
    }
    editarRegistro(drink.id, 'itens', itens);
  }

  function addBonusPetisco(drink) {
    const itens = Array.isArray(drink.itens) ? [...drink.itens] : [];
    const existente = itens.find((i) => i.descricao === 'bonus petisco');
    if (existente) {
      existente.qtd += 1;
    } else {
      itens.push({ descricao: 'bonus petisco', qtd: 1, valorUnit: 0 });
    }
    editarRegistro(drink.id, 'itens', itens);
  }

  function removeBonusPetisco(drink) {
    const itens = Array.isArray(drink.itens) ? [...drink.itens] : [];
    const existente = itens.find((i) => i.descricao === 'bonus petisco');
    if (!existente) return; // nada a remover
    if (existente.qtd > 1) {
      existente.qtd -= 1;
    } else {
      const idx = itens.findIndex((i) => i.descricao === 'bonus petisco');
      if (idx >= 0) itens.splice(idx, 1);
    }
    editarRegistro(drink.id, 'itens', itens);
  }

  function adicionarQtdItem(drink, idx) {
    const itens = Array.isArray(drink.itens) ? [...drink.itens] : [];
    itens[idx].qtd += 1;
    editarRegistro(drink.id, 'itens', itens);
  }

  function removerQtdItem(drink, idx) {
    const itens = Array.isArray(drink.itens) ? [...drink.itens] : [];
    if (itens[idx].qtd > 1) {
      itens[idx].qtd -= 1;
      editarRegistro(drink.id, 'itens', itens);
    } else {
      removerItem(drink, idx);
    }
  }

  function removerItem(drink, idx) {
    const itens = Array.isArray(drink.itens) ? [...drink.itens] : [];
    itens.splice(idx, 1);
    editarRegistro(drink.id, 'itens', itens);
  }

  function totalConsumo(drink) {
    const itens = Array.isArray(drink.itens) ? drink.itens : [];
    return itens.reduce((acc, i) => acc + i.qtd * i.valorUnit, 0);
  }

  // Bonus Petisco helpers
  function countBonusPetisco(drink) {
    const itens = Array.isArray(drink.itens) ? drink.itens : [];
    const b = itens.find((i) => i.descricao === 'bonus petisco');
    return b ? (b.qtd || 0) : 0;
  }

  function bonusPetiscoValor(drink) {
    return countBonusPetisco(drink) * 20; // R$20 por bônus
  }

  function saldoLiquido(drink) {
    const comissao = calcComissao(drink.quantidade || 0, drink.meta || 20);
    const bonus = bonusPetiscoValor(drink);
    const consumo = totalConsumo(drink);
    return comissao + bonus - consumo;
  }

  // UI helpers
  const formRef = React.useRef(null);
  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const totalDrinks = lista.reduce((acc, d) => acc + (d.quantidade || 0), 0);
  const totalComissao = lista.reduce((acc, d) => acc + calcComissao(d.quantidade || 0, d.meta || 20), 0);
  const totalConsumoAll = lista.reduce((acc, d) => acc + totalConsumo(d), 0);

  function toggleDrinkAberto(id) {
    setDrinksAbertos(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function abrirDrink(drink) {
    setDrinkAberta(drink);
  }

  function fecharDrink() {
    setDrinkAberta(null);
  }

  return (
    <ResponsiveLayout title="Drinks">
      <div style={{ padding: 20 }}>
        <div className="page-header">
          <div className="page-title">🍹 Drinks</div>
          <div className="header-actions">
            <button className="btn-secondary" onClick={carregar}>Atualizar</button>
            <button className="btn-primary" onClick={scrollToForm}>Nova semana</button>
            <button
              className="btn-secondary"
              onClick={() => {
                const url = `${window.location.origin}/drinks-public?u=${encodeURIComponent(userId)}`;
                navigator.clipboard.writeText(url)
                  .then(() => alert('Link público copiado para a área de transferência'))
                  .catch(() => alert('Não foi possível copiar o link'));
              }}
            >
              Copiar link público
            </button>
          </div>
        </div>

        <div className="responsive-grid">
          <div className="card fade-in" style={{ borderColor: 'rgba(0,255,0,0.4)' }}>
            <div style={{ color: '#00ff00', fontWeight: 'bold' }}>Total de Drinks</div>
            <div style={{ color: 'white', fontSize: 26, fontWeight: 'bold' }}>{totalDrinks}</div>
          </div>
        </div>

        {/* Link público somente visualização (não afeta funcionalidades de quem está logado) */}
        {publicLink && (
          <div className="card fade-in" style={{ marginTop: 12, borderColor: 'rgba(0,255,0,0.25)' }}>
            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ color: '#00ff00', fontWeight: 'bold' }}>Link público (visualização)</div>
              <input className="form-input" value={publicLink} readOnly />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(publicLink)
                      .then(() => alert('Link público copiado'))
                      .catch(() => alert('Não foi possível copiar o link'));
                  }}
                >
                  Copiar
                </button>
                <a className="btn-primary" href={publicLink} target="_blank" rel="noreferrer">Abrir</a>
              </div>
              <div style={{ color: '#aaa', fontSize: 12 }}>Opcional: adicione <code>&f=Nome</code> para filtrar por funcionária.</div>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="card fade-in" style={{ borderColor: 'rgba(255,0,0,0.4)', marginTop: 20 }}>
            <div style={{ color: '#ff5c5c' }}>{errorMsg}</div>
          </div>
        )}

        <div className="card fade-in" ref={formRef} style={{ marginTop: 20 }}>
          <form onSubmit={criarRegistro} style={{ display: 'grid', gap: 10 }}>
            <div className="form-group">
              <label className="form-label">Funcionária</label>
              <input
                className="form-input"
                placeholder="Funcionária"
                value={form.funcionaria}
                onChange={(e) => setForm({ ...form, funcionaria: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
              <div>
                <label className="form-label">Quantidade inicial</label>
                <input
                  className="form-input"
                  type="number"
                  placeholder="Quantidade inicial"
                  value={form.quantidade}
                  onChange={(e) => setForm({ ...form, quantidade: parseInt(e.target.value || '0', 10) })}
                />
              </div>
              <div>
                <label className="form-label">Meta</label>
                <input
                  className="form-input"
                  type="number"
                  placeholder="Meta"
                  value={form.meta}
                  onChange={(e) => setForm({ ...form, meta: parseInt(e.target.value || '20', 10) })}
                />
              </div>
            </div>
            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
              <div>
                <label className="form-label">Início</label>
                <input type="date" className="form-input" value={form.inicio} onChange={(e) => setForm({ ...form, inicio: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Fim</label>
                <input type="date" className="form-input" value={form.fim} onChange={(e) => setForm({ ...form, fim: e.target.value })} />
              </div>
            </div>
            <button type="submit" className="btn-primary">Criar semana 🍹</button>
          </form>
        </div>

        {loading ? (
          <p>Carregando...</p>
        ) : (
          <div className="responsive-grid">
            {lista.map((d) => (
              <div key={d.id} className="card fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ color: '#00ff00', fontWeight: 'bold', fontSize: 18 }}>
                    {d.funcionaria || '---'}
                  </div>
                  <button className="btn-primary" onClick={() => abrirDrink(d)} style={{ minWidth: 100 }}>Abrir</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {drinkAberta && (
          <div className="modal-overlay" onClick={fecharDrink}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, color: '#00ff00' }}>{drinkAberta.funcionaria || 'Drinks'}</h3>
                <button className="btn-secondary" onClick={fecharDrink}>Fechar</button>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                <span style={{ background: 'rgba(0,255,0,0.06)', border: '1px solid #00ff00', color: '#00ff00', padding: '6px 10px', borderRadius: 8 }}>
                  {new Date(drinkAberta.periodoInicio).toLocaleDateString()} — {new Date(drinkAberta.periodoFim).toLocaleDateString()}
                </span>
                <span style={{ background: 'rgba(0,255,0,0.06)', border: '1px solid #00ff00', color: '#00ff00', padding: '6px 10px', borderRadius: 8 }}>
                  Qtd: <strong>{drinkAberta.quantidade}</strong>
                </span>
                <span style={{ background: 'rgba(0,255,0,0.06)', border: '1px solid #00ff00', color: '#00ff00', padding: '6px 10px', borderRadius: 8 }}>
                  Bônus: <strong>{countBonusPetisco(drinkAberta)}</strong>
                </span>
                <span style={{ background: 'rgba(0,255,0,0.06)', border: '1px solid #00ff00', color: saldoLiquido(drinkAberta) >= 0 ? '#00ff00' : '#ff5c5c', padding: '6px 10px', borderRadius: 8 }}>
                  Saldo: <strong>R$ {saldoLiquido(drinkAberta).toFixed(2)}</strong>
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 12 }}>
                <div style={{ border: '1px solid rgba(0,255,0,0.25)', borderRadius: 12, padding: 12, background: 'rgba(0,255,0,0.06)' }}>
                  <div style={{ color: '#00ff00', fontWeight: 'bold', marginBottom: 8 }}>Quantidade</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>{drinkAberta.quantidade}</span>
                    <button className="btn-primary" onClick={() => addUm(drinkAberta.id)}>+1 drink</button>
                    <button className="btn-secondary" onClick={() => removeUm(drinkAberta.id)}>-1</button>
                  </div>
                </div>
                <div style={{ border: '1px solid rgba(0,255,0,0.25)', borderRadius: 12, padding: 12, background: 'rgba(0,255,0,0.06)' }}>
                  <div style={{ color: '#00ff00', fontWeight: 'bold', marginBottom: 8 }}>Meta</div>
                  <input
                    className="form-input"
                    type="number"
                    value={drinkAberta.meta}
                    onChange={(e) => editarRegistro(drinkAberta.id, 'meta', parseInt(e.target.value || '0', 10))}
                  />
                  <div style={{ marginTop: 12 }}>
                    <div style={{ height: 10, background: 'rgba(0,255,0,0.1)', borderRadius: 999, overflow: 'hidden', border: '1px solid rgba(0,255,0,0.3)' }}>
                      <div style={{
                        width: `${Math.min(100, Math.round((drinkAberta.quantidade / Math.max(1, drinkAberta.meta)) * 100))}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #00ff00, #00cc00)'
                      }} />
                    </div>
                    <div style={{ color: '#00ff00', marginTop: 6, fontSize: 12 }}>Progresso: {Math.min(100, Math.round((drinkAberta.quantidade / Math.max(1, drinkAberta.meta)) * 100))}%</div>
                  </div>
                </div>
                <div style={{ border: '1px solid rgba(0,255,0,0.25)', borderRadius: 12, padding: 12, background: 'rgba(0,255,0,0.06)' }}>
                  <div style={{ color: '#00ff00', fontWeight: 'bold', marginBottom: 8 }}>Bônus Petisco</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>{countBonusPetisco(drinkAberta)}</span>
                    <button className="btn-primary" onClick={() => addBonusPetisco(drinkAberta)}>+1</button>
                    <button className="btn-secondary" onClick={() => removeBonusPetisco(drinkAberta)}>-1</button>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(0,255,0,0.2)', paddingTop: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                  <div style={{ border: '1px solid rgba(0,255,0,0.25)', borderRadius: 12, padding: 12 }}>
                    <div style={{ color: '#00ff00', fontWeight: 'bold', marginBottom: 6 }}>Comissão</div>
                    <div style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>R$ {calcComissao(drinkAberta.quantidade, drinkAberta.meta).toFixed(2)}</div>
                  </div>
                  <div style={{ border: '1px solid rgba(0,255,0,0.25)', borderRadius: 12, padding: 12 }}>
                    <div style={{ color: '#00ff00', fontWeight: 'bold', marginBottom: 6 }}>Bônus Petisco</div>
                    <div style={{ color: 'white', fontSize: 18 }}>Qtd: {countBonusPetisco(drinkAberta)} — R$ {bonusPetiscoValor(drinkAberta).toFixed(2)}</div>
                  </div>
                  <div style={{ border: '1px solid rgba(0,255,0,0.25)', borderRadius: 12, padding: 12 }}>
                    <div style={{ color: '#00ff00', fontWeight: 'bold', marginBottom: 6 }}>Consumo</div>
                    <div style={{ color: 'white', fontSize: 18 }}>R$ {totalConsumo(drinkAberta).toFixed(2)}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 12 }}>
                <div style={{ border: '1px solid rgba(0,255,0,0.25)', borderRadius: 12, padding: 12, background: 'rgba(0,255,0,0.06)' }}>
                  <div style={{ color: '#00ff00', fontWeight: 'bold', marginBottom: 6 }}>Saldo lucrador</div>
                  <div style={{ color: '#00ff00', fontSize: 18, fontWeight: 'bold' }}>R$ {Math.max(0, saldoLiquido(drinkAberta)).toFixed(2)}</div>
                </div>
                <div style={{ border: '1px solid rgba(255,92,92,0.25)', borderRadius: 12, padding: 12, background: 'rgba(255,92,92,0.06)' }}>
                  <div style={{ color: '#ff5c5c', fontWeight: 'bold', marginBottom: 6 }}>Saldo devedor</div>
                  <div style={{ color: '#ff5c5c', fontSize: 18, fontWeight: 'bold' }}>R$ {Math.max(0, -saldoLiquido(drinkAberta)).toFixed(2)}</div>
                </div>
              </div>

              <div style={{ marginTop: 15 }}>
                <label style={{ color: '#00ff00', fontWeight: 'bold', marginBottom: 8, display: 'block' }}>Registrar consumo do cardápio:</label>
                <ProductSearch produtos={produtos} onAddProduct={(produto) => adicionarProdutoAoRegistro(drinkAberta, produto)} />
              </div>

              <div style={{ marginTop: 12 }}>
                <label style={{ color: '#00ff00', fontWeight: 'bold', marginBottom: 8, display: 'block' }}>Itens consumidos</label>
                <div className="responsive-grid">
                  {(Array.isArray(drinkAberta.itens)
                    ? drinkAberta.itens
                        .map((item, idx) => ({ item, idx }))
                        .filter(({ item }) => item.descricao !== 'bonus petisco')
                    : []
                  ).map(({ item, idx }) => (
                    <div key={idx} className="card fade-in" style={{ borderColor: 'rgba(0,255,0,0.3)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div style={{ color: '#00ff00', fontWeight: 'bold' }}>{item.descricao}</div>
                        <div style={{ textAlign: 'right', color: 'white' }}>Unit: R$ {Number(item.valorUnit).toFixed(2)}</div>
                        <div style={{ color: 'white' }}>Qtd: {item.qtd}</div>
                        <div style={{ textAlign: 'right', color: 'white' }}>Total: R$ {(item.qtd * item.valorUnit).toFixed(2)}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <button className="btn-primary" onClick={() => adicionarQtdItem(drinkAberta, idx)}>+1</button>
                        <button className="btn-secondary" onClick={() => removerQtdItem(drinkAberta, idx)}>-1</button>
                        <button className="btn-danger" onClick={() => removerItem(drinkAberta, idx)}>Remover</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 15 }}>
                <button onClick={() => removerRegistro(drinkAberta.id)} className="btn-danger">Excluir registro</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ResponsiveLayout>
  );
}

export default Drinks;