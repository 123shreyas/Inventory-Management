import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { AlertTriangle, ShieldAlert, Package, Warehouse, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';

const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { lastUpdate } = useInventory();

  const fetchAlerts = async () => {
    try {
      const res = await apiClient.get('/Stock');
      const stockData = res.data || [];
      const identifiedAlerts = stockData.map(s => {
        let type = 'optimal';
        let severity = 0;
        
        if (s.quantityOnHand <= s.safetyStock) {
          type = 'critical'; severity = 3;
        } else if (s.quantityOnHand <= s.reorderLevel) {
          type = 'low'; severity = 2;
        } else if (s.reorderLevel > 0 && s.quantityOnHand > (s.reorderLevel + s.safetyStock * 2)) {
          type = 'overstock'; severity = 1;
        }
        
        return { ...s, alertType: type, severity };
      }).filter(s => s.alertType !== 'optimal').sort((a, b) => b.severity - a.severity);
      
      setAlerts(identifiedAlerts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  // Re-fetch alerts when a real-time update is received
  useEffect(() => {
    if (lastUpdate) {
      console.log('Real-time update received in AlertsPage, re-fetching...');
      fetchAlerts();
    }
  }, [lastUpdate]);

  if (loading) return <div className="flex items-center justify-center min-h-[400px]">Scanning for alerts...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Active Stock Alerts</h2>
        <p className="text-slate-500 font-medium mt-1">Real-time notification of inventory health issues</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {alerts.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center space-y-4 shadow-sm">
            <div className="mx-auto h-16 w-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
              <ShieldAlert size={32} />
            </div>
            <p className="text-xl font-bold text-slate-900">All systems optimal</p>
            <p className="text-slate-500">No low stock, overstock, or critical inventory issues detected currently.</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const isCritical = alert.alertType === 'critical';
            const isOverstock = alert.alertType === 'overstock';
            
            let borderColor = 'border-amber-100';
            let iconBoxBg = 'bg-amber-100 text-amber-600';
            let badgeColors = 'bg-amber-500 text-white';
            let customBgColor = '';
            
            if (isCritical) {
               borderColor = 'border-red-200';
               iconBoxBg = 'bg-red-500 text-white';
               badgeColors = 'bg-red-600 text-white';
               customBgColor = 'bg-red-50/10';
            } else if (isOverstock) {
               borderColor = 'border-blue-200';
               iconBoxBg = 'bg-blue-100 text-blue-600';
               badgeColors = 'bg-blue-500 text-white';
               customBgColor = 'bg-blue-50/10';
            }

            return (
              <div key={alert.stockLevelId} className={`bg-white p-6 rounded-3xl border transition-all hover:shadow-md flex items-center gap-6 ${borderColor} ${customBgColor}`}>
                <div className={`p-4 rounded-2xl ${iconBoxBg}`}>
                  {isCritical ? <ShieldAlert size={24} /> : isOverstock ? <Package size={24} /> : <AlertTriangle size={24} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${badgeColors}`}>
                      {isCritical ? 'Critical' : isOverstock ? 'Overstock' : 'Low Stock'}
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-900 truncate">{alert.productName}</h3>
                  </div>
                  <div className="flex items-center gap-6 text-sm font-medium text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Warehouse size={14} />
                      {alert.warehouseName}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Package size={14} />
                      Qty: <span className={`font-bold ${isCritical ? 'text-red-600' : isOverstock ? 'text-blue-600' : 'text-slate-900'}`}>{alert.quantityOnHand}</span>
                    </div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase">Target Range: {alert.safetyStock} - {alert.reorderLevel + (alert.safetyStock * 2)}</div>
                  </div>
                </div>
                <Link
                  to="/stock-movement"
                  state={{ productId: alert.productId, warehouseId: alert.warehouseId, type: isOverstock ? 4 : 0 }}
                  className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded-2xl transition-all"
                >
                  <ArrowRight size={20} />
                </Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AlertsPage;
