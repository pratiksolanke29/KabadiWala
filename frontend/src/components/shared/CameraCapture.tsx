import { useTranslation } from 'react-i18next';
import { useRef, useEffect, useState, useCallback } from 'react';
import { X, RotateCcw, Camera } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => void;
  onClose?: () => void;
  facingMode?: 'environment' | 'user';
  maxWidth?: number;
  maxHeight?: number;
  imageQuality?: number;
}

export function CameraCapture({
  onCapture,
  onClose,
  facingMode = 'environment',
  maxWidth = 1280,
  maxHeight = 720,
  imageQuality = 0.8,
}: CameraCaptureProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Streams are resources, not render state. Updating them must not restart the effect.
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef(0);
  const tRef = useRef(t);
  tRef.current = t;
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [activeFacingMode, setActiveFacingMode] = useState(facingMode);

  useEffect(() => setActiveFacingMode(facingMode), [facingMode]);

  const stopCamera = useCallback(() => {
    // Also invalidate a permission request that completes after close/unmount.
    requestRef.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    const request = requestRef.current;
    setError(null);
    setHasPermission(false);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera requires HTTPS or localhost');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: activeFacingMode },
          width: { ideal: maxWidth },
          height: { ideal: maxHeight },
        },
      });
      if (request !== requestRef.current || !videoRef.current) {
        mediaStream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = mediaStream;
      // Video stays mounted during loading, so there is always a playback target.
      videoRef.current.srcObject = mediaStream;
      await videoRef.current.play();
    } catch (err) {
      if (request !== requestRef.current) return;
      stopCamera();
      console.error('Camera error:', err);
      setError(tRef.current('camera.error', { defaultValue: 'Unable to access camera. Please check permissions.' }));
      setHasPermission(false);
    }
  }, [activeFacingMode, maxWidth, maxHeight, stopCamera]);

  const closeCamera = useCallback(() => {
    stopCamera();
    onClose?.();
  }, [stopCamera, onClose]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || isCapturing || !hasPermission ||
        videoRef.current.readyState < 2 || !videoRef.current.videoWidth || !videoRef.current.videoHeight) return;
    
    setIsCapturing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      setIsCapturing(false);
      return;
    }

    // Set canvas size to video size
    const scale = Math.min(1, maxWidth / video.videoWidth, maxHeight / video.videoHeight);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/jpeg', imageQuality);
    onCapture(dataUrl);
    setIsCapturing(false);
  }, [onCapture, imageQuality, isCapturing, hasPermission, maxWidth, maxHeight]);

  const switchCamera = useCallback(() => {
    setActiveFacingMode((mode) => mode === 'environment' ? 'user' : 'environment');
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const loadingView = !hasPermission ? (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-surface-alt  rounded-card">
        {error ? (
          <div className="text-center p-8">
            <Camera size={32} strokeWidth={1.75} className="mb-4 text-muted" aria-hidden="true" />
            <p className="text-danger  mb-4">{error}</p>
            <button
              onClick={startCamera}
              className="px-6 py-3 bg-accent text-on-accent rounded-lg hover:bg-accent-hover transition-colors"
            >
              {t('camera.retry', { defaultValue: 'Retry' })}
            </button>
            {onClose && (
              <button
                onClick={closeCamera}
                className="mt-4 text-muted hover:text-foreground  "
              >
                {t('common.cancel', { defaultValue: 'Cancel' })}
              </button>
            )}
          </div>
        ) : (
          <div className="text-center">
            <Camera size={32} strokeWidth={1.75} className="mb-4 text-accent" aria-hidden="true" />
            <p className="text-muted ">{t('camera.loading', { defaultValue: 'Starting camera...' })}</p>
          </div>
        )}
      </div>
    ) : null;

  return (
    <div className="relative w-full">
      {loadingView}
      <div className={hasPermission ? '' : 'hidden'}>
        <div className="relative bg-black rounded-card overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedData={() => {
              const video = videoRef.current;
              if (streamRef.current && video?.srcObject === streamRef.current && video.videoWidth > 0) {
                setHasPermission(true);
              }
            }}
            className="w-full h-auto max-h-[500px] object-cover"
            aria-label={t('camera.preview', { defaultValue: 'Camera preview' })}
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {onClose && (
            <button
              onClick={closeCamera}
              className="absolute top-3 right-3 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              aria-label={t('common.close', { defaultValue: 'Close' })}
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={switchCamera}
            className="absolute top-3 left-3 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            aria-label={t('camera.switch', { defaultValue: 'Switch camera' })}
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-6 mt-6 p-4">
          {onClose && (
            <button
              onClick={closeCamera}
              className="px-6 py-3 text-foreground  hover:bg-surface-alt  rounded-lg transition-colors font-medium"
            >
              {t('common.cancel', { defaultValue: 'Cancel' })}
            </button>
          )}
          <button
            onClick={capturePhoto}
            disabled={isCapturing || !hasPermission}
            className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-white bg-accent hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 flex items-center justify-center"
            aria-label={t('camera.capture', { defaultValue: 'Capture photo' })}
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-panel" />
            {isCapturing && (
              <div className="absolute inset-0 rounded-full border border-white/50 " />
            )}
          </button>
          <div className="w-16 h-16 sm:w-20 sm:h-20" /> {/* spacer for alignment */}
        </div>

        <p className="text-center text-sm text-muted  mt-2">
          {t('camera.instruction', { defaultValue: 'Position the item in the frame and tap the button to capture' })}
        </p>
      </div>
    </div>
  );
}

interface PhotoPreviewProps {
  dataUrl: string;
  onRetake: () => void;
  onConfirm: () => void;
}

export function PhotoPreview({ dataUrl, onRetake, onConfirm }: PhotoPreviewProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-md">
        <img
          src={dataUrl}
          alt={t('camera.captured', { defaultValue: 'Captured photo' })}
          className="w-full rounded-card"
        />
      </div>
      <div className="flex gap-4 w-full max-w-md">
        <button
          onClick={onRetake}
          className="flex-1 px-6 py-3 border border-line text-foreground   rounded-lg hover:bg-surface-alt  transition-colors font-medium"
        >
          {t('camera.retake', { defaultValue: 'Retake' })}
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 px-6 py-3 bg-accent text-on-accent rounded-lg hover:bg-accent-hover transition-colors font-medium"
        >
          {t('common.next', { defaultValue: 'Next' })}
        </button>
      </div>
    </div>
  );
}