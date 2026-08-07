import { AccentColor } from '../store/uiStore'

export interface ThemeConfig {
  text: string
  bg: string
  border: string
  btn: string
  gradient: string
  hex: string
  rgb: string
  ring: string
  name: string
  accentClass: string
}

export function getColorClasses(accentColor: AccentColor): ThemeConfig {
  switch (accentColor) {
    case 'winter':
    case 'cyan':
      return {
        name: 'Winter',
        text: 'text-cyan-400',
        bg: 'bg-cyan-500/15',
        border: 'border-cyan-500/30',
        btn: 'bg-cyan-400 hover:bg-cyan-300 text-black font-black shadow-[4px_4px_0px_#000]',
        gradient: 'from-cyan-500/25 via-blue-500/20 to-indigo-500/25',
        hex: '#06b6d4',
        rgb: '6, 182, 212',
        ring: 'ring-cyan-400',
        accentClass: 'accent-cyan-400'
      }
    case 'jungle':
    case 'emerald':
      return {
        name: 'Jungle',
        text: 'text-emerald-400',
        bg: 'bg-emerald-500/15',
        border: 'border-emerald-500/30',
        btn: 'bg-emerald-400 hover:bg-emerald-300 text-black font-black shadow-[4px_4px_0px_#000]',
        gradient: 'from-emerald-500/25 via-lime-500/20 to-teal-500/25',
        hex: '#10b981',
        rgb: '16, 185, 129',
        ring: 'ring-emerald-400',
        accentClass: 'accent-emerald-400'
      }
    case 'volcano':
    case 'blue':
      return {
        name: 'Volcano',
        text: 'text-orange-400',
        bg: 'bg-orange-500/15',
        border: 'border-orange-500/30',
        btn: 'bg-orange-500 hover:bg-orange-400 text-black font-black shadow-[4px_4px_0px_#000]',
        gradient: 'from-orange-500/25 via-red-500/20 to-amber-500/25',
        hex: '#f97316',
        rgb: '249, 115, 22',
        ring: 'ring-orange-400',
        accentClass: 'accent-orange-400'
      }
    case 'cyberpunk':
      return {
        name: 'Cyberpunk',
        text: 'text-rose-400',
        bg: 'bg-rose-500/15',
        border: 'border-rose-500/30',
        btn: 'bg-rose-500 hover:bg-rose-400 text-black font-black shadow-[4px_4px_0px_#000]',
        gradient: 'from-rose-500/25 via-yellow-500/20 to-pink-500/25',
        hex: '#f43f5e',
        rgb: '244, 63, 94',
        ring: 'ring-rose-400',
        accentClass: 'accent-rose-400'
      }
    case 'solar':
      return {
        name: 'Solar',
        text: 'text-yellow-400',
        bg: 'bg-yellow-500/15',
        border: 'border-yellow-500/30',
        btn: 'bg-yellow-400 hover:bg-yellow-300 text-black font-black shadow-[4px_4px_0px_#000]',
        gradient: 'from-yellow-500/25 via-amber-500/20 to-orange-500/25',
        hex: '#facc15',
        rgb: '250, 204, 21',
        ring: 'ring-yellow-400',
        accentClass: 'accent-yellow-400'
      }
    case 'plasma':
    case 'purple':
    default:
      return {
        name: 'Plasma',
        text: 'text-purple-400',
        bg: 'bg-purple-500/15',
        border: 'border-purple-500/30',
        btn: 'bg-purple-500 hover:bg-purple-400 text-black font-black shadow-[4px_4px_0px_#000]',
        gradient: 'from-purple-500/25 via-pink-500/20 to-indigo-500/25',
        hex: '#a855f7',
        rgb: '168, 85, 247',
        ring: 'ring-purple-400',
        accentClass: 'accent-purple-400'
      }
  }
}
