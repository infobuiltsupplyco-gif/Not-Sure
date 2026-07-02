import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../components/Icons'
import { useStore } from '../data/store'

export default function Login() {
  const { signIn } = useStore()
  const navigate = useNavigate()
  const [email, setEmail] = useState('ops@demo.vigil.nz')
  const [password, setPassword] = useState('demo')

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    signIn(email.trim())
    navigate('/app')
  }

  return (
    <div className="login-page">
      <div className="login-card card">
        <Link to="/">
          <Logo size={28} />
        </Link>
        <h1>Welcome back</h1>
        <p className="sub">Sign in to your operations dashboard</p>
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: 6 }}>
            Sign in
          </button>
        </form>
        <div className="demo-note">
          Demo mode — any email and password works. The dashboard is pre-loaded with sample operations data.
        </div>
      </div>
    </div>
  )
}
