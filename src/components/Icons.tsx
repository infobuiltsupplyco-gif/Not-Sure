interface IconProps {
  size?: number
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
})

export const ShieldIcon = ({ size = 20 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M12 3l7.5 3v5.5c0 4.6-3.1 8.3-7.5 10-4.4-1.7-7.5-5.4-7.5-10V6l7.5-3z" />
  </svg>
)

export const ShieldCheckIcon = ({ size = 20 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M12 3l7.5 3v5.5c0 4.6-3.1 8.3-7.5 10-4.4-1.7-7.5-5.4-7.5-10V6l7.5-3z" />
    <path d="M9 12l2.2 2.2L15.5 9.5" />
  </svg>
)

export const RadarIcon = ({ size = 20 }: IconProps) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4.5" />
    <path d="M12 12l6-6" />
  </svg>
)

export const AlertIcon = ({ size = 20 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M12 4L2.8 19.5h18.4L12 4z" />
    <path d="M12 10v4.2" />
    <circle cx="12" cy="17" r="0.4" fill="currentColor" />
  </svg>
)

export const UsersIcon = ({ size = 20 }: IconProps) => (
  <svg {...base(size)}>
    <circle cx="9" cy="8" r="3.4" />
    <path d="M2.8 20c.7-3.2 3.2-5 6.2-5s5.5 1.8 6.2 5" />
    <path d="M16 5.4a3.4 3.4 0 010 6.2M18.5 15.5c1.4.8 2.4 2.3 2.7 4.5" />
  </svg>
)

export const BuildingIcon = ({ size = 20 }: IconProps) => (
  <svg {...base(size)}>
    <rect x="4.5" y="3.5" width="15" height="17" rx="1.5" />
    <path d="M9 8h1.5M13.5 8H15M9 12h1.5M13.5 12H15M9 16h1.5M13.5 16H15" />
  </svg>
)

export const ChartIcon = ({ size = 20 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M4 4v16h16" />
    <path d="M8.5 15v-4M12.5 15V8M16.5 15v-6.5" />
  </svg>
)

export const MapPinIcon = ({ size = 20 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11z" />
    <circle cx="12" cy="10" r="2.6" />
  </svg>
)

export const ClockIcon = ({ size = 20 }: IconProps) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5V12l3 2" />
  </svg>
)

export const FileIcon = ({ size = 20 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M14 3.5H7a1.5 1.5 0 00-1.5 1.5v14A1.5 1.5 0 007 20.5h10a1.5 1.5 0 001.5-1.5V8L14 3.5z" />
    <path d="M14 3.5V8h4.5M9 12.5h6M9 16h6" />
  </svg>
)

export const CheckIcon = ({ size = 16 }: IconProps) => (
  <svg {...base(size)} strokeWidth={2.4}>
    <path d="M4.5 12.5l5 5 10-11" />
  </svg>
)

export const PhoneIcon = ({ size = 20 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M5 4h4l1.5 5-2.3 1.7a13 13 0 005.1 5.1L15 13.5l5 1.5v4a2 2 0 01-2 2A15 15 0 013 6a2 2 0 012-2z" />
  </svg>
)

export const BoltIcon = ({ size = 20 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M13 2.5L4.5 13.5H11l-1 8 8.5-11H12l1-8z" />
  </svg>
)

export const LogoutIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M9 20.5H5.5a2 2 0 01-2-2v-13a2 2 0 012-2H9" />
    <path d="M15 16l4-4-4-4M19 12H9" />
  </svg>
)

export function Logo({ size = 24 }: IconProps) {
  return (
    <span className="logo">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M16 2l11 4.5v8.2c0 7-4.7 12.6-11 15.3-6.3-2.7-11-8.3-11-15.3V6.5L16 2z" fill="#3987e5" />
        <path d="M10.5 15.5l4 4 7-8" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Vigil
    </span>
  )
}
