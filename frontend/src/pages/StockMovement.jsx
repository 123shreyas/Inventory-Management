import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { TRANSACTION_TYPES } from '../utils/constants';
import { ArrowUpDown, Box, Warehouse, Clipboard, Loader2, Info } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const StockMovement = () => {
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [formData, setFormData] = useState({
    productId: '',
    warehouseId: '',
    destinationWarehouseId: '',
    transactionType: 0,
    quantity: 1,
    referenceNumber: '',
    batchId: '',
    isHold: false,
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Default 7 days
  });
  const [batches, setBatches] = useState([]);
  const [currentStock, setCurrentStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [prodRes, warRes] = await Promise.all([
          apiClient.get('/Products?pageSize=1000'),
          apiClient.get('/Warehouses')
        ]);
        
        const prodItems = prodRes.data.items || [];
        const warItems = warRes.data || [];
        
        setProducts(prodItems);
        setWarehouses(warItems);
        
        setFormData(prev => ({
          ...prev,
          productId: prodItems.length > 0 ? prodItems[0].productId : '',
          warehouseId: warItems.length > 0 ? warItems[0].warehouseId : '',
          destinationWarehouseId: warItems.length > 1 ? warItems[1].warehouseId : ''
        }));
      } catch (err) {
        addToast('Failed to load transaction metadata.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [addToast]);

  useEffect(() => {
    if (formData.productId && formData.warehouseId) {
      const fetchStock = async () => {
        try {
          const [stockRes, batchRes] = await Promise.all([
            apiClient.get(`/Stock/${formData.productId}`),
            apiClient.get(`/Stock/${formData.productId}/batches/${formData.warehouseId}`)
          ]);
          const stock = stockRes.data.find(s => s.warehouseId === formData.warehouseId);
          setCurrentStock(stock ? stock.quantityOnHand : 0);
          setBatches(batchRes.data || []);
        } catch (err) {
          setCurrentStock(0);
          setBatches([]);
        }
      };
      fetchStock();
    }
  }, [formData.productId, formData.warehouseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.productId || !formData.warehouseId) {
      addToast('Product and Warehouse are required.', 'error');
      return;
    }
    if (formData.transactionType === 4 && formData.warehouseId === formData.destinationWarehouseId) {
      addToast('Source and Destination warehouse cannot be the same.', 'error');
      return;
    }
    if (formData.transactionType === 4 && !formData.destinationWarehouseId) {
      addToast('Destination Warehouse is required for internal transfers.', 'error');
      return;
    }

    setSubmitting(true);

    if ((formData.transactionType === 1 || formData.transactionType === 4) && formData.quantity > currentStock) {
      addToast('Insufficient stock for this transaction.', 'error');
      setSubmitting(false);
      return;
    }

    try {
      if (formData.isHold) {
        await apiClient.post('/Stock/reserve', {
          productId: formData.productId,
          warehouseId: formData.warehouseId,
          quantity: formData.quantity,
          expiryDate: formData.expiryDate,
          reference: formData.referenceNumber
        });
        addToast('Stock hold (reservation) created successfully!', 'success');
      } else {
        await apiClient.post('/Stock/transaction', {
          ...formData,
          transactionDate: new Date().toISOString()
        });
        addToast('Stock transaction recorded successfully!', 'success');
      }

      setFormData(prev => ({ ...prev, quantity: 1, referenceNumber: '', isHold: false }));
      
      const res = await apiClient.get(`/Stock/${formData.productId}`);
      const stock = res.data.find(s => s.warehouseId === formData.warehouseId);
      setCurrentStock(stock ? stock.quantityOnHand : 0);
    } catch (err) {
      const errorMsg = err.response?.data?.detailed || err.response?.data?.message || 'Transaction failed.';
      addToast(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const isNumeric = name === 'quantity' || name === 'transactionType';
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (isNumeric ? (value === '' ? '' : parseInt(value)) : value)
    }));
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]">Loading metadata...</div>;

  const isOut = formData.transactionType === 1;
  const canSubmit = !isOut || (formData.quantity <= currentStock);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Stock Movements</h2>
        <p className="text-slate-500 font-medium mt-1">Record purchases, sales, and internal adjustments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Target Product</label>
                  <div className="relative">
                    <Box className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium" size={18} />
                    <select
                      name="productId"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700 appearance-none"
                      value={formData.productId}
                      onChange={handleChange}
                    >
                      <option value="" disabled>Select a product</option>
                      {products.map(p => (
                        <option key={p.productId} value={p.productId}>{p.productName} ({p.sku})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Location / Source Warehouse</label>
                  <div className="relative">
                    <Warehouse className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select
                      name="warehouseId"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700 appearance-none"
                      value={formData.warehouseId}
                      onChange={handleChange}
                    >
                      <option value="" disabled>Select a warehouse</option>
                      {warehouses.map(w => (
                        <option key={w.warehouseId} value={w.warehouseId}>{w.warehouseName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Movement Type</label>
                  <div className="relative">
                    <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select
                      name="transactionType"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700 appearance-none"
                      value={formData.transactionType}
                      onChange={handleChange}
                    >
                      {TRANSACTION_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {formData.transactionType === 4 && (
                  <div className="md:col-span-2 p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex flex-col gap-2 mt-2">
                    <label className="block text-sm font-bold text-blue-900">Destination Warehouse (For Transfer)</label>
                    <div className="relative">
                      <Warehouse className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
                      <select
                        name="destinationWarehouseId"
                        className="w-full pl-11 pr-4 py-3 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-bold text-blue-800 appearance-none shadow-sm"
                        value={formData.destinationWarehouseId}
                        onChange={handleChange}
                      >
                        <option value="" disabled>Select destination</option>
                        {warehouses.map(w => w.warehouseId !== formData.warehouseId && (
                          <option key={'dest-' + w.warehouseId} value={w.warehouseId}>{w.warehouseName}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Transaction Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-black text-slate-900"
                    value={formData.quantity}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Reference Number</label>
                  <div className="relative">
                    <Clipboard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      name="referenceNumber"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                      value={formData.referenceNumber}
                      onChange={handleChange}
                      placeholder="PO-123, SALE-456, etc."
                    />
                  </div>
                </div>

                {batches.length > 0 && !formData.isHold && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Specific Batch (Optional)</label>
                    <select
                      name="batchId"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700"
                      value={formData.batchId}
                      onChange={handleChange}
                    >
                      <option value="">Auto-select (Oldest First)</option>
                      {batches.map(b => (
                        <option key={b.stockBatchId} value={b.stockBatchId}>
                          {b.batchNumber} (Exp: {b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : 'N/A'}) - {b.quantity} in stock
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="md:col-span-2 flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex h-6 items-center">
                    <input
                      name="isHold"
                      type="checkbox"
                      className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                      checked={formData.isHold}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="text-sm leading-6">
                    <label className="font-black text-slate-900 uppercase tracking-widest">Mark as Stock Hold (Reservation)</label>
                    <p className="text-slate-500 font-medium tracking-tight">Quantity will be reserved without deducting from total stock until fulfilled.</p>
                  </div>
                </div>

                {formData.isHold && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Hold Expiry Date</label>
                    <input
                      type="date"
                      name="expiryDate"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                      value={formData.expiryDate}
                      onChange={handleChange}
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || !canSubmit}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black rounded-xl shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="animate-spin" size={20} /> : 'Post Transaction'}
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
             <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Stock Status</h3>
             <div className="text-center py-6">
                <p className="text-slate-500 text-sm font-medium">Quantity on Hand</p>
                <div className={`text-5xl font-black mt-2 ${currentStock <= 10 ? 'text-red-500' : 'text-slate-900'}`}>
                  {currentStock !== null ? currentStock : '--'}
                </div>
             </div>
             {isOut && currentStock < formData.quantity && (
               <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-100 flex gap-3">
                 <Info size={20} className="text-red-500 flex-shrink-0" />
                 <p className="text-xs font-bold text-red-600 leading-relaxed">
                   CRITICAL: You are trying to sell/move more quantity than available in this warehouse.
                 </p>
               </div>
             )}
           </div>

           <div className="bg-slate-900 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
             <div className="relative z-10">
               <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-2">Quick Tip</h3>
               <p className="text-sm font-medium text-slate-300 leading-relaxed">
                 Use **Adjustments** for correcting inventory errors, and **Returns** for processing customer returns back into stock.
               </p>
             </div>
             <Box className="absolute -bottom-4 -right-4 text-white/5" size={120} />
           </div>
        </div>
      </div>
    </div>
  );
};

export default StockMovement;
