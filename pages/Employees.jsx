import React from 'react';
import { useEffect, useState } from 'react';
import { MdAdd, MdEdit, MdDelete, MdPerson, MdClose } from 'react-icons/md';
import api from '../api';
import styles from './Employees.module.css';

const emptyForm = { username:'', password:'', email:'', full_name:'', role:'employee', basic_salary:'' };

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState(emptyForm);
  const [editing, setEditing]     = useState(null);
  const [error, setError]         = useState('');
  const [saving, setSaving]       = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/users/').then(r => setEmployees(r.data.users)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditing(null); setError(''); setModal(true); };
  const openEdit = (emp) => {
    setForm({ ...emp, password: '', basic_salary: emp.basic_salary });
    setEditing(emp.user_id); setError(''); setModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this employee?')) return;
    await api.delete(`/users/${id}`);
    load();
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      if (editing) {
        await api.put(`/users/${editing}`, form);
      } else {
        await api.post('/auth/register', form);
      }
      setModal(false); load();
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally { setSaving(false); }
  };

  const roleColor = { admin: styles.roleAdmin, manager: styles.roleManager, employee: styles.roleEmployee };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Employees</h1>
          <p className={styles.sub}>{employees.length} total members</p>
        </div>
        <button className={styles.addBtn} onClick={openAdd}><MdAdd /> Add Employee</button>
      </div>

      {loading ? (
        <div className={styles.loader}>Loading employees…</div>
      ) : (
        <div className={styles.table}>
          <div className={styles.thead}>
            <span>Name</span><span>Role</span><span>Email</span><span>Basic Salary</span><span>Actions</span>
          </div>
          {employees.map(emp => (
            <div key={emp.user_id} className={styles.row}>
              <span className={styles.nameCell}>
                <div className={styles.avatar}>{emp.full_name.charAt(0)}</div>
                <div>
                  <p className={styles.name}>{emp.full_name}</p>
                  <p className={styles.username}>@{emp.username}</p>
                </div>
              </span>
              <span><span className={`${styles.role} ${roleColor[emp.role]}`}>{emp.role}</span></span>
              <span className={styles.email}>{emp.email}</span>
              <span className={styles.salary}>KES {Number(emp.basic_salary).toLocaleString()}</span>
              <span className={styles.actions}>
                <button className={styles.editBtn} onClick={() => openEdit(emp)}><MdEdit /></button>
                <button className={styles.delBtn}  onClick={() => handleDelete(emp.user_id)}><MdDelete /></button>
              </span>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className={styles.overlay} onClick={() => setModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editing ? 'Edit Employee' : 'Add Employee'}</h2>
              <button onClick={() => setModal(false)}><MdClose /></button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              {[
                { label:'Full Name',     key:'full_name',    type:'text' },
                { label:'Username',      key:'username',     type:'text' },
                { label:'Email',         key:'email',        type:'email' },
                { label:'Password',      key:'password',     type:'password' },
                { label:'Basic Salary (KES)', key:'basic_salary', type:'number' },
              ].map(f => (
                <div key={f.key} className={styles.field}>
                  <label>{f.label}</label>
                  <input
                    type={f.type} value={form[f.key]}
                    placeholder={f.key === 'password' && editing ? 'Leave blank to keep current' : ''}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    required={!(f.key === 'password' && editing)}
                  />
                </div>
              ))}
              <div className={styles.field}>
                <label>Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {error && <p className={styles.error}>{error}</p>}
              <button className={styles.saveBtn} type="submit" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Update Employee' : 'Add Employee'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
