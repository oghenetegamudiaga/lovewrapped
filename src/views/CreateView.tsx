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
  // Caps longest edge at ~1600px, re-encodes as JPEG starting at quality 0.8 down to ~0.15 until size <= 3MB
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

  // Process files with client-side image compression and upload flow
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
    setIsUploading(true);

    let oversizeCount = 0;

    try {
      for (const file of filesToProcess) {
        let fileToUpload: File;
        try {
          fileToUpload = await compressImage(file);
        } catch (cErr) {
          console.warn('Image compression failed, proceeding with original file:', cErr);
          fileToUpload = file;
        }

        // Check if compressed file size is safely under 3MB (Vercel payload limit protection)
        if (fileToUpload.size > 3 * 1024 * 1024) {
          oversizeCount++;
          continue;
        }

        // Request signed upload URL or parameters from serverless endpoint (sends only tiny JSON metadata)
        const uploadInfo = await getSignedUploadUrlApi(fileToUpload.name, fileToUpload.type || 'image/jpeg');

        if (uploadInfo.signedUrl) {
          // Direct browser-to-Supabase Storage PUT (bypasses serverless function entirely)
          const uploadRes = await fetch(uploadInfo.signedUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': fileToUpload.type || 'image/jpeg',
            },
            body: fileToUpload,
          });

          if (!uploadRes.ok) {
            throw new Error(`Storage upload failed with status ${uploadRes.status}`);
          }

          if (uploadInfo.publicUrl) {
            setImages((prev) => [...prev, uploadInfo.publicUrl!]);
          }
        } else if (uploadInfo.supabaseUrl && uploadInfo.supabaseAnonKey) {
          // Direct client-side Supabase SDK upload directly from browser
          const { createClient } = await import('@supabase/supabase-js');
          const client = createClient(uploadInfo.supabaseUrl, uploadInfo.supabaseAnonKey);
          const { error: storageErr } = await client.storage
            .from('experience-images')
            .upload(uploadInfo.path, fileToUpload, { contentType: fileToUpload.type || 'image/jpeg', upsert: true });

          if (storageErr) throw storageErr;

          const { data: pubData } = client.storage
            .from('experience-images')
            .getPublicUrl(uploadInfo.path);

          if (pubData?.publicUrl) {
            setImages((prev) => [...prev, pubData.publicUrl]);
          }
        } else {
          // Local environment fallback (read compressed file as Data URL on client without API byte payload)
          await new Promise<void>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target?.result) {
                setImages((prev) => [...prev, event.target!.result as string]);
                resolve();
              } else {
                reject(new Error('Failed to read file locally.'));
              }
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(fileToUpload);
          });
        }
      }

      if (oversizeCount > 0) {
        setImageError('File too large — could not compress photo under safe size limit');
      }
    } catch (err: unknown) {
      console.error('Direct image upload error:', err);
      const msg = err instanceof Error ? err.message : 'Network error or storage upload failure.';
      setUploadError(`Upload failed: ${msg}. Please check your connection and try again.`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) setIsDragging(true);
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
    <div className="min-h-screen bg-[#2b0818] text-[#fce7f3] py-12 px-4 sm:px-6 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Step Header */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-10 pb-6 border-b border-rose-900/40 text-center">
          <div className="flex flex-col items-center">
            <div className="eyebrow-pill mb-2">
              <span />
              Your LoveWrapped
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Let’s make it <em className="italic font-normal text-rose-300">personal.</em>
            </h1>
          </div>

          {/* Active Plan Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-rose-950/80 border border-rose-800/60 text-xs font-semibold">
            <button
              type="button"
              id="plan-toggle-free"
              onClick={() => onChangePlan('free')}
              className={`px-3.5 py-1.5 rounded-full transition-all ${
                selectedPlan === 'free'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-rose-300/80 hover:text-white'
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
                  ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md'
                  : 'text-rose-300/80 hover:text-white'
              }`}
            >
              Paid ({PAID_PLAN_PRICE_FORMATTED})
            </button>
          </div>
        </div>

        {/* Selected Tier Feature Matrix Banner */}
        <div className="glass-card p-4 rounded-2xl mb-8 flex flex-wrap items-center justify-around gap-4 text-xs font-medium border border-rose-500/20">
          <div className="flex items-center gap-2">
            <span className="text-rose-300/70">Slides:</span>
            <b className="text-white font-semibold">{selectedPlan === 'paid' ? 'Up to 12 slides' : 'Up to 5 slides'}</b>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-rose-300/70">Photos:</span>
            <b className={selectedPlan === 'free' ? 'text-rose-400/60' : 'text-emerald-400 font-semibold'}>
              {selectedPlan === 'free' ? 'Not included' : 'Up to 5 photos'}
            </b>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-rose-300/70">Music & Watermark:</span>
            <b className={selectedPlan === 'paid' ? 'text-emerald-400 font-semibold' : 'text-rose-400/60'}>
              {selectedPlan === 'paid' ? 'Music included • No watermark' : 'LoveWrapped watermark'}
            </b>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 glass-card p-6 sm:p-8 rounded-3xl border border-rose-500/20 space-y-6">
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <p>{errorMessage}</p>
              </div>
            )}

            {/* Names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-rose-200/90 mb-1.5">Your name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daniel"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#3a0d22] border border-rose-800/60 focus:outline-none focus:border-rose-400 text-white placeholder:text-rose-300/40 text-sm font-medium transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-rose-200/90 mb-1.5">Their name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amara"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#3a0d22] border border-rose-800/60 focus:outline-none focus:border-rose-400 text-white placeholder:text-rose-300/40 text-sm font-medium transition-all"
                />
              </div>
            </div>

            {/* Occasion */}
            <div>
              <label className="block text-xs font-medium text-rose-200/90 mb-1.5">Occasion *</label>
              <select
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#3a0d22] border border-rose-800/60 focus:outline-none focus:border-rose-400 text-white text-sm font-medium transition-all"
              >
                {OCCASIONS.map((occ) => (
                  <option key={occ} value={occ} className="bg-[#3a0d22] text-white">
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
                  className="w-full mt-3 px-4 py-3 rounded-2xl bg-[#3a0d22] border border-rose-800/60 focus:outline-none focus:border-rose-400 text-white text-sm font-medium transition-all"
                />
              )}
            </div>

            {/* Message */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-rose-200/90">Your short message *</label>
                <span className="text-xs text-rose-300/70">
                  {budget.usedTextChars} / {budget.totalTextBudget} chars
                </span>
              </div>

              <textarea
                required
                rows={4}
                placeholder="Tell them something true and beautiful..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#3a0d22] border border-rose-800/60 focus:outline-none focus:border-rose-400 text-white placeholder:text-rose-300/40 text-sm font-medium leading-relaxed transition-all"
              />
              <p className="text-[11px] text-rose-300/60 mt-1">
                Keep it honest. We’ll turn this into a beautiful story.
              </p>
            </div>

            {/* Photo Upload if plan allows */}
            {selectedPlan === 'paid' && (
              <div className="pt-2 border-t border-rose-900/40">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-rose-200/90">
                    Photos ({images.length} / 5)
                  </label>
                  <span className="text-[11px] text-rose-300/70">
                    JPEG, PNG, WebP · up to 5MB each
                  </span>
                </div>

                {/* Client-side validation error banner (size limit, format) */}
                {imageError && (
                  <div className="mb-3 p-3 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{imageError}</span>
                  </div>
                )}

                {/* Network or Storage upload error banner */}
                {uploadError && (
                  <div className="mb-3 p-3 rounded-xl bg-rose-950/90 border border-amber-500/50 text-amber-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
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
                        ? 'border-rose-500/50 bg-[#3a0d22]/30 pointer-events-none opacity-80'
                        : isDragging
                        ? 'border-rose-400 bg-rose-900/40 scale-[1.01]'
                        : 'border-rose-700/60 hover:border-rose-400 bg-[#3a0d22]/50'
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw className="w-5 h-5 text-rose-300 animate-spin mb-1" />
                        <span className="text-xs font-medium text-white">Compressing & uploading photo memory...</span>
                        <span className="text-[11px] text-rose-300/70 mt-1">
                          JPEG, PNG, WebP · up to 5MB each
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-rose-300 mb-1" />
                        <span className="text-xs font-medium text-white">
                          {isDragging ? 'Drop your images here' : 'Click or drag photo memory to upload'}
                        </span>
                        <span className="text-[11px] text-rose-300/70 mt-1">
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
                      <p className="text-[11px] text-rose-300/70 mb-2">
                        JPEG, PNG, WebP · up to 5MB each
                      </p>
                    )}
                    <div className="grid grid-cols-5 gap-2">
                      {images.map((imgUrl, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-rose-700/60 group">
                          <img src={imgUrl} alt="uploaded memory" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute inset-0 bg-black/70 text-rose-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
              <label className="block text-xs font-medium text-rose-200/90 mb-1.5">Your email (optional)</label>
              <input
                type="email"
                placeholder="e.g. daniel@example.com"
                value={creatorEmail}
                onChange={(e) => setCreatorEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#3a0d22] border border-rose-800/60 focus:outline-none focus:border-rose-400 text-white placeholder:text-rose-300/40 text-sm font-medium transition-all"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || budget.isOverflow}
              className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 hover:from-rose-500 hover:to-pink-500 text-white font-semibold text-base shadow-xl shadow-rose-950/80 transition-all flex items-center justify-center gap-2 border border-rose-400/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Preparing story...</span>
                </>
              ) : (
                <>
                  <span>Preview your story</span>
                  <ArrowUpRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Live Preview List */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-card p-6 rounded-3xl border border-rose-500/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif font-bold text-lg text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-400" />
                  Live Story Layout
                </h3>
                <span className="text-xs font-medium text-rose-300 bg-rose-900/60 px-2.5 py-1 rounded-full border border-rose-700/50">
                  {liveSlides.length} Slides
                </span>
              </div>

              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {liveSlides.map((slide, i) => (
                  <div key={slide.id} className="p-3.5 rounded-2xl bg-[#3a0d22]/80 border border-rose-800/50 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-rose-900/80 text-rose-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-rose-700/50">
                      {i + 1}
                    </span>
                    <div className="flex-1 text-xs text-rose-100 font-medium leading-relaxed">
                      {slide.type === 'image' ? (
                        <div className="flex items-center gap-3">
                          <img src={slide.url} alt="slide photo" className="w-12 h-12 object-cover rounded-lg border border-rose-700" />
                          <span className="italic text-rose-300">Photo Memory</span>
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

