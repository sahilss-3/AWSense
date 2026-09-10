import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  AlertTriangle,
  Flame,
  CheckCircle,
  TrendingDown
} from 'lucide-react';
import { ReportSummary } from '../types';
import { api } from '../services/api';

export const ReportsPage: React.FC = () => {
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<string>('Data Quality Report');

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await api.getReports();
      setReport(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const exportSummaryCSV = () => {
    if (!report) return;
    const lines = [
      'AWSense Meteorological Data Quality Report',
      `Generated At,${report.generated_at}`,
      `Total Observations,${report.total_observations}`,
      `Valid Observations,${report.valid_observations}`,
      `Anomalous Observations,${report.anomalous_observations}`,
      `Data Reliability,${report.data_reliability}%`,
      `Critical Sensors,${report.critical_sensors}`,
      '',
      'Station,Reliability,Max Failure Risk,Status',
      ...report.station_risk_rankings.map((s) => `${s.name},${s.reliability}%,${s.max_risk}%,${s.status}`)
    ];
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AWSense_DataQuality_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9DEE5] pb-5">
        <div>
          <h1 className="text-xl font-bold font-mono tracking-tight text-[#12355B] flex items-center gap-2">
            <FileText className="text-[#1F4E79]" size={20} />
            Meteorological Data Quality & Station Reliability Reports
          </h1>
          <p className="mt-1 text-xs text-[#5B6573]">
            Compliance auditing, data reliability indices, and predictive sensor degradation risk summaries
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded border border-[#D9DEE5] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1F4E79] hover:bg-[#F4F6F8] shadow-sm transition-colors"
          >
            <Printer size={13} />
            <span>Print Report</span>
          </button>
          <button
            onClick={exportSummaryCSV}
            className="flex items-center gap-1.5 rounded border border-[#12355B] bg-[#12355B] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#1F4E79] shadow-sm transition-colors"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          'Data Quality Report',
          'Station Health Report',
          'Sensor Reliability Report',
          'Anomaly Summary',
          'Maintenance Risk Report'
        ].map((t) => (
          <button
            key={t}
            onClick={() => setReportType(t)}
            className={`rounded px-3.5 py-1.5 text-xs font-sans font-medium transition-colors shadow-xs ${
              reportType === t
                ? 'bg-[#12355B] text-white font-semibold'
                : 'bg-white border border-[#D9DEE5] text-[#5B6573] hover:text-[#1F2937] hover:bg-[#F8FAFC]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Main Report Document Container */}
      <div className="rounded-lg border border-[#D9DEE5] bg-white p-6 space-y-6 shadow-sm print:shadow-none print:border-none print:p-0">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D9DEE5]">
          <div>
            <div className="text-[10px] font-mono tracking-widest text-[#1F4E79] font-bold uppercase">
              SIH26073 • MetOps Audit Verification
            </div>
            <h2 className="text-lg font-bold font-mono text-[#12355B] mt-0.5">
              {reportType}
            </h2>
            <p className="text-xs text-[#5B6573]">
              Generated: {report?.generated_at ? new Date(report.generated_at).toLocaleString() : 'Recent'}
            </p>
          </div>

          <div className="text-left sm:text-right font-mono text-xs">
            <span className="text-[#5B6573] block">Overall Network Quality</span>
            <span className="text-2xl font-bold text-[#1F4E79]">
              {report?.data_reliability.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* 4 Summary Highlight Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
          <div className="rounded bg-[#F8FAFC] p-4 border border-[#E5E7EB]">
            <span className="text-[#5B6573] text-[10px] block uppercase font-bold tracking-wider">Total Observations</span>
            <span className="text-xl font-bold text-[#12355B] mt-1 block">{report?.total_observations}</span>
            <span className="text-[10px] text-[#5B6573]">T, P, RH records</span>
          </div>

          <div className="rounded bg-[#F8FAFC] p-4 border border-[#E5E7EB]">
            <span className="text-[#5B6573] text-[10px] block uppercase font-bold tracking-wider">Valid Observations</span>
            <span className="text-xl font-bold text-[#198754] mt-1 block">{report?.valid_observations}</span>
            <span className="text-[10px] text-[#5B6573]">Traceability verified</span>
          </div>

          <div className="rounded bg-[#F8FAFC] p-4 border border-[#E5E7EB]">
            <span className="text-[#5B6573] text-[10px] block uppercase font-bold tracking-wider">Anomalous Cycles</span>
            <span className="text-xl font-bold text-[#C62828] mt-1 block">{report?.anomalous_observations}</span>
            <span className="text-[10px] text-[#5B6573]">Flagged & quarantined</span>
          </div>

          <div className="rounded bg-[#F8FAFC] p-4 border border-[#E5E7EB]">
            <span className="text-[#5B6573] text-[10px] block uppercase font-bold tracking-wider">Critical Sensors</span>
            <span className="text-xl font-bold text-[#D99A00] mt-1 block">{report?.critical_sensors}</span>
            <span className="text-[10px] text-[#5B6573]">Elevated failure risk</span>
          </div>
        </div>

        {/* Anomaly Breakdown Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#12355B] font-mono">
            Anomaly Classification Breakdown
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            {report?.anomaly_breakdown &&
              Object.entries(report.anomaly_breakdown).map(([k, v]) => (
                <div key={k} className="rounded bg-[#F8FAFC] p-3 border border-[#E5E7EB] flex justify-between items-center">
                  <span className="text-[#374151] truncate font-medium">{k.replace(/_/g, ' ')}</span>
                  <span className="font-bold text-[#1F4E79]">{v}</span>
                </div>
              ))}
          </div>
        </div>

        {/* High Risk Stations Ranking */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#12355B] font-mono">
            Station Degradation & Maintenance Risk Ranking
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#D9DEE5] bg-[#F8FAFC] text-[11px] text-[#5B6573] uppercase font-semibold">
                  <th className="py-2.5 px-3">Station Name</th>
                  <th className="py-2.5 px-3">Data Reliability</th>
                  <th className="py-2.5 px-3">Peak Sensor Failure Risk</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {report?.station_risk_rankings.map((st) => (
                  <tr key={st.station_id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-2.5 px-3 font-bold text-[#12355B]">{st.name}</td>
                    <td className="py-2.5 px-3 text-[#1F2937]">{st.reliability.toFixed(1)}%</td>
                    <td className="py-2.5 px-3">
                      <span className={st.max_risk > 50 ? 'text-[#C62828] font-bold' : st.max_risk > 25 ? 'text-[#D99A00] font-bold' : 'text-[#198754] font-medium'}>
                        {st.max_risk.toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold ${
                        st.status === 'HEALTHY' ? 'bg-[#DCFCE7] text-[#166534] border border-[#86EFAC]' :
                        st.status === 'WARNING' ? 'bg-[#FEF9C3] text-[#854D0E] border border-[#FDE047]' :
                        st.status === 'CRITICAL' ? 'bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]' :
                        'bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1]'
                      }`}>
                        {st.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
