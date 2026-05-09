import { useEffect, useState } from 'react';
import { MdAdd, MdCheckCircle, MdPayments } from 'react-icons/md';
import api from '../api';
import { useAuth } from '../AuthContext';
import styles from './Payroll.module.css';

const today = new Date();
const currentMonth = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`;

const statusMeta = {
  draft:    { label:'Draft',    cls:'draft'    },
  approved: { label:'Approved', cls:'approved' },
  paid:     { label:'Paid',     cls:'paid'     },
};

export default function Payroll() {
  const { user } = useAuth();
  const isAdmin  = user?.role === 'admin' || user?.role === 'manager';

  const [payrolls,   setPayrolls]   = useState([]);
  const [employees,  setEmployees]  = useState([]);
  const [month,      setMonth]      = useState(currentMonth);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(false);
  const [bulkModal,  setBulkModal]  = useState(false);
  const [genForm,    setGenForm]    = useState({ user_id:'', month: currentMonth, working_days:26, overtime_pay:0, bonuses:0, deductions:0 });
  const [msg, setMsg] = useState('');

  const load = () => {
    setLoading(true);
    api.get(`/payroll/?month=${month}`).then(r => setPayrolls(r.data.payrolls)).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    if (isAdmin) api.get('/users/').then(r => setEmployees(r.data.users.filter(u => u.role === 'employee')));
  }, [month]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payroll/generate', genForm);
      setModal(false); setMsg('✅ Payroll generated!'); load();
    } catch (err) { setMsg(err.response?.data?.error || 'Error generating payroll.'); }
  };

  const handleBulk = async () => {
    try {
      const r = await api.post('/payroll/generate-all', { month, working_days: 26 });
      setBulkModal(false);
      setMsg(`✅ Generated: ${r.data.generated.length}, Skipped: ${r.data.skipped.length}`);
      load();
    } catch (err) { setMsg(err.response?.data?.error || 'Error.'); }
  };

  const updateStatus = async (id, status) => {
    await api.put(`/payroll/${id}/status`, { status });
    load();
  };

  const totalNet = payrolls.reduce((s, p) => s + parseFloat(p.net_salary), 0);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Payroll</h1>
          <p className={styles.sub}>Manage and generate employee payrolls</p>
        </div>
        <div className={styles.headerRight}>
          <input type="month" className={styles.monthPicker}
            value={month} onChange={e => setMonth(e.target.value)} />
          {isAdmin && <>
            <button className={styles.bulkBtn} onClick={() => setBulkModal(true)}><MdPayments /> Generate All</button>
            <button className={styles.addBtn}  onClick={() => { setModal(true); setGenForm({...genForm, month}); }}><MdAdd /> Generate</button>
          </>}
        </div>
      </div>

      {/* Summary strip */}
      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Total Employees</p>
          <p className={styles.summaryVal}>{payrolls.length}</p>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Total Net Pay</p>
          <p className={`${styles.summaryVal} ${styles.green}`}>KES {totalNet.toLocaleString()}</p>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Paid Out</p>
          <p className={`${styles.summaryVal} ${styles.blue}`}>{payrolls.filter(p => p.status === 'paid').length}</p>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Pending</p>
          <p className={`${styles.summaryVal} ${styles.yellow}`}>{payrolls.filter(p => p.status !== 'paid').length}</p>
        </div>
      </div>

      {msg && <p className={styles.toast}>{msg}</p>}

      {loading ? <p className={styles.loader}>Loading…</p> : (
        <div className={styles.table}>
          <div className={styles.thead}>
            {isAdmin && <span>Employee</span>}
            <span>Month</span><span>Days</span><span>Basic</span>
            <span>Deductions</span><span>Net Salary</span><span>Status</span>
            {isAdmin && <span>Actions</span>}
          </div>
          {payrolls.length === 0 && <p className={styles.empty}>No payrolls found for this month.</p>}
          {payrolls.map(p => {
            const emp  = employees.find(e => e.user_id === p.user_id);
            const meta = statusMeta[p.status] || { label: p.status, cls: '' };
            return (
              <div key={p.payroll_id} className={styles.row}>
                {isAdmin && <span className={styles.empName}>{emp?.full_name || `Employee #${p.user_id}`}</span>}
                <span className={styles.mono}>{p.month}</span>
                <span>{p.days_worked}</span>
                <span className={styles.mono}>KES {Number(p.basic_salary).toLocaleString()}</span>
                <span className={styles.danger}>-KES {Number(p.deductions).toLocaleString()}</span>
                <span className={styles.net}>KES {Number(p.net_salary).toLocaleString()}</span>
                <span><span className={`${styles.badge} ${styles[meta.cls]}`}>{meta.label}</span></span>
                {isAdmin && (
                  <span className={styles.actionBtns}>
                    {p.status === 'draft'    && <button className={styles.approveBtn} onClick={() => updateStatus(p.payroll_id,'approved')} title="Approve"><MdCheckCircle /></button>}
                    {p.status === 'approved' && <button className={styles.payBtn}     onClick={() => updateStatus(p.payroll_id,'paid')} title="Mark Paid"><MdPayments /></button>}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Single generate modal */}
      {modal && (
        <div className={styles.overlay} onClick={() => setModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Generate Payroll</h2>
            <form onSubmit={handleGenerate} className={styles.form}>
              <div className={styles.field}>
                <label>Employee</label>
                <select required value={genForm.user_id} onChange={e => setGenForm({...genForm, user_id: e.target.value})}>
                  <option value="">Select employee…</option>
                  {employees.map(e => <option key={e.user_id} value={e.user_id}>{e.full_name}</option>)}
                </select>
              </div>
              {[
                { label:'Month',         key:'month',        type:'month'  },
                { label:'Working Days',  key:'working_days', type:'number' },
                { label:'Overtime Pay',  key:'overtime_pay', type:'number' },
                { label:'Bonuses (KES)', key:'bonuses',      type:'number' },
                { label:'Deductions',    key:'deductions',   type:'number' },
              ].map(f => (
                <div key={f.key} className={styles.field}>
                  <label>{f.label}</label>
                  <input type={f.type} value={genForm[f.key]}
                    onChange={e => setGenForm({...genForm, [f.key]: e.target.value})} />
                </div>
              ))}
              <button className={styles.saveBtn} type="submit">Generate</button>
            </form>
          </div>
        </div>
      )}

      {/* Bulk confirm modal */}
      {bulkModal && (
        <div className={styles.overlay} onClick={() => setBulkModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Generate All Payrolls</h2>
            <p className={styles.bulkMsg}>This will generate payrolls for all employees for <strong>{month}</strong> based on their attendance. Existing payrolls will be skipped.</p>
            <div className={styles.bulkBtns}>
              <button className={styles.cancelBtn} onClick={() => setBulkModal(false)}>Cancel</button>
              <button className={styles.saveBtn}   onClick={handleBulk}>Confirm & Generate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
