const WATERMARK_ERROR = 'Gagal membuat watermark foto. Silakan coba lagi.';

function formatCapturedAt(capturedAt) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(capturedAt);
}

export function createWatermarkedPhoto({ videoElement, coordinates, capturedAt = new Date() }) {
  return new Promise((resolve, reject) => {
    const width = videoElement?.videoWidth;
    const height = videoElement?.videoHeight;

    if (!width || !height) {
      reject(new Error(WATERMARK_ERROR));
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      reject(new Error(WATERMARK_ERROR));
      return;
    }

    context.drawImage(videoElement, 0, 0, width, height);

    const shortestSide = Math.min(width, height);
    const padding = Math.max(18, Math.round(shortestSide * 0.035));
    const fontSize = Math.max(22, Math.round(shortestSide * 0.038));
    const lineHeight = Math.round(fontSize * 1.35);
    const watermarkLines = [
      'Daily Check',
      formatCapturedAt(capturedAt),
      `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`,
    ];

    const boxHeight = padding * 2 + lineHeight * watermarkLines.length;
    const boxY = Math.max(0, height - boxHeight);

    context.fillStyle = 'rgba(15, 23, 42, 0.72)';
    context.fillRect(0, boxY, width, boxHeight);

    context.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
    context.fillStyle = '#FFFFFF';
    context.textBaseline = 'top';

    watermarkLines.forEach((line, index) => {
      context.fillText(line, padding, boxY + padding + index * lineHeight, width - padding * 2);
    });

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(WATERMARK_ERROR));
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      0.88
    );
  });
}
