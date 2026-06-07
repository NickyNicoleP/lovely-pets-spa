import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GroomerList from './Admin/GroomerList';
import GroomerForm from './Admin/GroomerForm';

export default function GroomersManagement() {
  const [selectedGroomer, setSelectedGroomer] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const handleEdit = (groomer) => {
    setSelectedGroomer(groomer);
    setShowForm(true);
  };

  const handleCreate = () => {
    setSelectedGroomer(null);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setSelectedGroomer(null);
  };

  const handleSave = () => {
    setShowForm(false);
    setSelectedGroomer(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar disponibilidad de Groomers</h1>
          <p className="text-sm text-gray-600 mt-1">
            Aquí puedes revisar y actualizar la disponibilidad semanal de los groomers registrados.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/grooming')}
          className="btn btn-secondary"
        >
          Volver a Grooming
        </button>
      </div>

      <GroomerList onEdit={handleEdit} onCreate={handleCreate} />

      {showForm && (
        <GroomerForm
          groomer={selectedGroomer}
          onClose={handleClose}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
