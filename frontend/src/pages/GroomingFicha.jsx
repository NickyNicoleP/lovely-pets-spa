import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fichaGroomingAPI } from '../services/api';

const sizeLabel = (peso) => {
  const kilos = Number(peso);
  if (!kilos || Number.isNaN(kilos)) return 'No disponible';
  if (kilos < 10) return 'Pequeña';
  if (kilos < 20) return 'Mediana';
  if (kilos < 35) return 'Grande';
  return 'Extra grande';
};

const checklistLabels = [
  { key: 'Corte de Uñas', label: 'Uñas' },
  { key: 'Limpieza de Oídos', label: 'Oídos' },
  { key: 'Glándulas', label: 'Glándulas' },
  { key: 'Corte', label: 'Corte' },
  { key: 'Baño', label: 'Baño' },
  { key: 'Perfume', label: 'Perfume' }
];

export default function GroomingFicha() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ficha, setFicha] = useState(null);
  const [loading, setLoading] = useState(true);
  const [estadoIngreso, setEstadoIngreso] = useState({
    nudos: false,
    pulgas: false,
    heridas: false,
    suciedad: false
  });
  const [observaciones, setObservaciones] = useState('');
  const [checklist, setChecklist] = useState([]);
  const [fotosAntes, setFotosAntes] = useState([]);
  const [fotosDespues, setFotosDespues] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const loadFicha = async () => {
    setLoading(true);
    try {
      const { data } = await fichaGroomingAPI.getById(id);
      setFicha(data);
      setObservaciones(data.observaciones || '');
      setInsumos(data.insumos || []);
      setChecklist((data.checklist || checklistLabels).map((item) => ({
        ...item,
        completed: !!(data.checklist || []).find((check) => check.nombre === item.key && check.realizado)
      })));
      setFotosAntes(data.fotos_antes || []);
      setFotosDespues(data.fotos_despues || []);

      if (data.estado_ingreso && typeof data.estado_ingreso === 'object') {
        setEstadoIngreso({
          nudos: !!data.estado_ingreso.nudos,
          pulgas: !!data.estado_ingreso.pulgas,
          heridas: !!data.estado_ingreso.heridas,
          suciedad: !!data.estado_ingreso.suciedad
        });
      } else {
        setEstadoIngreso({
          nudos: !!data.nudos,
          pulgas: !!data.pulgas,
          heridas: !!data.heridas,
          suciedad: false
        });
      }
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar la ficha.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFicha();
  }, [id]);

  const handleChecklistToggle = async (itemKey, completed) => {
    setChecklist((prev) => prev.map((item) =>
      item.key === itemKey ? { ...item, completed } : item
    ));
    try {
      await fichaGroomingAPI.updateChecklistItem(id, itemKey, { completed });
    } catch (err) {
      console.error(err);
      setError('No se pudo actualizar el checklist.');
    }
  };

  const handleFotoUpload = async (event, tipo) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('archivo', file);
      formData.append('tipo', tipo);
      await fichaGroomingAPI.uploadFoto(id, formData);
      await loadFicha();
      setMessage(`Foto ${tipo} cargada correctamente.`);
    } catch (err) {
      console.error(err);
      setError('Error al subir la foto.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveFicha = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload = {
        estado_ingreso: estadoIngreso,
        nudos: estadoIngreso.nudos,
        pulgas: estadoIngreso.pulgas,
        heridas: estadoIngreso.heridas,
        observaciones
      };
      await fichaGroomingAPI.update(id, payload);
      await loadFicha();
      setMessage('Ficha actualizada correctamente.');
    } catch (err) {
      console.error(err);
      setError('No se pudo guardar la ficha.');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseFicha = async () => {
    setClosing(true);
    setError(null);
    setMessage(null);
    try {
      await fichaGroomingAPI.close(id);
      setMessage('Servicio cerrado y cliente notificado.');
      navigate('/grooming');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'No se pudo cerrar la ficha.');
    } finally {
      setClosing(false);
    }
  };

  const checklistComplete = checklist.every((item) => item.completed);
  const hasPhotos = fotosAntes.length > 0 && fotosDespues.length > 0;
  const canClose = checklistComplete && hasPhotos;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500"></div>
      </div>
    );
  }

  if (!ficha) {
    return (
      <div className="p-6">
        <p className="text-center text-red-600">Ficha no encontrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-fuchsia-700">Ficha técnica de grooming</h1>
          <p className="text-sm text-slate-600">Registro detallado de la atención y cierre del servicio.</p>
        </div>
        <Link to="/grooming" className="btn btn-outline">Volver a grooming</Link>
      </div>

      {(message || error) && (
        <div className={`rounded-3xl p-4 ${message ? 'bg-emerald-50 border-2 border-emerald-200 text-emerald-700' : 'bg-red-50 border-2 border-red-200 text-red-700'}`}>
          {message || error}
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-3xl border border-pink-100 bg-pink-50 p-5 shadow-sm">
          <h2 className="font-semibold text-pink-700 mb-3">Datos de la mascota</h2>
          <p className="text-sm text-slate-700"><span className="font-medium">Nombre:</span> {ficha.mascota_nombre}</p>
          <p className="text-sm text-slate-700"><span className="font-medium">Raza:</span> {ficha.mascota_raza || 'No disponible'}</p>
          <p className="text-sm text-slate-700"><span className="font-medium">Tamaño:</span> {sizeLabel(ficha.mascota_peso)}</p>
          <p className="text-sm text-slate-700"><span className="font-medium">Temperamento:</span> {ficha.mascota_temperamento || 'No registrado'}</p>
        </article>

        <article className="rounded-3xl border border-pink-100 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="font-semibold text-fuchsia-700 mb-3">Estado de ingreso</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {['nudos', 'pulgas', 'heridas', 'suciedad'].map((field) => (
              <label key={field} className="flex items-center gap-3 rounded-2xl border border-fuchsia-200 bg-fuchsia-50 p-3">
                <input
                  type="checkbox"
                  checked={estadoIngreso[field]}
                  onChange={(e) => setEstadoIngreso({ ...estadoIngreso, [field]: e.target.checked })}
                  className="h-5 w-5 rounded border-pink-300 text-fuchsia-600 focus:ring-fuchsia-500"
                />
                <span className="text-sm font-medium text-slate-700">{field === 'suciedad' ? 'Suciedad' : field.charAt(0).toUpperCase() + field.slice(1)}</span>
              </label>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-fuchsia-700 mb-4">Checklist obligatorio antes de cerrar</h2>
          <div className="space-y-3">
            {checklist.map((item) => (
              <label key={item.key} className="flex items-center gap-3 rounded-2xl border border-pink-100 bg-pink-50 p-3">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={(e) => handleChecklistToggle(item.key, e.target.checked)}
                  className="h-5 w-5 rounded border-pink-300 text-fuchsia-600 focus:ring-fuchsia-500"
                />
                <span className="font-medium text-slate-700">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-fuchsia-700 mb-4">Fotos antes y después</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Antes</label>
              <input type="file" accept="image/*" onChange={(e) => handleFotoUpload(e, 'antes')} className="file-input" disabled={uploading} />
              <div className="mt-3 flex flex-wrap gap-3">
                {fotosAntes.map((foto) => (
                  <img key={foto.id} src={foto.url} alt="Antes" className="h-24 w-24 rounded-2xl object-cover border border-pink-100" />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Después</label>
              <input type="file" accept="image/*" onChange={(e) => handleFotoUpload(e, 'despues')} className="file-input" disabled={uploading} />
              <div className="mt-3 flex flex-wrap gap-3">
                {fotosDespues.map((foto) => (
                  <img key={foto.id} src={foto.url} alt="Después" className="h-24 w-24 rounded-2xl object-cover border border-pink-100" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-fuchsia-700 mb-4">Observaciones y recomendaciones</h2>
        <textarea
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          rows={5}
          className="input w-full resize-none"
          placeholder="Descripción de recomendaciones para el dueño"
        />
      </section>

      <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-fuchsia-700">Insumos usados</h2>
          <span className="text-sm text-slate-500">Marca los insumos utilizados</span>
        </div>
        <div className="space-y-3">
          {insumos.length === 0 ? (
            <p className="text-sm text-slate-500">No hay insumos registrados para esta ficha.</p>
          ) : (
            insumos.map((insumo) => (
              <label key={insumo.id} className="flex items-center gap-3 rounded-2xl border border-pink-100 bg-pink-50 p-3">
                <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-pink-300 text-fuchsia-600" />
                <div>
                  <p className="font-medium text-slate-700">{insumo.producto_nombre}</p>
                  <p className="text-sm text-slate-500">Cantidad: {insumo.cantidad}</p>
                </div>
              </label>
            ))
          )}
        </div>
      </section>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <button
          type="button"
          onClick={handleSaveFicha}
          disabled={saving}
          className="btn btn-primary w-full py-3 lg:w-auto"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        <button
          type="button"
          onClick={handleCloseFicha}
          disabled={!canClose || closing}
          className={`w-full py-3 lg:w-auto ${canClose ? 'btn btn-primary' : 'btn btn-disabled'}`}
        >
          {closing ? 'Cerrando...' : 'Cerrar servicio'}
        </button>
      </div>

      {!canClose && (
        <p className="text-sm text-slate-500">Completa el checklist y sube al menos una foto antes y una después para habilitar el cierre.</p>
      )}
    </div>
  );
}
