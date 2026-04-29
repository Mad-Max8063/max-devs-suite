
import { ImageResponse } from '@vercel/og';
export const config = { runtime: 'edge' };
export default function handler() {
  return new ImageResponse(
    <div style={{ display: 'flex', width: '100%', height: '100%', backgroundColor: 'red' }}>Hello</div>,
    { width: 1200, height: 630 }
  );
}
