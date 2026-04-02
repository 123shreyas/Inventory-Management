import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { Truck, Mail, Phone, Globe, ExternalLink, Plus, Edit2, Trash2, X, Save, AlertCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import Modal from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState({
    supplierName: '',
    email: '',
    phone: '',
    website: ''
  });
  const { addToast } = useToast();
  const { hasRole } = useAuth();

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/Suppliers');
      setSuppliers(res.data || []);
    } catch (err) {
      addToast('Failed to fetch suppliers.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (supplier = null) => {
    if (supplier) {
      setIsEdit(true);
      setCurrentSupplier(supplier);
    } else {
      setIsEdit(false);
      setCurrentSupplier({
        supplierName: '',
        email: '',
        phone: '',
        website: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentSupplier({
      supplierName: '',
      email: '',
      phone: '',
      website: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await apiClient.put(`/Suppliers/${currentSupplier.supplierId}`, currentSupplier);
        addToast('Supplier updated successfully.', 'success');
      } else {
        await apiClient.post('/Suppliers', currentSupplier);
        addToast('Supplier added successfully.', 'success');
      }
      handleCloseModal();
      fetchData();
    } catch (err) {
      addToast('Failed to save supplier.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await apiClient.delete(`/Suppliers/${id}`);
        addToast('Supplier deleted successfully.', 'success');
        fetchData();
      } catch (err) {
        addToast('Failed to delete supplier.', 'error');
      }
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading suppliers...</div>;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Suppliers</h2>
          <p className="text-slate-500 font-medium mt-1">Manage vendor contacts and procurement sources</p>
        </div>
        {hasRole(['Admin', 'InventoryManager']) && (
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-200"
          >
            <Plus size={20} />
            Add Supplier
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.map(s => (
          <div key={s.supplierId} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all group relative">
             <div className="flex items-center gap-4 mb-4">
                 <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                     <Truck size={24} />
                 </div>
                 <div className="flex-1 min-w-0">
                     <h3 className="text-lg font-bold text-slate-900 truncate">{s.supplierName}</h3>
                     <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">ID: {s.supplierId.substring(0,8)}</span>
                 </div>
                 {hasRole(['Admin', 'InventoryManager']) && (
                   <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenModal(s)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(s.supplierId)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                   </div>
                 )}
             </div>
             <div className="space-y-3">
                 <div className="flex items-center gap-3 text-slate-600">
                     <Mail size={16} className="text-slate-400" />
                     <span className="text-sm font-medium truncate">{s.email || 'No email provided'}</span>
                 </div>
                 <div className="flex items-center gap-3 text-slate-600">
                     <Phone size={16} className="text-slate-400" />
                     <span className="text-sm font-medium">{s.phone || 'No phone provided'}</span>
                 </div>
                 {s.website && (
                    <div className="flex items-center gap-3 text-slate-600">
                        <Globe size={16} className="text-slate-400" />
                        <a 
                            href={s.website.startsWith('http') ? s.website : `https://${s.website}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
                        >
                            Website <ExternalLink size={12} />
                        </a>
                    </div>
                 )}
             </div>
          </div>
        ))}
        {suppliers.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-3xl border border-slate-100">
             No suppliers registered yet.
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={isEdit ? 'Edit Supplier' : 'Add New Supplier'}
      >
        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 block">Supplier Name</label>
              <input
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-medium outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                value={currentSupplier.supplierName}
                onChange={(e) => setCurrentSupplier({ ...currentSupplier, supplierName: e.target.value })}
                placeholder="e.g. Acme Innovations Corp"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 block">Email Address</label>
              <input
                type="email"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-medium outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                value={currentSupplier.email}
                onChange={(e) => setCurrentSupplier({ ...currentSupplier, email: e.target.value })}
                placeholder="vendor@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 block">Phone Number</label>
              <input
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-medium outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                value={currentSupplier.phone}
                onChange={(e) => setCurrentSupplier({ ...currentSupplier, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 block">Website URL (Optional)</label>
              <input
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-medium outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                value={currentSupplier.website}
                onChange={(e) => setCurrentSupplier({ ...currentSupplier, website: e.target.value })}
                placeholder="www.acme.com"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-100 uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <Save size={20} />
            {isEdit ? 'Save Changes' : 'Initialize Supplier'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Suppliers;
