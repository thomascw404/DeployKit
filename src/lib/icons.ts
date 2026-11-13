// 24x24 stroke icons (currentColor). Paths only; Icon.astro wraps them.
import type { IconName } from '../config/types';

export const icons: Record<IconName, string> = {
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3.5 17.3a1.8 1.8 0 0 0 2.5 2.5l5.8-5.8a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.2-.6-.6-2.2z"/>',
  engine: '<path d="M4 10h2V8h3V6h6v2h2l2 2h1v6h-1l-2 2H9l-3-2H4z"/><path d="M2 11v4M12 10v4"/>',
  brake: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5"/><path d="M5 7.5A8 8 0 0 1 9 4.5"/>',
  suspension: '<path d="M12 2v3M12 19v3M8 5h8M8 19h8"/><path d="M9 7l6 2-6 2 6 2-6 2 6 2"/>',
  tire: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v5M12 16v5M3 12h5M16 12h5"/>',
  exhaust: '<path d="M2 14h10a3 3 0 0 0 3-3V8h3a2 2 0 0 1 2 2v1"/><path d="M2 14v3h10"/><path d="M19 15c1 .8 1 2.2 0 3M21.5 14c1.8 1.6 1.8 3.4 0 5"/>',
  oil: '<path d="M12 3s5 6 5 10a5 5 0 0 1-10 0c0-4 5-10 5-10z"/>',
  scan: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h5M7 16l2-2 2 2 2-3 3 3"/>',
  battery: '<rect x="3" y="7" width="18" height="12" rx="2"/><path d="M7 4v3M17 4v3M7 13h3M15.5 11.5v3M14 13h3"/>',
  ac: '<path d="M12 2v20M4.9 4.9l14.2 14.2M2 12h20M4.9 19.1 19.1 4.9"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  shuttle: '<rect x="3" y="6" width="15" height="10" rx="2"/><path d="M18 9h2l1.5 3v4H18"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/>',
  coffee: '<path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M16 11h2a2 2 0 0 1 0 4h-2M8 3v3M12 3v3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.8-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.8z"/>',
  family: '<circle cx="8" cy="7" r="3"/><circle cx="17" cy="9" r="2.3"/><path d="M2.5 20a5.5 5.5 0 0 1 11 0M14 20a4 4 0 0 1 7.5-2"/>',
  badge: '<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 7 5-2.5 5 2.5-1.5-7"/>',
  map: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  phone: '<path d="M5 3h3l2 5-2.5 1.5a11 11 0 0 0 7 7L16 14l5 2v3a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
  check: '<path d="m5 12 4.5 4.5L19 7"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
};
