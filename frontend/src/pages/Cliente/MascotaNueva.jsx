import { useState } from 'react';
import { mascotasAPI } from '../../services/api';

const sizeDurations = {
  pequeña: '30-45 minutos',
  mediana: '45-60 minutos',
  grande: '60-75 minutos',
  'extra-grande': '75-90 minutos'
};

export default function MascotaNueva() {
  const [form, setForm] = useState({
    nombre: '',
    especie: '',
    raza: '',
    edad: '',
    peso: '',
    tamano: '',
    temperamento: '',
    alergias: '',
    restricciones_medicas: '',
    vacunas: null
  });
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    setError(null);
    if (!file) {
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('archivo', file);
      const { data } = await mascotasAPI.uploadVacunas(formData);
      setUploadedFile({ name: file.name, url: data.path, mimetype: data.mimetype });
      setForm((prev) => ({
        ...prev,
        vacunas: [{ nombre: file.name, url: data.path, tipo: data.mimetype }]
      }));
      setMessage('Comprobante cargado correctamente.');
    } catch (uploadError) {
      console.error(uploadError);
      setError('Error al subir comprobante. Intenta nuevamente.');
      setUploadedFile(null);
      setForm((prev) => ({ ...prev, vacunas: null }));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!form.nombre || !form.especie || !form.raza || !form.tamano) {
      setError('Completa los campos requeridos antes de continuar.');
      return;
    }

    const payload = {
      nombre: form.nombre,
      especie: form.especie,
      raza: form.raza,
      edad: form.edad ? Number(form.edad) : null,
      peso: form.peso ? Number(form.peso) : null,
      temperamento: form.temperamento,
      alergias: form.alergias,
      restricciones_medicas: form.restricciones_medicas
        ? `${form.restricciones_medicas}\nTamaño: ${form.tamano}`
        : `Tamaño: ${form.tamano}`,
      vacunas: form.vacunas
    };

    try {
      await mascotasAPI.create(payload);
      setMessage('Mascota registrada correctamente.');
      setForm({
        nombre: '',
        especie: '',
        raza: '',
        edad: '',
        peso: '',
        tamano: '',
        temperamento: '',
        alergias: '',
        restricciones_medicas: '',
        vacunas: null
      });
      setUploadedFile(null);
      setFileInputKey(Date.now());
    } catch (submitError) {
      console.error(submitError);
      setError('No se pudo registrar la mascota. Revisa la información e intenta nuevamente.');
    }
  };

  const handleClear = () => {
    setForm({
      nombre: '',
      especie: '',
      raza: '',
      edad: '',
      peso: '',
      tamano: '',
      temperamento: '',
      alergias: '',
      restricciones_medicas: '',
      vacunas: null
    });
    setUploadedFile(null);
    setMessage(null);
    setError(null);
    setFileInputKey(Date.now());
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 rounded-3xl border border-pink-200 bg-gradient-to-r from-pink-50 to-fuchsia-50 p-6 shadow-lg">
        <h1 className="text-3xl font-bold text-pink-700 mb-2">Registrar nueva mascota</h1>
        <p className="text-sm text-slate-600">Completa los datos de tu mascota y sube un comprobante de vacunas o servicios previos para que podamos brindar el mejor cuidado.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-3xl border border-pink-100 p-8 shadow-xl">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="nombre" className="block text-sm font-semibold text-slate-700 mb-2">Nombre *</label>
            <input id="nombre" name="nombre" value={form.nombre} onChange={handleChange} required className="input w-full" placeholder="Ej. Luna" />
          </div>
          <div>
            <label htmlFor="especie" className="block text-sm font-semibold text-slate-700 mb-2">Especie *</label>
            <input id="especie" name="especie" value={form.especie} onChange={handleChange} required className="input w-full" placeholder="Ej. Perro" />
          </div>
          <div>
            <label htmlFor="raza" className="block text-sm font-semibold text-slate-700 mb-2">Raza *</label>
            <input id="raza" name="raza" value={form.raza} onChange={handleChange} required className="input w-full" placeholder="Ej. Golden Retriever" />
          </div>
          <div>
            <label htmlFor="tamano" className="block text-sm font-semibold text-slate-700 mb-2">Tamaño *</label>
            <select id="tamano" name="tamano" value={form.tamano} onChange={handleChange} required className="input w-full">
              <option value="">Selecciona tamaño</option>
              <option value="pequeña">Pequeña</option>
              <option value="mediana">Mediana</option>
              <option value="grande">Grande</option>
              <option value="extra-grande">Extra grande</option>
            </select>
          </div>
          <div>
            <label htmlFor="edad" className="block text-sm font-semibold text-slate-700 mb-2">Edad (años)</label>
            <input id="edad" name="edad" type="number" min="0" step="1" value={form.edad} onChange={handleChange} className="input w-full" placeholder="Ej. 3" />
          </div>
          <div>
            <label htmlFor="peso" className="block text-sm font-semibold text-slate-700 mb-2">Peso (kg)</label>
            <input id="peso" name="peso" type="number" min="0" step="0.1" value={form.peso} onChange={handleChange} className="input w-full" placeholder="Ej. 12.5" />
          </div>
          <div>
            <label htmlFor="temperamento" className="block text-sm font-semibold text-slate-700 mb-2">Temperamento</label>
            <input id="temperamento" name="temperamento" value={form.temperamento} onChange={handleChange} className="input w-full" placeholder="Ej. Tranquilo" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="alergias" className="block text-sm font-semibold text-slate-700 mb-2">Alergias</label>
            <textarea id="alergias" name="alergias" value={form.alergias} onChange={handleChange} className="input h-24 w-full resize-none" placeholder="Describe las alergias de tu mascota"></textarea>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="restricciones_medicas" className="block text-sm font-semibold text-slate-700 mb-2">Restricciones médicas</label>
            <textarea id="restricciones_medicas" name="restricciones_medicas" value={form.restricciones_medicas} onChange={handleChange} className="input h-24 w-full resize-none" placeholder="Ej. No usar ciertos productos o evitar el estrés"></textarea>
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-pink-100 bg-pink-50 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-fuchsia-700">Duración estimada del servicio</p>
              <p className="text-sm text-slate-600">Basado en el tamaño seleccionado.</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-fuchsia-100 px-3 py-1 text-sm font-medium text-fuchsia-700">
              {form.tamano ? sizeDurations[form.tamano] : 'Selecciona un tamaño'}
            </span>
          </div>
          <div className="text-sm text-slate-600">
            El tiempo estimado sirve para planificar mejor los servicios de grooming y baños de tu mascota.
          </div>
        </div>

        <div className="space-y-3">
          <label htmlFor="vacunas" className="block text-sm font-semibold text-slate-700">Comprobante de vacunas o servicios previos</label>
          <input
            key={fileInputKey}
            id="vacunas"
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="file-input"
          />
          {uploading && <p className="text-sm text-slate-500">Subiendo archivo...</p>}
          {uploadedFile && (
            <div className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50 p-3 text-sm text-fuchsia-700">
              <p className="font-semibold">Archivo cargado:</p>
              <p>{uploadedFile.name}</p>
              <a href={uploadedFile.url} target="_blank" rel="noreferrer" className="text-fuchsia-600 hover:underline">Ver comprobante</a>
            </div>
          )}
        </div>

        {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}

        <div className="flex flex-col gap-3 md:flex-row">
          <button type="submit" className="btn btn-primary flex-1 py-3">Registrar mascota</button>
          <button type="button" onClick={handleClear} className="w-full rounded-2xl border border-pink-300 bg-white px-4 py-3 text-sm font-semibold text-pink-700 transition hover:bg-pink-50 md:w-auto">Limpiar formulario</button>
        </div>
      </form>
    </div>
  );
}
