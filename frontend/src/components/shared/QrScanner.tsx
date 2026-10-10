import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

// Scans the collector's handover QR (kabadiwala://handover/<lotId>/<code>) with the back camera.
// Needs HTTPS (or localhost) for camera access. Calls onCode with the 6-character code.
export function QrScanner({ onCode, onClose }: { onCode: (code: string) => void; onClose: () => void }) {
  const [error, setError] = useState('');
  const doneRef = useRef(false);
  const cbRef = useRef({ onCode, onClose });
  cbRef.current = { onCode, onClose };

  useEffect(() => {
    const scanner = new Html5Qrcode('handover-qr-reader');
    let started = false;
    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      (text) => {
        if (doneRef.current) return;
        const code = text.trim().split('/').pop()?.toUpperCase() ?? '';
        if (!/^[A-Z0-9]{6}$/.test(code)) return; // not one of our codes - keep scanning
        doneRef.current = true;
        cbRef.current.onCode(code);
      },
      () => {},
    ).then(() => { started = true; if (doneRef.current) scanner.stop().catch(() => {}); })
      .catch(() => setError('Could not open the camera. Allow camera permission (needs HTTPS) or type the code.'));
    return () => { if (started) scanner.stop().then(() => scanner.clear()).catch(() => {}); };
  }, []);

  return (
    <div className="space-y-2">
      <div id="handover-qr-reader" className="w-full overflow-hidden rounded-lg" />
      {error && <p className="text-sm text-[var(--color-warning)]">{error}</p>}
      <button type="button" onClick={onClose} className="text-sm text-[var(--color-text-muted)] underline">Close scanner</button>
    </div>
  );
}
