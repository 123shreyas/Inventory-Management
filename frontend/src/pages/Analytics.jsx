import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { useToast } from '../context/ToastContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, PieChart as PieIcon, History, Calendar, Calculator, ArrowUpRight, ArrowDownRight, Package } from 'lucide-react';
import Loader from '../components/ui/Loader';

const Analytics = () => {
  const [abcData, setAbcData] = useState([]);
  const [agingData, setAgingData] = useState([]);
  const [turnoverData, setTurnoverData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [abcRes, agingRes, turnoverRes] = await Promise.all([
        apiClient.get('/Reports/abc-analysis'),
        apiClient.get('/Reports/stock-aging'),
        apiClient.get('/Reports/turnover')
      ]);
      setAbcData(abcRes.data);
      setAgingData(agingRes.data);
      setTurnoverData(turnoverRes.data);
    } catch (error) {
      addToast('Failed to fetch analytics data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  const abcChartData = [
    { name: 'Category A (High Value)', value: abcData.filter(x => x.category === 'A').length },
    { name: 'Category B (Medium Value)', value: abcData.filter(x => x.category === 'B').length },
    { name: 'Category C (Low Value)', value: abcData.filter(x => x.category === 'C').length },
  ];

  if (loading) return <div className="flex justify-center p-12"><Loader size="lg" /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Inventory Analytics</h1>
          <p className="text-slate-500 font-medium">Business intelligence and data-driven inventory insights.</p>
        </div>
        <button
          onClick={fetchData}
          className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
          title="Refresh Data"
        >
          <History size={24} />
        </button>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <span className="flex items-center gap-1 text-emerald-500 text-sm font-bold bg-emerald-50 px-2 py-1 rounded-lg">
              <ArrowUpRight size={14} /> 12%
            </span>
          </div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Turnover Ratio</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-slate-900">{turnoverData?.turnoverRatio?.toFixed(2) || '0.00'}</h3>
            <span className="text-slate-400 font-bold text-sm">per period</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calculator size={24} />
            </div>
            <span className="flex items-center gap-1 text-slate-400 text-sm font-bold bg-slate-50 px-2 py-1 rounded-lg">
              Est. COGS
            </span>
          </div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Total COGS</p>
          <h3 className="text-3xl font-black text-slate-900">₹{turnoverData?.cogs?.toLocaleString()}</h3>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Package size={24} />
            </div>
            <span className="flex items-center gap-1 text-red-500 text-sm font-bold bg-red-50 px-2 py-1 rounded-lg">
              <ArrowDownRight size={14} /> 5%
            </span>
          </div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Avg. Inventory Value</p>
          <h3 className="text-3xl font-black text-slate-900">₹{turnoverData?.averageInventory?.toLocaleString()}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ABC Analysis Chart */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <PieIcon className="text-blue-600" size={24} />
            <h3 className="text-xl font-bold text-slate-900">ABC Classification</h3>
          </div>
          
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={abcChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {abcChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 p-4 bg-slate-50 rounded-2xl">
            <p className="text-xs text-slate-500 font-medium italic">
              *Category A represents the top 70% of total inventory value. Category C represents the bottom 10%.
            </p>
          </div>
        </div>

        {/* Stock Aging Summary */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <History className="text-blue-600" size={24} />
            <h3 className="text-xl font-bold text-slate-900">Stock Aging Report</h3>
          </div>

          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
            {agingData.length === 0 ? (
              <p className="text-center text-slate-400 py-12">No batch data available for aging report.</p>
            ) : (
              agingData.map((batch, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black ${batch.status === 'Old' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {batch.daysInStock}d
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">Batch: {batch.batchNumber}</p>
                      <p className="text-xs text-slate-400 font-medium">Quantity in Stock: {batch.quantity}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${batch.status === 'Old' ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {batch.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
