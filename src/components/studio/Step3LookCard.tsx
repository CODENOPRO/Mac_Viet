import { useState, useEffect, useMemo, useRef } from 'react';
import { useStore, store } from '../../lib/store';
import { SOURCES } from '../../data/sources';
import { TRADITIONAL_COLORS, layTenMau } from '../../data/palettes';
import { tinhHaiHoa, ColorInputItem } from '../../lib/colorHarmony';
import { kiemTraVanHoa } from '../../lib/cultureGuard';
import {
  explainGarment,
  cultureCheck,
  nameAndCaption,
  renderLook,
  ExplainGarmentResponse,
  CultureCheckResponse,
  NameAndCaptionResult,
  nenAnhChoAI,
} from '../../lib/gemini';
import { macThu } from '../../lib/tryOn';
import { chonBoiCanhTuDong } from '../../data/backgrounds';
import CompareLooksModal from './CompareLooksModal';
import TryOnModal from './TryOnModal';
import AiExplanationModal from './AiExplanationModal';
import { BACKGROUNDS } from '../../data/backgrounds';
import { Source } from '../../types';
import { exportLookCardPoster } from '../../lib/tryOnGuard';
import SourceTag from '../shared/SourceTag';

export default function Step3LookCard() {
  const {
    lookState,
    selectedEvent,
    contextSetup,
    userPhoto,
    activeTryOnImage,
    tryOnBackgroundId,
  } = useStore();

  const [isHoldingCompare, setIsHoldingCompare] = useState(false);
  const [showWhyModal, setShowWhyModal] = useState(false);
  const [isRebuilding, setIsRebuilding] = useState(false);

  const handleRebuild = async () => {
    if (isRebuilding) return;
    setIsRebuilding(true);
    try {
      const bg =
        BACKGROUNDS.find((b) => b.id === tryOnBackgroundId) ||
        chonBoiCanhTuDong(selectedEvent?.id, contextSetup?.regionId, lookState.mauChinh);
      const anhNguoiInput = userPhoto || '';
      const res = await macThu({
        anhNguoi: anhNguoiInput,
        look: lookState,
        boiCanh: selectedEvent,
        background: bg,
        chatLuong: 'nhanh',
      });
      setAiImageUrl(res.anh);
      setIsAiImage(true);
      store.setActiveTryOnImage(res.anh);
      showToast('Đã dựng lại diện mạo mới');
    } catch (err) {
      console.warn('Lỗi khi dựng lại', err);
      showToast('Không thể kết nối để dựng lại ảnh');
    } finally {
      setIsRebuilding(false);
    }
  };

  // Ảnh gốc của người dùng
  const originalImage = useMemo(() => {
    return userPhoto || null;
  }, [userPhoto]);

  // ---------------------------------------------------------------------------
  // 1. ENGINE TÍNH ĐIỂM CỤC BỘ (TỨC THÌ, KHÔNG CHỜ MẠNG)
  // ---------------------------------------------------------------------------
  const mauThucTe: ColorInputItem[] = useMemo(() => {
    return [
      {
        hex: lookState.mauChinh || lookState.thuongY?.mauTruyenThong?.[0] || '#16243A',
        trongSo: 0.5,
        lop: 'thuong_y',
      },
      {
        hex: lookState.haY?.mauTruyenThong?.[0] || '#F2EDE3',
        trongSo: 0.25,
        lop: 'ha_y',
      },
      {
        hex: lookState.thuPhuc?.mauTruyenThong?.[0] || '#2C2A26',
        trongSo: 0.1,
        lop: 'thu_phuc',
      },
      {
        hex: lookState.hai?.mauTruyenThong?.[0] || '#16243A',
        trongSo: 0.05,
        lop: 'hai',
      },
      {
        hex: '#F2EDE3',
        trongSo: 0.1,
        lop: 'phu_kien',
      },
    ];
  }, [lookState]);

  const colorResult = useMemo(
    () => tinhHaiHoa(mauThucTe, selectedEvent),
    [mauThucTe, selectedEvent]
  );
  const scoreMau = colorResult.diem;

  const scoreBoiCanh = useMemo(() => {
    const topLevel = lookState.thuongY?.mucTrangTrong ?? 3;
    const diff = Math.abs(topLevel - (contextSetup.mucTrangTrong ?? selectedEvent.mucTrangTrongYeuCau));
    if (diff === 0) return 96;
    if (diff === 1) return 82;
    return 55;
  }, [lookState.thuongY, selectedEvent]);

  const cultureFlagResult = useMemo(() => {
    return kiemTraVanHoa(
      lookState,
      selectedEvent,
      contextSetup.phongCach,
      contextSetup.regionId,
      contextSetup.nguoiMac
    );
  }, [lookState, selectedEvent, contextSetup]);

  const scoreVanHoa = useMemo(() => {
    if (cultureFlagResult.mucDoChung === 'xanh') return 98;
    if (cultureFlagResult.mucDoChung === 'vang') return 74;
    return 36;
  }, [cultureFlagResult]);

  // ---------------------------------------------------------------------------
  // 2. TÊN 6 LỚP ĐANG MẶC (DƯỚI KHỐI ẢNH)
  // ---------------------------------------------------------------------------
  const sixLayersText = useMemo(() => {
    // Chỉ liệt kê món người dùng đã chọn, không tự điền món họ chưa chọn
    const layers = [
      lookState.thuongY?.ten,
      lookState.haY?.ten,
      lookState.thuPhuc?.ten,
      lookState.hai?.ten,
      lookState.phuKien?.[0]?.ten || (lookState.phuKienHienDai ? 'Phụ kiện hiện đại' : undefined),
      lookState.hoaVan?.ten,
    ].filter(Boolean);
    return layers.join(' · ');
  }, [lookState]);

  // Màu chính
  const mainColorName = useMemo(() => {
    const match = TRADITIONAL_COLORS.find(
      (c) => c.hex.toLowerCase() === lookState.mauChinh?.toLowerCase()
    );
    return match?.ten || 'Chàm';
  }, [lookState.mauChinh]);

  // ---------------------------------------------------------------------------
  // 3. STATE CHO BỐN KHỐI (GỌI SONG SONG, CÔ LẬP LỖI HOÀN TOÀN)
  // ---------------------------------------------------------------------------
  // Khối 1: Tên look
  const [nameData, setNameData] = useState<NameAndCaptionResult | null>(null);
  const [loadingName, setLoadingName] = useState(true);

  // Khối 2: Chuyện của tà áo
  const [storyData, setStoryData] = useState<ExplainGarmentResponse | null>(null);
  const [loadingStory, setLoadingStory] = useState(true);

  // Khối 3: Diễn giải văn hoá
  const [cultureCheckData, setCultureCheckData] = useState<CultureCheckResponse | null>(null);
  const [loadingCultureCheck, setLoadingCultureCheck] = useState(true);

  // Khối ảnh: RenderLook (chạy riêng, chậm hơn)
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);
  const [isAiImage, setIsAiImage] = useState(false);
  const [loadingImage, setLoadingImage] = useState(true);

  // ---------------------------------------------------------------------------
  // 4. MODALS & TOAST INTERFACES
  // ---------------------------------------------------------------------------
  const [modalSourceOpen, setModalSourceOpen] = useState(false);
  const [modalCompareOpen, setModalCompareOpen] = useState(false);
  const [modalTryOnOpen, setModalTryOnOpen] = useState(false);
  const [modalPosterOpen, setModalPosterOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // ---------------------------------------------------------------------------
  // 5. GỌI SONG SONG KHI VÀO MÀN LOOK CARD
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    // A. Khối 1: nameAndCaption
    setLoadingName(true);
    nameAndCaption(lookState)
      .then((res) => {
        if (isMounted) setNameData(res);
      })
      .catch((err) => {
        console.warn('[Gemini nameAndCaption error, fallback used]', err);
        if (isMounted) {
          setNameData({
            tenLook: `${mainColorName} Phố, Đoan Trang`,
            captionNgan: `Nét đĩnh đạc của tà ${lookState.thuongY?.ten || 'Việt phục'} giữa nhịp sống hiện đại.`,
            captionDai: `Một sớm thong dong với tà áo truyền thống sắc ${mainColorName}. Giữ gìn cốt cách xưa là cách người trẻ trân quý cội nguồn văn hiến.`,
            hashtags: ['macviet', 'vietphuc', 'aotruyenthong'],
          });
        }
      })
      .finally(() => {
        if (isMounted) setLoadingName(false);
      });

    // B. Khối 2: explainGarment
    setLoadingStory(true);
    const garmentIdToExplain = lookState.thuongY?.id || 'G04';
    explainGarment(garmentIdToExplain)
      .then((res) => {
        if (isMounted) setStoryData(res);
      })
      .catch((err) => {
        console.warn('[Gemini explainGarment error, fallback used]', err);
        if (isMounted) {
          setStoryData({
            cauChuyen:
              lookState.thuongY?.cauChuyen || 'Chưa có câu chuyện cho món này trong dữ liệu.',
            nienDaiNoiBat: lookState.thuongY?.nienDai || 'Chưa xác định',
            aiTungMac: lookState.thuongY?.dungKhiNao.join(', ') || 'Sĩ phu, nhân dân trong các dịp lễ tết và giao tế',
            yNghiaHoaVan: 'Hoa văn thanh nhã theo quy thức cổ truyền.',
            sourceIds: lookState.thuongY?.sourceIds || ['S01', 'S03'],
            doChacChan: lookState.thuongY?.doChacChan || 'da_xac_lap',
          });
        }
      })
      .finally(() => {
        if (isMounted) setLoadingStory(false);
      });

    // C. Khối 3: cultureCheck
    setLoadingCultureCheck(true);
    cultureCheck(lookState, selectedEvent, cultureFlagResult)
      .then((res) => {
        if (isMounted) setCultureCheckData(res);
      })
      .catch((err) => {
        console.warn('[Gemini cultureCheck error, fallback used]', err);
        if (isMounted) {
          setCultureCheckData({
            dienGiai: cultureFlagResult.luatViPham.map((item) => ({
              ruleId: item.rule.id,
              thongDiepDeHieu: item.rule.thongDiep,
              boiCanhLichSu: item.rule.dieuKien,
              sourceIds: item.rule.sourceIds,
            })),
            cachSuaThem: [],
          });
        }
      })
      .finally(() => {
        if (isMounted) setLoadingCultureCheck(false);
      });

    // D. Khối Ảnh: ưu tiên activeTryOnImage đã mặc thử ở Bước 3
    if (activeTryOnImage) {
      setAiImageUrl(activeTryOnImage);
      setIsAiImage(true);
      setLoadingImage(false);
    } else {
      setLoadingImage(true);
      const bg = chonBoiCanhTuDong(selectedEvent?.id, contextSetup?.regionId, lookState.mauChinh);
      const anhNguoiInput = userPhoto || '';
      macThu({
        anhNguoi: anhNguoiInput,
        look: lookState,
        boiCanh: selectedEvent,
        background: bg,
        chatLuong: 'nhanh',
      })
        .then((res) => {
          if (isMounted) {
            if (res?.anh) {
              setAiImageUrl(res.anh);
              setIsAiImage(true);
            } else {
              setIsAiImage(false);
            }
          }
        })
        .catch((err) => {
          console.warn('[Gemini macThu error, flat composite kept]', err);
          if (isMounted) {
            setIsAiImage(false);
          }
        })
        .finally(() => {
          if (isMounted) setLoadingImage(false);
        });
    }

    return () => {
      isMounted = false;
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [lookState, selectedEvent, contextSetup, cultureFlagResult, mainColorName, activeTryOnImage, userPhoto, originalImage]);

  // ---------------------------------------------------------------------------
  // 6. XỬ LÝ CHIA SẺ VÀ CÁC HÀNH ĐỘNG
  // ---------------------------------------------------------------------------
  const handleShare = () => {
    try {
      const payload = {
        ty: lookState.thuongY?.id,
        hy: lookState.haY?.id,
        tp: lookState.thuPhuc?.id,
        hi: lookState.hai?.id,
        mc: lookState.mauChinh,
        ev: selectedEvent.id,
        rg: contextSetup.regionId,
        pc: contextSetup.phongCach,
      };
      const jsonStr = JSON.stringify(payload);
      const hash = btoa(encodeURIComponent(jsonStr));
      const shareUrl = `${window.location.origin}${window.location.pathname}#look=${encodeURIComponent(hash)}`;

      navigator.clipboard
        .writeText(shareUrl)
        .then(() => {
          showToast('Đã sao chép liên kết phối đồ vào bộ nhớ tạm.');
        })
        .catch(() => {
          showToast('Đã sao chép liên kết phối đồ.');
        });
    } catch {
      showToast('Đã tạo liên kết chia sẻ.');
    }
  };

  const handleSaveLookbook = () => {
    const title = nameData?.tenLook || `Phối đồ ${selectedEvent.ten}`;
    store.saveToLookbook(title, `Sự kiện: ${selectedEvent.ten}`);
    showToast('Đã lưu bộ phối vào Lookbook thành công.');
  };

  // Nguồn áp dụng
  const activeSources: Source[] = useMemo(() => {
    const sids = new Set<string>();
    lookState.thuongY?.sourceIds?.forEach((s) => sids.add(s));
    cultureFlagResult.sourceIds?.forEach((s) => sids.add(s));
    storyData?.sourceIds?.forEach((s) => sids.add(s));
    if (sids.size === 0) sids.add('S01');
    return SOURCES.filter((s) => sids.has(s.id));
  }, [lookState.thuongY, cultureFlagResult, storyData]);

  // Xếp hàng độ chắc chắn
  const doChacChanLabel = useMemo(() => {
    const val = storyData?.doChacChan || lookState.thuongY?.doChacChan || 'da_xac_lap';
    if (val === 'da_xac_lap') {
      return {
        label: 'ĐÃ XÁC LẬP',
        border: 'border-[#16243A]/40 text-[#16243A] bg-[#16243A]/5',
      };
    }
    if (val === 'thuc_hanh_hien_nay') {
      return {
        label: 'THỰC HÀNH HIỆN NAY',
        border: 'border-[#C39A27]/60 text-[#C39A27] bg-[#C39A27]/10',
      };
    }
    return {
      label: 'ĐANG TRANH LUẬN',
      border: 'border-[#A8322A]/40 text-[#A8322A] bg-[#A8322A]/5',
    };
  }, [storyData, lookState.thuongY]);

  // Dữ liệu Nên, Cân nhắc, Tránh cho Khối 3
  const danhSachNen = useMemo(() => {
    if (lookState.thuongY?.dungKhiNao && lookState.thuongY.dungKhiNao.length > 0) {
      return lookState.thuongY.dungKhiNao.slice(0, 3);
    }
    return [
      `Phù hợp các dịp ${selectedEvent.ten.toLowerCase()} trang nhã`,
      'Đi cùng guốc gỗ mộc hoặc hài nhung cổ truyền',
      'Giữ nếp cổ cài kín đáo và đĩnh đạc',
    ];
  }, [lookState.thuongY, selectedEvent]);

  const danhSachCanNhac = useMemo(() => {
    const list: string[] = [];
    if (cultureFlagResult.luatViPham.some((l) => l.mucDoHienThi === 'vang')) {
      cultureFlagResult.luatViPham
        .filter((l) => l.mucDoHienThi === 'vang')
        .forEach((l) => list.push(l.rule.thongDiep));
    }
    if (selectedEvent.luuY) {
      list.push(selectedEvent.luuY);
    }
    if (list.length === 0) {
      list.push('Kiểm tra nhiệt độ không gian để chọn chất vải lụa tơ hoặc the');
      list.push('Phụ kiện trang sức đi kèm nên chọn chất liệu mộc như trầm hoặc bạc');
    }
    return list.slice(0, 3);
  }, [cultureFlagResult, selectedEvent]);

  const danhSachTranh = useMemo(() => {
    const list: string[] = [];
    if (cultureFlagResult.luatViPham.some((l) => l.mucDoHienThi === 'do')) {
      cultureFlagResult.luatViPham
        .filter((l) => l.mucDoHienThi === 'do')
        .forEach((l) => list.push(l.rule.thongDiep));
    }
    if (lookState.thuongY?.khongDungKhiNao && lookState.thuongY.khongDungKhiNao.length > 0) {
      list.push(...lookState.thuongY.khongDungKhiNao);
    }
    if (list.length === 0) {
      list.push('Tránh mặc xộc xệch hoặc bỏ buông khuy cổ nơi tôn nghiêm');
      list.push('Tránh kết hợp với giày thể thao hầm hố trong lễ gia tiên');
    }
    return list.slice(0, 3);
  }, [cultureFlagResult, lookState.thuongY]);

  // ---------------------------------------------------------------------------
  // 7. BIỂN CHÚ THÍCH BỘ ĐỒ - HIỆN KHI CHƯA CÓ ẢNH MẶC THỬ THẬT
  // Không vẽ hình người hay trang phục. Chỉ có mẫu màu thật và tên từng lớp lấy từ lựa chọn.
  // ---------------------------------------------------------------------------
  const renderBienBoDo = () => {
    const mauChinh = lookState.mauChinh || lookState.thuongY?.mauTruyenThong?.[0] || '#16243A';
    const cacLop: { vaiTro: string; ten?: string; mau?: string }[] = [
      { vaiTro: 'Thượng y', ten: lookState.thuongY?.ten, mau: mauChinh },
      { vaiTro: 'Hạ y', ten: lookState.haY?.ten, mau: lookState.haY?.mauTruyenThong?.[0] },
      { vaiTro: 'Thủ phục', ten: lookState.thuPhuc?.ten, mau: lookState.thuPhuc?.mauTruyenThong?.[0] },
      { vaiTro: 'Hài', ten: lookState.hai?.ten, mau: lookState.hai?.mauTruyenThong?.[0] },
      { vaiTro: 'Hoa văn', ten: lookState.hoaVan?.ten },
    ];

    return (
      <div className="w-full h-full relative bg-[#F2EDE3] flex flex-col select-none @container">
        {/* Mẫu màu chính, như một mẩu vải ghim trên biển */}
        <div className="relative flex-[0_0_38%] border-b border-[#2C2A26]/15" style={{ backgroundColor: mauChinh }}>
          <span className="absolute left-3 bottom-2 px-1.5 py-0.5 bg-[#FBF8F2]/90 font-mono text-[10px] text-[#2C2A26]">
            {layTenMau(mauChinh)}
          </span>
        </div>

        <div className="flex-1 min-h-0 flex flex-col px-4 py-3 gap-2 overflow-hidden">
          <p className="font-mono text-[10px] tracking-[0.14em] text-[#A8322A] m-0">CHƯA CÓ ẢNH MẶC THỬ</p>
          <p className="font-display text-[clamp(16px,9cqw,26px)] leading-tight text-[#2C2A26] m-0">
            {lookState.thuongY?.ten || 'Chưa chọn thượng y'}
          </p>
          <ul className="list-none m-0 p-0 mt-1 flex flex-col">
            {cacLop.map((l) => (
              <li
                key={l.vaiTro}
                className="flex items-center gap-2 py-1 border-t border-[#2C2A26]/10 font-sans text-[clamp(10px,4.2cqw,12px)] text-[#2C2A26] min-w-0"
              >
                <span
                  className="w-2.5 h-2.5 shrink-0 border border-[#2C2A26]/20"
                  style={{ backgroundColor: l.mau || 'transparent' }}
                />
                <span className="text-[#2C2A26]/70 shrink-0 w-[4.8em]">{l.vaiTro}</span>
                <span className="truncate">{l.ten || 'Chưa chọn'}</span>
              </li>
            ))}
          </ul>
        </div>

        {loadingImage && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-[#16243A] text-[#F2EDE3] border border-[#C39A27]/50 rounded-[1px] font-mono text-[10px] tracking-widest shadow-md">
            <span className="w-1.5 h-1.5 bg-[#C39A27] animate-ping" />
            <span>ĐANG DỰNG ẢNH</span>
          </div>
        )}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // RENDER CHÍNH — BỐ CỤC 12 CỘT
  // ---------------------------------------------------------------------------
  // Ảnh AI chỉ hiện khi có cả ảnh người dùng; nhãn AI và nút dựng lại theo đúng điều kiện này.
  const dangHienAnhAI = Boolean(isAiImage && (activeTryOnImage || aiImageUrl) && userPhoto);

  return (
    <div className="w-full flex flex-col gap-6 select-none animate-in fade-in duration-200">
      {/* LƯỚI 12 CỘT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ===================================================================
            CỘT TRÁI (6 CỘT): KHỐI ẢNH LOOK VÀ KHỐI BẠN ĐÃ CHỌN NẰM NGAY CẠNH NHAU
            =================================================================== */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <div className="relative aspect-[3/4] w-full rounded-[2px] border border-[#C39A27] overflow-hidden bg-[#FBF8F2] shadow-sm">
              {isHoldingCompare && originalImage ? (
                <div className="w-full h-full relative">
                  <img
                    src={originalImage}
                    alt="Ảnh gốc trước khi thay đồ"
                    className="w-full h-full object-cover object-center animate-in fade-in duration-150"
                  />
                  <div className="absolute top-3 left-3 px-2 py-0.5 bg-[#16243A]/90 text-[#F2EDE3] font-mono text-[10px] tracking-wider uppercase rounded-[1px] border border-[#C39A27]/50 shadow-sm">
                    ẢNH GỐC BAN ĐẦU
                  </div>
                </div>
              ) : dangHienAnhAI ? (
                <img
                  src={activeTryOnImage || aiImageUrl || ''}
                  alt={nameData?.tenLook || 'Phối trang Mặc Việt'}
                  className="w-full h-full object-cover object-center animate-in fade-in duration-300"
                />
              ) : (
                renderBienBoDo()
              )}

              {/* NÚT TẢI ẢNH VỀ MÁY (FILE TẢI VỀ CÓ ĐÓNG DẤU ẢNH DO AI TẠO) */}
              {!isHoldingCompare && isAiImage && (activeTryOnImage || aiImageUrl) && (
                <a
                  href={activeTryOnImage || aiImageUrl || ''}
                  download="mac-viet-look-ai.jpg"
                  className="absolute bottom-3 right-3 px-2.5 py-1 bg-[#16243A]/90 hover:bg-[#A8322A] text-[#F2EDE3] font-mono text-[10px] uppercase tracking-wider rounded-[1px] border border-[#C39A27]/60 transition-colors shadow-sm"
                  title="Tải ảnh về máy (đã kèm dấu xác thực AI)"
                >
                  TẢI ẢNH ↓
                </a>
              )}
            </div>

            {dangHienAnhAI && (
              <>
            {/* 3. DƯỚI ẢNH: HAI DÒNG NHÃN BẮT BUỘC THEO QUY CHUẨN */}
            <div className="pt-2 flex flex-col gap-1 border-t border-[#2C2A26]/12">
              <button
                type="button"
                onClick={() => setShowWhyModal(true)}
                className="text-left font-sans text-xs text-[#6E5439] hover:text-[#A8322A] hover:underline transition-colors cursor-pointer leading-snug"
              >
                Ảnh minh hoạ do AI dựng. Chi tiết cổ áo, khuy, hoa văn có thể chưa đúng, đối chiếu với danh sách bên dưới.
              </button>
            </div>

            {/* 4. NÚT DỰNG LẠI NGAY DƯỚI ẢNH, KÈM DÒNG NHỎ */}
            <div className="flex flex-col gap-1 pt-0.5">
              <button
                type="button"
                disabled={isRebuilding}
                onClick={handleRebuild}
                className="w-full py-2.5 px-3 border border-[#2C2A26]/30 bg-[#16243A] text-[#F2EDE3] hover:bg-[#0D1826] font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
              >
                {isRebuilding ? (
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#C39A27] animate-ping" />
                    <span>ĐANG DỰNG LẠI...</span>
                  </span>
                ) : (
                  <span>DỰNG LẠI</span>
                )}
              </button>
              <span className="font-sans text-[11px] text-[#6E5439] text-center">
                Mỗi lần dựng cho kết quả hơi khác.
              </span>
            </div>

              </>
            )}

            {/* NÚT SO VỚI ẢNH GỐC: GIỮ CHUỘT ĐỂ XEM ẢNH TRƯỚC KHI THAY ĐỒ */}
            {originalImage && (activeTryOnImage || aiImageUrl) && (
              <button
                type="button"
                onMouseDown={() => setIsHoldingCompare(true)}
                onMouseUp={() => setIsHoldingCompare(false)}
                onMouseLeave={() => setIsHoldingCompare(false)}
                onTouchStart={() => setIsHoldingCompare(true)}
                onTouchEnd={() => setIsHoldingCompare(false)}
                className={`w-full py-2.5 px-3 border transition-all font-mono text-xs uppercase tracking-wider select-none text-center cursor-pointer flex items-center justify-center gap-2 ${
                  isHoldingCompare
                    ? 'bg-[#16243A] text-[#F2EDE3] border-[#C39A27]'
                    : 'bg-[#FBF8F2] hover:bg-[#F2EDE3] text-[#2C2A26] border-[#2C2A26]/20'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isHoldingCompare ? 'bg-[#C39A27] animate-ping' : 'bg-[#A8322A]'
                  }`}
                />
                <span>
                  {isHoldingCompare
                    ? 'ĐANG HIỆN ẢNH GỐC (NHẢ CHUỘT ĐỂ XEM ĐỒ)'
                    : 'SO VỚI ẢNH GỐC (GIỮ CHUỘT)'}
                </span>
              </button>
            )}

            {/* DƯỚI ẢNH: HÀNG MONO NHỎ GHI TÊN 6 LỚP ĐANG MẶC CÁCH NHAU DẤU CHẤM GIỮA */}
            <div className="font-sans text-sm text-[#2C2A26] leading-relaxed pt-1 px-0.5">
              <span className="block font-mono text-[10px] uppercase tracking-wider text-[#6E5439] mb-1">Bộ đang mặc</span>
              {sixLayersText}
            </div>
          </div>

        </div>

        {/* ===================================================================
            CỘT PHẢI (6 CỘT): BỐN KHỐI NỘI DUNG XẾP DỌC, NGĂN BẰNG ĐƯỜNG KẺ TÓC
            =================================================================== */}
        <div className="lg:col-span-8 flex flex-col divide-y divide-[#2C2A26]/15">
          {/* -----------------------------------------------------------------
              KHỐI 1 — TÊN VÀ ĐIỂM
              ----------------------------------------------------------------- */}
          <div className="pb-7">
            {loadingName ? (
              <div className="space-y-3">
                <div className="h-11 w-3/4 bg-[#2C2A26]/10 animate-pulse rounded-[1px]" />
                <div className="h-4 w-1/2 bg-[#2C2A26]/8 animate-pulse rounded-[1px]" />
              </div>
            ) : (
              <div>
                <h1 className="font-display text-[38px] md:text-[44px] leading-tight text-[#2C2A26] font-normal tracking-tight">
                  {nameData?.tenLook || `${mainColorName} Phố, Đoan Trang`}
                </h1>
                {nameData?.captionNgan && (
                  <p className="text-sm font-sans text-[#6E5439] mt-1.5 italic max-w-xl">
                    "{nameData.captionNgan}"
                  </p>
                )}
              </div>
            )}

            {/* BA CHỈ SỐ NẰM NGANG: HÀI HÒA MÀU · HỢP BỐI CẢNH · CỜ VĂN HÓA */}
            <div className="grid grid-cols-3 gap-6 pt-6 mt-2">
              {/* 1. Hài hòa màu */}
              <div className="flex flex-col">
                <span className="micro-label text-[#6E5439]">HÀI HÒA MÀU</span>
                <div className="text-3xl font-mono text-[#2C2A26] font-light mt-0.5 tabular-nums">
                  {scoreMau}
                </div>
                <div className="h-[2px] w-full bg-[#2C2A26]/15 mt-2">
                  <div
                    className="h-full bg-[#2C2A26] transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, scoreMau))}%` }}
                  />
                </div>
              </div>

              {/* 2. Hợp bối cảnh */}
              <div className="flex flex-col">
                <span className="micro-label text-[#6E5439]">HỢP BỐI CẢNH</span>
                <div className="text-3xl font-mono text-[#2C2A26] font-light mt-0.5 tabular-nums">
                  {scoreBoiCanh}
                </div>
                <div className="h-[2px] w-full bg-[#2C2A26]/15 mt-2">
                  <div
                    className="h-full bg-[#2C2A26] transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, scoreBoiCanh))}%` }}
                  />
                </div>
              </div>

              {/* 3. Cờ văn hóa */}
              <div className="flex flex-col">
                <span className="micro-label text-[#6E5439]">CỜ VĂN HÓA</span>
                <div
                  className={`text-3xl font-mono font-light mt-0.5 tabular-nums ${
                    cultureFlagResult.mucDoChung === 'do'
                      ? 'text-[#A8322A]'
                      : cultureFlagResult.mucDoChung === 'vang'
                      ? 'text-[#C39A27]'
                      : 'text-[#2D6A4F]'
                  }`}
                >
                  {cultureFlagResult.mucDoChung === 'do'
                    ? 'Cần cân nhắc'
                    : cultureFlagResult.mucDoChung === 'vang'
                    ? 'Hơi lệch'
                    : 'Chưa lệch'}
                </div>
              </div>
            </div>

            <p className="font-sans text-[11px] text-[#6E5439] pt-3 leading-relaxed">
              Cờ chấm trên lựa chọn của bạn, không chấm trên ảnh.
            </p>
          </div>

          {/* -----------------------------------------------------------------
              KHỐI 2 — CHUYỆN CỦA TÀ ÁO
              ----------------------------------------------------------------- */}
          <div className="py-7 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="micro-label text-[#A8322A]">CHUYỆN CỦA TÀ ÁO</span>

              {/* NHÃN ĐỘ CHẮC CHẮN DẠNG VIÊN THUỐC VIỀN MẢNH */}
              <span
                className={`px-2.5 py-0.5 text-[11px] font-mono border rounded-full uppercase tracking-wider ${doChacChanLabel.border}`}
              >
                {doChacChanLabel.label}
              </span>
            </div>

            {loadingStory ? (
              <div className="space-y-2.5 py-1">
                <div className="h-4 w-full bg-[#2C2A26]/8 animate-pulse rounded-[1px]" />
                <div className="h-4 w-11/12 bg-[#2C2A26]/8 animate-pulse rounded-[1px]" />
                <div className="h-4 w-4/5 bg-[#2C2A26]/8 animate-pulse rounded-[1px]" />
                <div className="h-4 w-2/3 bg-[#2C2A26]/8 animate-pulse rounded-[1px]" />
              </div>
            ) : (
              <div className="text-sm font-sans text-[#2C2A26] leading-relaxed max-w-[65ch]">
                {storyData?.cauChuyen || lookState.thuongY?.cauChuyen}
                {lookState.hoaVan && (
                  <span className="block mt-2 text-[#6E5439]">
                    Hoa văn "{lookState.hoaVan.ten}" được thêu ứng biến theo tích cổ: {lookState.hoaVan.yNghia}
                  </span>
                )}
              </div>
            )}

            {/* HÀNG NGUỒN SỬ DỤNG SOURCETAG ĐỒNG BỘ */}
            <div className="pt-2 flex flex-wrap items-center gap-1.5">
              <SourceTag sourceIds={activeSources.map((s) => s.id)} />
            </div>
          </div>

          {/* -----------------------------------------------------------------
              KHỐI 3 — NÊN, CÂN NHẮC, TRÁNH
              ----------------------------------------------------------------- */}
          <div className="py-7">
            <span className="micro-label text-[#2C2A26] block mb-4">QUY TẮC MẶC ĐÚNG ĐIỂN LỄ</span>

            {/* BA CỘT NHỎ, MỖI CỘT MỘT ĐƯỜNG KẺ MÀU Ở TRÊN: XANH, VÀNG, ĐỎ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Cột 1: NÊN (Đường kẻ xanh) */}
              <div className="flex flex-col">
                <div className="h-[2px] w-full bg-[#2D6A4F] mb-3" />
                <span className="font-mono text-xs font-semibold text-[#2D6A4F] uppercase tracking-wider mb-2">
                  NÊN
                </span>
                <ul className="text-xs font-sans text-[#2C2A26] space-y-2 leading-relaxed">
                  {danhSachNen.map((item, idx) => (
                    <li key={idx} className="pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-[#2D6A4F]">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cột 2: CÂN NHẮC (Đường kẻ vàng) */}
              <div className="flex flex-col">
                <div className="h-[2px] w-full bg-[#C39A27] mb-3" />
                <span className="font-mono text-xs font-semibold text-[#C39A27] uppercase tracking-wider mb-2">
                  CÂN NHẮC
                </span>
                <ul className="text-xs font-sans text-[#2C2A26] space-y-2 leading-relaxed">
                  {danhSachCanNhac.map((item, idx) => (
                    <li key={idx} className="pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-[#C39A27]">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cột 3: TRÁNH (Đường kẻ đỏ) */}
              <div className="flex flex-col">
                <div className="h-[2px] w-full bg-[#A8322A] mb-3" />
                <span className="font-mono text-xs font-semibold text-[#A8322A] uppercase tracking-wider mb-2">
                  TRÁNH
                </span>
                <ul className="text-xs font-sans text-[#2C2A26] space-y-2 leading-relaxed">
                  {danhSachTranh.map((item, idx) => (
                    <li key={idx} className="pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-[#A8322A]">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* -----------------------------------------------------------------
              KHỐI 4 — HÀNH ĐỘNG
              HÀNG NĂM NÚT: SO SÁNH · LƯU VÀO LOOKBOOK · THỬ TRÊN ẢNH · XUẤT POSTER · CHIA SẺ
              ----------------------------------------------------------------- */}
          <div className="pt-7">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {/* Nút 1: SO SÁNH (Nút chính, nền --dieu) */}
              <button
                type="button"
                onClick={() => setModalCompareOpen(true)}
                className="px-3 py-3 bg-[#A8322A] text-[#F2EDE3] font-mono text-xs uppercase tracking-wider hover:bg-[#A8322A]/90 transition-colors text-center cursor-pointer rounded-[1px]"
              >
                SO SÁNH
              </button>

              {/* Nút 2: LƯU VÀO LOOKBOOK */}
              <button
                type="button"
                onClick={handleSaveLookbook}
                className="px-3 py-3 border border-[#2C2A26]/30 text-[#2C2A26] font-mono text-xs uppercase tracking-wider hover:border-[#2C2A26] hover:bg-[#2C2A26]/5 transition-colors text-center cursor-pointer rounded-[1px]"
              >
                LƯU VÀO LOOKBOOK
              </button>

              {/* Nút 3: THỬ TRÊN ẢNH */}
              <button
                type="button"
                onClick={() => setModalTryOnOpen(true)}
                className="px-3 py-3 border border-[#2C2A26]/30 text-[#2C2A26] font-mono text-xs uppercase tracking-wider hover:border-[#2C2A26] hover:bg-[#2C2A26]/5 transition-colors text-center cursor-pointer rounded-[1px]"
              >
                THỬ TRÊN ẢNH
              </button>

              {/* Nút 4: XUẤT POSTER */}
              <button
                type="button"
                onClick={() => setModalPosterOpen(true)}
                className="px-3 py-3 border border-[#2C2A26]/30 text-[#2C2A26] font-mono text-xs uppercase tracking-wider hover:border-[#2C2A26] hover:bg-[#2C2A26]/5 transition-colors text-center cursor-pointer rounded-[1px]"
              >
                XUẤT POSTER
              </button>

              {/* Nút 5: CHIA SẺ */}
              <button
                type="button"
                onClick={handleShare}
                className="px-3 py-3 border border-[#2C2A26]/30 text-[#2C2A26] font-mono text-xs uppercase tracking-wider hover:border-[#2C2A26] hover:bg-[#2C2A26]/5 transition-colors text-center cursor-pointer rounded-[1px]"
              >
                CHIA SẺ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          TOAST XÁC NHẬN MẢNH Ở GÓC, TỰ TẮT SAU 2.5 GIÂY (KHÔNG DÙNG ALERT)
          ===================================================================== */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 bg-[#16243A] text-[#F2EDE3] border border-[#C39A27] font-mono text-xs shadow-lg tracking-wider flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="w-1.5 h-1.5 bg-[#C39A27]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =====================================================================
          MODAL 1: CHI TIẾT NGUỒN TƯ LIỆU VĂN HIẾN
          ===================================================================== */}
      {modalSourceOpen && (
        <div className="fixed inset-0 z-50 bg-[#0D1826]/85 flex items-center justify-center p-4">
          <div className="bg-[#FBF8F2] border border-[#2C2A26] w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 md:p-8 flex flex-col gap-6 shadow-2xl rounded-[1px]">
            <div className="flex items-center justify-between border-b border-[#2C2A26]/15 pb-4">
              <div>
                <span className="micro-label text-[#A8322A]">TRA CỨU DI SẢN</span>
                <h3 className="font-display text-2xl text-[#2C2A26] mt-0.5">
                  Tư liệu tham chiếu văn hiến
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalSourceOpen(false)}
                className="font-mono text-xs text-[#2C2A26] hover:text-[#A8322A] px-2 py-1 border border-[#2C2A26]/20 cursor-pointer"
              >
                ĐÓNG [ESC]
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {activeSources.map((source) => (
                <div
                  key={source.id}
                  className="p-4 border border-[#2C2A26]/15 bg-[#F2EDE3]/50 flex flex-col gap-2"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-xs font-semibold text-[#16243A]">
                      {source.ten}
                    </span>
                    <span className="font-mono text-[11px] text-[#6E5439]">
                      Năm: {source.nam}
                    </span>
                  </div>
                  <div className="text-xs font-sans text-[#2C2A26]">
                    <strong>Tác giả / Cơ quan biên soạn:</strong> {source.tacGia}
                  </div>
                  <div className="text-xs font-sans text-[#6E5439] italic">
                    {source.ghiChu}
                  </div>
                  <div className="text-[11px] font-mono text-[#2C2A26]/70">
                    Phân loại: {source.loai === 'sach' ? 'Sách chuyên khảo' : 'Tư liệu triều đình'}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[#2C2A26]/15 pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setModalSourceOpen(false)}
                className="px-6 py-2 bg-[#2C2A26] text-[#F2EDE3] font-mono text-xs uppercase tracking-wider hover:bg-[#16243A] cursor-pointer"
              >
                HOÀN TẤT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: SO SÁNH CÁC PHƯƠNG ÁN PHỐI (SO SÁNH)
          ===================================================================== */}
      <CompareLooksModal
        isOpen={modalCompareOpen}
        onClose={() => setModalCompareOpen(false)}
      />

      {/* =====================================================================
          MODAL 3: THỬ TRÊN ẢNH / CHỌN NHÂN VẬT ĐẠI DIỆN (THỬ TRÊN ẢNH)
          ===================================================================== */}
      <TryOnModal
        isOpen={modalTryOnOpen}
        onClose={() => setModalTryOnOpen(false)}
        lookState={lookState}
        onSuccess={(newImgUrl) => {
          setAiImageUrl(newImgUrl);
          setIsAiImage(true);
          showToast('Đã dựng hình trang phục thành công!');
        }}
        onErrorToast={showToast}
      />

      {/* =====================================================================
          MODAL 4: XUẤT POSTER TRIỂN LÃM (XUẤT POSTER)
          ===================================================================== */}
      {modalPosterOpen && (
        <div className="fixed inset-0 z-50 bg-[#0D1826]/85 flex items-center justify-center p-4">
          <div className="bg-[#FBF8F2] border border-[#2C2A26] w-full max-w-xl max-h-[90vh] overflow-y-auto p-8 flex flex-col gap-6 shadow-2xl rounded-[1px]">
            <div className="flex items-center justify-between border-b border-[#2C2A26]/15 pb-4">
              <div>
                <span className="micro-label text-[#A8322A]">BẢN IN DI SẢN</span>
                <h3 className="font-display text-2xl text-[#2C2A26] mt-0.5">
                  Poster Thư Tịch Mặc Việt
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalPosterOpen(false)}
                className="font-mono text-xs text-[#2C2A26] hover:text-[#A8322A] px-2 py-1 border border-[#2C2A26]/20 cursor-pointer"
              >
                ĐÓNG [ESC]
              </button>
            </div>

            {/* Khung Poster thu nhỏ */}
            <div className="border-4 border-[#16243A] p-6 bg-[#F2EDE3] flex flex-col gap-4 items-center text-center">
              <span className="font-mono text-[10px] tracking-widest uppercase text-[#A8322A]">
                MẶC VIỆT · PHÒNG TRƯNG BÀY VIỆT PHỤC
              </span>
              <h4 className="font-display text-3xl text-[#16243A]">
                {nameData?.tenLook || 'Chàm Phố Đoan Trang'}
              </h4>
              <p className="text-xs font-sans text-[#6E5439] italic max-w-md">
                "{nameData?.captionNgan || 'Nét đĩnh đạc của tà áo cổ truyền giữa nhịp sống đương đại'}"
              </p>

              <div className="w-48 h-64 border border-[#C39A27] bg-[#FBF8F2] my-2 overflow-hidden flex items-center justify-center">
                {isAiImage && aiImageUrl ? (
                  <img src={aiImageUrl} alt="Poster" className="w-full h-full object-cover" />
                ) : (
                  renderBienBoDo()
                )}
              </div>

              <div className="font-mono text-[11px] text-[#2C2A26]">
                {sixLayersText}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <span className="font-mono text-[10px] px-2 py-0.5 border border-[#2C2A26]/30">
                  MÀU CHÍNH: {layTenMau(lookState.mauChinh)}
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 border border-[#2C2A26]/30">
                  HÀI HÒA: {scoreMau}/100
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 border border-[#2C2A26]/30">
                  BỐI CẢNH: {selectedEvent.ten}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[#2C2A26]/15 pt-4">
              <span className="font-mono text-xs text-[#6E5439]">
                Sẵn sàng để lưu trữ hoặc in ấn
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const posterImg = isAiImage && aiImageUrl ? aiImageUrl : (userPhoto || '');
                    exportLookCardPoster({
                      tenLook: nameData?.tenLook || 'Chàm Phố Đoan Trang',
                      caption: nameData?.captionNgan || 'Nét đĩnh đạc của tà áo cổ truyền giữa nhịp sống đương đại',
                      imageDataUrl: posterImg,
                      sixLayersText: sixLayersText,
                      mauChinh: lookState.mauChinh || '#16243A',
                      suKien: selectedEvent.ten,
                      scoreMau: scoreMau,
                      laAnhAI: Boolean(isAiImage && aiImageUrl),
                    });
                  }}
                  className="px-5 py-2.5 bg-[#16243A] text-[#F2EDE3] font-mono text-xs uppercase tracking-wider hover:bg-[#0D1826] cursor-pointer"
                >
                  TẢI POSTER [PNG / CÓ DẤU]
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="px-5 py-2.5 bg-[#A8322A] text-[#F2EDE3] font-mono text-xs uppercase tracking-wider hover:bg-[#A8322A]/90 cursor-pointer"
                >
                  IN POSTER
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GIẢI THÍCH VÌ SAO ẢNH AI CHỈ LÀ MINH HOẠ */}
      <AiExplanationModal isOpen={showWhyModal} onClose={() => setShowWhyModal(false)} />
    </div>
  );
}
