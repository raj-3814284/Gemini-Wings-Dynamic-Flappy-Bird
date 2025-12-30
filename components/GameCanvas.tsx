
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { 
  GAME_WIDTH, GAME_HEIGHT, BIRD_X, BIRD_SIZE, 
  GRAVITY, JUMP_STRENGTH, MAX_VELOCITY, 
  PIPE_WIDTH, PIPE_GAP, PIPE_SPACING, PIPE_SPEED, 
  GROUND_HEIGHT 
} from '../constants';
import { GameState, ThemeConfig, Pipe } from '../types';
import { soundService } from '../services/soundService';

interface GameCanvasProps {
  gameState: GameState;
  theme: ThemeConfig;
  customBirdUrl?: string | null;
  onGameOver: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, theme, customBirdUrl, onGameOver, onScoreUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const birdImageRef = useRef<HTMLImageElement | null>(null);
  
  const birdY = useRef(GAME_HEIGHT / 2);
  const birdVelocity = useRef(0);
  const pipes = useRef<Pipe[]>([]);
  const score = useRef(0);
  const frameCount = useRef(0);
  const isDead = useRef(false);
  const bobbingOffset = useRef(0);
  const lastState = useRef<GameState>(gameState);
  const scoreFlash = useRef(0);

  useEffect(() => {
    if (customBirdUrl) {
      const img = new Image();
      img.src = customBirdUrl;
      img.onload = () => {
        birdImageRef.current = img;
      };
    } else {
      birdImageRef.current = null;
    }
  }, [customBirdUrl]);

  const resetGame = useCallback(() => {
    birdY.current = GAME_HEIGHT / 2;
    birdVelocity.current = 0;
    pipes.current = [];
    score.current = 0;
    frameCount.current = 0;
    isDead.current = false;
    onScoreUpdate(0);
    scoreFlash.current = 0;
  }, [onScoreUpdate]);

  const createPipe = (x: number): Pipe => {
    const minPipeHeight = 60;
    const maxPipeHeight = GAME_HEIGHT - GROUND_HEIGHT - PIPE_GAP - minPipeHeight;
    const topHeight = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight + 1)) + minPipeHeight;
    return { x, topHeight, passed: false };
  };

  const update = (deltaTime: number) => {
    const timeScale = deltaTime / 16.66;

    if (gameState === GameState.START || gameState === GameState.LOADING_THEME) {
      bobbingOffset.current = Math.sin(Date.now() / 200) * 10;
      return;
    }

    if (gameState !== GameState.PLAYING || isDead.current) return;

    if (scoreFlash.current > 0) {
      scoreFlash.current -= 0.1 * timeScale;
    }

    birdVelocity.current += GRAVITY * timeScale;
    if (birdVelocity.current > MAX_VELOCITY) birdVelocity.current = MAX_VELOCITY;
    birdY.current += birdVelocity.current * timeScale;

    if (birdY.current + BIRD_SIZE / 2 >= GAME_HEIGHT - GROUND_HEIGHT) {
      birdY.current = GAME_HEIGHT - GROUND_HEIGHT - BIRD_SIZE / 2;
      die();
      return;
    }
    
    if (birdY.current - BIRD_SIZE / 2 <= 0) {
      birdY.current = BIRD_SIZE / 2;
      birdVelocity.current = 0;
    }

    if (pipes.current.length === 0 || 
        GAME_WIDTH - pipes.current[pipes.current.length - 1].x >= PIPE_SPACING) {
      pipes.current.push(createPipe(GAME_WIDTH));
    }

    pipes.current.forEach((pipe) => {
      pipe.x -= PIPE_SPEED * timeScale;

      const birdRect = {
        left: BIRD_X - BIRD_SIZE / 2 + 8,
        right: BIRD_X + BIRD_SIZE / 2 - 8,
        top: birdY.current - BIRD_SIZE / 2 + 8,
        bottom: birdY.current + BIRD_SIZE / 2 - 8
      };

      const topPipeRect = {
        left: pipe.x,
        right: pipe.x + PIPE_WIDTH,
        top: 0,
        bottom: pipe.topHeight
      };

      const bottomPipeRect = {
        left: pipe.x,
        right: pipe.x + PIPE_WIDTH,
        top: pipe.topHeight + PIPE_GAP,
        bottom: GAME_HEIGHT - GROUND_HEIGHT
      };

      const intersects = (r1: any, r2: any) => {
        return !(r2.left > r1.right || 
                 r2.right < r1.left || 
                 r2.top > r1.bottom ||
                 r2.bottom < r1.top);
      };

      if (intersects(birdRect, topPipeRect) || intersects(birdRect, bottomPipeRect)) {
        die();
      }

      if (!pipe.passed && pipe.x + PIPE_WIDTH < BIRD_X) {
        pipe.passed = true;
        score.current += 1;
        scoreFlash.current = 1.0;
        soundService.playScore();
        onScoreUpdate(score.current);
      }
    });

    if (pipes.current.length > 0 && pipes.current[0].x < -PIPE_WIDTH) {
      pipes.current.shift();
    }
  };

  const die = () => {
    if (isDead.current) return;
    isDead.current = true;
    soundService.playCrash();
    onGameOver(score.current);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = theme.skyColor;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    if (scoreFlash.current > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${scoreFlash.current * 0.2})`;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    pipes.current.forEach(pipe => {
      ctx.fillStyle = theme.pipeColor;
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
      ctx.fillRect(pipe.x, pipe.topHeight + PIPE_GAP, PIPE_WIDTH, GAME_HEIGHT - GROUND_HEIGHT - (pipe.topHeight + PIPE_GAP));
      
      ctx.fillStyle = '#00000022';
      ctx.fillRect(pipe.x - 2, pipe.topHeight - 20, PIPE_WIDTH + 4, 20);
      ctx.fillRect(pipe.x - 2, pipe.topHeight + PIPE_GAP, PIPE_WIDTH + 4, 20);
      
      ctx.strokeStyle = '#00000044';
      ctx.lineWidth = 2;
      ctx.strokeRect(pipe.x - 2, pipe.topHeight - 20, PIPE_WIDTH + 4, 20);
      ctx.strokeRect(pipe.x - 2, pipe.topHeight + PIPE_GAP, PIPE_WIDTH + 4, 20);
    });

    ctx.fillStyle = theme.groundColor;
    ctx.fillRect(0, GAME_HEIGHT - GROUND_HEIGHT, GAME_WIDTH, GROUND_HEIGHT);
    ctx.fillStyle = '#00000022';
    ctx.fillRect(0, GAME_HEIGHT - GROUND_HEIGHT, GAME_WIDTH, 4);

    const renderY = (gameState === GameState.START || gameState === GameState.LOADING_THEME) 
      ? (GAME_HEIGHT / 2) + bobbingOffset.current 
      : birdY.current;

    ctx.save();
    ctx.translate(BIRD_X, renderY);
    
    const rotation = (gameState === GameState.START || gameState === GameState.LOADING_THEME)
      ? Math.sin(Date.now() / 400) * 0.1
      : Math.min(Math.PI / 3, Math.max(-Math.PI / 4, birdVelocity.current * 0.18));
    
    ctx.rotate(rotation);

    if (birdImageRef.current) {
      ctx.drawImage(
        birdImageRef.current, 
        -BIRD_SIZE / 2, 
        -BIRD_SIZE / 2, 
        BIRD_SIZE, 
        BIRD_SIZE
      );
    } else {
      ctx.font = `${BIRD_SIZE}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillText(theme.birdEmoji, 0, 0);
    }
    
    ctx.restore();
  };

  const loop = (time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const deltaTime = Math.min(time - lastTimeRef.current, 100);
    lastTimeRef.current = time;

    update(deltaTime);
    draw();
    requestRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    if (gameState === GameState.PLAYING && lastState.current !== GameState.PLAYING) {
      resetGame();
    } else if (gameState === GameState.START || gameState === GameState.LOADING_THEME) {
      resetGame();
    }
    
    lastState.current = gameState;
    lastTimeRef.current = performance.now();
    requestRef.current = requestAnimationFrame(loop);
    
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, theme, resetGame]);

  useEffect(() => {
    const handleAction = (e?: Event) => {
      if (e) {
        if (e instanceof KeyboardEvent) {
          if (e.code === 'Space' || e.code === 'ArrowUp') e.preventDefault();
        } else if (e.type === 'touchstart' || e.type === 'mousedown') {
          if (gameState === GameState.PLAYING) {
            e.preventDefault();
          }
        }
      }

      if (gameState === GameState.PLAYING && !isDead.current) {
        birdVelocity.current = JUMP_STRENGTH;
        soundService.playFlap();
      }
    };

    window.addEventListener('keydown', handleAction);
    window.addEventListener('touchstart', handleAction, { passive: false });
    window.addEventListener('mousedown', handleAction);

    return () => {
      window.removeEventListener('keydown', handleAction);
      window.removeEventListener('touchstart', handleAction);
      window.removeEventListener('mousedown', handleAction);
    };
  }, [gameState]);

  return (
    <canvas
      ref={canvasRef}
      width={GAME_WIDTH}
      height={GAME_HEIGHT}
      className="max-w-full max-h-full rounded-xl shadow-2xl overflow-hidden border-4 border-white/20 touch-none"
      style={{ aspectRatio: `${GAME_WIDTH}/${GAME_HEIGHT}` }}
    />
  );
};

export default GameCanvas;
