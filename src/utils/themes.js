export const themes = {
  default: {
    name: 'Skyline',
    gradient: 'linear-gradient(135deg, #3340f3 0%, #0f5576 50%, #2aa473 100%)',
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    accent: '#ec4899'
  },
  sunset: {
    name: 'Sunset Orange',
    gradient: 'linear-gradient(135deg, #f97316 0%, #1f1a13 50%, #dc2626 100%)',
    primary: '#f97316',
    secondary: '#ef4444',
    accent: '#dc2626'
  },
  midnight: {
    name: 'Scorpio',
    gradient: 'linear-gradient(to bottom left, #53360e 0%, #1e2025 50%, #482956 100%)',
    primary: '#6366f1',
    secondary: '#7c3aed',
    accent: '#5b21b6'
  },
  cherry: {
    name: 'Orion',
    gradient: 'linear-gradient(135deg, #2c100c 0%, #150b2b 50%, #f5c115 100%)',
    primary: '#f472b6',
    secondary: '#ec4899',
    accent: '#db2777'
  },
  ocean: {
    name: 'Bomb Pop',
    gradient: 'linear-gradient(135deg, #690909 0%, #0284c7 50%, #ffffff 100%)',
    primary: '#0ea5e9',
    secondary: '#0284c7',
    accent: '#ffffff'
  },
  volcano: {
    name: 'Volcanic',
    gradient: 'linear-gradient(135deg, #3f0b04 0%, #925d14 50%, #ea580c 100%)',
    primary: '#fb923c',
    secondary: '#f97316',
    accent: '#ea580c'
  },
  lavender: {
    name: 'Royal',
    gradient: 'linear-gradient(135deg, #160329 0%, #a855f7 50%, #9333ea 100%)',
    primary: '#c084fc',
    secondary: '#a855f7',
    accent: '#9333ea'
  }
};

export const getTheme = (themeName) => {
  return themes[themeName] || themes.default;
};