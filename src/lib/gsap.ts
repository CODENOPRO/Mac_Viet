import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Đăng ký ScrollTrigger đúng một lần duy nhất ở cấp mô-đun trước mọi component
gsap.registerPlugin(ScrollTrigger);

// Gán vào window để phục vụ kiểm tra, đo đạc nghiệm thu và script ngoài
if (typeof window !== 'undefined') {
  (window as any).gsap = gsap;
  (window as any).ScrollTrigger = ScrollTrigger;
}

export { gsap, ScrollTrigger };
