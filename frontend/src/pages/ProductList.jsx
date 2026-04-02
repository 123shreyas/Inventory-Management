import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Edit2, Trash2, LayoutGrid, List as ListIcon, AlertCircle } from 'lucide-react';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { hasRole } = useAuth();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, stockRes] = await Promise.all([
        apiClient.get('/Products?pageSize=1000'),
        apiClient.get('/Stock')
      ]);
      setProducts(productsRes.data.items || []);
      setStocks(stockRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await apiClient.delete(`/Products/${id}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete product.');
    }
  };

  const getStockForProduct = (productId) => {
    const productStocks = stocks.filter(s => s.productId === productId);
    const total = productStocks.reduce((sum, s) => sum + (s.quantityOnHand || 0), 0);
    const reorderLevel = productStocks[0]?.reorderLevel || 0;
    return { total, reorderLevel };
  };

  const filteredProducts = products.filter(p =>
    p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center min-h-[400px]">Loading Products...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Inventory Catalog</h2>
          <p className="text-slate-500 font-medium mt-1">Manage your products and their global stock levels</p>
        </div>
        
        {hasRole(['Admin', 'InventoryManager']) && (
          <Link
            to="/products/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
          >
            <Plus size={20} />
            Add New Product
          </Link>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center border border-slate-200 rounded-xl p-1 bg-white">
            <button className="p-2 text-blue-600 bg-blue-50 rounded-lg"><LayoutGrid size={18} /></button>
            <button className="p-2 text-slate-400"><ListIcon size={18} /></button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Product Details</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Pricing</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Stock Level</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProducts.map((product) => {
                const { total, reorderLevel } = getStockForProduct(product.productId);
                const isLowStock = total <= reorderLevel;

                return (
                  <tr key={product.productId} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">{product.productName}</span>
                        <span className="text-xs font-medium text-slate-400 mt-0.5">{product.sku}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[11px] font-bold uppercase tracking-wider">
                        {product.categoryName}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">₹{product.listPrice.toFixed(2)}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Cost: ₹{product.cost.toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className={`text-sm font-black ${isLowStock ? 'text-red-500' : 'text-emerald-500'}`}>
                          {total} <span className="text-[10px] font-medium text-slate-400">({product.unitOfMeasure})</span>
                        </div>
                        {isLowStock && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-red-400 uppercase animate-pulse">
                            <AlertCircle size={10} />
                            Low Stock
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {hasRole(['Admin', 'InventoryManager']) && (
                          <Link
                            to={`/products/edit/${product.productId}`}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          >
                            <Edit2 size={16} />
                          </Link>
                        )}
                        {hasRole('Admin') && (
                          <button
                            onClick={() => handleDelete(product.productId)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductList;
