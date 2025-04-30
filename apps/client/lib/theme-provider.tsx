import { createContext, useContext, useEffect, useState } from "react";
import { useParams } from "next/navigation";

// Define the theme structure based on our Prisma schema
export interface ThemeConfig {
  colors: {
    primary: {
      DEFAULT: string;
      50?: string;
      100?: string;
      200?: string;
      300?: string;
      400?: string;
      500?: string;
      600?: string;
      700?: string;
      800?: string;
      900?: string;
    };
    secondary: {
      DEFAULT: string;
    };
  };
  borderRadius?: {
    sm?: string;
    DEFAULT?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
  fontFamily?: {
    sans?: string[];
  };
}

interface ThemeContextType {
  theme: ThemeConfig | null;
  isLoading: boolean;
  projectSlug: string | null;
}

// Create context for theme
const ThemeContext = createContext<ThemeContextType>({
  theme: null,
  isLoading: true,
  projectSlug: null,
});

// Default theme as fallback
const defaultTheme: ThemeConfig = {
  colors: {
    primary: {
      DEFAULT: "#0079FF",
      50: "#E6F0FF",
      100: "#CCE0FF",
      200: "#99C2FF",
      300: "#66A3FF",
      400: "#3385FF",
      500: "#0066FF",
      600: "#0053CC",
      700: "#003F99",
      800: "#002A66",
      900: "#001533",
    },
    secondary: {
      DEFAULT: "#10B981",
    },
  },
  borderRadius: {
    sm: "0.125rem",
    DEFAULT: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const [themeContext, setThemeContext] = useState<ThemeContextType>({
    theme: null,
    isLoading: true,
    projectSlug: null,
  });

  useEffect(() => {
    async function loadTheme() {
      try {
        // Get project slug from path or subdomain
        const projectSlug = 
          // From subdomain: example.client.dabao.in
          window.location.hostname.split('.')[0] !== 'localhost' 
            ? window.location.hostname.split('.')[0]
            : params.projectSlug as string || 'demo'; // Fallback to demo

        // Fetch theme from API
        const response = await fetch(`/api/theme?projectSlug=${projectSlug}`);
        
        if (!response.ok) {
          throw new Error('Failed to load theme');
        }
        
        const data = await response.json();
        
        setThemeContext({
          theme: data.theme || defaultTheme,
          isLoading: false,
          projectSlug,
        });
        
        // Apply theme to CSS variables
        applyTheme(data.theme || defaultTheme);
      } catch (error) {
        console.error('Error loading theme:', error);
        // Apply default theme as fallback
        setThemeContext({
          theme: defaultTheme,
          isLoading: false,
          projectSlug: 'default',
        });
        applyTheme(defaultTheme);
      }
    }

    loadTheme();
  }, [params]);

  return (
    <ThemeContext.Provider value={themeContext}>
      {children}
    </ThemeContext.Provider>
  );
}

// Helper to convert hex to hsl
function hexToHSL(hex: string): string {
  // Convert hex to RGB
  let r = 0, g = 0, b = 0;
  
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  
  // Convert RGB to HSL
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  // Convert to degrees and percentages
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
}

// Apply theme to CSS variables
function applyTheme(theme: ThemeConfig) {
  const root = document.documentElement;
  
  // Apply colors
  if (theme.colors) {
    if (theme.colors.primary) {
      root.style.setProperty('--primary', hexToHSL(theme.colors.primary.DEFAULT));
      root.style.setProperty('--primary-foreground', '0 0% 100%');
      
      // Apply shades if available
      if (theme.colors.primary['50']) root.style.setProperty('--primary-50', hexToHSL(theme.colors.primary['50']));
      if (theme.colors.primary['100']) root.style.setProperty('--primary-100', hexToHSL(theme.colors.primary['100']));
      if (theme.colors.primary['200']) root.style.setProperty('--primary-200', hexToHSL(theme.colors.primary['200']));
      if (theme.colors.primary['300']) root.style.setProperty('--primary-300', hexToHSL(theme.colors.primary['300']));
      if (theme.colors.primary['400']) root.style.setProperty('--primary-400', hexToHSL(theme.colors.primary['400']));
      if (theme.colors.primary['500']) root.style.setProperty('--primary-500', hexToHSL(theme.colors.primary['500']));
      if (theme.colors.primary['600']) root.style.setProperty('--primary-600', hexToHSL(theme.colors.primary['600']));
      if (theme.colors.primary['700']) root.style.setProperty('--primary-700', hexToHSL(theme.colors.primary['700']));
      if (theme.colors.primary['800']) root.style.setProperty('--primary-800', hexToHSL(theme.colors.primary['800']));
      if (theme.colors.primary['900']) root.style.setProperty('--primary-900', hexToHSL(theme.colors.primary['900']));
    }
    
    if (theme.colors.secondary) {
      root.style.setProperty('--secondary', hexToHSL(theme.colors.secondary.DEFAULT));
      root.style.setProperty('--secondary-foreground', '0 0% 100%');
    }
  }
  
  // Apply border radius
  if (theme.borderRadius) {
    if (theme.borderRadius.sm) root.style.setProperty('--radius-sm', theme.borderRadius.sm);
    if (theme.borderRadius.DEFAULT) root.style.setProperty('--radius', theme.borderRadius.DEFAULT);
    if (theme.borderRadius.md) root.style.setProperty('--radius-md', theme.borderRadius.md);
    if (theme.borderRadius.lg) root.style.setProperty('--radius-lg', theme.borderRadius.lg);
    if (theme.borderRadius.xl) root.style.setProperty('--radius-xl', theme.borderRadius.xl);
  }
}

// Hook to use theme in components
export const useTheme = () => useContext(ThemeContext);