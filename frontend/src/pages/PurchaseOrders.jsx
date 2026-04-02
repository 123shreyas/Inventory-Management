import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { useToast } from '../context/ToastContext';
import { Plus, Package, Truck, CheckCircle, Clock, AlertCircle, X, ChevronRight, Calculator } from 'lucide-react';
import Modal from '../components/ui/Modal';
import Loader from '../components/ui/Loader';

const PurchaseOrders = () => {
  const [pos, setPos] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedPo, setSelectedPo] = useState(null);
  const { addToast } = useToast();

  // Create PO State
  const [newPo, setNewPo] = useState({
    supplierId: '',
    items: [{ productId: '', quantity: 1, unitPrice: 0 }]
  });

  // Receive PO State
  const [receiveWarehouseId, setReceiveWarehouseId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [posRes, supRes, prodRes, warRes] = await Promise.all([
        apiClient.get('/PurchaseOrders'),
        apiClient.get('/Suppliers'),
        apiClient.get('/Products'),
        apiClient.get('/Warehouses')
      ]);
      setPos(posRes.data);
      setSuppliers(supRes.data);
      setProducts(prodRes.data?.items || []);
      setWarehouses(warRes.data);
    } catch (error) {
      addToast('Failed to fetch data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setNewPo({
      ...newPo,
      items: [...newPo.items, { productId: '', quantity: 1, unitPrice: 0 }]
    });
  };

  const handleRemoveItem = (index) => {
    const items = [...newPo.items];
    items.splice(index, 1);
    setNewPo({ ...newPo, items });
  };

  const handleItemChange = (index, field, value) => {
    const items = [...newPo.items];
    items[index][field] = value;
    setNewPo({ ...newPo, items });
  };

  const handleCreatePo = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/PurchaseOrders', newPo);
      addToast('Purchase Order created successfully', 'success');
      setShowCreateModal(false);
      fetchData();
    } catch (error) {
      addToast('Failed to create Purchase Order', 'error');
    }
  };

  const handleReceivePo = async () => {
    if (!receiveWarehouseId) {
      addToast('Please select a warehouse', 'error');
      return;
    }
    try {
      await apiClient.post(`/PurchaseOrders/${selectedPo.purchaseOrderId}/receive?warehouseId=${receiveWarehouseId}`);
      addToast('Stock received successfully', 'success');
      setShowReceiveModal(false);
      fetchData();
    } catch (error) {
      addToast('Failed to receive stock', 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Received': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Ordered': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Cancelled': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader size="lg" /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Purchase Orders</h1>
          <p className="text-slate-500 font-medium">Manage procurement and track inbound stock deliveries.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-200"
        >
          <Plus size={20} />
          New Order
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {pos.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Truck size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">No Purchase Orders Found</h3>
            <p className="text-slate-500">Get started by creating your first procurement order.</p>
          </div>
        ) : (
          pos.map((po) => (
            <div key={po.purchaseOrderId} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all p-6 group">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${po.status === 'Received' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                    <Truck size={28} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xl font-bold text-slate-900">{po.orderNumber}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${getStatusColor(po.status)}`}>
                        {po.status}
                      </span>
                    </div>
                    <p className="text-slate-500 font-medium flex items-center gap-2 text-sm">
                      <Clock size={14} /> Ordered {new Date(po.orderDate).toLocaleDateString()} • Provider ID: {po.supplierId.substring(0, 8)}...
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-8 lg:text-right">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Amount</p>
                    <p className="text-2xl font-black text-slate-900">₹{po.totalAmount?.toLocaleString()}</p>
                  </div>
                  
                  {po.status !== 'Received' && (
                    <button
                      onClick={() => { setSelectedPo(po); setShowReceiveModal(true); }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-100 flex items-center gap-2"
                    >
                      <CheckCircle size={18} />
                      Mark Received
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      <Modal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        title="Create Purchase Order"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreatePo} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Supplier</label>
            <select
              required
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-medium focus:border-blue-500 focus:bg-white outline-none transition-all"
              value={newPo.supplierId}
              onChange={(e) => setNewPo({ ...newPo, supplierId: e.target.value })}
            >
              <option value="">Select Supplier</option>
              {suppliers.map(s => <option key={s.supplierId} value={s.supplierId}>{s.supplierName}</option>)}
            </select>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm font-bold text-slate-700 uppercase tracking-wider">
              <span>Items</span>
              <button type="button" onClick={handleAddItem} className="text-blue-600 flex items-center gap-1 hover:underline">
                <Plus size={16} /> Add Item
              </button>
            </div>
            
            {newPo.items.map((item, index) => (
              <div key={index} className="bg-slate-50 rounded-2xl p-4 grid grid-cols-12 gap-4 items-end animate-in fade-in scale-in-95 duration-200">
                <div className="col-span-12 lg:col-span-5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Product</label>
                  <select
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium outline-none"
                    value={item.productId}
                    onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                  >
                    <option value="">Select</option>
                    {products.map(p => <option key={p.productId} value={p.productId}>{p.productName}</option>)}
                  </select>
                </div>
                <div className="col-span-5 lg:col-span-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Qty</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium outline-none"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                  />
                </div>
                <div className="col-span-5 lg:col-span-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Unit Price</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium outline-none"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))}
                  />
                </div>
                <div className="col-span-2 lg:col-span-1 flex justify-center">
                  <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-400 hover:text-red-600 p-2">
                    <X size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-100 uppercase tracking-widest"
          >
            Submit Purchase Order
          </button>
        </form>
      </Modal>

      {/* Receive Modal */}
      <Modal
        isOpen={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        title="Inventory Receipt"
      >
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-4">
            <AlertCircle className="text-emerald-500 shrink-0" size={24} />
            <p className="text-emerald-700 text-sm font-medium">
              You are about to receive stock for <strong>{selectedPo?.orderNumber}</strong>. This will increase the current inventory levels in the selected warehouse.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Storage Warehouse</label>
            <select
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-medium outline-none focus:border-emerald-500 transition-all"
              value={receiveWarehouseId}
              onChange={(e) => setReceiveWarehouseId(e.target.value)}
            >
              <option value="">Select Warehouse</option>
              {warehouses.map(w => <option key={w.warehouseId} value={w.warehouseId}>{w.warehouseName}</option>)}
            </select>
          </div>

          <button
            onClick={handleReceivePo}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-emerald-100 uppercase tracking-widest"
          >
            Confirm Receipt
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default PurchaseOrders;
