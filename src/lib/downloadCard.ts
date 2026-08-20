import { toJpeg, toPng } from 'html-to-image';

export interface DownloadCardOptions {
  maxWidth?: number;
  watermark?: boolean;
  filename?: string;
  quality?: number;
}

/**
 * Rasterizes a static invitation card DOM element and triggers a browser download.
 *
 * @param element The HTML element container of the card to capture.
 * @param format Output image format ('jpeg' | 'png').
 * @param options Configuration options for output dimensions, watermark, and filename.
 */
export async function downloadCard(
  element: HTMLElement,
  format: 'jpeg' | 'png' = 'jpeg',
  options: DownloadCardOptions = {}
): Promise<void> {
  if (!element) {
    throw new Error('Target card element was not found.');
  }

  const watermarkEnabled = options.watermark ?? false;
  const targetMaxWidth = watermarkEnabled ? (options.maxWidth || 800) : options.maxWidth;
  const quality = options.quality ?? 0.92;
  const defaultFilename = watermarkEnabled ? 'save-the-date-card' : 'wedding-invitation-card';
  const filename = `${options.filename || defaultFilename}.${format}`;

  let dynamicallyAddedWatermark: HTMLElement | null = null;

  try {
    // 1. Watermark Integrity Enforcement:
    // If watermark is requested, verify watermark element exists inside target DOM.
    // If missing (e.g., stripped via DevTools manipulation), inject temporary watermark badge into target DOM before capture.
    if (watermarkEnabled) {
      const existingBadge = element.querySelector('#amorah-watermark-badge');
      if (!existingBadge) {
        dynamicallyAddedWatermark = document.createElement('div');
        dynamicallyAddedWatermark.id = 'amorah-watermark-badge-injected';
        dynamicallyAddedWatermark.className =
          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider bg-black/40 backdrop-blur border border-white/20 text-white/90 shadow-sm my-2';
        dynamicallyAddedWatermark.innerHTML =
          '<span>Made with <strong class="font-bold text-amber-200">Amorah</strong></span>';
        
        // Append to card footer
        element.appendChild(dynamicallyAddedWatermark);
      }
    }

    // 2. Determine canvas dimensions & scaling
    const rect = element.getBoundingClientRect();
    const elementWidth = rect.width || element.offsetWidth || 540;
    const elementHeight = rect.height || element.offsetHeight || 675;

    let canvasWidth: number | undefined = undefined;
    let canvasHeight: number | undefined = undefined;
    let pixelRatio = 2; // Default crisp rendering for high-DPI outputs

    if (targetMaxWidth && elementWidth > targetMaxWidth) {
      const scale = targetMaxWidth / elementWidth;
      canvasWidth = targetMaxWidth;
      canvasHeight = Math.round(elementHeight * scale);
      pixelRatio = scale * 2;
    } else if (targetMaxWidth && watermarkEnabled) {
      // For watermarked free tier, cap output width at max 800px
      const scale = Math.min(1, targetMaxWidth / elementWidth);
      canvasWidth = Math.round(elementWidth * scale);
      canvasHeight = Math.round(elementHeight * scale);
      pixelRatio = 1.5;
    }

    const htmlToImageOptions = {
      cacheBust: true,
      quality,
      canvasWidth,
      canvasHeight,
      pixelRatio,
      style: {
        transform: 'none',
        margin: '0',
      },
    };

    // 3. Rasterize via html-to-image
    let dataUrl: string;
    if (format === 'png') {
      dataUrl = await toPng(element, htmlToImageOptions);
    } else {
      dataUrl = await toJpeg(element, htmlToImageOptions);
    }

    // 4. Trigger browser file download
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err: unknown) {
    console.error('Error rasterizing invite card image:', err);
    throw new Error('Failed to download card image. Please try again.');
  } finally {
    // Clean up dynamically injected watermark element if any
    if (dynamicallyAddedWatermark && dynamicallyAddedWatermark.parentNode) {
      dynamicallyAddedWatermark.parentNode.removeChild(dynamicallyAddedWatermark);
    }
  }
}
