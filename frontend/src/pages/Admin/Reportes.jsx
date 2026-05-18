import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, LineChart, Line } from 'recharts';
import { fichaGroomingAPI } from '../../services/api';

export default function Reportes() {
  const [dataOcupacion, setDataOcupacion] = useState([]);
  const [dataIngresos, setDataIngresos] = useState([]);

  useEffect(() => {
    // Ejemplo: usar estadísticas de ficha grooming
    fichaGroomingAPI.getEstadisticas().then(res => {
      // Ajusta según lo que devuelva tu backend
      setDataOcupacion(res.data.ocupacionMensual || []);
      setDataIngresos(res.data.ingresosMensuales || []);
    }).catch(() => {
      // Datos de ejemplo si no hay backend
      setDataOcupacion([
        { mes: 'Ene', citas: 12 }, { mes: 'Feb', citas: 19 }, { mes: 'Mar', citas: 15 }
      ]);
      setDataIngresos([
        { mes: 'Ene', ingresos: 1200 }, { mes: 'Feb', ingresos: 1900 }, { mes: 'Mar', ingresos: 1500 }
      ]);
    });
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Reportes</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Ocupación mensual</h2>
          <BarChart width={500} height={300} data={dataOcupacion}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="citas" fill="#8884d8" />
          </BarChart>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Ingresos mensuales</h2>
          <LineChart width={500} height={300} data={dataIngresos}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="ingresos" stroke="#82ca9d" />
          </LineChart>
        </div>
      </div>
    </div>
  );
}