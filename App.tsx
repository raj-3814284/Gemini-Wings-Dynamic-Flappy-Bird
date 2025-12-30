
import React, { useState, useEffect, useRef } from 'react';
import { GameState, ThemeConfig, GameStats, GeminiCommentary } from './types';
import { DEFAULT_THEME, GAME_WIDTH, GAME_HEIGHT } from './constants';
import { generateRandomTheme, getSnarkyComment } from './services/geminiService';
import { soundService } from './services/soundService';
import GameCanvas from './components/GameCanvas';
import TermsModal from './components/TermsModal';
import LoadingScreen from './components/LoadingScreen';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.LOADING_APP);
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('gemini-wings-muted');
    return saved === 'true';
  });
  const [stats, setStats] = useState<GameStats>(() => {
    const saved = localStorage.getItem('gemini-wings-stats');
    return saved ? JSON.parse(saved) : { score: 0, highScore: 0, deaths: 0, customBirdUrl: null, customMusicUrl: null, customMusicName: null };
  });
  const [currentScore, setCurrentScore] = useState(0);
  const [commentary, setCommentary] = useState<GeminiCommentary | null>(null);
  const [isNewThemeLoading, setIsNewThemeLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);

  // Initial app boot sequence
  useEffect(() => {
    if (gameState === GameState.LOADING_APP) {
      const timer = setTimeout(() => {
        setGameState(GameState.START);
      }, 3500); // Polished loading time
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  // Sync stats to local storage
  useEffect(() => {
    localStorage.setItem('gemini-wings-stats', JSON.stringify(stats));
  }, [stats]);

  // Handle Audio Context and BGM
  useEffect(() => {
    localStorage.setItem('gemini-wings-muted', String(isMuted));
    soundService.setMuted(isMuted);
    
    if (!isMuted && gameState === GameState.PLAYING) {
      soundService.startBGM(theme, stats.customMusicUrl);
    } else if (isMuted || gameState !== GameState.PLAYING) {
      soundService.stopBGM();
    }
  }, [isMuted, gameState, theme, stats.customMusicUrl]);

  const handleStartGame = () => {
    setGameState(GameState.PLAYING);
    setCommentary(null);
    soundService.startBGM(theme, stats.customMusicUrl);
  };

  const handleGameOver = async (finalScore: number) => {
    setGameState(GameState.GAME_OVER);
    soundService.stopBGM();
    setStats(prev => ({
      ...prev,
      deaths: prev.deaths + 1,
      highScore: Math.max(prev.highScore, finalScore)
    }));
    
    try {
      const comment = await getSnarkyComment(finalScore);
      setCommentary(comment);
    } catch (e) {
      setCommentary({ message: "Better luck next time!", vibe: "Generic" });
    }
  };

  const handleResetStats = () => {
    if (confirm("Reset all statistics including high score?")) {
      setStats({ 
        score: 0, 
        highScore: 0, 
        deaths: 0, 
        customBirdUrl: stats.customBirdUrl, 
        customMusicUrl: stats.customMusicUrl,
        customMusicName: stats.customMusicName
      });
    }
  };

  const handleChangeTheme = async () => {
    soundService.stopBGM();
    setIsNewThemeLoading(true);
    setGameState(GameState.LOADING_THEME);
    try {
      const newTheme = await generateRandomTheme();
      setTheme(newTheme);
    } catch (e) {
      console.error("Theme generation failed", e);
    } finally {
      setIsNewThemeLoading(false);
      setGameState(GameState.START);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStats(prev => ({ ...prev, customBirdUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (stats.customMusicUrl) URL.revokeObjectURL(stats.customMusicUrl);
      const musicUrl = URL.createObjectURL(file);
      setStats(prev => ({ 
        ...prev, 
        customMusicUrl: musicUrl,
        customMusicName: file.name
      }));
    }
  };

  const handleTermsAgreed = () => {
    setShowTerms(false);
    fileInputRef.current?.click();
  };

  const handleResetBird = () => {
    setStats(prev => ({ ...prev, customBirdUrl: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleResetMusic = () => {
    if (stats.customMusicUrl) URL.revokeObjectURL(stats.customMusicUrl);
    setStats(prev => ({ ...prev, customMusicUrl: null, customMusicName: null }));
    if (musicInputRef.current) musicInputRef.current.value = "";
  };

  if (gameState === GameState.LOADING_APP) {
    return <LoadingScreen />;
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center p-4 bg-slate-950 text-white font-sans overflow-hidden">
      
      {/* Dynamic Background Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Hidden File Inputs */}
      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
      <input type="file" ref={musicInputRef} onChange={handleMusicUpload} accept="audio/*" className="hidden" />

      <TermsModal 
        isOpen={showTerms} 
        onAgree={handleTermsAgreed} 
        onCancel={() => setShowTerms(false)} 
        accentColor={theme.accentColor}
      />

      <div className="relative flex flex-col items-center max-w-lg w-full">
        
        {/* Game Area */}
        <div className="relative w-full shadow-[0_32px_64px_rgba(0,0,0,0.5)] rounded-3xl overflow-hidden border-4 border-white/10">
          <GameCanvas 
            gameState={gameState} 
            theme={theme} 
            customBirdUrl={stats.customBirdUrl}
            onGameOver={handleGameOver} 
            onScoreUpdate={(s) => setCurrentScore(s)}
          />

          {/* HUD for Score Overlay */}
          {gameState === GameState.PLAYING && (
            <div className="absolute top-12 left-0 w-full flex justify-center pointer-events-none animate-in fade-in duration-300">
              <span className="text-7xl font-black drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] italic">
                {currentScore}
              </span>
            </div>
          )}

          {/* Mute Toggle Always Available */}
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="absolute top-6 right-6 z-20 w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20 hover:scale-110 active:scale-95 transition-all shadow-lg"
          >
            <i className={`fa-solid ${isMuted ? 'fa-volume-xmark text-red-400' : 'fa-volume-high text-white'}`}></i>
          </button>

          {/* Game UI Overlays (Start, Game Over, Loading Theme) */}
          {gameState !== GameState.PLAYING && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[6px] p-6 text-center animate-in fade-in duration-300">
              
              {gameState === GameState.START && (
                <div className="space-y-6 w-full max-w-xs">
                  <div className="space-y-1">
                    <h1 className="text-6xl font-black italic uppercase leading-none text-white drop-shadow-lg">
                      GEMINI<br/><span className="text-blue-400">WINGS</span>
                    </h1>
                    <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">
                      Theme: <span className="text-white" style={{ color: theme.accentColor }}>{theme.name}</span>
                    </p>
                  </div>

                  <button 
                    onClick={handleStartGame}
                    className="w-full py-5 bg-white text-black font-black rounded-3xl text-2xl transition-all hover:scale-105 active:scale-95 shadow-2xl flex items-center justify-center gap-3"
                  >
                    START FLIGHT
                    <i className="fa-solid fa-play text-xl"></i>
                  </button>

                  {/* Primary Customization Options - Responsive Grid */}
                  <div className="grid grid-cols-1 gap-3">
                    <button 
                      onClick={handleChangeTheme}
                      disabled={isNewThemeLoading}
                      className="w-full py-3 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-500/30 transition-all disabled:opacity-50"
                    >
                      <i className={`fa-solid fa-wand-magic-sparkles ${isNewThemeLoading ? 'animate-spin' : ''}`}></i>
                      {isNewThemeLoading ? 'IMAGINING...' : 'GENERATE AI THEME'}
                    </button>

                    <button 
                      onClick={() => setShowTerms(true)}
                      className="w-full py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                    >
                      <i className="fa-solid fa-image text-purple-400"></i>
                      {stats.customBirdUrl ? 'CHANGE BIRD' : 'CHOOSE BIRD FROM GALLERY'}
                    </button>

                    <button 
                      onClick={() => musicInputRef.current?.click()}
                      className="w-full py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                    >
                      <i className="fa-solid fa-music text-green-400"></i>
                      {stats.customMusicName ? `SONG: ${stats.customMusicName}` : 'CHOOSE MUSIC FROM GALLERY'}
                    </button>

                    {(stats.customBirdUrl || stats.customMusicUrl) && (
                      <div className="flex gap-2 justify-center pt-2">
                        {stats.customBirdUrl && (
                          <button onClick={handleResetBird} className="text-[9px] text-red-400 font-bold underline uppercase">Reset Bird</button>
                        )}
                        {stats.customMusicUrl && (
                          <button onClick={handleResetMusic} className="text-[9px] text-red-400 font-bold underline uppercase">Reset Music</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {gameState === GameState.GAME_OVER && (
                <div className="space-y-6 w-full max-w-xs animate-in zoom-in duration-300">
                  <h2 className="text-6xl font-black text-red-500 italic uppercase drop-shadow-xl scale-110">CRASHED!</h2>
                  
                  <div className="flex justify-center gap-6 py-5 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-[0.2em]">Score</span>
                      <span className="text-4xl font-black">{currentScore}</span>
                    </div>
                    <div className="w-px bg-white/10"></div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-[0.2em]">Best</span>
                      <span className="text-4xl font-black text-yellow-400">{stats.highScore}</span>
                    </div>
                  </div>

                  {commentary && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 animate-in slide-in-from-bottom duration-500">
                      <p className="text-sm italic text-blue-100">"{commentary.message}"</p>
                      <div className="mt-2 text-[10px] font-bold uppercase text-blue-400 tracking-widest bg-blue-500/20 inline-block px-2 py-0.5 rounded">AI {commentary.vibe}</div>
                    </div>
                  )}

                  <div className="space-y-3 pt-2">
                    <button 
                      onClick={handleStartGame}
                      className="w-full py-5 bg-white text-black font-black rounded-3xl text-2xl transition-all hover:scale-105 active:scale-95 shadow-2xl"
                    >
                      RETRY FLIGHT
                    </button>
                    
                    <div className="flex justify-between items-center px-4 pt-2">
                      <button 
                        onClick={() => { setGameState(GameState.START); soundService.stopBGM(); }}
                        className="text-[10px] text-slate-400 hover:text-white font-black uppercase tracking-widest transition-colors"
                      >
                        BACK TO MENU
                      </button>
                      <button 
                        onClick={handleResetStats}
                        className="text-[10px] text-red-400/60 hover:text-red-400 font-black uppercase tracking-widest flex items-center gap-1 transition-colors"
                      >
                        <i className="fa-solid fa-trash text-[8px]"></i>
                        Reset Best
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {gameState === GameState.LOADING_THEME && (
                <div className="space-y-6">
                  <div className="relative w-24 h-24 mx-auto">
                    <div className="absolute inset-0 border-[6px] border-blue-500/10 rounded-full"></div>
                    <div className="absolute inset-0 border-[6px] border-t-blue-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-5xl">🧠</div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter">Imagining World...</h3>
                    <p className="text-slate-400 text-sm animate-pulse">Gemini is sketching your next adventure.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info for Desktop (Hidden on mobile to save space) */}
        <div className="mt-8 opacity-40 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-4">
          <span>{stats.deaths} Crashes</span>
          <div className="w-1 h-1 bg-white rounded-full"></div>
          <span>Powered by Gemini 3 Flash</span>
        </div>
        
      </div>
    </div>
  );
};

export default App;
