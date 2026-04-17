'use client';

import React, { useState, useEffect } from 'react';
import { generateBrandData, generateBrandImage, BrandIdentity } from '@/lib/gemini';
import { Loader2, Palette, Type, Wand2, Download, CheckCircle2, MessageSquareText } from 'lucide-react';
import ChatWidget from './ChatWidget';

export default function BrandDashboard() {
  const [mission, setMission] = useState('');
  const [imageSize, setImageSize] = useState<"1K" | "2K" | "4K">('1K');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brand, setBrand] = useState<BrandIdentity | null>(null);
  
  const [primaryLogoBase64, setPrimaryLogoBase64] = useState<string | null>(null);
  const [secondaryLogoBase64, setSecondaryLogoBase64] = useState<string | null>(null);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);

  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  // Load Google Fonts
  useEffect(() => {
    if (brand?.fonts) {
      const loadFont = (fontName: string) => {
        const linkId = `font-${fontName.replace(/\s+/g, '-')}`;
        if (!document.getElementById(linkId)) {
          const link = document.createElement('link');
          link.id = linkId;
          link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,700&display=swap`;
          link.rel = 'stylesheet';
          document.head.appendChild(link);
        }
      };
      loadFont(brand.fonts.header.name);
      loadFont(brand.fonts.body.name);
    }
  }, [brand]);

  const handleGenerate = async () => {
    if (!mission.trim()) {
       setError("Please enter a company mission.");
       return;
    }
    setError(null);
    setIsGenerating(true);
    setBrand(null);
    setPrimaryLogoBase64(null);
    setSecondaryLogoBase64(null);

    try {
      // 1. Generate text-based brand identity
      const newBrand = await generateBrandData(mission);
      setBrand(newBrand);
      setIsGenerating(false);

      // 2. Kick off image generation independently so the user can see text immediately
      setIsGeneratingImages(true);
      
      const [primaryUrl, secondaryUrl] = await Promise.all([
        generateBrandImage(newBrand.logoPrompt, imageSize),
        generateBrandImage(newBrand.secondaryLogoPrompt, imageSize)
      ]);

      setPrimaryLogoBase64(primaryUrl);
      setSecondaryLogoBase64(secondaryUrl);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsGenerating(false);
      setIsGeneratingImages(false);
    }
  };

  const copyToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white">
      {/* Navigation / Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-neutral-200 bg-white sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-neutral-900 rounded-sm flex items-center justify-center">
            <Wand2 className="w-4 h-4 text-white" />
          </div>
          <h1 className="font-semibold tracking-tight text-lg">Identity<span className="font-light opacity-50">Forge</span></h1>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <a href="#" className="text-neutral-500 hover:text-neutral-900 transition-colors">Documentation</a>
          <a href="#" className="bg-neutral-900 text-white px-4 py-2 rounded-full hover:bg-neutral-800 transition-colors">Export Assets</a>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-0 relative">
        
        {/* Left Side: Input Panel */}
        <div className="lg:col-span-4 border-r border-neutral-200 bg-white min-h-[calc(100vh-65px)] lg:sticky lg:top-[65px]">
          <div className="p-8 lg:p-10 flex flex-col h-full">
            <div className="mb-10">
              <h2 className="text-3xl font-light tracking-tight mb-2">Configure Brand</h2>
              <p className="text-neutral-500 text-sm">Describe the mission, values, and goal. The AI will forge a complete aesthetic system.</p>
            </div>

            <div className="space-y-6 flex-grow">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                  Company Mission / Brief
                </label>
                <textarea
                  value={mission}
                  onChange={(e) => setMission(e.target.value)}
                  className="w-full min-h-[160px] p-4 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:outline-none transition-all resize-none text-sm leading-relaxed"
                  placeholder="e.g. A sustainable coffee roaster focused on direct-trade beans and minimal environmental impact..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                  Image Quality
                </label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-neutral-100 rounded-lg">
                  {(["1K", "2K", "4K"] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => setImageSize(size)}
                      className={`py-2 text-xs font-medium rounded-md transition-all ${imageSize === size ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-900'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-neutral-100">
              {error && (
                <div className="p-4 mb-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                  {error}
                </div>
              )}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !mission.trim()}
                className="w-full bg-neutral-900 text-white rounded-xl py-4 font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Forging Identity...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Generate Brand Bible
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Output Dashboard */}
        <div className="lg:col-span-8 p-6 lg:p-12">
          {!brand && !isGenerating && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
              <Palette className="w-16 h-16 mb-6 stroke-1" />
              <h3 className="text-2xl font-light mb-2">No Brand Generated</h3>
              <p className="max-w-sm">Enter a company mission on the left to see the AI generate a complete brand system.</p>
            </div>
          )}

          {isGenerating && !brand && (
            <div className="h-full flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
                <p className="text-neutral-500 animate-pulse">Consulting the oracle...</p>
              </div>
            </div>
          )}

          {brand && (
            <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards">
              {/* Header section with fonts applied */}
              <div className="text-center" style={{ fontFamily: `"${brand.fonts.header.name}", ${brand.fonts.header.fallback}` }}>
                <h1 className="text-6xl md:text-8xl font-medium tracking-tight mb-4 text-neutral-900">{brand.brandName}</h1>
                <p className="text-xl md:text-2xl opacity-60 font-light max-w-2xl mx-auto" style={{ fontFamily: `"${brand.fonts.body.name}", ${brand.fonts.body.fallback}` }}>
                  &quot;{brand.tagline}&quot;
                </p>
              </div>

              {/* Logo Section */}
              <section className="bg-white rounded-3xl p-8 shadow-sm border border-neutral-100">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-neutral-400">Visual Marks</h3>
                  {isGeneratingImages && (
                    <span className="text-xs flex items-center gap-2 bg-neutral-100 px-3 py-1.5 rounded-full text-neutral-500 uppercase tracking-wide font-semibold">
                      <Loader2 className="w-3 h-3 animate-spin" /> Rendering {imageSize} assets
                    </span>
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Primary Logo */}
                  <div className="flex flex-col gap-4">
                    <div className="aspect-square bg-neutral-50 rounded-2xl border border-neutral-100 flex items-center justify-center overflow-hidden relative group">
                      {primaryLogoBase64 ? (
                        <img src={primaryLogoBase64} alt="Primary Logo" className="w-full h-full object-contain p-8" />
                      ) : (
                        <div className="flex flex-col items-center gap-3 text-neutral-300">
                           <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Primary Logo Base</h4>
                      <p className="text-sm text-neutral-500 leading-relaxed line-clamp-2">{brand.logoPrompt}</p>
                    </div>
                  </div>

                  {/* Secondary Mark */}
                  <div className="flex flex-col gap-4">
                    <div className="aspect-square bg-neutral-50 rounded-2xl border border-neutral-100 flex items-center justify-center overflow-hidden relative group">
                      {secondaryLogoBase64 ? (
                        <img src={secondaryLogoBase64} alt="Secondary Mark" className="w-full h-full object-contain p-12" />
                      ) : (
                        <div className="flex flex-col items-center gap-3 text-neutral-300">
                           <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Secondary Mark / Icon</h4>
                      <p className="text-sm text-neutral-500 leading-relaxed line-clamp-2">{brand.secondaryLogoPrompt}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Color Palette */}
              <section className="bg-white rounded-3xl overflow-hidden shadow-sm border border-neutral-100">
                <div className="p-8 pb-6 border-b border-neutral-100">
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-neutral-400">Color System</h3>
                </div>
                <div className="flex flex-col md:flex-row h-auto md:h-64 cursor-crosshair">
                  {brand.colors.map((color, i) => (
                    <div 
                      key={i} 
                      onClick={() => copyToClipboard(color.hex)}
                      className="flex-1 group relative flex flex-col transition-all duration-500 md:hover:flex-[1.5] cursor-pointer"
                      style={{ backgroundColor: color.hex }}
                    >
                      <div className="p-4 md:p-6 mt-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-md bg-white/10 text-white mix-blend-difference w-full">
                        <div className="text-2xl font-mono font-medium tracking-tight flex items-center gap-2 mb-1">
                          {color.hex} 
                          {copiedHex === color.hex && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                        <div className="text-sm opacity-90 font-medium tracking-wide">{color.name}</div>
                        <div className="text-xs opacity-70 mt-1 uppercase tracking-wider">{color.usage}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Typography */}
              <section className="bg-white rounded-3xl p-8 shadow-sm border border-neutral-100">
                <div className="flex items-center gap-2 mb-10">
                  <Type className="w-5 h-5 text-neutral-400" />
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-neutral-400">Typography Pairing</h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-12">
                  {/* Header Font */}
                  <div>
                    <div className="mb-6 pb-6 border-b border-neutral-100">
                      <div className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-1">Primary Display</div>
                      <div className="flex items-baseline justify-between">
                         <div className="text-2xl font-medium tracking-tight">{brand.fonts.header.name}</div>
                         <div className="text-xs text-neutral-500 font-mono bg-neutral-100 px-2 py-1 rounded">Google Fonts</div>
                      </div>
                      <p className="text-sm text-neutral-500 mt-2">{brand.fonts.header.description}</p>
                    </div>
                    <div 
                      className="space-y-4 text-neutral-900" 
                      style={{ fontFamily: `"${brand.fonts.header.name}", ${brand.fonts.header.fallback}` }}
                    >
                      <div className="text-5xl md:text-6xl tracking-tight leading-none">Aa</div>
                      <div className="text-4xl md:text-5xl tracking-tight leading-tight">The quick brown fox.</div>
                      <div className="text-2xl tracking-normal opacity-80 leading-normal">Aesthetic utility and functional grace, perfectly balanced for headers.</div>
                    </div>
                  </div>

                  {/* Body Font */}
                  <div>
                    <div className="mb-6 pb-6 border-b border-neutral-100">
                      <div className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-1">Secondary Reading</div>
                      <div className="flex items-baseline justify-between">
                         <div className="text-xl font-medium tracking-tight">{brand.fonts.body.name}</div>
                         <div className="text-xs text-neutral-500 font-mono bg-neutral-100 px-2 py-1 rounded">Google Fonts</div>
                      </div>
                      <p className="text-sm text-neutral-500 mt-2">{brand.fonts.body.description}</p>
                    </div>
                    <div 
                      className="space-y-4 text-neutral-700" 
                      style={{ fontFamily: `"${brand.fonts.body.name}", ${brand.fonts.body.fallback}` }}
                    >
                      <div className="text-4xl">Aa</div>
                      <div className="text-lg leading-relaxed">
                        The quick brown fox jumps over the lazy dog. 1234567890. This font is selected for maximum legibility and harmonious pairing with the chosen display typeface. Every glyph is proportioned for rhythmic, comfortable reading across extended paragraphs and dense data sets.
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Brand Voice */}
              <section className="bg-neutral-900 text-white rounded-3xl p-10 md:p-14 shadow-xl">
                 <h3 className="text-sm font-semibold uppercase tracking-widest text-neutral-400 mb-6 flex items-center gap-2">
                   <MessageSquareText className="w-5 h-5" /> Brand Voice & Tone
                 </h3>
                 <p className="text-xl md:text-3xl font-light leading-relaxed tracking-tight" style={{ fontFamily: `"${brand.fonts.header.name}", ${brand.fonts.header.fallback}` }}>
                   {brand.voice}
                 </p>
              </section>
            </div>
          )}
        </div>
      </main>

      {/* Floating Chat Widget */}
      <ChatWidget brandContext={brand} />
    </div>
  );
}
