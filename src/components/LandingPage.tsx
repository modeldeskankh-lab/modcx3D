import React from 'react';
import {
  Sparkles,
  Box,
  Zap,
  ArrowRight,
  Layers,
  Cpu,
  Globe,
  Compass,
  Monitor,
  CheckCircle2,
  Sliders,
  Download,
  Terminal,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface LandingPageProps {
  onExploreHub: () => void;
  onLaunchEditorDirectly: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onExploreHub,
  onLaunchEditorDirectly
}) => {
  return (
    <div className="h-screen w-full bg-[#090b10] text-gray-100 font-sans selection:bg-cyan-500 selection:text-black overflow-y-auto overflow-x-hidden relative flex flex-col min-w-0">
      {/* Ambient Radial Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] max-w-full h-[500px] bg-gradient-to-b from-cyan-600/15 via-purple-600/10 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[600px] right-0 w-[500px] max-w-full h-[500px] bg-blue-600/10 blur-3xl pointer-events-none -z-10" />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370f_1px,transparent_1px),linear-gradient(to_bottom,#1f29370f_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none -z-10"
      />

      {/* Navigation Header */}
      <header className="w-full bg-[#090b10]/90 backdrop-blur-md sticky top-0 z-50 border-b border-[#1e2330]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 flex items-center justify-center text-white font-extrabold text-base sm:text-lg shadow-lg shadow-cyan-500/20 shrink-0">
              M
            </div>
            <span className="text-lg sm:text-xl font-extrabold tracking-tight text-white whitespace-nowrap">
              modcx<span className="text-cyan-400">3D</span>
            </span>
            <span className="hidden md:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase shrink-0">
              v2.4 Engine
            </span>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
            <button
              onClick={onLaunchEditorDirectly}
              className="hidden sm:block text-xs font-semibold text-gray-300 hover:text-white px-3 py-2 rounded-lg hover:bg-[#181d28] transition-colors whitespace-nowrap"
            >
              Launch Studio
            </button>
            <button
              onClick={onExploreHub}
              className="px-3 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs tracking-wide shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all flex items-center gap-1.5 whitespace-nowrap group"
            >
              <span>EXPLORE MODCX3D</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full min-w-0">
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-12 sm:pb-20 text-center relative w-full min-w-0">
          {/* Badge */}
          <div className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-3.5 py-1.5 rounded-full bg-[#151923] border border-[#2b3245] text-[10px] sm:text-xs text-cyan-300 mb-6 sm:mb-8 shadow-inner max-w-full">
            <Sparkles size={13} className="text-cyan-400 animate-pulse shrink-0" />
            <span className="font-semibold uppercase tracking-wider text-[10px] sm:text-[11px] break-words">Visual Studio WebGL 3D Game Scene Design</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
            <span className="text-gray-400">Browser-Based Web App</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white mb-4 sm:mb-6 leading-[1.15] sm:leading-[1.1] break-words max-w-full">
            Build, Render &amp; Ship <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Real-Time 3D Worlds
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-3xl mx-auto text-sm sm:text-lg md:text-xl text-gray-300 leading-relaxed font-normal mb-8 sm:mb-10 px-2 break-words">
            modcx3D is a browser-based web app designed for Visual Studio WebGL 3D game scene design, real-time rendering, and asset editing. Inspect GLTF assets, craft PBR materials, set physical skies, and export standalone 3D scenes.
          </p>

          {/* Hero Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16 w-full max-w-md sm:max-w-none mx-auto">
            <button
              onClick={onExploreHub}
              className="w-full sm:w-auto px-7 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm tracking-wide shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all flex items-center justify-center gap-2.5 group"
            >
              <Compass size={18} className="text-cyan-200 shrink-0" />
              <span className="whitespace-nowrap">EXPLORE MODCX3D HUB</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform text-cyan-200 shrink-0" />
            </button>

            <button
              onClick={onLaunchEditorDirectly}
              className="w-full sm:w-auto px-6 sm:px-7 py-3.5 sm:py-4 rounded-xl bg-[#141822] hover:bg-[#1f2535] border border-[#2d364d] text-gray-200 hover:text-white font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Monitor size={17} className="text-gray-400 shrink-0" />
              <span>Open 3D Studio Directly</span>
            </button>
          </div>

          {/* Engine Metric Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto p-3 sm:p-4 rounded-2xl bg-[#10131c]/80 border border-[#222838] backdrop-blur-md shadow-2xl w-full min-w-0">
            <div className="p-2.5 sm:p-3 text-center border-r border-[#1e2433] min-w-0">
              <div className="text-xl sm:text-2xl font-black text-cyan-400 font-mono truncate">60 FPS</div>
              <div className="text-[10px] sm:text-[11px] text-gray-400 uppercase tracking-wider font-medium mt-1 truncate">WebGL 2.0 Pipeline</div>
            </div>
            <div className="p-2.5 sm:p-3 text-center md:border-r border-[#1e2433] min-w-0">
              <div className="text-xl sm:text-2xl font-black text-blue-400 font-mono truncate">GLTF / GLB</div>
              <div className="text-[10px] sm:text-[11px] text-gray-400 uppercase tracking-wider font-medium mt-1 truncate">Native Asset Import</div>
            </div>
            <div className="p-2.5 sm:p-3 text-center border-r border-[#1e2433] min-w-0">
              <div className="text-xl sm:text-2xl font-black text-purple-400 font-mono truncate">PBR Shaders</div>
              <div className="text-[10px] sm:text-[11px] text-gray-400 uppercase tracking-wider font-medium mt-1 truncate">Physical Materials</div>
            </div>
            <div className="p-2.5 sm:p-3 text-center min-w-0">
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono truncate">0ms Install</div>
              <div className="text-[10px] sm:text-[11px] text-gray-400 uppercase tracking-wider font-medium mt-1 truncate">100% In-Browser</div>
            </div>
          </div>
        </section>

        {/* Feature Pillars Section */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 border-t border-[#1a1f2c] w-full min-w-0">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2 sm:mb-3">Engine Capabilities</h2>
            <p className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight break-words">
              Designed for Desktop-Grade 3D Web Creation
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8 w-full min-w-0">
            <div className="p-5 sm:p-7 rounded-2xl bg-[#12151f] border border-[#222838] hover:border-cyan-500/50 transition-all group min-w-0 break-words">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 sm:mb-6 group-hover:scale-110 transition-transform shrink-0">
                <Box size={22} />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-3">Interactive 3D Gizmos &amp; Hierarchy</h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Full transform gizmo support for translation, rotation, and scaling. Complete node hierarchy with parent-child scene graph management.
              </p>
            </div>

            <div className="p-5 sm:p-7 rounded-2xl bg-[#12151f] border border-[#222838] hover:border-blue-500/50 transition-all group min-w-0 break-words">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4 sm:mb-6 group-hover:scale-110 transition-transform shrink-0">
                <Sliders size={22} />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-3">PBR Material &amp; Sky Inspector</h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Inspect metallic, roughness, bump maps, and emissive properties. Adjust physical sun elevations, Rayleigh scattering, and exponential fog.
              </p>
            </div>

            <div className="p-5 sm:p-7 rounded-2xl bg-[#12151f] border border-[#222838] hover:border-purple-500/50 transition-all group min-w-0 break-words sm:col-span-2 md:col-span-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 sm:mb-6 group-hover:scale-110 transition-transform shrink-0">
                <Download size={22} />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-3">ZIP &amp; Visual Studio Export</h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Export complete standalone web applications as ZIP packages, formatted for seamless opening in Visual Studio, VS Code, or web deployment.
              </p>
            </div>
          </div>
        </section>

        {/* Architecture & Workflow Section */}
        <section id="workflow" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 border-t border-[#1a1f2c] w-full min-w-0">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start lg:items-center w-full min-w-0">
            {/* Left Content Column */}
            <div className="w-full min-w-0 flex flex-col items-start text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-300 font-semibold mb-4 max-w-full">
                <Cpu size={14} className="shrink-0" />
                <span className="truncate">ARCHITECTURE &amp; PERFORMANCE</span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4 sm:mb-6 leading-tight break-words max-w-full">
                Powered by Three.js &amp; WebGL 2.0 Hardware Acceleration
              </h2>
              
              <p className="text-gray-300 text-xs sm:text-sm md:text-base leading-relaxed mb-6 break-words max-w-full">
                modcx3D leverages high-performance WebGL shaders, shadow maps, and custom raycasters to deliver responsive mouse manipulation, orbit camera control, and frame-rate optimization directly inside standard web browsers.
              </p>

              <div className="space-y-3.5 w-full min-w-0">
                <div className="flex items-start gap-3 text-xs sm:text-sm text-gray-200 leading-normal w-full min-w-0">
                  <CheckCircle2 size={18} className="text-cyan-400 shrink-0 mt-0.5" />
                  <span className="flex-1 min-w-0 break-words">
                    Zero backend server dependencies — runs completely client-side in browser memory.
                  </span>
                </div>
                <div className="flex items-start gap-3 text-xs sm:text-sm text-gray-200 leading-normal w-full min-w-0">
                  <CheckCircle2 size={18} className="text-cyan-400 shrink-0 mt-0.5" />
                  <span className="flex-1 min-w-0 break-words">
                    Seamless integration with `/public` folder assets for high-resolution 3D models and textures.
                  </span>
                </div>
                <div className="flex items-start gap-3 text-xs sm:text-sm text-gray-200 leading-normal w-full min-w-0">
                  <CheckCircle2 size={18} className="text-cyan-400 shrink-0 mt-0.5" />
                  <span className="flex-1 min-w-0 break-words">
                    Local storage scene persistence allowing uninterrupted scene editing sessions.
                  </span>
                </div>
              </div>
            </div>

            {/* Right JSON Spec Code Block Card */}
            <div className="p-4 sm:p-6 md:p-8 rounded-2xl bg-[#0f121a] border border-[#222838] shadow-2xl w-full min-w-0 overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#222838] mb-4 sm:mb-6 min-w-0 gap-2">
                <div className="flex items-center gap-2 min-w-0 truncate">
                  <Terminal size={16} className="text-cyan-400 shrink-0" />
                  <span className="font-mono text-xs sm:text-sm text-gray-200 truncate font-semibold">
                    modcx3D-engine-spec.json
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 font-bold shrink-0">
                  READY
                </span>
              </div>

              <div className="w-full min-w-0 overflow-x-auto rounded-xl bg-[#080a10] border border-[#1d2334] p-3 sm:p-4 shadow-inner">
                <pre className="font-mono text-[11px] sm:text-xs text-cyan-300 leading-relaxed whitespace-pre select-all max-w-full">
{`{
  "engine": "modcx3D Pro v2.4",
  "renderer": "WebGL2RenderingContext",
  "pipeline": {
    "shadowMap": true,
    "toneMapping": "ACESFilmic",
    "colorSpace": "SRGBColorSpace",
    "physicallyCorrectLights": true
  },
  "assetSupport": ["GLTF 2.0", "GLB", "HDR", "PNG", "WEBP"],
  "exportTarget": "Visual Studio / Web Application"
}`}
                </pre>
              </div>

              <div className="mt-6 pt-4 border-t border-[#222838] flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-2 text-gray-300 font-medium">
                  <ShieldCheck size={15} className="text-cyan-400 shrink-0" />
                  <span>Enterprise WebGL Ready</span>
                </span>
                <button
                  onClick={onExploreHub}
                  className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 group whitespace-nowrap"
                >
                  <span>Enter modcx3D Hub</span>
                  <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center w-full min-w-0">
          <div className="p-6 sm:p-12 rounded-3xl bg-gradient-to-b from-[#141926] to-[#0c0e15] border border-[#283147] shadow-2xl relative overflow-hidden w-full min-w-0">
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-3 sm:mb-4 break-words">
              Ready to Launch Your 3D Studio?
            </h2>
            
            <p className="text-gray-400 text-xs sm:text-sm md:text-base max-w-xl mx-auto mb-6 sm:mb-8 break-words">
              Access the modcx3D Hub to manage your project library, explore templates, and launch the 3D scene designer.
            </p>

            <button
              onClick={onExploreHub}
              className="px-7 sm:px-9 py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm tracking-wider shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all inline-flex items-center justify-center gap-2.5 group whitespace-nowrap"
            >
              <span>EXPLORE MODCX3D</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#181c28] py-6 sm:py-8 text-center text-xs text-gray-500 bg-[#07080c] w-full min-w-0 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded bg-cyan-500 flex items-center justify-center text-black font-bold text-[10px]">
              M
            </div>
            <span className="font-bold text-gray-300">modcx3D Engine</span>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center space-x-6 text-gray-400">
            <span className="hover:text-cyan-400 cursor-pointer transition-colors" onClick={onExploreHub}>modcx3D Hub</span>
            <span className="hover:text-cyan-400 cursor-pointer transition-colors" onClick={onLaunchEditorDirectly}>3D Studio</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
