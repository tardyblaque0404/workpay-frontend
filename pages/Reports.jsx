import React from 'react';
import { useState } from 'react';
import { MdBarChart, MdAccessTime, MdPayments, MdDownload } from 'react-icons/md';
import api from '../api';
import styles from './Reports.module.css';

const today = new Date();
const currentMonth = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`;

export default function Reports() {
  const [month,    setMonth]   = useState(currentMonth);
  const [attData,  setAttData] = useState(null);
  const [payData,  setPayData] = useState(null);
  const [loading,  setLoading] = useState({ att: false, pay: false });
  const [error,    setError]   = useState('');

  const loadAttendance = async () => {
    setLoading(l => ({...l, att:true})); setError('');
    try {
      const r = await api.get(`/reports/attendance?month=${month}`);
      setAttData(r.data);
    } catch { setError('Could not load attendance report.'); }
    finally { setLoading(l => ({...l, att:false})); }
  };

  const loadPayroll = async () => {
    setLoading(l => ({...l, pay:true})); setError('');
    try {
      const r = await api.get(`/reports/payroll?month=${month}`);
      setPayData(r.data);
    } catch { setError('Could not load payroll report.'); }
    finally { setLoading(l => ({...l, pay:false})); }
  };

  const downloadCSV = (data, filename) => {
    if (!data?.length) return;
    const keys = Object.keys(data[0]);
    const csv  = [keys.join(','), ...data.map(r => keys.map(k => r[k]).join(','))].join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Reports</h1>
          <p className={styles.sub}>Generate and export attendance & payroll data</p>
        </div>
        <input type="month" className={styles.monthPicker}
          value={month} onChange={e => setMonth(e.target.value)} />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.reportCards}>
        {/* Attendance Report */}
        <div className={styles.reportCard}>
          <div className={styles.cardHead}>
            <div className={styles.cardIcon} style={{background:'rgba(96,165,250,0.12)', color:'var(--info)'}}>
              <MdAccessTime />
            </div>
            <div>
              <h2 className={styles.cardTitle}>Attendance Report</h2>
              <p className={styles.cardSub}>Summary of presence, absences, and late arrivals</p>
            </div>
          </div>
          <button className={styles.generateBtn} onClick={loadAttendance} disabled={loading.att}>
            {loading.att ? 'Loading…' : <><MdBarChart /> Generate Report</>}
          </button>

          {attData && (
            <div className={styles.resultBox}>
              <div className={styles.resultHeader}>
                <p className={styles.resultTitle}>{attData.report} — {attData.data?.length} employees</p>
                <button className={styles.dlBtn} onClick={() => downloadCSV(attData.data, `attendance-${month}.csv`)}>
                  <MdDownload /> CSV
                </button>
              </div>
              <div className={styles.resultTable}>
                <div className={styles.rHead}>
                  <span>Employee</span><span>Present</span><span>Absent</span><span>Late</span><span>Half Day</span><span>Total</span>
                </div>
                {attData.data?.map(row => (
                  <div key={row.user_id} className={styles.rRow}>
                    <span className={styles.rName}>{row.full_name}</span>
                    <span className={styles.green}>{row.present || 0}</span>
                    <span className={styles.red}>{row.absent || 0}</span>
                    <span className={styles.yellow}>{row.late || 0}</span>
                    <span className={styles.blue}>{row.half_day || 0}</span>
                    <span className={styles.bold}>{row.total}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Payroll Report */}
        <div className={styles.reportCard}>
          <div className={styles.cardHead}>
            <div className={styles.cardIcon} style={{background:'rgba(74,222,128,0.1)', color:'var(--success)'}}>
              <MdPayments />
            </div>
            <div>
              <h2 className={styles.cardTitle}>Payroll Report</h2>
              <p className={styles.cardSub}>Net salaries, deductions, and payment status</p>
            </div>
          </div>
          <button className={styles.generateBtn} onClick={loadPayroll} disabled={loading.pay}>
            {loading.pay ? 'Loading…' : <><MdBarChart /> Generate Report</>}
          </button>

          {payData && (
            <div className={styles.resultBox}>
              <div className={styles.resultHeader}>
                <div>
                  <p className={styles.resultTitle}>{payData.report}</p>
                  <p className={styles.totalLine}>Total Net Pay: <strong>KES {Number(payData.total_net_salary).toLocaleString()}</strong></p>
                </div>
                <button className={styles.dlBtn} onClick={() => downloadCSV(payData.data, `payroll-${month}.csv`)}>
                  <MdDownload /> CSV
                </button>
              </div>
              <div className={styles.resultTable}>
                <div className={styles.rHead}>
                  <span>Employee</span><span>Days</span><span>Basic</span><span>Deductions</span><span>Net</span><span>Status</span>
                </div>
                {payData.data?.map(row => (
                  <div key={row.payroll_id} className={styles.rRow}>
                    <span className={styles.rName}>{row.full_name}</span>
                    <span>{row.days_worked}</span>
                    <span className={styles.mono}>KES {Number(row.basic_salary).toLocaleString()}</span>
                    <span className={styles.red}>-{Number(row.deductions).toLocaleString()}</span>
                    <span className={styles.green}>KES {Number(row.net_salary).toLocaleString()}</span>
                    <span>
                      <span className={`${styles.badge} ${styles[row.status]}`}>{row.status}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
