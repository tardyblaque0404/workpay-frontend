import { useEffect, useState } from 'react';
import { MdPeople, MdAccessTime, MdPayments, MdTrendingUp } from 'react-icons/md';
import api from '../api';
import styles from './Dashboard.module.css';

const today = new Date();
const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

export default function Dashboard() {
  const [stats, setStats]     = useState({ users: 0, present: 0, payrolls: 0, paid: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/users/'),
      api.get(`/attendance/?month=${currentMonth}`),
      api.get(`/payroll/?month=${currentMonth}`),
    ]).then(([usersRes, attRes, payRes]) => {
      const users    = usersRes.data.users.length;
      const present  = attRes.data.attendance.filter(a => a.status === 'present').length;
      const payrolls = payRes.data.payrolls.length;
      const paid     = payRes.data.payrolls.filter(p => p.status === 'paid').length;
      const totalNet = payRes.data.payrolls.reduce((s, p) => s + p.net_salary, 0);
      setStats({ users, present, payrolls, paid, totalNet });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Total Employees', value: stats.users,    icon: <MdPeople />,      color: 'accent'   },
    { label: 'Present Today',   value: stats.present,  icon: <MdAccessTime />,  color: 'success'  },
    { label: 'Payrolls This Month', value: stats.payrolls, icon: <MdPayments />, color: 'warning'  },
    { label: 'Total Net Pay',   value: `KES ${Number(stats.totalNet || 0).toLocaleString()}`, icon: <MdTrendingUp />, color: 'info' },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.date}>{today.toLocaleDateString('en-KE', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
      </div>

      <div className={styles.cards}>
        {cards.map(card => (
          <div key={card.label} className={`${styles.card} ${styles[card.color]}`}>
            <div className={styles.cardIcon}>{card.icon}</div>
            <div className={styles.cardBody}>
              <p className={styles.cardLabel}>{card.label}</p>
              <p className={styles.cardValue}>
                {loading ? <span className={styles.shimmer} /> : card.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.infoRow}>
        <div className={styles.infoCard}>
          <h2 className={styles.infoTitle}>Quick Actions</h2>
          <div className={styles.actions}>
            <a href="/attendance" className={styles.action}>
              <MdAccessTime className={styles.actionIcon} />
              <span>Mark Attendance</span>
            </a>
            <a href="/payroll" className={styles.action}>
              <MdPayments className={styles.actionIcon} />
              <span>Generate Payroll</span>
            </a>
            <a href="/employees" className={styles.action}>
              <MdPeople className={styles.actionIcon} />
              <span>Manage Employees</span>
            </a>
            <a href="/reports" className={styles.action}>
              <MdTrendingUp className={styles.actionIcon} />
              <span>View Reports</span>
            </a>
          </div>
        </div>

        <div className={styles.infoCard}>
          <h2 className={styles.infoTitle}>Month Summary</h2>
          <div className={styles.summary}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Month</span>
              <span className={styles.summaryValue}>{today.toLocaleDateString('en-KE', { month:'long', year:'numeric' })}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Payrolls Generated</span>
              <span className={styles.summaryValue}>{stats.payrolls}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Payrolls Paid</span>
              <span className={`${styles.summaryValue} ${styles.success}`}>{stats.paid}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Total Net Pay</span>
              <span className={`${styles.summaryValue} ${styles.accent}`}>
                KES {Number(stats.totalNet || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
