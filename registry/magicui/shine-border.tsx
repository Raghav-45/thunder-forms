import React from 'react'

interface ShineBorderProps {
  shineColor?: string[]
  className?: string
  strokeWidth?: number
}

export const ShineBorder: React.FC<ShineBorderProps> = ({
  shineColor = ['#A07CFE', '#FE8FB5', '#FFBE7B'],
  className = '',
  strokeWidth = 2,
}) => {
  const [c1 = '#A07CFE', c2 = '#FE8FB5', c3 = '#FFBE7B'] = shineColor
  const reactId = React.useId()
  const gradientId = `shineGradient-${reactId}`
  const filterId = `softGlow-${reactId}`

  // SVG border uses viewBox padding to align the stroke inside the element
  return (
    <svg
      aria-hidden
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ zIndex: 0 }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" x2="100%" y1="0%" y2="0%">
          <stop offset="0%" stopColor={c1} />
          <stop offset="50%" stopColor={c2} />
          <stop offset="100%" stopColor={c3} />
        </linearGradient>
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Glow behind the main stroke */}
      <rect
        x={strokeWidth}
        y={strokeWidth}
        width={100 - strokeWidth * 2}
        height={100 - strokeWidth * 2}
        rx="8"
        ry="8"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={Math.max(1, strokeWidth * 3)}
        strokeOpacity={0.35}
        style={{ filter: `url(#${filterId})`, mixBlendMode: 'screen' }}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Main border stroke */}
      <rect
        x={strokeWidth}
        y={strokeWidth}
        width={100 - strokeWidth * 2}
        height={100 - strokeWidth * 2}
        rx="8"
        ry="8"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        strokeOpacity={1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default ShineBorder
