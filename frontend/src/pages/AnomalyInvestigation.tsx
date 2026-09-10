import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle,
  AlertCircle,
  Wrench,
  HelpCircle,
  ArrowLeft,
  Flame,
  Cpu,
  TrendingDown,
  ShieldAlert,
  Clock
} from 'lucide-react';
import { Anomaly, SensorReading, IncidentStatus } from '../types';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { ContributionBar } from '../components/common/ContributionBar';
import { TimeSeriesChart } from '../components/charts/TimeSeriesChart';
import { api } from '../services/api';

interface AnomalyInvestigationProps {
  anomaly: Anomaly | null;
  anomaliesList: Anomaly[];
  onBackToList: () => void;
  onSelectAnomaly: (anomaly: Anomaly) => void;
  onAlertStatusUpdated?: () => void;
}

export const AnomalyInvestigation: React.FC<AnomalyInvestigationProps> = ({
  anomaly,
  anomaliesList,
  onBackToList,
  onSelectAnomaly,
  onAlertStatusUpdated
}) => {
  const [currentAnomaly, setCurrentAnomaly] = useState<Anomaly | null>(anomaly || anomaliesList[0] || null);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [status, setStatus] = useState<IncidentStatus>(anomaly?.status || 'New');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (anomaly) {
      setCurrentAnomaly(anomaly);
      setStatus(anomaly.status);
    } else if (anomaliesList.length > 0 && !currentAnomaly) {
      setCurrentAnomaly(anomaliesList[0]);
      setStatus(anomaliesList[0].status);
    }
  }, [anomaly, anomaliesList]);

  useEffect(() => {
    if (currentAnomaly) {
      api.getReadings(currentAnomaly.station_id, 36)
        .then((data) => setReadings(data))
        .catch((err) => console.error('Failed to load readings for investigation chart', err));
    }
  }, [currentAnomaly]);

  const handleUpdateStatus = async (newStatus: IncidentStatus) => {
    if (!currentAnomaly) return;
    setActionLoading(true);
    try {
      const alerts = await api.getAlerts();
      const match = alerts.find((a) => a.anomaly_id === currentAnomaly.id);
      if (match) {
        await api.updateAlertStatus(match.id, newStatus);
      }
      setStatus(newStatus);
      setCurrentAnomaly({ ...currentAnomaly, status: newStatus });
      if (onAlertStatusUpdated) onAlertStatusUpdated();
    } catch (e) {
      console.error('Failed to update status', e);
    } finally {
      setActionLoading(false);
    }
  };

  if (!currentAnomaly) {
    return (
      <div className="py-16 text-center space-y-4 bg-white rounded-lg border border-[#D9DEE5] p-8 shadow-card">
        <p className="text-[#5B6573] text-sm">No anomaly selected for diagnostic investigation.</p>
        <button
          onClick={onBackToList}
          className="rounded bg-[#12355B] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0D2744] transition-colors"
        >
          View All Detected Anomalies
        </button>
      </div>
    );
  }

  const unit = currentAnomaly.parameter === 'temperature' ? '°C' : (currentAnomaly.parameter === 'pressure' ? ' hPa' : '%');

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border border-[#D9DEE5] rounded-lg bg-white p-4 shadow-card">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToList}
            className="rounded border border-[#D9DEE5] bg-white p-2 text-[#5B6573] hover:bg-[#F4F6F8] hover:text-[#12355B] transition-colors"
            title="Back to anomaly list"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#5B6573]">
              Diagnostic Audit Record • Incident ID: {currentAnomaly.id}
            </span>
            <h1 className="text-lg font-bold font-sans text-[#12355B] flex items-center gap-2">
              <Search className="text-[#1F4E79]" size={18} />
              Anomaly Investigation: {currentAnomaly.anomaly_type.replace(/_/g, ' ')}
            </h1>
          </div>
        </div>

        {/* Quick switcher between anomalies */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#5B6573] font-medium hidden sm:inline">Select Anomaly:</span>
          <select
            value={currentAnomaly.id}
            onChange={(e) => {
              const selected = anomaliesList.find((a) => a.id === e.target.value);
              if (selected) {
                setCurrentAnomaly(selected);
                setStatus(selected.status);
              }
            }}
            className="rounded border border-[#D9DEE5] bg-[#F4F6F8] px-3 py-1.5 font-mono text-xs text-[#1F2937] focus:border-[#12355B] focus:bg-white focus:outline-none cursor-pointer"
          >
            {anomaliesList.map((a) => (
              <option key={a.id} value={a.id}>
                {a.station_id} • {a.parameter} • {a.anomaly_type.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Header Diagnostic Card */}
      <div className="rounded-lg border border-[#D9DEE5] bg-white p-5 shadow-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2]">
              <ShieldAlert size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold font-sans text-[#12355B]">ANOMALOUS OBSERVATION FLAGGED</span>
                <SeverityBadge severity={currentAnomaly.severity} />
                <span className="rounded bg-[#F8FAFC] border border-[#D9DEE5] px-2 py-0.5 text-[11px] font-sans font-semibold text-[#5B6573]">
                  Status: {status}
                </span>
              </div>
              <p className="text-xs text-[#5B6573] font-mono mt-0.5">
                Station: <strong className="text-[#1F2937]">{currentAnomaly.station_id}</strong> • Parameter: <strong className="text-[#1F2937] uppercase">{currentAnomaly.parameter}</strong> • Detected: {new Date(currentAnomaly.timestamp).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={actionLoading || status === 'Acknowledged'}
              onClick={() => handleUpdateStatus('Acknowledged')}
              className="rounded border border-[#D9DEE5] bg-white px-3 py-1.5 text-xs font-semibold text-[#1F2937] hover:bg-[#F4F6F8] transition-colors disabled:opacity-50"
            >
              Acknowledge
            </button>
            <button
              disabled={actionLoading || status === 'Investigating'}
              onClick={() => handleUpdateStatus('Investigating')}
              className="rounded border border-[#FFE082] bg-[#FFF8E1] px-3 py-1.5 text-xs font-semibold text-[#B78103] hover:bg-[#FEF0C7] transition-colors disabled:opacity-50"
            >
              Mark Investigating
            </button>
            <button
              disabled={actionLoading || status === 'Resolved'}
              onClick={() => handleUpdateStatus('Resolved')}
              className="rounded border border-[#C8E6C9] bg-[#E8F5E9] px-3 py-1.5 text-xs font-bold text-[#12633D] hover:bg-[#D4EDDA] transition-colors disabled:opacity-50"
            >
              Resolve Anomaly
            </button>
          </div>
        </div>

        {/* 6 Key Verification Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
          <div className="rounded border border-[#D9DEE5] bg-[#F8FAFC] p-3">
            <span className="text-[#5B6573] text-[10px] block uppercase font-sans font-semibold">Observed Value</span>
            <span className="text-lg font-bold text-[#1F2937]">
              {currentAnomaly.observed_value} {unit}
            </span>
          </div>

          <div className="rounded border border-[#D9DEE5] bg-[#F8FAFC] p-3">
            <span className="text-[#5B6573] text-[10px] block uppercase font-sans font-semibold">AI Expected</span>
            <span className="text-lg font-bold text-[#1F4E79]">
              {currentAnomaly.expected_value} {unit}
            </span>
          </div>

          <div className="rounded border border-[#D9DEE5] bg-[#F8FAFC] p-3">
            <span className="text-[#5B6573] text-[10px] block uppercase font-sans font-semibold">Deviation</span>
            <span className={`text-lg font-bold ${Math.abs(currentAnomaly.deviation) > 4 ? 'text-[#C62828]' : 'text-[#1F2937]'}`}>
              {currentAnomaly.deviation > 0 ? `+${currentAnomaly.deviation}` : currentAnomaly.deviation} {unit}
            </span>
          </div>

          <div className="rounded border border-[#D9DEE5] bg-[#F8FAFC] p-3">
            <span className="text-[#5B6573] text-[10px] block uppercase font-sans font-semibold">Anomaly Score</span>
            <span className="text-lg font-bold text-[#C62828]">
              {currentAnomaly.anomaly_score.toFixed(2)}
            </span>
            <span className="text-[10px] text-[#5B6573] block font-sans">Scale 0.0 - 1.0</span>
          </div>

          <div className="rounded border border-[#D9DEE5] bg-[#F8FAFC] p-3">
            <span className="text-[#5B6573] text-[10px] block uppercase font-sans font-semibold">AI Confidence</span>
            <span className="text-lg font-bold text-[#12355B]">
              {currentAnomaly.confidence.toFixed(0)}%
            </span>
            <span className="text-[10px] text-[#5B6573] block font-sans">Deterministic ML</span>
          </div>

          <div className="rounded border border-[#D9DEE5] bg-[#F8FAFC] p-3">
            <span className="text-[#5B6573] text-[10px] block uppercase font-sans font-semibold">Classification</span>
            <span className="text-xs font-sans font-bold text-[#1F2937] block truncate">
              {currentAnomaly.anomaly_type.replace(/_/g, ' ')}
            </span>
            <span className="text-[10px] text-[#5B6573] font-sans font-semibold">{currentAnomaly.severity} Severity</span>
          </div>
        </div>
      </div>

      {/* Contextual Time Series Graph */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#12355B] flex items-center gap-2 font-sans">
            <Clock size={16} className="text-[#1F4E79]" />
            Telemetry Context Graph (Observed vs AI Expected Baseline)
          </h2>
          <span className="text-xs font-mono text-[#5B6573]">
            Surrounding temporal observation window
          </span>
        </div>
        <TimeSeriesChart
          data={readings}
          parameter={currentAnomaly.parameter}
          height={320}
        />
      </div>

      {/* Two Column Section: Why did AI flag this? + Root Cause & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* WHY DID AI FLAG THIS? (6 cols) */}
        <div className="lg:col-span-6 rounded-lg border border-[#D9DEE5] bg-white p-5 space-y-4 shadow-card">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#12355B] flex items-center gap-2 font-sans">
                <Cpu size={16} className="text-[#1F4E79]" />
                WHY DID AI FLAG THIS?
              </h3>
              <p className="text-xs text-[#5B6573]">Factor contribution analysis from statistical & physics models</p>
            </div>
          </div>

          <div className="space-y-2.5">
            <ContributionBar
              label="Temporal Deviation"
              percentage={currentAnomaly.temporal_deviation}
              description="Departure from rolling mean and standard deviation"
              colorType="danger"
            />
            <ContributionBar
              label="Rate of Change"
              percentage={currentAnomaly.rate_of_change}
              description="First-order derivative step (dX/dt) within observation interval"
              colorType="danger"
            />
            <ContributionBar
              label="Historical Deviation"
              percentage={currentAnomaly.historical_deviation}
              description="Departure from multi-day diurnal baseline expectation"
              colorType="warning"
            />
            <ContributionBar
              label="Psychrometric Humidity Consistency"
              percentage={currentAnomaly.humidity_consistency}
              description="Thermodynamic coupling with Magnus-Tetens vapor curve"
              colorType="info"
            />
            <ContributionBar
              label="Barometric Pressure Consistency"
              percentage={currentAnomaly.pressure_consistency}
              description="Atmospheric surface pressure equilibrium check"
              colorType="info"
            />
          </div>

          {/* AI REASONING BOX */}
          <div className="rounded-lg border border-[#D9DEE5] bg-[#EBF3FA] p-4 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#12355B] flex items-center gap-1.5 font-sans">
              <Cpu size={14} />
              AI Reasoning Engine Diagnostic
            </span>
            <p className="text-xs text-[#1F2937] leading-relaxed font-sans">
              {currentAnomaly.explanation}
            </p>
          </div>
        </div>

        {/* LIKELY ROOT CAUSE & RECOMMENDED ACTION (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Likely Root Cause Card */}
          <div className="rounded-lg border border-[#D9DEE5] bg-white p-5 space-y-3 shadow-card">
            <div className="flex items-center gap-2">
              <HelpCircle size={16} className="text-[#D99A00]" />
              <h3 className="text-sm font-bold text-[#12355B] font-sans">LIKELY ROOT CAUSE</h3>
            </div>
            <div className="rounded border border-[#D9DEE5] bg-[#F8FAFC] p-3.5">
              <div className="font-bold text-sm text-[#1F2937] font-mono">
                {currentAnomaly.root_cause}
              </div>
              <p className="text-xs text-[#5B6573] mt-1 font-sans">
                Diagnostic derived from divergence dynamics, step velocity, and historical sensor stability.
              </p>
            </div>
          </div>

          {/* Recommended Action Card */}
          <div className="rounded-lg border border-[#D9DEE5] bg-white p-5 space-y-3 shadow-card">
            <div className="flex items-center gap-2">
              <Wrench size={16} className="text-[#198754]" />
              <h3 className="text-sm font-bold text-[#12355B] font-sans">RECOMMENDED ACTION</h3>
            </div>
            <div className="rounded border border-[#C8E6C9] bg-[#E8F5E9] p-3.5 space-y-2">
              <p className="text-xs font-bold text-[#12633D] font-sans">
                {currentAnomaly.recommended_action}
              </p>
              <div className="text-[11px] text-[#5B6573] space-y-1 pt-2 border-t border-[#C8E6C9] font-sans">
                <div>• Compare subsequent readings to verify transient vs permanent transducer defect.</div>
                <div>• Cross-reference adjacent synoptic AWS stations to ensure no localized squall.</div>
                <div>• Verify ADC calibration logs before manual physical transducer replacement.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
