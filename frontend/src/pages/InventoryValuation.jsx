import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { DollarSign, BarChart2, TrendingUp, Package } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const InventoryValuation = () => {
  const [products, setProducts] = useState([]);
  const [valuationData, setValuationData] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [prodRes, stockRes] = await Promise.all([
          apiClient.get('/Products?pageSize=1000'),
          apiClient.get('/Stock')
        ]);
        
        const prodItems = prodRes.data.items || [];
        const stockItems = stockRes.data || [];
        
        setProducts(prodItems);
        
        // Compute valuation per product
        let overallTotal = 0;
        const valData = prodItems.map(p => {
          const productStock = stockItems.filter(s => s.productId === p.productId);
          const totalQty = productStock.reduce((sum, s) => sum + (s.quantityOnHand || 0), 0);
          const val = totalQty * (p.cost || 0);
          overallTotal += val;
          return {
            ...p,
            totalQuantity: totalQty,
            totalValue: val
          };
        }).filter(v => v.totalQuantity > 0).sort((a, b) => b.totalValue - a.totalValue);
        
        setValuationData(valData);
        setTotalValue(overallTotal);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6'];
  const topCategories = valuationData.slice(0, 6).map((item, index) => ({
    name: item.productName,
    value: item.totalValue,
    color: COLORS[index % COLORS.length]
  }));

  if (loading) return <div className="flex items-center justify-center min-h-[400px]">Calculating valuation...</div>;

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Inventory Valuation</h2>
        <p className="text-slate-500 font-medium mt-1">Financial overview of your current stock levels</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-600 outline outline-4 outline-emerald-600/20 outline-offset-4 p-8 rounded-3xl shadow-xl flex items-center gap-6">
            <div className={`p-4 rounded-2xl bg-white/20 text-white backdrop-blur-sm`}>
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-100 uppercase tracking-widest">Total Asset Value</p>
              <p className="text-4xl font-black text-white mt-1">₹{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6">
            <div className={`p-4 rounded-2xl bg-blue-50 text-blue-600`}>
              <Package size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Active Valued Products</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{valuationData.length}</p>
            </div>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6">
            <div className={`p-4 rounded-2xl bg-indigo-50 text-indigo-600`}>
              <BarChart2 size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Valuation Method</p>
              <p className="text-2xl font-black text-slate-900 mt-1">FIFO / Avg Cost</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center gap-4 justify-between">
              <h3 className="text-lg font-bold text-slate-900">Value Distribution by Product</h3>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Product</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">In Stock Qty</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Unit Cost</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Total Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {valuationData.map((item) => (
                    <tr key={item.productId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">{item.productName}</span>
                          <span className="text-xs font-medium text-slate-400">{item.sku}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                          <span className="text-sm font-bold text-slate-700">{item.totalQuantity} <span className="text-slate-400 text-xs font-medium">{item.unitOfMeasure}</span></span>
                      </td>
                      <td className="px-6 py-4 text-right">
                          <span className="text-sm font-medium text-slate-600">₹{(item.cost || 0).toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                          <span className="text-base font-black text-emerald-600">₹{item.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </td>
                    </tr>
                  ))}
                  {valuationData.length === 0 && (
                      <tr>
                          <td colSpan="4" className="px-6 py-12 text-center text-slate-500 font-medium">No stock data available to calculate valuation.</td>
                      </tr>
                  )}
                </tbody>
              </table>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-500" />
                Value Concentration Top 6
            </h3>
            
            <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={topCategories}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={110}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {topCategories.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip 
                            formatter={(value) => `₹${value.toLocaleString()}`}
                            contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            
            <div className="mt-8 space-y-3">
                {topCategories.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}}></div>
                            <span className="text-sm font-bold text-slate-700 truncate max-w-[120px] sm:max-w-[150px]">{item.name}</span>
                        </div>
                        <span className="text-sm font-black text-slate-900">
                            ₹{(item.value > 1000 ? (item.value/1000).toFixed(1) + 'k' : item.value)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryValuation;
