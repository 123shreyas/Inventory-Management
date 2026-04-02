import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { Warehouse as WarehouseIcon, MapPin, Maximize, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import Modal from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';

const Warehouses = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentWarehouse, setCurrentWarehouse] = useState({
    warehouseName: '',
    location: '',
    capacity: 0
  });
  const { addToast } = useToast();
  const { hasRole } = useAuth();

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/Warehouses');
      setWarehouses(res.data || []);
    } catch (err) {
      addToast('Failed to fetch warehouses.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (warehouse = null) => {
    if (warehouse) {
      setIsEdit(true);
      setCurrentWarehouse(warehouse);
    } else {
      setIsEdit(false);
      setCurrentWarehouse({
        warehouseName: '',
        location: '',
        capacity: 0
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentWarehouse({
      warehouseName: '',
      location: '',
      capacity: 0
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await apiClient.put(`/Warehouses/${currentWarehouse.warehouseId}`, currentWarehouse);
        addToast('Warehouse updated successfully.', 'success');
      } else {
        await apiClient.post('/Warehouses', currentWarehouse);
        addToast('Warehouse added successfully.', 'success');
      }
      handleCloseModal();
      fetchData();
    } catch (err) {
      addToast('Failed to save warehouse.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this warehouse? This might fail if there are active stock levels associated with it.')) {
      try {
        await apiClient.delete(`/Warehouses/${id}`);
        addToast('Warehouse deleted successfully.', 'success');
        fetchData();
      } catch (err) {
        addToast('Failed to delete warehouse. Ensure it is empty of stock.', 'error');
      }
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading warehouses...</div>;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Warehouses</h2>
          <p className="text-slate-500 font-medium mt-1">Manage physical storage locations and capacity</p>
        </div>
        {hasRole(['Admin', 'InventoryManager']) && (
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-200"
          >
            <Plus size={20} />
            Add Warehouse
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {warehouses.map(w => (
          <div key={w.warehouseId} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all group relative">
             <div className="flex items-center gap-4 mb-4">
                 <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                     <WarehouseIcon size={24} />
                 </div>
                 <div className="flex-1 min-w-0">
                     <h3 className="text-lg font-bold text-slate-900 truncate">{w.warehouseName}</h3>
                     <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">ID: {w.warehouseId.substring(0,8)}</span>
                 </div>
                 {hasRole(['Admin', 'InventoryManager']) && (
                   <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenModal(w)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(w.warehouseId)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                   </div>
                 )}
             </div>
             <div className="space-y-3">
                 <div className="flex items-center gap-3 text-slate-600">
                     <MapPin size={16} className="text-slate-400" />
                     <span className="text-sm font-medium">{w.location}</span>
                 </div>
                 <div className="flex items-center gap-3 text-slate-600">
                     <Maximize size={16} className="text-slate-400" />
                     <span className="text-sm font-medium">Capacity: {w.capacity.toLocaleString()} units</span>
                 </div>
             </div>
          </div>
        ))}
        {warehouses.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-3xl border border-slate-100">
             No warehouses registered yet.
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={isEdit ? 'Edit Warehouse' : 'Add New Warehouse'}
      >
        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 block">Warehouse Name</label>
              <input
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-medium outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                value={currentWarehouse.warehouseName}
                onChange={(e) => setCurrentWarehouse({ ...currentWarehouse, warehouseName: e.target.value })}
                placeholder="e.g. Central Distribution Hub"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 block">Physical Location</label>
              <input
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-medium outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                value={currentWarehouse.location}
                onChange={(e) => setCurrentWarehouse({ ...currentWarehouse, location: e.target.value })}
                placeholder="City, State, Country"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 block">Storage Capacity (Units)</label>
              <input
                type="number"
                required
                min="0"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-medium outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                value={currentWarehouse.capacity}
                onChange={(e) => setCurrentWarehouse({ ...currentWarehouse, capacity: parseInt(e.target.value) })}
                placeholder="10000"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-indigo-100 uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <Save size={20} />
            {isEdit ? 'Update Warehouse' : 'Initialize Warehouse'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Warehouses;
