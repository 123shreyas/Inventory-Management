import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { Package, DollarSign, AlertTriangle, TrendingUp, History } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalValue: 0,
    lowStockCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [productsRes, valuationRes, stockRes, warehousesRes] = await Promise.all([
          apiClient.get('/Products?pageSize=1000'),
          apiClient.get('/Inventory/valuation'),
          apiClient.get('/Stock'),
          apiClient.get('/Warehouses')
        ]);

        const products = productsRes.data.items || [];
        const stockData = stockRes.data || [];
        const warehouses = warehousesRes.data || [];
        
        const lowStock = stockData.filter(s => s.quantityOnHand <= s.reorderLevel).length;

        setStats({
          totalProducts: products.length,
          totalValue: valuationRes.data.totalInventoryValue || 0,
          lowStockCount: lowStock,
        });

        // Aggregate stock by warehouse
        const distribution = warehouses.map(w => {
          const totalStock = stockData
            .filter(s => s.warehouseId === w.warehouseId)
            .reduce((sum, s) => sum + s.quantityOnHand, 0);
          return {
            name: w.warehouseName,
            stock: totalStock
          };
        }).filter(d => d.stock > 0);

        setChartData(distribution);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    { name: 'Total Products', value: stats.totalProducts, icon: <Package size={24} />, color: 'blue' },
    { name: 'Inventory Value', value: `₹${stats.totalValue.toLocaleString()}`, icon: <DollarSign size={24} />, color: 'green' },
    { name: 'Low Stock Alerts', value: stats.lowStockCount, icon: <AlertTriangle size={24} />, color: 'red' },
  ];

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div></div>;

  return (
    <div className="space-y-10 pb-12">
      <header>
        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Dashboard Overview</h2>
        <p className="text-slate-500 font-medium mt-2">Real-time inventory insights and performance metrics</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <div key={card.name} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6 transition-all hover:shadow-md">
            <div className={`p-4 rounded-2xl bg-${card.color}-50 text-${card.color}-600`}>
              {card.icon}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{card.name}</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp size={24} className="text-blue-600" />
              Stock Distribution
            </h3>
          </div>
          <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 600, fontSize: 12}} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 600, fontSize: 12}} />
                 <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                 <Bar dataKey="stock" radius={[6, 6, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899'][index % 5]} />
                    ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 mb-8">
            <History size={24} className="text-blue-600" />
            System Rules
          </h3>
          <ul className="space-y-6">
            <li className="flex items-start gap-4">
              <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
              <p className="text-slate-600 font-medium text-sm leading-relaxed">
                Stock alerts are automatically generated when quantities fall below the <span className="text-blue-600 font-bold">Reorder Level</span> defined in the product settings.
              </p>
            </li>
            <li className="flex items-start gap-4">
              <div className="h-2 w-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
              <p className="text-slate-600 font-medium text-sm leading-relaxed">
                Only <span className="text-emerald-600 font-bold">Admins</span> can perform product deletions and full inventory wipes.
              </p>
            </li>
            <li className="flex items-start gap-4">
              <div className="h-2 w-2 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
              <p className="text-slate-600 font-medium text-sm leading-relaxed">
                Inter-warehouse <span className="text-amber-600 font-bold">Transfers</span> require sufficient stock in the source location.
              </p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
