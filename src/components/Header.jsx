import { useEffect } from 'react'
import { useStore } from '../state/store.js'
import { startAudio, stopAudio } from '../audio/synth.js'

export default function Header() {
  const muted = useStore((s) => s.muted)
  const setMuted = useStore((s) => s.setMuted)

  useEffect(() => stopAudio, [])

  const toggle = () => {
    if (muted) startAudio()
    else stopAudio()
    setMuted(!muted)
  }

  return (
    <header className="site-header">
      <a className="logo" href="#section-hero" data-magnetic>
        APEX<span>FUEL</span>
      </a>
      <div className="header-right">
        <button className={`audio-toggle ${muted ? 'is-muted' : ''}`} onClick={toggle} data-magnetic aria-label={muted ? 'Unmute ambient audio' : 'Mute ambient audio'}>
          <span className="audio-bars">
            <i /><i /><i /><i />
          </span>
          <span className="audio-label">{muted ? 'SOUND OFF' : 'SOUND ON'}</span>
        </button>
        <button className="shop-btn" data-magnetic data-cursor="scoop">
          SHOP
        </button>
      </div>
    </header>
  )
}
