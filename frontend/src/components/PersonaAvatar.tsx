import React from 'react'
import { SenseiPersonality } from '../store/uiStore'

interface PersonaAvatarProps {
  personality: SenseiPersonality
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const PersonaAvatar: React.FC<PersonaAvatarProps> = ({ personality, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base'
  }

  // High-contrast, retro pixel art SVG representations for each personality
  const renderPixelArt = () => {
    switch (personality) {
      case 'Deadpool':
        return (
          <svg viewBox="0 0 16 16" className="w-full h-full bg-[#180505] p-1 border-2 border-black image-rendering-pixelated">
            {/* Deadpool Red Mask */}
            <rect x="3" y="2" width="10" height="12" fill="#ef4444" />
            <rect x="2" y="4" width="12" height="8" fill="#ef4444" />
            {/* Black eye patches */}
            <rect x="3" y="5" width="4" height="4" fill="#000000" />
            <rect x="9" y="5" width="4" height="4" fill="#000000" />
            {/* White slit eyes */}
            <rect x="4" y="6" width="2" height="2" fill="#ffffff" />
            <rect x="10" y="6" width="2" height="2" fill="#ffffff" />
            {/* Center seam */}
            <rect x="7.5" y="2" width="1" height="12" fill="#991b1b" />
          </svg>
        )

      case 'Homelander':
        return (
          <svg viewBox="0 0 16 16" className="w-full h-full bg-[#050b18] p-1 border-2 border-black image-rendering-pixelated">
            {/* Blonde hair */}
            <rect x="3" y="1" width="10" height="4" fill="#facc15" />
            <rect x="2" y="2" width="12" height="2" fill="#eab308" />
            {/* Face */}
            <rect x="4" y="4" width="8" height="6" fill="#fde047" />
            <rect x="4" y="5" width="8" height="5" fill="#fef08a" />
            {/* Blue eyes */}
            <rect x="5" y="6" width="2" height="1" fill="#0284c7" />
            <rect x="9" y="6" width="2" height="1" fill="#0284c7" />
            {/* Smirk */}
            <rect x="6" y="9" width="4" height="1" fill="#b45309" />
            {/* Blue Suit & Red/Gold shoulders */}
            <rect x="2" y="10" width="12" height="5" fill="#1e3a8a" />
            <rect x="2" y="10" width="3" height="3" fill="#dc2626" />
            <rect x="11" y="10" width="3" height="3" fill="#dc2626" />
            <rect x="4" y="10" width="8" height="1" fill="#facc15" />
          </svg>
        )

      case 'Thor':
        return (
          <svg viewBox="0 0 16 16" className="w-full h-full bg-[#06121e] p-1 border-2 border-black image-rendering-pixelated">
            {/* Helmet Wings */}
            <rect x="1" y="2" width="2" height="4" fill="#e2e8f0" />
            <rect x="13" y="2" width="2" height="4" fill="#e2e8f0" />
            {/* Silver Helmet */}
            <rect x="3" y="1" width="10" height="4" fill="#94a3b8" />
            <rect x="4" y="2" width="8" height="2" fill="#cbd5e1" />
            {/* Face & Electric Blue Eyes */}
            <rect x="4" y="5" width="8" height="5" fill="#fed7aa" />
            <rect x="5" y="6" width="2" height="2" fill="#38bdf8" />
            <rect x="9" y="6" width="2" height="2" fill="#38bdf8" />
            {/* Golden Beard */}
            <rect x="4" y="9" width="8" height="3" fill="#d97706" />
            {/* Armor */}
            <rect x="3" y="12" width="10" height="3" fill="#475569" />
            <circle cx="5.5" cy="13.5" r="1" fill="#38bdf8" />
            <circle cx="10.5" cy="13.5" r="1" fill="#38bdf8" />
          </svg>
        )

      case 'Messi':
        return (
          <svg viewBox="0 0 16 16" className="w-full h-full bg-[#031525] p-1 border-2 border-black image-rendering-pixelated">
            {/* Dark Hair */}
            <rect x="4" y="1" width="8" height="4" fill="#451a03" />
            <rect x="3" y="2" width="10" height="2" fill="#78350f" />
            {/* Face */}
            <rect x="4" y="4" width="8" height="6" fill="#fde68a" />
            <rect x="5" y="6" width="2" height="1" fill="#451a03" />
            <rect x="9" y="6" width="2" height="1" fill="#451a03" />
            {/* Beard */}
            <rect x="4" y="8" width="8" height="3" fill="#92400e" />
            {/* Argentina Jersey Stripes */}
            <rect x="2" y="10" width="12" height="5" fill="#ffffff" />
            <rect x="3" y="10" width="2" height="5" fill="#38bdf8" />
            <rect x="7" y="10" width="2" height="5" fill="#38bdf8" />
            <rect x="11" y="10" width="2" height="5" fill="#38bdf8" />
            <rect x="7.5" y="12" width="1" height="1" fill="#facc15" />
          </svg>
        )

      case 'Taylor Swift':
        return (
          <svg viewBox="0 0 16 16" className="w-full h-full bg-[#1a0815] p-1 border-2 border-black image-rendering-pixelated">
            {/* Blonde hair */}
            <rect x="2" y="1" width="12" height="10" fill="#fef08a" />
            <rect x="3" y="2" width="10" height="3" fill="#fde047" />
            {/* Face */}
            <rect x="4" y="4" width="8" height="6" fill="#fff7ed" />
            {/* Eyes */}
            <rect x="5" y="5.5" width="2" height="1" fill="#0284c7" />
            <rect x="9" y="5.5" width="2" height="1" fill="#0284c7" />
            {/* Iconic Red Lipstick */}
            <rect x="6" y="8" width="4" height="1.5" fill="#e11d48" />
            {/* Sparkle outfit */}
            <rect x="3" y="10" width="10" height="5" fill="#ec4899" />
            <rect x="4" y="11" width="2" height="2" fill="#ffffff" />
            <rect x="10" y="12" width="2" height="2" fill="#ffffff" />
          </svg>
        )

      case 'Ryan Gosling':
        return (
          <svg viewBox="0 0 16 16" className="w-full h-full bg-[#181106] p-1 border-2 border-black image-rendering-pixelated">
            {/* Dirty Blonde Hair */}
            <rect x="4" y="1" width="8" height="4" fill="#ca8a04" />
            <rect x="3" y="2" width="10" height="2" fill="#eab308" />
            {/* Face */}
            <rect x="4" y="4" width="8" height="6" fill="#fed7aa" />
            {/* Sunglasses / Eyes */}
            <rect x="4" y="5" width="8" height="3" fill="#000000" />
            <rect x="5" y="5.5" width="2" height="1" fill="#facc15" />
            <rect x="9" y="5.5" width="2" height="1" fill="#facc15" />
            {/* Cool Stubble & Smile */}
            <rect x="4" y="8.5" width="8" height="2" fill="#a16207" opacity="0.4" />
            <rect x="6" y="9" width="4" height="1" fill="#78350f" />
            {/* Drive Satin Scorpion Jacket */}
            <rect x="2" y="10" width="12" height="5" fill="#fef08a" />
            <rect x="2" y="10" width="2" height="5" fill="#000000" />
            <rect x="12" y="10" width="2" height="5" fill="#000000" />
            {/* Golden Scorpion Emblem */}
            <rect x="7" y="11" width="2" height="3" fill="#eab308" />
          </svg>
        )

      default:
        return (
          <div className="w-full h-full bg-purple-500/20 flex items-center justify-center font-bold text-white">
            {personality[0]}
          </div>
        )
    }
  }

  return (
    <div className={`shrink-0 rounded-lg overflow-hidden border-2 border-black shadow-[3px_3px_0px_#000] ${sizeClasses[size]} ${className}`}>
      {renderPixelArt()}
    </div>
  )
}
