import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ResponsiveLayout from '../Layout/ResponsiveLayout';
import ProductSearch from '../ProductSearch';
import '../Layout/GlobalLayout.css';

function Drinks() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(false);
  const [produtos, setProdutos] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
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

  // UI helpers
  const formRef = React.useRef(null);
  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const totalDrinks = lista.reduce((acc, d) => acc + (d.quantidade || 0), 0);
  const totalComissao = lista.reduce((acc, d) => acc + calcComissao(d.quantidade || 0, d.meta || 20), 0);
  const totalConsumoAll = lista.reduce((acc, d) => acc + totalConsumo(d), 0);

  return (
    <ResponsiveLayout title="Drinks">
      <div style={{ padding: 20 }}>
        <div className="page-header">
          <div className="page-title">🍹 Drinks</div>
          <div className="header-actions">
            <button className="btn-secondary" onClick={carregar}>Atualizar</button>
            <button className="btn-primary" onClick={scrollToForm}>Nova semana</button>
          </div>
        </div>

        <div className="responsive-grid">
          <div className="card fade-in" style={{ borderColor: 'rgba(0,255,0,0.4)' }}>
            <div style={{ color: '#00ff00', fontWeight: 'bold' }}>Total de Drinks</div>
            <div style={{ color: 'white', fontSize: 26, fontWeight: 'bold' }}>{totalDrinks}</div>
          </div>
          <div className="card fade-in" style={{ borderColor: 'rgba(0,255,0,0.4)' }}>
            <div style={{ color: '#00ff00', fontWeight: 'bold' }}>Comissão Total</div>
            <div style={{ color: 'white', fontSize: 26, fontWeight: 'bold' }}>R$ {totalComissao.toFixed(2)}</div>
          </div>
          <div className="card fade-in" style={{ borderColor: 'rgba(0,255,0,0.4)' }}>
            <div style={{ color: '#00ff00', fontWeight: 'bold' }}>Consumo Total</div>
            <div style={{ color: 'white', fontSize: 26, fontWeight: 'bold' }}>R$ {totalConsumoAll.toFixed(2)}</div>
          </div>
        </div>

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      border: '2px solid #00ff00',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(0,255,0,0.08)',
                      color: '#00ff00',
                      fontWeight: 'bold'
                    }}>
                      {(d.funcionaria || 'U').slice(0, 2).toUpperCase()}
                    </div>
                    <input
                      className="form-input"
                      value={d.funcionaria}
                      onChange={(e) => editarRegistro(d.id, 'funcionaria', e.target.value)}
                      style={{ maxWidth: 280 }}
                    />
                  </div>
                  <div style={{
                    background: 'linear-gradient(45deg, rgba(0,255,0,0.15), rgba(0,255,0,0.05))',
                    border: '1px solid rgba(0,255,0,0.3)',
                    borderRadius: 20,
                    padding: '8px 12px',
                    color: '#00ff00',
                    fontWeight: 'bold'
                  }}>
                    {new Date(d.periodoInicio).toLocaleDateString()} — {new Date(d.periodoFim).toLocaleDateString()}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 15 }}>
                  <div>
                    <div style={{ color: '#00ff00', fontWeight: 'bold', marginBottom: 6 }}>Quantidade</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: 'white', fontSize: 18 }}>{d.quantidade}</span>
                      <button className="btn-primary" onClick={() => addUm(d.id)}>+1 drink</button>
                      <button className="btn-secondary" onClick={() => removeUm(d.id)}>-1</button>
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#00ff00', fontWeight: 'bold', marginBottom: 6 }}>Meta</div>
                    <input
                      className="form-input"
                      type="number"
                      value={d.meta}
                      onChange={(e) => editarRegistro(d.id, 'meta', parseInt(e.target.value || '0', 10))}
                    />
                    <div style={{ marginTop: 10 }}>
                      <div style={{ height: 10, background: 'rgba(0,255,0,0.1)', borderRadius: 999, overflow: 'hidden', border: '1px solid rgba(0,255,0,0.3)' }}>
                        <div style={{
                          width: `${Math.min(100, Math.round((d.quantidade / Math.max(1, d.meta)) * 100))}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #00ff00, #00cc00)'
                        }} />
                      </div>
                      <div style={{ color: '#00ff00', marginTop: 6, fontSize: 12 }}>Progresso: {Math.min(100, Math.round((d.quantidade / Math.max(1, d.meta)) * 100))}%</div>
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#00ff00', fontWeight: 'bold', marginBottom: 6 }}>Comissão</div>
                    <div style={{ color: 'white', fontSize: 18 }}>R$ {calcComissao(d.quantidade, d.meta).toFixed(2)}</div>
                  </div>
                  <div>
                    <div style={{ color: '#00ff00', fontWeight: 'bold', marginBottom: 6 }}>Total Consumo</div>
                    <div style={{ color: 'white', fontSize: 18 }}>R$ {totalConsumo(d).toFixed(2)}</div>
                  </div>
                </div>

                <div style={{ marginBottom: 15 }}>
                  <label style={{ color: '#00ff00', fontWeight: 'bold', marginBottom: 8, display: 'block' }}>Registrar consumo do cardápio:</label>
                  <ProductSearch produtos={produtos} onAddProduct={(produto) => adicionarProdutoAoRegistro(d, produto)} />
                </div>

                <div>
                  <label style={{ color: '#00ff00', fontWeight: 'bold', marginBottom: 8, display: 'block' }}>Itens consumidos</label>
                  <div className="responsive-grid">
                    {(Array.isArray(d.itens) ? d.itens : []).map((item, idx) => (
                      <div key={idx} className="card fade-in" style={{ borderColor: 'rgba(0,255,0,0.3)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <div style={{ color: '#00ff00', fontWeight: 'bold' }}>{item.descricao}</div>
                          <div style={{ textAlign: 'right', color: 'white' }}>Unit: R$ {Number(item.valorUnit).toFixed(2)}</div>
                          <div style={{ color: 'white' }}>Qtd: {item.qtd}</div>
                          <div style={{ textAlign: 'right', color: 'white' }}>Total: R$ {(item.qtd * item.valorUnit).toFixed(2)}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                          <button className="btn-primary" onClick={() => adicionarQtdItem(d, idx)}>+1</button>
                          <button className="btn-secondary" onClick={() => removerQtdItem(d, idx)}>-1</button>
                          <button className="btn-danger" onClick={() => removerItem(d, idx)}>Remover</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 15 }}>
                  <button onClick={() => removerRegistro(d.id)} className="btn-danger">Excluir registro</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ResponsiveLayout>
  );
}

export default Drinks;