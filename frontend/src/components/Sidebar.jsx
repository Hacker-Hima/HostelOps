import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  LayoutDashboard,
  Box,
  FileQuestion,
  AlertTriangle,
  Users,
  History,
  CheckSquare,
  UserCheck,
  Building,
  Shield,
  Layers,
  Settings,
  Home as HomeIcon,
  Wrench,
  ClipboardList,
  Search,
  Camera,
  CheckCircle2,
} from 'lucide-react';

const Sidebar = () => {
  const { user, isAdmin, isTechnician } = useAuth();
  const { t } = useLanguage();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }} title="Return to Home Portal">
          <Building size={28} color="#60a5fa" />
          <div className="sidebar-logo-text">
            HAMS<span>.hostel</span>
          </div>
        </Link>
      </div>

      <nav className="sidebar-nav">
        {/* Quick link to Home / Mini-Game Portal */}
        <NavLink
          to="/"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          id="nav-home-portal"
          style={{ marginBottom: '0.75rem', background: 'rgba(255,255,255,0.04)' }}
        >
          <HomeIcon size={18} color="#60a5fa" />
          <span>{t('backToHome')}</span>
        </NavLink>

        {isAdmin ? (
          <>
            <div className="sidebar-nav-heading">{t('wardenAdmin')}</div>
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              id="nav-admin-dashboard"
            >
              <LayoutDashboard size={18} />
              <span>{t('adminDashboard')}</span>
            </NavLink>

            <NavLink
              to="/admin/assets"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              id="nav-admin-assets"
            >
              <Box size={18} />
              <span>{t('manageAssets')}</span>
            </NavLink>

            <NavLink
              to="/admin/requests"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              id="nav-admin-requests"
            >
              <FileQuestion size={18} />
              <span>{t('assetRequests')}</span>
            </NavLink>

            <NavLink
              to="/admin/damage-reports"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              id="nav-admin-damage"
            >
              <AlertTriangle size={18} />
              <span>{t('damageLoss')}</span>
            </NavLink>

            <NavLink
              to="/admin/users"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              id="nav-admin-users"
            >
              <Users size={18} />
              <span>{t('hostelResidents')}</span>
            </NavLink>

            <NavLink
              to="/admin/history"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              id="nav-admin-history"
            >
              <History size={18} />
              <span>{t('auditTrail')}</span>
            </NavLink>

            <NavLink
              to="/technician/tasks"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              id="nav-admin-maintenance-ops"
            >
              <Wrench size={18} />
              <span>Maintenance Ops</span>
            </NavLink>

            <NavLink
              to="/admin/settings"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              id="nav-admin-settings"
            >
              <Settings size={18} />
              <span>{t('systemSettings')}</span>
            </NavLink>
          </>
        ) : isTechnician ? (
          <>
            <div className="sidebar-nav-heading">Technician / Staff</div>
            <NavLink
              to="/technician/dashboard"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              id="nav-tech-dashboard"
            >
              <LayoutDashboard size={18} />
              <span>Tech Dashboard</span>
            </NavLink>

            <NavLink
              to="/technician/tasks"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              id="nav-tech-tasks"
            >
              <ClipboardList size={18} />
              <span>Maintenance Tasks</span>
            </NavLink>

            <NavLink
              to="/technician/inspect"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              id="nav-tech-inspect"
            >
              <Search size={18} />
              <span>Inspect Asset</span>
            </NavLink>

            <NavLink
              to="/technician/report-damage"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              id="nav-tech-report"
            >
              <Camera size={18} />
              <span>Report Damage</span>
            </NavLink>

            <NavLink
              to="/technician/history"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              id="nav-tech-history"
            >
              <History size={18} />
              <span>Maintenance History</span>
            </NavLink>

            <NavLink
              to="/settings"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              id="nav-tech-settings"
            >
              <Settings size={18} />
              <span>{t('accountSettings')}</span>
            </NavLink>
          </>
        ) : (
          <>
            <div className="sidebar-nav-heading">{t('studentPortal')}</div>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              id="nav-user-dashboard"
            >
              <LayoutDashboard size={18} />
              <span>{t('myDashboard')}</span>
            </NavLink>

            <NavLink
              to="/my-assets"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              id="nav-user-my-assets"
            >
              <Layers size={18} />
              <span>{t('myAssignedAssets')}</span>
            </NavLink>

            <NavLink
              to="/request-asset"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              id="nav-user-request"
            >
              <CheckSquare size={18} />
              <span>{t('requestAsset')}</span>
            </NavLink>

            <NavLink
              to="/report-issue"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              id="nav-user-report"
            >
              <AlertTriangle size={18} />
              <span>{t('reportDamageLoss')}</span>
            </NavLink>

            <NavLink
              to="/history"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              id="nav-user-history"
            >
              <History size={18} />
              <span>{t('personalHistory')}</span>
            </NavLink>

            <NavLink
              to="/profile"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              id="nav-user-profile"
            >
              <UserCheck size={18} />
              <span>{t('myProfile')}</span>
            </NavLink>

            <NavLink
              to="/settings"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              id="nav-user-settings"
            >
              <Settings size={18} />
              <span>{t('accountSettings')}</span>
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Shield size={16} color="#60a5fa" />
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            <span>{t('roleLabel')}: </span>
            <strong style={{ color: '#ffffff' }}>
              {user?.role === 'admin'
                ? t('administrator')
                : isTechnician
                ? 'Hostel Technician'
                : t('hostelResident')}
            </strong>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
