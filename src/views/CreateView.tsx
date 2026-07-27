import React, { useState, useMemo } from 'react';
import { Heart, Sparkles, Upload, Trash2, ArrowUpRight, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { PlanTier, CreateExperiencePayload, Experience } from '../types.js';
import { calculateSlideBudget, generateSlides } from '../lib/slideEngine.js';
import { createExperienceApi, getSignedUploadUrlApi } from '../lib/api.js';
import { PAID_PLAN_PRICE_FORMATTED } from '../constants.js';

interface CreateViewProps {
  selectedPlan: PlanTier;
  onChangePlan: (plan: PlanTier) => void;
  onExperienceCreated: (experience: Experience) => void;
}

const OCCASIONS = [
  'Wedding Anniversary',
  'Relationship Anniversary',
  'Birthday Surprise',
  'Romantic Surprise',
  'Just Because',
  'Deep Appreciation',
  'Valentine’s Love',
  'Apology & Reconciliation',
  'Custom Occasion',
];

export const CreateView: React.FC<CreateViewProps> = ({
  selectedPlan,
  onChangePlan,
  onExperienceCreated,
}) => {
  const [senderName, setSenderName] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [occasion, setOccasion] = useState(OCCASIONS[0]);
  const [customOccasion, setCustomOccasion] = useState('');
  const [message, setMessage] = useState('');
  const [creatorEmail, setCreatorEmail] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const finalOccasion = occasion === 'Custom Occasion' ? customOccasion || 'Special Moment' : occasion;

  // Calculate dynamic slide budget live
  const budget = useMemo(() => {
    return calculateSlideBudget(selectedPlan, message, images.length);
  }, [selectedPlan, message, images.length]);

  // Live auto-generated slides
  const liveSlides = useMemo(() => {
    return generateSlides(
      senderName,
      receiverName,
      finalOccasion,
      message || 'Your heartfelt message will appear here slide by slide...',
      selectedPlan,
      images
    );
  }, [senderName, receiverName, finalOccasion, message, selectedPlan, images]);

  // Offscreen canvas image compression helper
  const compressImage = (file: File, maxDimension = 1600, maxSizeBytes = 3 * 1024 * 1024): Promise<File> => {
    if (!file.type.startsWith('image/')) {
      return Promise.resolve(file);
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return resolve(file);
        }

        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.8;
        const attemptCompression = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                return resolve(file);
              }
              if (blob.size <= maxSizeBytes || quality <= 0.15) {
                const compressedFile = new File(
                  [blob],
                  file.name.replace(/\.[^/.]+$/, '') + '.jpg',
                  { type: 'image/jpeg', lastModified: Date.now() }
                );
                return resolve(compressedFile);
              }

              quality -= 0.15;
              attemptCompression();
            },
            'image/jpeg',
            quality
          );
        };

        attemptCompression();
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      };

      img.src = url;
    });
  };

  const processFiles = async (files: FileList | File[]) => {
    setImageError(null);
    setUploadError(null);
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const maxPhotos = 5;
    const remainingSlots = maxPhotos - images.length;
    if (remainingSlots <= 0) {
      setImageError(`Maximum limit of ${maxPhotos} photos reached.`);
      return;
    }

    const filesToProcess = fileArray.slice(0, remainingSlots);

    const validFiles: File[] = [];
    for (const file of filesToProcess) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setImageError('Unsupported format. Please upload JPEG, PNG, or WebP images.');
        continue;
      }
      if (file.size > 15 * 1024 * 1024) {
        setImageError('Photo size exceeds 15MB limit before compression.');
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setIsUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const rawFile of validFiles) {
        const compressedFile = await compressImage(rawFile);
        let uploadedUrl = '';

        try {
          const uploadInfo = await getSignedUploadUrlApi(compressedFile.name, compressedFile.type);

          if (uploadInfo.signedUrl) {
            const uploadResp = await fetch(uploadInfo.signedUrl, {
              method: 'PUT',
              headers: {
                'Content-Type': compressedFile.type,
              },
              body: compressedFile,
            });

            if (uploadResp.ok && uploadInfo.publicUrl) {
              uploadedUrl = uploadInfo.publicUrl;
            }
          }
        } catch (err: unknown) {
          console.warn('Storage upload error, falling back:', err);
        }

        if (!uploadedUrl) {
          uploadedUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(compressedFile);
          });
        }

        uploadedUrls.push(uploadedUrl);
      }

      setImages((prev) => [...prev, ...uploadedUrls].slice(0, maxPhotos));
    } catch (err: unknown) {
      console.error('File processing error:', err);
      setUploadError('Failed to process image file. Please try another photo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!isUploading && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageError(null);
    setUploadError(null);
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!senderName.trim()) {
      setErrorMessage('Please enter your name.');
      return;
    }
    if (!receiverName.trim()) {
      setErrorMessage('Please enter their name.');
      return;
    }
    if (!message.trim() || message.trim().length < 10) {
      setErrorMessage('Please enter a heartfelt message (at least 10 characters).');
      return;
    }
    if (budget.isOverflow) {
      setErrorMessage('Please shorten your message or adjust photos to fit within the slide capacity.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: CreateExperiencePayload = {
        sender_name: senderName.trim(),
        receiver_name: receiverName.trim(),
        occasion: finalOccasion,
        message: message.trim(),
        tier: selectedPlan,
        images,
        creator_email: creatorEmail.trim() || undefined,
      };

      const created = await createExperienceApi(payload);
      onExperienceCreated(created);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create experience. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream text-maroon py-12 px-4 sm:px-6 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Step Header */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-10 pb-6 border-b border-cream-border text-center">
          <div className="flex flex-col items-center">
            <div className="eyebrow-pill mb-2">
              <span />
              Your LoveWrapped
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-maroon tracking-tight">
              Let’s make it <em className="italic font-normal text-coral">personal.</em>
            </h1>
          </div>

          {/* Active Plan Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-cream-card border border-cream-border text-xs font-semibold">
            <button
              type="button"
              id="plan-toggle-free"
              onClick={() => onChangePlan('free')}
              className={`px-3.5 py-1.5 rounded-full transition-all ${
                selectedPlan === 'free'
                  ? 'bg-maroon text-cream shadow-sm'
                  : 'text-mauve hover:text-maroon'
              }`}
            >
              Free (₦0)
            </button>
            <button
              type="button"
              id="plan-toggle-paid"
              onClick={() => onChangePlan('paid')}
              className={`px-3.5 py-1.5 rounded-full transition-all ${
                selectedPlan === 'paid'
                  ? 'bg-maroon text-cream shadow-sm'
                  : 'text-mauve hover:text-maroon'
              }`}
            >
              Paid ({PAID_PLAN_PRICE_FORMATTED})
            </button>
          </div>
        </div>

        {/* Selected Tier Feature Matrix Banner */}
        <div className="glass-card p-4 rounded-2xl mb-8 flex flex-wrap items-center justify-around gap-4 text-xs font-medium border border-cream-border">
          <div className="flex items-center gap-2">
            <span className="text-mauve">Slides:</span>
            <b className="text-maroon font-semibold">{selectedPlan === 'paid' ? 'Up to 12 slides' : 'Up to 5 slides'}</b>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-mauve">Photos:</span>
            <b className={selectedPlan === 'free' ? 'text-mauve/60' : 'text-emerald-700 font-semibold'}>
              {selectedPlan === 'free' ? 'Not included' : 'Up to 5 photos'}
            </b>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-mauve">Music & Watermark:</span>
            <b className={selectedPlan === 'paid' ? 'text-emerald-700 font-semibold' : 'text-mauve/60'}>
              {selectedPlan === 'paid' ? 'Music included • No watermark' : 'LoveWrapped watermark'}
            </b>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 glass-card p-6 sm:p-8 rounded-3xl border border-cream-border space-y-6">
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-coral/10 border border-coral/40 text-maroon text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-coral shrink-0 mt-0.5" />
                <p>{errorMessage}</p>
              </div>
            )}

            {/* Names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-mauve mb-1.5">Your name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daniel"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-cream-card border border-cream-border focus:outline-none focus:border-coral text-maroon placeholder:text-mauve/60 text-sm font-medium transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-mauve mb-1.5">Their name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amara"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-cream-card border border-cream-border focus:outline-none focus:border-coral text-maroon placeholder:text-mauve/60 text-sm font-medium transition-all"
                />
              </div>
            </div>

            {/* Occasion */}
            <div>
              <label className="block text-xs font-medium text-mauve mb-1.5">Occasion *</label>
              <select
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-cream-card border border-cream-border focus:outline-none focus:border-coral text-maroon text-sm font-medium transition-all"
              >
                {OCCASIONS.map((occ) => (
                  <option key={occ} value={occ} className="bg-cream-card text-maroon">
                    {occ}
                  </option>
                ))}
              </select>

              {occasion === 'Custom Occasion' && (
                <input
                  type="text"
                  placeholder="Enter custom occasion..."
                  value={customOccasion}
                  onChange={(e) => setCustomOccasion(e.target.value)}
                  className="w-full mt-3 px-4 py-3 rounded-2xl bg-cream-card border border-cream-border focus:outline-none focus:border-coral text-maroon text-sm font-medium transition-all"
                />
              )}
            </div>

            {/* Message */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-mauve">Your short message *</label>
                <span className="text-xs text-mauve/80">
                  {budget.usedTextChars} / {budget.totalTextBudget} chars
                </span>
              </div>

              <textarea
                required
                rows={4}
                placeholder="Tell them something true and beautiful..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-cream-card border border-cream-border focus:outline-none focus:border-coral text-maroon placeholder:text-mauve/60 text-sm font-medium leading-relaxed transition-all"
              />
              <p className="text-[11px] text-mauve/80 mt-1">
                Keep it honest. We’ll turn this into a beautiful story.
              </p>
            </div>

            {/* Photo Upload if plan allows */}
            {selectedPlan === 'paid' && (
              <div className="pt-2 border-t border-cream-border">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-mauve">
                    Photos ({images.length} / 5)
                  </label>
                  <span className="text-[11px] text-mauve/80">
                    JPEG, PNG, WebP · up to 5MB each
                  </span>
                </div>

                {/* Client-side validation error banner */}
                {imageError && (
                  <div className="mb-3 p-3 rounded-xl bg-rose-100 border border-coral/40 text-maroon text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-coral shrink-0" />
                    <span>{imageError}</span>
                  </div>
                )}

                {/* Upload error banner */}
                {uploadError && (
                  <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {images.length < 5 && (
                  <label
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed transition-all mb-4 text-center cursor-pointer ${
                      isUploading
                        ? 'border-cream-border bg-cream-card/50 pointer-events-none opacity-80'
                        : isDragging
                        ? 'border-coral bg-cream-border scale-[1.01]'
                        : 'border-cream-border hover:border-coral bg-cream-card'
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw className="w-5 h-5 text-coral animate-spin mb-1" />
                        <span className="text-xs font-medium text-maroon">Compressing & uploading photo memory...</span>
                        <span className="text-[11px] text-mauve/80 mt-1">
                          JPEG, PNG, WebP · up to 5MB each
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-coral mb-1" />
                        <span className="text-xs font-medium text-maroon">
                          {isDragging ? 'Drop your images here' : 'Click or drag photo memory to upload'}
                        </span>
                        <span className="text-[11px] text-mauve/80 mt-1">
                          JPEG, PNG, WebP · up to 5MB each
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          disabled={isUploading}
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </>
                    )}
                  </label>
                )}

                {images.length > 0 && (
                  <div>
                    {images.length >= 5 && (
                      <p className="text-[11px] text-mauve/80 mb-2">
                        JPEG, PNG, WebP · up to 5MB each
                      </p>
                    )}
                    <div className="grid grid-cols-5 gap-2">
                      {images.map((imgUrl, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-cream-border group">
                          <img src={imgUrl} alt="uploaded memory" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute inset-0 bg-maroon/70 text-cream flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Email optional */}
            <div>
              <label className="block text-xs font-medium text-mauve mb-1.5">Your email (optional)</label>
              <input
                type="email"
                placeholder="e.g. daniel@example.com"
                value={creatorEmail}
                onChange={(e) => setCreatorEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-cream-card border border-cream-border focus:outline-none focus:border-coral text-maroon placeholder:text-mauve/60 text-sm font-medium transition-all"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || budget.isOverflow}
              className="w-full py-4 px-6 rounded-full bg-maroon hover:bg-maroon-light text-cream font-semibold text-base shadow-md transition-all flex items-center justify-center gap-2 border border-maroon/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Preparing story...</span>
                </>
              ) : (
                <>
                  <span>Preview your story</span>
                  <ArrowUpRight className="w-5 h-5 text-coral" />
                </>
              )}
            </button>
          </form>

          {/* Live Preview List */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-card p-6 rounded-3xl border border-cream-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif font-bold text-lg text-maroon flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-coral" />
                  Live Story Layout
                </h3>
                <span className="text-xs font-medium text-dustyRose bg-cream-card px-2.5 py-1 rounded-full border border-cream-border">
                  {liveSlides.length} Slides
                </span>
              </div>

              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {liveSlides.map((slide, i) => (
                  <div key={slide.id} className="p-3.5 rounded-2xl bg-cream-card border border-cream-border flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-cream-border text-maroon font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-cream-border">
                      {i + 1}
                    </span>
                    <div className="flex-1 text-xs text-maroon font-medium leading-relaxed">
                      {slide.type === 'image' ? (
                        <div className="flex items-center gap-3">
                          <img src={slide.url} alt="slide photo" className="w-12 h-12 object-cover rounded-lg border border-cream-border" />
                          <span className="italic text-mauve">Photo Memory</span>
                        </div>
                      ) : (
                        <p className="line-clamp-3 whitespace-pre-line">{slide.content}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
