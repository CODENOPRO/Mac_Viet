import { useEffect, useRef, useState } from 'react';
import { gsap } from '../../lib/gsap';
import { IMAGES } from '../../data/images';

interface PreloaderProps {
  onComplete: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Nếu người dùng bật prefers-reduced-motion: bỏ preloader, hoàn thành ngay
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      onComplete();
      return;
    }

    const startTime = performance.now();
    let isFontsLoaded = false;
    let isHeroImageLoaded = false;
    let isExiting = false;

    // 1. Kiểm tra fonts sẵn sàng
    if (document.fonts) {
      document.fonts.ready
        .then(() => {
          isFontsLoaded = true;
        })
        .catch(() => {
          isFontsLoaded = true;
        });
    } else {
      isFontsLoaded = true;
    }

    // 2. Tải trước ảnh Hero
    const img = new Image();
    img.src = IMAGES.heroChamAo;
    img.onload = () => {
      isHeroImageLoaded = true;
    };
    img.onerror = () => {
      isHeroImageLoaded = true;
    };

    // 3. Tiến trình đếm từ 0 đến 100 trong tối thiểu 1400ms
    const interval = setInterval(() => {
      if (isExiting) return;

      const elapsed = performance.now() - startTime;
      const currentProgress = Math.min(100, Math.floor((elapsed / 1400) * 100));
      setProgress(currentProgress);

      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${currentProgress}%`;
      }

      // Đạt tối thiểu 1400ms VÀ fonts đã sẵn sàng VÀ ảnh hero đã load (hoặc timeout 2500ms dự phòng)
      const isReadyToExit =
        (elapsed >= 1400 && isFontsLoaded && isHeroImageLoaded) || elapsed >= 2500;

      if (isReadyToExit && !isExiting) {
        isExiting = true;
        clearInterval(interval);
        setProgress(100);

        // Hiệu ứng trượt lên bằng clip-path trong 900ms ease power4.inOut
        if (containerRef.current) {
          gsap.to(containerRef.current, {
            clipPath: 'inset(0 0 100% 0)',
            duration: 0.9,
            ease: 'power4.inOut',
            onComplete: () => {
              onComplete();
            },
          });
        } else {
          onComplete();
        }
      }
    }, 20);

    return () => {
      clearInterval(interval);
    };
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      className="fixed inset-0 z-[var(--z-preloader)] bg-[#0D1826] text-[#F2EDE3] flex flex-col justify-between p-8 md:p-14 select-none pointer-events-auto"
      style={{
        clipPath: 'inset(0 0 0 0)',
      }}
    >
      {/* 4 dấu ngoặc góc camera HUD cố định */}
      <div className="absolute top-6 left-6 w-3 h-3 border-t border-l border-[#C39A27]/60 pointer-events-none" />
      <div className="absolute top-6 right-6 w-3 h-3 border-t border-r border-[#C39A27]/60 pointer-events-none" />
      <div className="absolute bottom-6 left-6 w-3 h-3 border-b border-l border-[#C39A27]/60 pointer-events-none" />
      <div className="absolute bottom-6 right-6 w-3 h-3 border-b border-r border-[#C39A27]/60 pointer-events-none" />

      {/* Góc trên: Micro-label */}
      <div className="flex items-center justify-between w-full">
        <span className="font-mono text-xs text-[#C39A27] uppercase tracking-widest">MAC VIET</span>
        <span className="font-mono text-[10px] text-[#F2EDE3]/50 uppercase tracking-wider">
          KHOI TAO DU LIEU 2026
        </span>
      </div>

      {/* Khu vực trung tâm: Câu dẫn ý niệm */}
      <div className="max-w-xl">
        <span className="font-mono text-[10px] text-[#C39A27] uppercase tracking-widest block mb-2">
          Y PHUC DI SAN
        </span>
        <p className="font-sans text-sm md:text-base text-[#F2EDE3]/75 leading-relaxed">
          Mỗi tấm áo là một lần người Việt tự giới thiệu mình. Tỉ mỉ từng lớp dệt, chuẩn mực từng quy thức điển chế.
        </p>
      </div>

      {/* Đáy màn: Chữ "ĐANG DỆT" bằng Fraunces, số đếm góc phải dưới bằng JetBrains Mono, đường kẻ tóc ngang */}
      <div className="w-full flex flex-col gap-4">
        {/* Đường kẻ tóc chạy ngang theo tiến trình */}
        <div className="w-full h-[1px] bg-[#F2EDE3]/15 relative overflow-hidden">
          <div
            ref={progressBarRef}
            className="absolute top-0 left-0 bottom-0 bg-[#C39A27]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-baseline justify-between">
          <span className="font-display text-4xl md:text-7xl font-light text-[#F2EDE3] tracking-tight">
            ĐANG DỆT
          </span>
          <span className="font-mono text-3xl md:text-5xl text-[#C39A27] tabular-nums font-normal">
            {progress.toString().padStart(2, '0')}%
          </span>
        </div>
      </div>
    </div>
  );
}
