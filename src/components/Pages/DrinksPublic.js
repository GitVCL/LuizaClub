import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import '../Layout/GlobalLayout.css';

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
}

function calcComissao(qtd, meta) {
  const extra = Math.max(0, (qtd || 0) - (meta || 20));
  return extra * 5;
}

function countBonusPetisco(drink) {
  const itens = Array.isArray(drink.itens) ? drink.itens : [];
  const b = itens.find((i) => i.descricao === 'bonus petisco');
  return b ? (b.qtd || 0) : 0;
}

function bonusPetiscoValor(drink) {
  return countBonusPetisco(drink) * 20;
}

function totalConsumo(drink) {
  const itens = Array.isArray(drink.itens) ? drink.itens : [];
  return itens.reduce((acc, i) => acc + (Number(i.qtd || 0) * Number(i.valorUnit || 0)), 0);
}

function saldoLiquido(drink) {
  const comissao = calcComissao(drink.quantidade || 0, drink.meta || 20);
  const bonus = bonusPetiscoValor(drink);
  const consumo = totalConsumo(drink);
  return comissao + bonus - consumo;
}

function DrinksPublic() {
  const [searchParams] = useSearchParams();
  const urlUserId = searchParams.get('u');
  const filterFuncionario = searchParams.get('f');
  const inicio = searchParams.get('inicio');
  const fim = searchParams.get('fim');

  const ownerId = useMemo(() => {
    return urlUserId || process.env.REACT_APP_PUBLIC_USER_ID || '';
  }, [urlUserId]);

  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function carregar() {
      if (!ownerId) {
        setErrorMsg('Link inválido: usuário não informado.');
        setLista([]);
        return;
      }
      try {
        setErrorMsg('');
        setLoading(true);
        const base = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
        const url = new URL(`${base}/api/drinks/${ownerId}`);
        if (inicio && fim) {
          url.searchParams.set('inicio', inicio);
          url.searchParams.set('fim', fim);
        }
        const res = await fetch(url.toString());
        if (!res.ok) {
          const text = await res.text();
          console.error('Falha ao carregar drinks públicos:', res.status, res.statusText, text);
          setErrorMsg(`Falha ao carregar (HTTP ${res.status}).`);
          setLista([]);
          return;
        }
        const data = await res.json();
        setLista(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Erro ao carregar drinks públicos:', err);
        setErrorMsg('Erro de conexão com o servidor.');
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [ownerId, inicio, fim]);

  const filtrada = useMemo(() => {
    if (!filterFuncionario) return lista;
    return lista.filter((d) =>
      (d.funcionaria || '').toLowerCase().includes(filterFuncionario.toLowerCase())
    );
  }, [lista, filterFuncionario]);

  const totalBonusGeral = filtrada.reduce((acc, d) => acc + countBonusPetisco(d), 0);
  const totalConsumoGeral = filtrada.reduce((acc, d) => acc + totalConsumo(d), 0);

  return (
    <div className="app-container">
      <div className="app-content" style={{ padding: 20 }}>
        <div className="page-header">
          <div className="page-title">🍹 Drinks & Petiscos (Visualização Pública)</div>
          <div className="header-actions">
            <button
              className="btn-secondary"
              onClick={() => {
                try {
                  window.location.reload();
                } catch {
                  // fallback silencioso
                }
              }}
            >
              Atualizar
            </button>
            <span className="badge" style={{ background: 'rgba(0,255,0,0.15)', border: '1px solid rgba(0,255,0,0.35)', color: '#00ff00' }}>
              Somente leitura
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="card fade-in" style={{ borderColor: 'rgba(255,0,0,0.4)', marginTop: 20 }}>
            <div style={{ color: '#ff5c5c' }}>{errorMsg}</div>
          </div>
        )}

        {loading && (
          <div className="card fade-in" style={{ marginTop: 20 }}>
            <div style={{ color: '#aaa' }}>Carregando...</div>
          </div>
        )}

        <div className="responsive-grid" style={{ marginTop: 20 }}>
          {filtrada.map((d) => {
            const qtdBonus = countBonusPetisco(d);
            const valorBonus = bonusPetiscoValor(d);
            const consumo = totalConsumo(d);
            const saldo = saldoLiquido(d);
            const itensConsumo = (Array.isArray(d.itens)
              ? d.itens.filter((i) => i.descricao !== 'bonus petisco')
              : []);
            const progresso = Math.min(100, Math.round(((d.quantidade || 0) / Math.max(1, d.meta || 20)) * 100));

            return (
              <div key={d.id} className="card fade-in" style={{ borderColor: 'rgba(0,255,0,0.25)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>{d.funcionaria || '—'}</div>
                  <div style={{ color: '#aaa', fontSize: 12 }}>
                    {formatDate(d.periodoInicio)} — {formatDate(d.periodoFim)}
                  </div>
                </div>

                {/* ============ BLOCO: DRINKS ============ */}
                <div style={{ marginTop: 12 }}>
                  <div style={{ color: '#00ff00', fontWeight: 'bold', fontSize: 13, marginBottom: 6 }}>
                    🍹 Drinks
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ color: 'white', fontSize: 22, fontWeight: 'bold' }}>{d.quantidade}</span>
                    <span style={{ color: '#aaa', fontSize: 12 }}>(meta {d.meta})</span>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <div style={{ height: 10, background: 'rgba(0,255,0,0.1)', borderRadius: 999, overflow: 'hidden', border: '1px solid rgba(0,255,0,0.3)' }}>
                      <div style={{
                        width: `${progresso}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #00ff00, #00cc00)'
                      }} />
                    </div>
                    <div style={{ color: '#00ff00', marginTop: 6, fontSize: 12 }}>Progresso: {progresso}%</div>
                  </div>

                  <div style={{ marginTop: 8, fontSize: 12, color: '#aaa' }}>
                    Comissão estimada: <span style={{ color: '#00ff00', fontWeight: 'bold' }}>R$ {calcComissao(d.quantidade, d.meta).toFixed(2)}</span>
                  </div>
                </div>

                {/* ============ BLOCO: BÔNUS PETISCO ============ */}
                <div style={{
                  marginTop: 12,
                  padding: '10px 12px',
                  backgroundColor: 'rgba(255, 193, 7, 0.08)',
                  border: '1px solid rgba(255, 193, 7, 0.35)',
                  borderRadius: 8
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: '#ffc107', fontWeight: 'bold', fontSize: 13 }}>
                      🥨 Bônus Petisco
                    </div>
                    <div style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                      {qtdBonus}
                    </div>
                  </div>
                  <div style={{ marginTop: 4, fontSize: 12, color: '#aaa' }}>
                    Valor: <span style={{ color: '#ffc107', fontWeight: 'bold' }}>R$ {valorBonus.toFixed(2)}</span>
                    <span style={{ color: '#666', marginLeft: 6 }}>(R$ 20/unidade)</span>
                  </div>
                </div>

                {/* ============ BLOCO: CONSUMO (PETISCOS & CARDÁPIO) ============ */}
                <div style={{
                  marginTop: 12,
                  padding: '10px 12px',
                  backgroundColor: 'rgba(255, 92, 92, 0.06)',
                  border: '1px solid rgba(255, 92, 92, 0.25)',
                  borderRadius: 8
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ color: '#ff5c5c', fontWeight: 'bold', fontSize: 13 }}>
                      🍽 Consumo (Petiscos & Cardápio)
                    </div>
                    <div style={{ color: 'white', fontWeight: 'bold' }}>
                      R$ {consumo.toFixed(2)}
                    </div>
                  </div>

                  {itensConsumo.length === 0 ? (
                    <div style={{ color: '#888', fontSize: 12, textAlign: 'center', padding: '8px 0' }}>
                      Nenhum item consumido
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: 6, maxHeight: 220, overflowY: 'auto', paddingRight: 4 }}>
                      {itensConsumo.map((item, idx) => {
                        const unit = Number(item.valorUnit || 0);
                        const qtd = Number(item.qtd || 0);
                        const subtotal = unit * qtd;
                        return (
                          <div key={idx} style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr auto',
                            gap: 4,
                            padding: '6px 8px',
                            backgroundColor: 'rgba(0,0,0,0.3)',
                            borderRadius: 6,
                            fontSize: 12,
                            border: '1px solid rgba(255,92,92,0.12)'
                          }}>
                            <div>
                              <div style={{ color: 'white', fontWeight: 'bold' }}>{item.descricao || 'Item'}</div>
                              <div style={{ color: '#aaa', marginTop: 2 }}>
                                {qtd}x R$ {unit.toFixed(2)}
                              </div>
                            </div>
                            <div style={{ color: '#ff5c5c', fontWeight: 'bold', alignSelf: 'center' }}>
                              R$ {subtotal.toFixed(2)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ============ BLOCO: SALDO ============ */}
                <div style={{
                  marginTop: 12,
                  padding: '10px 12px',
                  backgroundColor: saldo >= 0 ? 'rgba(0, 255, 0, 0.08)' : 'rgba(255, 92, 92, 0.08)',
                  border: `1px solid ${saldo >= 0 ? 'rgba(0,255,0,0.35)' : 'rgba(255,92,92,0.35)'}`,
                  borderRadius: 8
                }}>
                  <div style={{ display: 'grid', gap: 4, fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa' }}>
                      <span>Comissão</span>
                      <span style={{ color: '#00ff00' }}>+ R$ {calcComissao(d.quantidade, d.meta).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa' }}>
                      <span>Bônus Petisco</span>
                      <span style={{ color: '#ffc107' }}>+ R$ {valorBonus.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa' }}>
                      <span>Consumo</span>
                      <span style={{ color: '#ff5c5c' }}>- R$ {consumo.toFixed(2)}</span>
                    </div>
                    <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.15)', margin: '4px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}>Saldo</span>
                      <span style={{
                        color: saldo >= 0 ? '#00ff00' : '#ff5c5c',
                        fontWeight: 'bold',
                        fontSize: 15
                      }}>
                        R$ {saldo.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Resumo Geral da página (se houver mais de 1 funcionária) */}
        {filtrada.length > 1 && (
          <div className="card fade-in" style={{
            marginTop: 24,
            borderColor: 'rgba(255, 193, 7, 0.35)',
            background: 'rgba(255, 193, 7, 0.04)'
          }}>
            <div style={{ color: '#ffc107', fontWeight: 'bold', fontSize: 14, marginBottom: 12 }}>
              📊 Resumo Geral ({filtrada.length} funcionária(s))
            </div>
            <div className="responsive-grid" style={{ marginTop: 0 }}>
              <div style={{
                padding: '10px 12px',
                backgroundColor: 'rgba(0,0,0,0.3)',
                borderRadius: 8,
                border: '1px solid rgba(0,255,0,0.2)'
              }}>
                <div style={{ color: '#00ff00', fontWeight: 'bold', fontSize: 12 }}>Bônus Petisco Total</div>
                <div style={{ color: 'white', fontWeight: 'bold', fontSize: 16, marginTop: 4 }}>
                  {totalBonusGeral} un.
                </div>
                <div style={{ color: '#ffc107', fontSize: 12, marginTop: 2 }}>
                  R$ {(totalBonusGeral * 20).toFixed(2)}
                </div>
              </div>
              <div style={{
                padding: '10px 12px',
                backgroundColor: 'rgba(0,0,0,0.3)',
                borderRadius: 8,
                border: '1px solid rgba(255,92,92,0.2)'
              }}>
                <div style={{ color: '#ff5c5c', fontWeight: 'bold', fontSize: 12 }}>Consumo Total (Petiscos)</div>
                <div style={{ color: 'white', fontWeight: 'bold', fontSize: 16, marginTop: 4 }}>
                  R$ {totalConsumoGeral.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DrinksPublic;
