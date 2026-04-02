import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { Tag, Plus, Edit2, Trash2, Save, X, Layers } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import Modal from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentCategory, setCurrentCategory] = useState({
    categoryName: '',
    description: ''
  });
  const { addToast } = useToast();
  const { hasRole } = useAuth();

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/Categories');
      setCategories(res.data || []);
    } catch (err) {
      addToast('Failed to fetch categories.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (category = null) => {
    if (category) {
      setIsEdit(true);
      setCurrentCategory(category);
    } else {
      setIsEdit(false);
      setCurrentCategory({
        categoryName: '',
        description: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentCategory({
      categoryName: '',
      description: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await apiClient.put(`/Categories/${currentCategory.categoryId}`, currentCategory);
        addToast('Category updated successfully.', 'success');
      } else {
        await apiClient.post('/Categories', currentCategory);
        addToast('Category added successfully.', 'success');
      }
      handleCloseModal();
      fetchData();
    } catch (err) {
      addToast('Failed to save category.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category? This might fail if there are products associated with it.')) {
      try {
        await apiClient.delete(`/Categories/${id}`);
        addToast('Category deleted successfully.', 'success');
        fetchData();
      } catch (err) {
        addToast('Failed to delete category. Ensure it is empty of products.', 'error');
      }
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading categories...</div>;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Product Categories</h2>
          <p className="text-slate-500 font-medium mt-1">Organize and classify your inventory items</p>
        </div>
        {hasRole(['Admin', 'InventoryManager']) && (
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-200"
          >
            <Plus size={20} />
            Add Category
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(c => (
          <div key={c.categoryId} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all group relative">
             <div className="flex items-center gap-4 mb-4">
                 <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                     <Tag size={24} />
                 </div>
                 <div className="flex-1 min-w-0">
                     <h3 className="text-lg font-bold text-slate-900 truncate">{c.categoryName}</h3>
                     <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">ID: {c.categoryId.substring(0,8)}</span>
                 </div>
                 {hasRole(['Admin', 'InventoryManager']) && (
                   <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenModal(c)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(c.categoryId)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                   </div>
                 )}
             </div>
             <div className="space-y-3">
                 <p className="text-sm text-slate-600 leading-relaxed min-h-[40px]">
                    {c.description || <span className="italic text-slate-400 text-xs">No description provided</span>}
                 </p>
                 <div className="pt-2 border-t border-slate-50 flex items-center gap-2 text-indigo-600">
                    <Layers size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">Product Class</span>
                 </div>
             </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-3xl border border-slate-100">
             No product categories registered yet.
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={isEdit ? 'Edit Category' : 'Add New Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 block">Category Name</label>
              <input
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-medium outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner"
                value={currentCategory.categoryName}
                onChange={(e) => setCurrentCategory({ ...currentCategory, categoryName: e.target.value })}
                placeholder="e.g. Office Supplies, Electronics"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 block">Description</label>
              <textarea
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-medium outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner min-h-[100px]"
                value={currentCategory.description}
                onChange={(e) => setCurrentCategory({ ...currentCategory, description: e.target.value })}
                placeholder="Briefly describe what this category includes"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-emerald-100 uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <Save size={20} />
            {isEdit ? 'Update Category' : 'Create Category'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Categories;
