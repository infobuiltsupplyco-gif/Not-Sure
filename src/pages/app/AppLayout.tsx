import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  AlertIcon,
  BuildingIcon,
  FileIcon,
  Logo,
  LogoutIcon,
  RadarIcon,
  UsersIcon,
} from '../../components/Icons'
import { useStore } from '../../data/store'

const NAV = [
  { to: '/app', label: 'Operations', icon: <RadarIcon size={18} />, end: true },
  { to: '/app/incidents', label: 'Incidents', icon: <AlertIcon size={18} /> },
  { to: '/app/guards', label: 'Guards', icon: <UsersIcon size={18} /> },
  { to: '/app/sites', label: 'Sites', icon: <BuildingIcon size={18} /> },
  { to: '/app/reports', label: 'Reports', icon: <FileIcon size={18} /> },
]

export default function AppLayout() {
  const { user, signOut } = useStore()
  const navigate = useNavigate()
  const initials = (user ?? 'U')
    .split('@')[0]
    .split(/[._-]/)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2)

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Logo size={22} />
        <nav>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="spacer" />
        <div className="side-user">
          <span className="avatar">{initials || 'OP'}</span>
          <span className="meta">
            <span className="n">{user?.split('@')[0]}</span>
            <br />
            <span className="r">Operations Manager</span>
          </span>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          style={{ marginTop: 10, justifyContent: 'flex-start' }}
          onClick={() => {
            signOut()
            navigate('/')
          }}
        >
          <LogoutIcon size={16} /> Sign out
        </button>
      </aside>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
