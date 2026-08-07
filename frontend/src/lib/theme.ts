import { AccentColor } from '../store/uiStore'

export interface MultiColorTheme {
  name: string
  primary: string
  primaryRgb: string
  secondary: string
  secondaryRgb: string
  tertiary: string
  tertiaryRgb: string
  hex: string
  rgb: string
  text: string
  bg: string
  border: string
  btn: string
  gradient: string
  ring: string
  accentClass: string
}

export function getColorClasses(accentColor: AccentColor): MultiColorTheme {
  switch (accentColor) {
    case 'winter':
    case 'cyan':
      return {
        name: 'Winter',
        primary: '#06b6d4',
        primaryRgb: '6, 182, 212',
        secondary: '#3b82f6',
        secondaryRgb: '59, 130, 246',
        tertiary: '#6366f1',
        tertiaryRgb: '99, 102, 241',
        hex: '#06b6d4',
        rgb: '6, 182, 212',
        text: 'text-cyan-400',
        bg: 'bg-cyan-500/15',
        border: 'border-cyan-500/40',
        btn: 'bg-cyan-400 hover:bg-cyan-300 text-black font-black shadow-[4px_4px_0px_#3b82f6]',
        gradient: 'from-cyan-400 via-blue-500 to-indigo-500',
        ring: 'ring-cyan-400',
        accentClass: 'accent-cyan-400'
      }
    case 'jungle':
    case 'emerald':
      return {
        name: 'Jungle',
        primary: '#10b981',
        primaryRgb: '16, 185, 129',
        secondary: '#84cc16',
        secondaryRgb: '132, 204, 22',
        tertiary: '#facc15',
        tertiaryRgb: '250, 204, 21',
        hex: '#10b981',
        rgb: '16, 185, 129',
        text: 'text-emerald-400',
        bg: 'bg-emerald-500/15',
        border: 'border-emerald-500/40',
        btn: 'bg-emerald-400 hover:bg-emerald-300 text-black font-black shadow-[4px_4px_0px_#84cc16]',
        gradient: 'from-emerald-400 via-lime-400 to-yellow-400',
        ring: 'ring-emerald-400',
        accentClass: 'accent-emerald-400'
      }
    case 'volcano':
    case 'blue':
      return {
        name: 'Volcano',
        primary: '#f97316',
        primaryRgb: '249, 115, 22',
        secondary: '#ef4444',
        secondaryRgb: '239, 68, 68',
        tertiary: '#facc15',
        tertiaryRgb: '250, 204, 21',
        hex: '#f97316',
        rgb: '249, 115, 22',
        text: 'text-orange-400',
        bg: 'bg-orange-500/15',
        border: 'border-orange-500/40',
        btn: 'bg-orange-500 hover:bg-orange-400 text-black font-black shadow-[4px_4px_0px_#ef4444]',
        gradient: 'from-orange-500 via-red-500 to-yellow-400',
        ring: 'ring-orange-400',
        accentClass: 'accent-orange-400'
      }
    case 'cyberpunk':
      return {
        name: 'Cyberpunk',
        primary: '#f43f5e',
        primaryRgb: '244, 63, 94',
        secondary: '#06b6d4',
        secondaryRgb: '6, 182, 212',
        tertiary: '#facc15',
        tertiaryRgb: '250, 204, 21',
        hex: '#f43f5e',
        rgb: '244, 63, 94',
        text: 'text-rose-400',
        bg: 'bg-rose-500/15',
        border: 'border-rose-500/40',
        btn: 'bg-rose-500 hover:bg-rose-400 text-black font-black shadow-[4px_4px_0px_#06b6d4]',
        gradient: 'from-rose-500 via-cyan-400 to-yellow-400',
        ring: 'ring-rose-400',
        accentClass: 'accent-rose-400'
      }
    case 'solar':
      return {
        name: 'Solar',
        primary: '#facc15',
        primaryRgb: '250, 204, 21',
        secondary: '#f59e0b',
        secondaryRgb: '245, 158, 11',
        tertiary: '#f97316',
        tertiaryRgb: '249, 115, 22',
        hex: '#facc15',
        rgb: '250, 204, 21',
        text: 'text-yellow-400',
        bg: 'bg-yellow-500/15',
        border: 'border-yellow-500/40',
        btn: 'bg-yellow-400 hover:bg-yellow-300 text-black font-black shadow-[4px_4px_0px_#f97316]',
        gradient: 'from-yellow-400 via-amber-500 to-orange-500',
        ring: 'ring-yellow-400',
        accentClass: 'accent-yellow-400'
      }
    case 'plasma':
    case 'purple':
    default:
      return {
        name: 'Plasma',
        primary: '#a855f7',
        primaryRgb: '168, 85, 247',
        secondary: '#ec4899',
        secondaryRgb: '236, 72, 153',
        tertiary: '#06b6d4',
        tertiaryRgb: '6, 182, 212',
        hex: '#a855f7',
        rgb: '168, 85, 247',
        text: 'text-purple-400',
        bg: 'bg-purple-500/15',
        border: 'border-purple-500/40',
        btn: 'bg-purple-500 hover:bg-purple-400 text-black font-black shadow-[4px_4px_0px_#ec4899]',
        gradient: 'from-purple-500 via-pink-500 to-cyan-400',
        ring: 'ring-purple-400',
        accentClass: 'accent-purple-400'
      }
  }
}
