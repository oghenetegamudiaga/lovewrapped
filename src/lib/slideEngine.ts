import { PlanTier, Slide, SlideBudgetInfo } from '../types';

/**
 * Calculates slide budget rules for Free vs Paid tier.
 */
export function calculateSlideBudget(
  tier: PlanTier,
  message: string,
  imagesCount: number
): SlideBudgetInfo {
  const currentImages = tier === 'free' ? 0 : Math.min(Math.max(0, imagesCount), 5);
  const usedTextChars = message.length;

  if (tier === 'free') {
    const maxTotalSlides = 5;
    const maxImages = 0;
    const textSlidesAvailable = 5;
    const charsPerTextSlide = 120;
    const totalTextBudget = 500;
    const remainingTextChars = totalTextBudget - usedTextChars;
    const isOverflow = usedTextChars > totalTextBudget;

    let overflowMessage: string | undefined;
    if (isOverflow) {
      overflowMessage = `Message is too long for a 5-slide Free experience (${usedTextChars}/${totalTextBudget} chars). Upgrade to Paid for up to 12 slides!`;
    }

    return {
      tier,
      maxTotalSlides,
      maxImages,
      currentImages: 0,
      textSlidesAvailable,
      charsPerTextSlide,
      totalTextBudget,
      usedTextChars,
      remainingTextChars,
      isOverflow,
      overflowMessage,
    };
  } else {
    // Paid tier
    const maxTotalSlides = 12;
    const maxImages = 5;
    // Guarantee at least 1 text slide even if 5 images are uploaded
    const textSlidesAvailable = Math.max(1, maxTotalSlides - currentImages);
    const charsPerTextSlide = 200;
    const totalTextBudget = textSlidesAvailable * charsPerTextSlide;
    const remainingTextChars = totalTextBudget - usedTextChars;
    const isOverflow = usedTextChars > totalTextBudget;

    let overflowMessage: string | undefined;
    if (isOverflow) {
      if (currentImages > 0) {
        overflowMessage = `Message exceeds capacity (${usedTextChars}/${totalTextBudget} chars). Try removing an image or shortening your message.`;
      } else {
        overflowMessage = `Message exceeds capacity (${usedTextChars}/${totalTextBudget} chars). Shorten your text slightly to fit within 12 slides.`;
      }
    }

    return {
      tier,
      maxTotalSlides,
      maxImages,
      currentImages,
      textSlidesAvailable,
      charsPerTextSlide,
      totalTextBudget,
      usedTextChars,
      remainingTextChars,
      isOverflow,
      overflowMessage,
    };
  }
}

/**
 * Smartly splits a message string into clean sentence chunks.
 */
export function splitMessageIntoChunks(
  message: string,
  targetChunkCount: number,
  maxCharsPerChunk: number
): string[] {
  const trimmed = message.trim();
  if (!trimmed) return ['...'];

  // Clean double spaces / weird line breaks
  const sanitized = trimmed.replace(/\r\n/g, '\n');

  // Split into paragraphs or sentences
  const rawSentences = sanitized
    .split(/(?<=[.!?\n])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (rawSentences.length === 0) {
    return [sanitized.slice(0, maxCharsPerChunk)];
  }

  // If there are fewer sentences than available slides, or sentences are short enough:
  // Distribute sentences cleanly across chunks
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of rawSentences) {
    // If adding this sentence stays within maxCharsPerChunk
    if ((currentChunk + ' ' + sentence).trim().length <= maxCharsPerChunk) {
      currentChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      // If the sentence itself exceeds maxCharsPerChunk, cut at clause or space
      if (sentence.length > maxCharsPerChunk) {
        let remainingSentence = sentence;
        while (remainingSentence.length > maxCharsPerChunk) {
          // Find last space before maxCharsPerChunk
          let cutIndex = remainingSentence.lastIndexOf(' ', maxCharsPerChunk);
          if (cutIndex <= 0) cutIndex = maxCharsPerChunk;
          chunks.push(remainingSentence.slice(0, cutIndex).trim());
          remainingSentence = remainingSentence.slice(cutIndex).trim();
        }
        currentChunk = remainingSentence;
      } else {
        currentChunk = sentence;
      }
    }

    if (chunks.length >= targetChunkCount) break;
  }

  if (currentChunk && chunks.length < targetChunkCount) {
    chunks.push(currentChunk);
  }

  // Ensure we do not exceed targetChunkCount
  return chunks.slice(0, targetChunkCount);
}

/**
 * Generates an array of Slide objects from sender, receiver, occasion, message, and images.
 */
export function generateSlides(
  senderName: string,
  receiverName: string,
  occasion: string,
  message: string,
  tier: PlanTier,
  imageUrlList: string[] = []
): Slide[] {
  const budget = calculateSlideBudget(tier, message, imageUrlList.length);
  const textChunks = splitMessageIntoChunks(
    message,
    budget.textSlidesAvailable,
    budget.charsPerTextSlide
  );

  const slides: Slide[] = [];
  let slideIndex = 1;

  // Slide 1: Cover/Opening Slide
  const firstChunk = textChunks.length > 0 ? textChunks[0] : message;
  const openingContent = `Dear ${receiverName || 'Loved One'},\n\n${firstChunk}`;
  slides.push({
    id: `slide-${slideIndex}`,
    type: 'text',
    content: openingContent,
    order: slideIndex++,
  });

  // Remaining text chunks
  const remainingTextChunks = textChunks.slice(1);

  // If paid tier with images, interleave or place images tastefully
  const images = tier === 'paid' ? imageUrlList.slice(0, 5) : [];
  let imgIdx = 0;

  // Add middle slides
  for (let i = 0; i < remainingTextChunks.length; i++) {
    // Check if we should insert an image slide first
    if (imgIdx < images.length && (i === 0 || i % 2 === 1)) {
      slides.push({
        id: `slide-${slideIndex}`,
        type: 'image',
        url: images[imgIdx],
        caption: `A special memory for our ${occasion}`,
        order: slideIndex++,
      });
      imgIdx++;
    }

    slides.push({
      id: `slide-${slideIndex}`,
      type: 'text',
      content: remainingTextChunks[i],
      order: slideIndex++,
    });
  }

  // Append any leftover images
  while (imgIdx < images.length && slides.length < budget.maxTotalSlides) {
    slides.push({
      id: `slide-${slideIndex}`,
      type: 'image',
      url: images[imgIdx],
      caption: `${occasion} Moments`,
      order: slideIndex++,
    });
    imgIdx++;
  }

  // Final closing touch on the last text slide or sign-off slide if space permits
  if (slides.length > 0) {
    const lastSlide = slides[slides.length - 1];
    if (lastSlide.type === 'text') {
      lastSlide.content += `\n\nWith all my love,\n${senderName || 'Your Special Someone'}`;
    } else if (slides.length < budget.maxTotalSlides) {
      slides.push({
        id: `slide-${slideIndex}`,
        type: 'text',
        content: `Always & Forever,\nWith love from ${senderName || 'Your Special Someone'} 💖`,
        order: slideIndex++,
      });
    }
  }

  return slides;
}
