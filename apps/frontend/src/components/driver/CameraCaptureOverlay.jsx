import { Camera, RotateCcw, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useCameraCapture } from '../../hooks/useCameraCapture';
import PhotoReview from './PhotoReview';

export default function CameraCaptureOverlay({
  checklistItem,
  coordinates,
  onClose,
  onAcceptPhoto,
}) {
  const videoRef = useRef(null);
  const [videoReady, setVideoReady] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const {
    status,
    stream,
    errorMessage,
    openCamera,
    captureFrame,
    closeCamera,
  } = useCameraCapture();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    openCamera();

    return () => {
      document.body.style.overflow = '';
      closeCamera();
    };
  }, [closeCamera, openCamera]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      setVideoReady(false);
    }
  }, [stream]);

  const handleClose = () => {
    closeCamera();
    onClose();
  };

  const handleCapture = async () => {
    const result = await captureFrame({
      videoElement: videoRef.current,
      coordinates,
    });

    if (result) {
      setCapturedPhoto(result);
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    openCamera();
  };

  const handleAccept = () => {
    if (!capturedPhoto) return;

    onAcceptPhoto({
      blob: capturedPhoto.blob,
      capturedAt: capturedPhoto.capturedAt,
    });
    handleClose();
  };

  const canCapture = status === 'streaming' && videoReady && !capturedPhoto;
  const canRetry = ['denied', 'unavailable', 'unsupported', 'error'].includes(status);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10">
        <div className="min-w-0">
          <p className="text-xs text-slate-300">Ambil Foto</p>
          <h2 className="truncate text-base font-bold">{checklistItem.label}</h2>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="w-11 h-11 rounded-lg bg-white/10 text-white inline-flex items-center justify-center hover:bg-white/15"
          aria-label="Tutup kamera"
        >
          <X size={21} aria-hidden="true" />
        </button>
      </div>

      {capturedPhoto ? (
        <PhotoReview
          photoBlob={capturedPhoto.blob}
          checklistItem={checklistItem}
          onRetake={handleRetake}
          onAccept={handleAccept}
        />
      ) : (
        <>
          <div className="relative flex-1 min-h-0 bg-black">
            {status === 'streaming' && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={() => setVideoReady(true)}
                className="h-full w-full object-contain"
              />
            )}

            {status === 'requesting' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <span className="w-9 h-9 border-4 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                <p className="text-sm font-semibold">Meminta akses kamera...</p>
              </div>
            )}

            {errorMessage && status !== 'requesting' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                <p className="max-w-sm text-sm font-semibold">{errorMessage}</p>
                {canRetry && (
                  <button
                    type="button"
                    onClick={openCamera}
                    className="btn-secondary min-h-11 justify-center"
                    aria-label="Coba lagi membuka kamera"
                  >
                    <RotateCcw size={17} aria-hidden="true" />
                    Coba Lagi
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="bg-slate-950 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-center">
            <p className="mb-4 text-xs text-slate-300">Pastikan objek terlihat jelas, lalu tekan tombol kamera.</p>
            <button
              type="button"
              onClick={handleCapture}
              disabled={!canCapture}
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white text-primary shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Ambil foto"
            >
              <Camera size={34} aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
