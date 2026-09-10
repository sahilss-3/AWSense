import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Radio,
  HeartPulse,
  AlertTriangle,
  Wrench,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { Insight } from '../types';
import { api } from '../services/api';

export const AIInsightsPage: React.FC = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const loadInsights = async () => {
    setLoading(true);
    try {
      const data = await api.getInsights();
      setInsights(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  const filtered = activeCategory === 'ALL' ? insights : insights.filter((i) => i.category === activeCategory);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Network':
        return <Radio size={16} className="text-[#1F4E79]" />;
      case 'Sensor':
        return <HeartPulse size={16} className="text-[#1F4E79]" />;
      case 'Anomaly':
        return <AlertTriangle size={16} className="text-[#C62828]" />;
      case 'Maintenance':
        return <Wrench size={16} className="text-[#D99A00]" />;
      default:
        return <Sparkles size={16} className="text-[#1F4E79]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9DEE5] pb-5">
        <div>
          <h1 className="text-xl font-bold font-mono tracking-tight text-[#12355B] flex items-center gap-2">
            <Sparkles className="text-[#1F4E79]" size={20} />
            Data-Driven Telemetry Insights
          </h1>
          <p className="mt-1 text-xs text-[#5B6573]">
            Algorithmic patterns synthesized directly from local station time-series observations
          </p>
        </div>

        <button
          onClick={loadInsights}
          className="flex items-center gap-2 rounded border border-[#D9DEE5] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1F4E79] hover:bg-[#F4F6F8] shadow-sm transition-colors self-start"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {['ALL', 'Network', 'Sensor', 'Anomaly', 'Maintenance'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded px-3.5 py-1.5 text-xs font-sans font-medium transition-colors shadow-xs ${
              activeCategory === cat
                ? 'bg-[#12355B] text-white font-semibold'
                : 'bg-white border border-[#D9DEE5] text-[#5B6573] hover:text-[#1F2937] hover:bg-[#F8FAFC]'
            }`}
          >
            {cat === 'ALL' ? 'All Categories' : `${cat} Insights`}
          </button>
        ))}
      </div>

      {/* Insights Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => {
          const isCritical = item.severity === 'Critical';
          const isWarning = item.severity === 'Warning';

          return (
            <div
              key={item.id}
              className={`rounded-lg border bg-white p-5 space-y-3 transition-all hover:shadow-md ${
                isCritical
                  ? 'border-[#C62828] ring-1 ring-[#C62828]/20'
                  : isWarning
                  ? 'border-[#D99A00]'
                  : 'border-[#D9DEE5]'
              }`}
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-[#E5E7EB]">
                <div className="flex items-center gap-2.5">
                  <div className="rounded bg-[#F4F6F8] p-2 border border-[#D9DEE5]">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div>
                    <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-[#5B6573] block">
                      {item.category} Insight
                    </span>
                    <span className="text-xs font-semibold text-[#12355B]">
                      {item.station_id || 'Network-wide'}
                    </span>
                  </div>
                </div>

                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-sans font-semibold uppercase ${
                    isCritical
                      ? 'bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]'
                      : isWarning
                      ? 'bg-[#FEF9C3] text-[#854D0E] border border-[#FDE047]'
                      : 'bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]'
                  }`}
                >
                  {item.severity}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#12355B] leading-snug">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs text-[#374151] leading-relaxed font-sans">
                  {item.description}
                </p>
              </div>

              <div className="pt-2.5 border-t border-[#E5E7EB] flex items-center justify-between text-[10px] font-mono text-[#5B6573]">
                <span>Algorithmic Telemetry Synthesis</span>
                <span>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
