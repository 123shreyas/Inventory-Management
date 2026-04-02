import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { ArrowLeft, Save, Loader2, Package, Hash, IndianRupee, Tag, Ruler } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    productName: '',
    sku: '',
    description: '',
    categoryId: '',
    unitOfMeasure: 'pcs',
    cost: 0,
    listPrice: 0,
    reorderLevel: 0,
    safetyStock: 0,
    isActive: true,
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetching(true);
        const [catRes, prodRes] = await Promise.all([
          apiClient.get('/Categories'),
          isEdit ? apiClient.get(`/Products/${id}`) : Promise.resolve(null)
        ]);

        setCategories(catRes.data || []);
        
        if (prodRes) {
          const product = prodRes.data;
          setFormData({
            productName: product.productName || '',
            sku: product.sku || '',
            description: product.description || '',
            categoryId: product.categoryId || '',
            unitOfMeasure: product.unitOfMeasure || 'pcs',
            cost: product.cost ?? 0,
            listPrice: product.listPrice ?? 0,
            reorderLevel: product.reorderLevel ?? 0,
            safetyStock: product.safetyStock ?? 0,
            isActive: product.isActive ?? true,
          });
        } else if (catRes.data?.length > 0) {
          setFormData(prev => ({ ...prev, categoryId: catRes.data[0].categoryId }));
        }
      } catch (err) {
        addToast('Failed to fetch required data.', 'error');
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [id, isEdit, addToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.categoryId) {
      addToast('Please select a category.', 'error');
      return;
    }
    if (formData.listPrice < formData.cost) {
      addToast('List Price must be greater than or equal to Purchase Cost.', 'error');
      return;
    }
    setLoading(true);

    try {
      if (isEdit) {
        await apiClient.put(`/Products/${id}`, formData);
        addToast('Product updated successfully!', 'success');
      } else {
        await apiClient.post('/Products', formData);
        addToast('Product registered successfully!', 'success');
      }
      navigate('/products');
    } catch (err) {
      const msg = err.response?.data?.detailed || err.response?.data?.message || 'Failed to save product.';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = value;
    if (type === 'checkbox') finalValue = checked;
    else if (type === 'number') finalValue = value === '' ? '' : parseFloat(value);
    
    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  if (fetching) return <div className="flex items-center justify-center min-h-[400px]">Initializing form data...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/products')}
          className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {isEdit ? 'Edit Product' : 'Register New Product'}
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            {isEdit ? `Modifying SKU: ${formData.sku}` : 'Fill in the core attributes to initialize the product'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="space-y-6">
               <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Core Identity</h3>
               
               <div>
                 <label className="block text-sm font-bold text-slate-700 mb-2">Product Name</label>
                 <div className="relative group">
                   <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                   <input
                     name="productName"
                     required
                     className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700"
                     value={formData.productName}
                     onChange={handleChange}
                     placeholder="e.g. UltraHD Projector"
                   />
                 </div>
               </div>

               <div>
                 <label className="block text-sm font-bold text-slate-700 mb-2">SKU Number</label>
                 <div className="relative group">
                   <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                   <input
                     name="sku"
                     required
                     className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700 disabled:opacity-50"
                     value={formData.sku}
                     onChange={handleChange}
                     disabled={isEdit}
                     placeholder="PROD-100-XYZ"
                   />
                 </div>
               </div>

               <div>
                 <label className="block text-sm font-bold text-slate-700 mb-2">Category Assignment</label>
                 <div className="relative">
                   <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <select
                     name="categoryId"
                     className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700 appearance-none bg-no-repeat"
                     value={formData.categoryId}
                     onChange={handleChange}
                   >
                     <option value="" disabled>Select a category</option>
                     {categories.map(cat => (
                       <option key={cat.categoryId} value={cat.categoryId}>{cat.categoryName}</option>
                     ))}
                   </select>
                 </div>
               </div>
            </div>

            <div className="space-y-6">
               <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Logistics & Value</h3>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">Unit of Measure</label>
                   <div className="relative">
                     <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                     <input
                       name="unitOfMeasure"
                       required
                       className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700"
                       value={formData.unitOfMeasure}
                       onChange={handleChange}
                       placeholder="pcs"
                     />
                   </div>
                 </div>
                 <div className="flex items-end">
                    <label className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer w-full group">
                      <input
                        type="checkbox"
                        name="isActive"
                        className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 transition-all"
                        checked={formData.isActive}
                        onChange={handleChange}
                      />
                      <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Active Status</span>
                    </label>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">Purchase Cost</label>
                   <div className="relative group">
                     <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                     <input
                       type="number"
                       name="cost"
                       step="0.01"
                       className="w-full pl-11 pr-4 py-3 bg-emerald-50/10 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all font-black text-emerald-700"
                       value={formData.cost}
                       onChange={handleChange}
                     />
                   </div>
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">List Price</label>
                   <div className="relative group">
                     <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={18} />
                     <input
                       type="number"
                       name="listPrice"
                       step="0.01"
                       className="w-full pl-11 pr-4 py-3 bg-blue-50/10 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-black text-blue-700"
                       value={formData.listPrice}
                       onChange={handleChange}
                     />
                   </div>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">Reorder Level</label>
                   <div className="relative group">
                     <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" size={18} />
                     <input
                       type="number"
                       name="reorderLevel"
                       className="w-full pl-11 pr-4 py-3 bg-orange-50/10 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 transition-all font-black text-orange-700"
                       value={formData.reorderLevel}
                       onChange={handleChange}
                       placeholder="Min stock for alert"
                     />
                   </div>
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">Safety Stock</label>
                   <div className="relative group">
                     <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500" size={18} />
                     <input
                       type="number"
                       name="safetyStock"
                       className="w-full pl-11 pr-4 py-3 bg-red-50/10 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 transition-all font-black text-red-700"
                       value={formData.safetyStock}
                       onChange={handleChange}
                       placeholder="Emergency reserve"
                     />
                   </div>
                 </div>
               </div>

               <div>
                 <label className="block text-sm font-bold text-slate-700 mb-2">Detailed Description</label>
                 <textarea
                   name="description"
                   rows="3"
                   className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700"
                   value={formData.description}
                   onChange={handleChange}
                   placeholder="Describe technical specifications or use cases..."
                 />
               </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="px-8 py-3.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-all"
            >
              Discard Changes
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-10 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-black rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center gap-2 active:scale-95"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              {isEdit ? 'Save Changes' : 'Initialize Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
