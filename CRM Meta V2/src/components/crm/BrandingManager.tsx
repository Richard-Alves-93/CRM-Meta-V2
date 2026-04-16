import { useEffect } from "react";
import { useBranding } from "@/modules/auth/hooks/useAuth";
import { hexToHslStr } from "@/lib/colors";

/**
 * Componente responsável por injetar as configurações de marca (favicon, cores primárias)
 * diretamente no DOM. No-render component.
 */
export const BrandingManager = () => {
  const branding = useBranding();

  useEffect(() => {
    if (!branding) return;

    // 1. Atualizar Favicon
    if (branding.favicon) {
      const link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (link) {
        link.href = branding.favicon;
      } else {
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.href = branding.favicon;
        document.getElementsByTagName('head')[0].appendChild(newLink);
      }
    }

    // 2. Aplicar Cores Primárias no CSS Variable
    if (branding.primaryColor) {
      const hsl = hexToHslStr(branding.primaryColor);
      const root = document.documentElement;
      
      root.style.setProperty('--primary', hsl);
      root.style.setProperty('--ring', hsl);
      root.style.setProperty('--sidebar-primary', hsl);
      root.style.setProperty('--sidebar-ring', hsl);
      
      // Persiste localmente para evitar flashes de cor antiga antes do hydration
      localStorage.setItem('crm_custom_primary_color', branding.primaryColor);
    }
  }, [branding]);

  return null; // Este componente não renderiza nada visualmente
};
