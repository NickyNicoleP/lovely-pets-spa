import { useState, useEffect, useMemo } from 'react';
import { agendaAPI, pagosAPI, configAPI } from '../services/api';

export default function Caja() {
  const getLocalIsoDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getLocalIsoDate());
  const [reservas, setReservas] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [referencia, setReferencia] = useState('');
  const [config, setConfig] = useState({ bank_qr_url: '' });
  const [montoRecibido, setMontoRecibido] = useState('');
  const [filterMetodo, setFilterMetodo] = useState('todos');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadReservas();
    loadPagos();
    loadConfig();
  }, [selectedDate]);

  const loadReservas = async () => {
    setLoading(true);
    try {
      const resp = await agendaAPI.getAll({ fecha: selectedDate });
      setReservas(resp.data || []);
    } catch (err) {
      console.error('Error cargando reservas para caja:', err);
      setReservas([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPagos = async () => {
    try {
      const response = await pagosAPI.getAll({ fecha_inicio: selectedDate, fecha_fin: selectedDate });
      setPagos(response.data || []);
    } catch (err) {
      console.error('Error cargando pagos:', err);
      setPagos([]);
    }
  };

  const loadConfig = async () => {
    try {
      const response = await configAPI.get();
      setConfig(response.data || { bank_qr_url: '' });
    } catch (err) {
      console.error('Error cargando configuración:', err);
    }
  };

  const openPayment = (reserva) => {
    setSelectedReserva(reserva);
    setPaymentMethod('efectivo');
    setMontoRecibido('');
    setPaymentModalOpen(true);
  };

  const calcularCambio = () => {
    const precio = Number(selectedReserva?.precio_final || selectedReserva?.precio_servicio || 0);
    const recibido = Number(montoRecibido || 0);
    return Math.max(0, (recibido - precio)).toFixed(2);
  };

  const openQrLink = () => {
    if (config?.bank_qr_url) {
      window.open(config.bank_qr_url, '_blank');
    }
  };

  const registrarPago = async () => {
    if (!selectedReserva) return;

    const precio = Number(selectedReserva?.precio_final || selectedReserva?.precio_servicio || 0);
    const recibido = paymentMethod === 'efectivo' ? Number(montoRecibido || precio) : precio;
    const vuelto = paymentMethod === 'efectivo' ? Number(calcularCambio()) : 0;

    if (paymentMethod === 'efectivo' && recibido < precio) {
      alert('El monto recibido debe ser igual o mayor al monto total.');
      return;
    }

    if (paymentMethod !== 'efectivo' && !referencia.trim()) {
      alert('Ingrese una referencia para el pago.');
      return;
    }

    const referenciaText = paymentMethod === 'efectivo'
      ? `Recibido:${recibido};Vuelto:${vuelto}`
      : referencia.trim();

    try {
      await pagosAPI.create({
        reserva_id: selectedReserva.id,
        monto: precio,
        metodo: paymentMethod,
        referencia: referenciaText
      });

      if (paymentMethod === 'qr' && config.bank_qr_url) {
        openQrLink();
      }

      generarComprobante(selectedReserva, paymentMethod, recibido, vuelto);

      setPaymentModalOpen(false);
      setSelectedReserva(null);
      setMontoRecibido('');
      setReferencia('');
      loadReservas();
      loadPagos();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const generarComprobante = (reserva, metodo, recibido, vuelto) => {
    const ahora = new Date();
    const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/La_Paz' };
    const fechaFormato = ahora.toLocaleDateString('es-BO', opciones);
    const horaFormato = ahora.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/La_Paz' });
    
    const cliente = `${reserva.cliente_nombre || ''} ${reserva.cliente_apellido || ''}`.trim();
    const mascota = reserva.mascota_nombre || '';
    const servicio = reserva.servicio_nombre || '';
    const monto = Number(reserva.precio_final || reserva.precio_servicio || 0).toFixed(2);
    const montoRecibido = Number(recibido).toFixed(2);
    const montoVuelto = Number(vuelto).toFixed(2);
    const nombreMetodo = metodo === 'qr' ? 'QR' : metodo === 'efectivo' ? 'Efectivo' : metodo === 'transferencia' ? 'Transferencia' : metodo === 'tarjeta' ? 'Tarjeta' : 'Otro';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Comprobante-${reserva.id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              background-color: #f5f5f5;
              padding: 20px;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: white;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #EC4899 0%, #C2185B 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              font-size: 28px;
              font-weight: 700;
              margin-bottom: 5px;
            }
            .header p {
              font-size: 14px;
              opacity: 0.95;
            }
            .separator {
              height: 3px;
              background-color: #EC4899;
            }
            .content {
              padding: 30px 20px;
            }
            .section {
              margin-bottom: 25px;
            }
            .section-title {
              font-size: 12px;
              font-weight: 700;
              color: #EC4899;
              text-transform: uppercase;
              margin-bottom: 12px;
              letter-spacing: 0.5px;
            }
            .info-table {
              width: 100%;
              border-collapse: collapse;
              background-color: #f9f9f9;
              border-radius: 6px;
              overflow: hidden;
            }
            .info-table td {
              padding: 10px 15px;
              border: 1px solid #e0e0e0;
              font-size: 13px;
            }
            .info-table td:first-child {
              font-weight: 600;
              color: #555;
              width: 35%;
              background-color: #f0f0f0;
            }
            .payment-section {
              background-color: #FCE7F3;
              border-left: 4px solid #EC4899;
              padding: 20px;
              border-radius: 6px;
              text-align: center;
            }
            .payment-section .label {
              font-size: 12px;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 8px;
            }
            .payment-section .amount {
              font-size: 36px;
              font-weight: 700;
              color: #EC4899;
              margin-bottom: 15px;
            }
            .payment-details {
              display: flex;
              justify-content: space-around;
              margin-top: 15px;
              padding-top: 15px;
              border-top: 1px solid #E91E63;
            }
            .payment-details div {
              text-align: center;
            }
            .payment-details .label {
              font-size: 11px;
              color: #666;
              display: block;
              margin-bottom: 5px;
            }
            .payment-details .value {
              font-size: 14px;
              font-weight: 600;
              color: #333;
            }
            .footer {
              background-color: #f9f9f9;
              padding: 20px;
              text-align: center;
              border-top: 1px solid #e0e0e0;
              font-size: 12px;
              color: #666;
            }
            .footer .gratitude {
              font-size: 14px;
              color: #EC4899;
              font-weight: 600;
              margin-bottom: 10px;
            }
            .footer .contact {
              font-size: 11px;
              color: #999;
              margin-top: 8px;
            }
            @media print {
              body { background: white; padding: 0; }
              .container { box-shadow: none; border-radius: 0; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🐾 PawSpa</h1>
              <p>Lovely Pets Spa</p>
            </div>
            <div class="separator"></div>
            
            <div class="content">
              <div class="section">
                <div class="section-title">Información del Comprobante</div>
                <table class="info-table">
                  <tr>
                    <td>Nº Comprobante</td>
                    <td>#${reserva.id.toString().padStart(6, '0')}</td>
                  </tr>
                  <tr>
                    <td>Fecha y Hora</td>
                    <td>${fechaFormato} - ${horaFormato}</td>
                  </tr>
                </table>
              </div>

              <div class="section">
                <div class="section-title">Detalles del Servicio</div>
                <table class="info-table">
                  <tr>
                    <td>Cliente</td>
                    <td>${cliente}</td>
                  </tr>
                  <tr>
                    <td>Mascota</td>
                    <td>${mascota}</td>
                  </tr>
                  <tr>
                    <td>Servicio</td>
                    <td>${servicio}</td>
                  </tr>
                </table>
              </div>

              <div class="payment-section">
                <div class="label">Monto Total</div>
                <div class="amount">Bs. ${monto}</div>
                <div class="payment-details">
                  <div>
                    <span class="label">Método</span>
                    <span class="value">${nombreMetodo}</span>
                  </div>
                  <div>
                    <span class="label">Recibido</span>
                    <span class="value">Bs. ${montoRecibido}</span>
                  </div>
                  <div>
                    <span class="label">Vuelto</span>
                    <span class="value">Bs. ${montoVuelto}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="footer">
              <div class="gratitude">¡Gracias por confiar en PawSpa! 🐾</div>
              <div class="contact">
                <p>📍 La Paz, Bolivia</p>
                <p>📱 Teléfono: +591 76543210</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comprobante_pawspa_${reserva.id}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const totalesPorMetodo = useMemo(() => {
    const totals = { efectivo: 0, qr: 0, tarjeta: 0, link_pago: 0, transferencia: 0, desconocido: 0 };
    pagos.forEach((p) => {
      const metodo = p.metodo || 'desconocido';
      const monto = Number(p.monto || 0);
      totals[metodo] = (totals[metodo] || 0) + (isNaN(monto) ? 0 : monto);
    });
    return totals;
  }, [pagos]);

  const totalGeneral = useMemo(() => Object.values(totalesPorMetodo).reduce((s, v) => s + v, 0), [totalesPorMetodo]);

  const historialFiltrado = useMemo(() => {
    return pagos.filter((p) => {
      if (filterMetodo !== 'todos' && p.metodo !== filterMetodo) return false;
      const q = searchText.trim().toLowerCase();
      if (!q) return true;
      return (p.cliente_nombre || '').toLowerCase().includes(q) ||
             (p.mascota_nombre || '').toLowerCase().includes(q) ||
             String(p.id).includes(q);
    });
  }, [pagos, filterMetodo, searchText]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Caja / Punto de Venta</h1>
          <p className="text-sm text-gray-600 mt-1">Registra pagos del día y genera comprobantes.</p>
        </div>
      </div>

      <div className="card mb-6 p-4">
        <div className="flex items-center gap-3">
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="input" />
          <button onClick={() => { loadReservas(); loadPagos(); }} className="btn btn-outline">Actualizar</button>
        </div>
      </div>

      <div className="grid gap-4 mb-6 md:grid-cols-2">
        <div className="bg-fuchsia-50 border border-fuchsia-100 p-4 rounded-2xl">
          <p className="text-sm font-medium text-fuchsia-700">Servicios del día</p>
          {loading ? (
            <p>Cargando...</p>
          ) : (
            <div className="mt-3 space-y-2">
              {reservas.map((r) => (
                <div key={r.id} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                  <div>
                    <div className="font-medium">{r.cliente_nombre} {r.cliente_apellido}</div>
                    <div className="text-sm text-gray-500">{r.mascota_nombre} • {r.servicio_nombre}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">Bs {parseFloat(r.precio_final || r.precio_servicio || 0).toFixed(2)}</div>
                    <div className="mt-2 flex gap-2">
                      {r.estado !== 'completada' && (
                        <button onClick={() => openPayment(r)} className="btn btn-primary text-sm">Registrar pago</button>
                      )}
                      <button onClick={() => generarComprobante(r, r.observaciones?.split(';')[0]?.replace('Pago ', '') || paymentMethod, parseFloat(r.recibido || r.precio_final || 0), 0)} className="btn btn-outline text-sm">Descargar comprobante</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-100 p-4 rounded-2xl">
          <p className="text-sm font-medium text-gray-500">Cierre de caja</p>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between"><span>Efectivo</span><span>Bs {totalesPorMetodo.efectivo.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>QR</span><span>Bs {totalesPorMetodo.qr.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Tarjeta</span><span>Bs {totalesPorMetodo.tarjeta.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Link Pago</span><span>Bs {totalesPorMetodo.link_pago.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Transferencia</span><span>Bs {totalesPorMetodo.transferencia.toFixed(2)}</span></div>
            <div className="border-t pt-2 mt-2 flex justify-between font-semibold"><span>Total</span><span>Bs {totalGeneral.toFixed(2)}</span></div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 p-4 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Historial de pagos</h2>
          <div className="flex items-center gap-2">
            <select value={filterMetodo} onChange={(e) => setFilterMetodo(e.target.value)} className="input">
              <option value="todos">Todos</option>
              <option value="efectivo">Efectivo</option>
              <option value="qr">QR</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="link_pago">Link Pago</option>
              <option value="transferencia">Transferencia</option>
            </select>
            <input placeholder="Buscar cliente, mascota o id" value={searchText} onChange={(e) => setSearchText(e.target.value)} className="input" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-left text-sm text-gray-600">
                <th className="p-2">ID</th>
                <th className="p-2">Cliente</th>
                <th className="p-2">Mascota</th>
                <th className="p-2">Servicio</th>
                <th className="p-2">Monto</th>
                <th className="p-2">Método</th>
                <th className="p-2">Estado</th>
                <th className="p-2">Referencia</th>
                <th className="p-2">Fecha</th>
                <th className="p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {historialFiltrado.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-2">{p.id}</td>
                  <td className="p-2">{p.cliente_nombre} {p.cliente_apellido}</td>
                  <td className="p-2">{p.mascota_nombre}</td>
                  <td className="p-2">{p.servicio_nombre}</td>
                  <td className="p-2">Bs {Number(p.monto || 0).toFixed(2)}</td>
                  <td className="p-2">{p.metodo}</td>
                  <td className="p-2">{p.estado || 'N/A'}</td>
                  <td className="p-2">
                    {p.referencia ? p.referencia : '-'}
                  </td>
                  <td className="p-2">
                    {p.fecha && p.fecha !== 'Invalid Date' 
                      ? (() => {
                          try {
                            const fechaObj = new Date(p.fecha);
                            return isNaN(fechaObj.getTime()) 
                              ? 'N/A'
                              : fechaObj.toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' });
                          } catch (e) {
                            return 'N/A';
                          }
                        })()
                      : 'N/A'
                    }
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => generarComprobante({
                        ...p,
                        cliente_nombre: p.cliente_nombre,
                        cliente_apellido: p.cliente_apellido,
                        mascota_nombre: p.mascota_nombre,
                        servicio_nombre: p.servicio_nombre,
                        precio_final: p.monto
                      }, p.metodo, p.monto, 0)}
                      className="btn btn-outline text-sm"
                    >
                      Comprobante
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {paymentModalOpen && selectedReserva && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Registrar pago</h2>
            <p className="font-medium text-gray-900 mt-2">{selectedReserva.cliente_nombre} - {selectedReserva.mascota_nombre}</p>
            <p className="text-sm text-gray-500">Monto: Bs {parseFloat(selectedReserva.precio_final || selectedReserva.precio_servicio || 0).toFixed(2)}</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="label">Método de pago</label>
                <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="qr">QR</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </div>

              {paymentMethod === 'efectivo' && (
                <div>
                  <label className="label">Monto recibido</label>
                  <input type="number" min="0" step="0.01" className="input" value={montoRecibido} onChange={(e) => setMontoRecibido(e.target.value)} />
                  <div className="text-sm text-gray-600 mt-2">Vuelto: Bs {calcularCambio()}</div>
                </div>
              )}

              {paymentMethod !== 'efectivo' && (
                <div className="space-y-3">
                  {paymentMethod === 'qr' && (
                    <div className="rounded-lg border border-pink-200 bg-pink-50 p-4">
                      <div className="font-semibold text-pink-700">Pago QR</div>
                      <p className="text-sm text-pink-700 mt-2">
                        Envía el monto al QR de la cuenta bancaria y registra la referencia de la transacción.
                      </p>
                      {config.bank_qr_url ? (
                        <div className="mt-3 flex flex-col gap-2">
                          <a href={config.bank_qr_url} target="_blank" rel="noreferrer" className="btn btn-secondary w-full text-center">Abrir QR / Link de pago</a>
                          <p className="text-xs text-gray-500 break-all">{config.bank_qr_url}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No se configuró aún la URL/QR en el panel de administración.</p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="label">Referencia de pago</label>
                    <input type="text" className="input" value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Ej. Transacción 123456" />
                    <p className="text-sm text-gray-500 mt-1">Registra la referencia que te proporciona el banco o pasarela de pago.</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button onClick={() => { setPaymentModalOpen(false); setSelectedReserva(null); setReferencia(''); }} className="flex-1 btn btn-outline">Cancelar</button>
                <button onClick={registrarPago} className="flex-1 btn btn-primary">Registrar pago</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
