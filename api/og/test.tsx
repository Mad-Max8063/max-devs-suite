
import { ImageResponse } from '@vercel/og';
export const config = { runtime: 'edge' };
const FONT_URL = 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff';
export default async function handler() {
  const fontData = await fetch(new URL(FONT_URL, import.meta.url)).then(res => res.arrayBuffer());
  return new ImageResponse(
    <div style={{ display: 'flex', width: '100%', height: '100%', backgroundColor: 'red' }}>Hello</div>,
    { width: 1200, height: 630, fonts: [{ name: 'Inter', data: fontData, style: 'normal', weight: 400 }] }
  );
}
