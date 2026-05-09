import React from 'react';
import { useEffect, useState } from 'react';
import { MdCheckCircle, MdCancel, MdAdd, MdAccessTime } from 'react-icons/md';
import api from '../api';
import { useAuth } from '../AuthContext';
import styles from './Attendance.module.css';

const today = new Date();
const currentMonth = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`;

const statusMeta = {
  present:  { label:'Present',  cls:'present'  },
  absent:   { label:'Absent',   cls:'absent'   },
  late:     { label:'Late',     cls:'late'     },
  half_day: { label:'Half Day', cls:'halfday'  },
};

export default function Attendance() {
  const { user } = useAuth();
  const isAdmin  = user?.role === 'admin' || user?.role === 'manager';

  const [records,  setRecords]  = useState([]);
  const [employees,setEmployees]= useState([]);
  const [month,    setMonth]    = useState(currentMonth);
  const [loading,  setLoading]  = useState(true);
  const [checkedIn,setCheckedIn]= useState(false);
  const [modal,    setModal]    = useState(false);
  const [manualForm, setManual] = useState({ user_id:'', date:'', status:'present', notes:'' });
  const [msg, setMsg]           = useState('');

  const load = () => {
    setLoading(true);
    const params = isAdmin ? `/attendance/?month=${month}` : `/attendance/?month=${month}`;
    api.get(params).then(r => {
      setRecords(r.data.attendance);
      // Check if current user already checked in today
      const todayStr = today.toISOString().split('T')[0];
      setCheckedIn(r.data.attendance.some(a =>
        a.user_id === user?.user_id && a.date === todayStr
      ));
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    if (isAdmin) api.get('/users/').then(r => setEmployees(r.data.users));
  }, [month]);

  const handleCheckIn = async () => {
    try {
      await api.post('/attendance/checkin');
      setMsg('✅ Checked in successfully!');
      load();
    } catch (err) { setMsg(err.response?.data?.error || 'Check-in failed.'); }
  };

  const handleCheckOut = async () => {
    try {
      await api.put('/attendance/checkout');
      setMsg('✅ Checked out successfully!');
      load();
    } catch (err) { setMsg(err.response?.data?.error || 'Check-out failed.'); }
  };

  const handleManual = async (e) => {
    e.preventDefault();
    try {
      await api.post('/attendance/manual', manualForm);
      setModal(false); load();
    } catch (err) { setMsg(err.response?.data?.error || 'Error recording attendance.'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this record?')) return;
    await api.delete(`/attendance/${id}`);
    load();
  };

  const todayStr = today.toISOString().split('T')[0];
  const todayRecord = records.find(r => r.user_id === user?.user_id && r.date === todayStr);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Attendance</h1>
          <p className={styles.sub}>Track and manage employee attendance</p>
        </div>
        <div className={styles.headerRight}>
          <input type="month" className={styles.monthPicker}
            value={month} onChange={e => setMonth(e.target.value)} />
          {isAdmin && (
            <button className={styles.addBtn} onClick={() => setModal(true)}>
              <MdAdd /> Manual Entry
            </button>
          )}
        </div>
      </div>

      {/* Clock in/out widget */}
      {!isAdmin && (
        <div className={styles.clockCard}>
          <div className={styles.clockLeft}>
            <MdAccessTime className={styles.clockIcon} />
            <div>
              <p className={styles.clockTitle}>Today — {today.toLocaleDateString('en-KE',{weekday:'long',month:'short',day:'numeric'})}</p>
              {todayRecord ? (
                <p className={styles.clockMeta}>
                  In: {todayRecord.check_in_time || '—'} &nbsp;·&nbsp;
                  Out: {todayRecord.check_out_time || 'Not yet'}
                </p>
              ) : <p className={styles.clockMeta}>Not checked in yet</p>}
            </div>
          </div>
          <div className={styles.clockBtns}>
            <button className={styles.inBtn}  onClick={handleCheckIn}  disabled={checkedIn}><MdCheckCircle /> Check In</button>
            <button className={styles.outBtn} onClick={handleCheckOut} disabled={!checkedIn || !!todayRecord?.check_out_time}><MdCancel /> Check Out</button>
          </div>
        </div>
      )}

      {msg && <p className={styles.toast}>{msg}</p>}

      {/* Records table */}
      {loading ? <p className={styles.loader}>Loading…</p> : (
        <div className={styles.table}>
          <div className={styles.thead}>
            {isAdmin && <span>Employee</span>}
            <span>Date</span><span>Status</span>
            <span>Check In</span><span>Check Out</span>
            {isAdmin && <span>Action</span>}
          </div>
          {records.length === 0 && <p className={styles.empty}>No records for this period.</p>}
          {records.map(r => {
            const emp = employees.find(e => e.user_id === r.user_id);
            const meta = statusMeta[r.status] || { label: r.status, cls: '' };
            return (
              <div key={r.attendance_id} className={styles.row}>
                {isAdmin && (
                  <span className={styles.empName}>{emp?.full_name || `User #${r.user_id}`}</span>
                )}
                <span className={styles.mono}>{r.date}</span>
                <span><span className={`${styles.badge} ${styles[meta.cls]}`}>{meta.label}</span></span>
                <span className={styles.mono}>{r.check_in_time  || '—'}</span>
                <span className={styles.mono}>{r.check_out_time || '—'}</span>
                {isAdmin && (
                  <span>
                    <button className={styles.delBtn} onClick={() => handleDelete(r.attendance_id)}><MdCancel /></button>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Manual entry modal */}
      {modal && (
        <div className={styles.overlay} onClick={() => setModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Manual Attendance Entry</h2>
            <form onSubmit={handleManual} className={styles.form}>
              <div className={styles.field}>
                <label>Employee</label>
                <select required value={manualForm.user_id} onChange={e => setManual({...manualForm, user_id: e.target.value})}>
                  <option value="">Select employee…</option>
                  {employees.map(e => <option key={e.user_id} value={e.user_id}>{e.full_name}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label>Date</label>
                <input type="date" required value={manualForm.date} onChange={e => setManual({...manualForm, date: e.target.value})} />
              </div>
              <div className={styles.field}>
                <label>Status</label>
                <select value={manualForm.status} onChange={e => setManual({...manualForm, status: e.target.value})}>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="half_day">Half Day</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Notes (optional)</label>
                <input type="text" value={manualForm.notes} onChange={e => setManual({...manualForm, notes: e.target.value})} />
              </div>
              <button className={styles.saveBtn} type="submit">Save Entry</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
