import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import {
  MdDashboard, MdPeople, MdAccessTime,
  MdPayments, MdBarChart, MdLogout, MdMenu, MdClose
} from 'react-icons/md';
import { useState } from 'react';
import styles from './Layout.module.css';

const navItems = [
  { to: '/dashboard',  icon: <MdDashboard />,  label: 'Dashboard',  roles: ['admin','manager'] },
  { to: '/employees',  icon: <MdPeople />,      label: 'Employees',  roles: ['admin','manager'] },
  { to: '/attendance', icon: <MdAccessTime />,  label: 'Attendance', roles: ['admin','manager','employee'] },
  { to: '/payroll',    icon: <MdPayments />,    label: 'Payroll',    roles: ['admin','manager','employee'] },
  { to: '/reports',    icon: <MdBarChart />,    label: 'Reports',    roles: ['admin','manager'] },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const visible = navItems.filter(n => n.roles.includes(user?.role));

  return (
    <div className={styles.shell}>
      {/* Mobile overlay */}
      {open && <div className={styles.overlay} onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarTop}>
          <div className={styles.brand}>
            <div className={styles.logo}>MK</div>
            <div>
              <p className={styles.brandName}>Miliki Kasri</p>
              <p className={styles.brandSub}>WorkPay</p>
            </div>
          </div>

          <nav className={styles.nav}>
            {visible.map(item => (
              <NavLink
                key={item.to} to={item.to}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.active : ''}`
                }
                onClick={() => setOpen(false)}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className={styles.sidebarBottom}>
          <div className={styles.userCard}>
            <div className={styles.avatar}>
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className={styles.userInfo}>
              <p className={styles.userName}>{user?.full_name}</p>
              <p className={styles.userRole}>{user?.role}</p>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <MdLogout /> Logout
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className={styles.main}>
        <header className={styles.topbar}>
          <button className={styles.menuBtn} onClick={() => setOpen(!open)}>
            {open ? <MdClose /> : <MdMenu />}
          </button>
          <p className={styles.topbarTitle}>
            Welcome back, <strong>{user?.full_name?.split(' ')[0]}</strong>
          </p>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
