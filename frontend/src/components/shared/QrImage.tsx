import { useEffect, useState } from 'react';
import { fetchQrBlobUrl } from '../../api';

export function QrImage({ lotId, className }: { lotId: string; className?: string }) {
  const [src, setSrc] = useState<string>();
  useEffect(() => {
    let url: string | undefined;
    let cancelled = false;
    fetchQrBlobUrl(lotId).then((u) => { url = u; if (!cancelled) setSrc(u); }).catch(() => {});
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url); };
  }, [lotId]);
  return src ? <img src={src} alt="QR" className={className} /> : <div className={className} />;
}
