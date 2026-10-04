import { CultureRule, LookState, EventContext } from '../types';
import { GARMENTS } from './garments';
import { MOTIFS } from './motifs';

export const CULTURE_RULES: CultureRule[] = [
  {
    id: 'CR-01',
    ten: 'Phẩm phục Nhật Bình trong bối cảnh thường ngày',
    dieuKien: 'Áo Nhật Bình và sự kiện mức trang trọng từ 3 trở xuống (cà phê, dạo phố, thường nhật)',
    kiemTra: (look: LookState, boiCanh?: EventContext): boolean => {
      const isNhatBinh = look.thuongY?.id === 'G06';
      const isLowFormality = boiCanh ? boiCanh.mucTrangTrongYeuCau <= 3 : false;
      return Boolean(isNhatBinh && isLowFormality);
    },
    mucDo: 'do',
    thongDiep: 'Nhật Bình là phẩm phục của hậu phi và mệnh phụ triều Nguyễn, gắn với nghi lễ cung đình. Đưa vào bối cảnh thường ngày làm lớp nghĩa nghi lễ của nó mờ đi.',
    cachSua: [
      {
        moTa: 'Đổi sang áo tấc tay thụng trang trọng vừa vặn',
        apDung: (look: LookState): LookState => {
          const aoTac = GARMENTS.find((g) => g.id === 'G05');
          return { ...look, thuongY: aoTac || look.thuongY };
        },
      },
      {
        moTa: 'Đổi sang áo ngũ thân tay chẽn thanh thoát',
        apDung: (look: LookState): LookState => {
          const nguThan = GARMENTS.find((g) => g.id === 'G04');
          return { ...look, thuongY: nguThan || look.thuongY };
        },
      },
    ],
    sourceIds: ['S01', 'S03', 'S04'],
    doChacChan: 'da_xac_lap',
    phanLoaiLoi: 'nghi_le',
    apDung: (look: LookState): LookState => {
      const aoTac = GARMENTS.find((g) => g.id === 'G05');
      return { ...look, thuongY: aoTac || look.thuongY };
    },
    viDu: {
      thuongY: GARMENTS.find((g) => g.id === 'G06') || null,
      haY: GARMENTS.find((g) => g.id === 'G10') || null,
      thuPhuc: GARMENTS.find((g) => g.id === 'G12') || null,
      hai: GARMENTS.find((g) => g.id === 'G15') || null,
      phuKien: [],
      hoaVan: null,
      mauChinh: '#A8322A',
    },
  },
  {
    id: 'CR-02',
    ten: 'Hoa văn rồng năm móng trên thường phục',
    dieuKien: 'Hoa văn rồng năm móng (M08) xuất hiện trên trang phục dân gian hoặc thường phục',
    kiemTra: (look: LookState): boolean => {
      return look.hoaVan?.id === 'M08';
    },
    mucDo: 'do',
    thongDiep: 'Rồng năm móng gắn riêng với hoàng đế trong quy chế điển chương triều Nguyễn, không áp dụng cho thường phục.',
    cachSua: [
      {
        moTa: 'Đổi sang hoa văn mây hoá mềm mại',
        apDung: (look: LookState): LookState => {
          const mayHoa = MOTIFS.find((m) => m.id === 'M02');
          return { ...look, hoaVan: mayHoa || null };
        },
      },
      {
        moTa: 'Đổi sang hoa văn thuỷ ba truyền thống',
        apDung: (look: LookState): LookState => {
          const thuyBa = MOTIFS.find((m) => m.id === 'M03');
          return { ...look, hoaVan: thuyBa || null };
        },
      },
    ],
    sourceIds: ['S01', 'S03'],
    doChacChan: 'da_xac_lap',
    phanLoaiLoi: 'dien_che',
    apDung: (look: LookState): LookState => {
      const mayHoa = MOTIFS.find((m) => m.id === 'M02');
      return { ...look, hoaVan: mayHoa || null };
    },
    viDu: {
      thuongY: GARMENTS.find((g) => g.id === 'G04') || null,
      haY: GARMENTS.find((g) => g.id === 'G10') || null,
      thuPhuc: GARMENTS.find((g) => g.id === 'G12') || null,
      hai: GARMENTS.find((g) => g.id === 'G15') || null,
      phuKien: [],
      hoaVan: MOTIFS.find((m) => m.id === 'M08') || null,
      mauChinh: '#16243A',
    },
  },
  {
    id: 'CR-03',
    ten: 'Hoa văn phượng hoàng trong bối cảnh dân gian',
    dieuKien: 'Hoa văn phượng hoàng (M07) dùng trong sự kiện mức trang trọng từ 3 trở xuống',
    kiemTra: (look: LookState, boiCanh?: EventContext): boolean => {
      const isPhuong = look.hoaVan?.id === 'M07';
      const isLowFormality = boiCanh ? boiCanh.mucTrangTrongYeuCau <= 3 : false;
      return Boolean(isPhuong && isLowFormality);
    },
    mucDo: 'vang',
    thongDiep: 'Hình tượng phượng hoàng gắn với thứ bậc cao trong quy chế phẩm phục, cần cân nhắc khi phối trong không gian thường nhật.',
    cachSua: [
      {
        moTa: 'Đổi sang hoa sen thanh nhã',
        apDung: (look: LookState): LookState => {
          const sen = MOTIFS.find((m) => m.id === 'M05');
          return { ...look, hoaVan: sen || null };
        },
      },
      {
        moTa: 'Đổi sang chữ Thọ dân gian',
        apDung: (look: LookState): LookState => {
          const tho = MOTIFS.find((m) => m.id === 'M01');
          return { ...look, hoaVan: tho || null };
        },
      },
    ],
    sourceIds: ['S03'],
    doChacChan: 'da_xac_lap',
    phanLoaiLoi: 'dien_che',
    apDung: (look: LookState): LookState => {
      const sen = MOTIFS.find((m) => m.id === 'M05');
      return { ...look, hoaVan: sen || null };
    },
    viDu: {
      thuongY: GARMENTS.find((g) => g.id === 'G04') || null,
      haY: GARMENTS.find((g) => g.id === 'G10') || null,
      thuPhuc: GARMENTS.find((g) => g.id === 'G12') || null,
      hai: GARMENTS.find((g) => g.id === 'G15') || null,
      phuKien: [],
      hoaVan: MOTIFS.find((m) => m.id === 'M07') || null,
      mauChinh: '#16243A',
    },
  },
  {
    id: 'CR-04',
    ten: 'Màu vàng hoàng kim chiếm tỷ lệ lớn',
    dieuKien: 'Màu vàng hoàng kim (#C39A27) chiếm trên 50% diện tích ngoài bối cảnh biểu diễn',
    kiemTra: (look: LookState, boiCanh?: EventContext): boolean => {
      if (boiCanh?.id === 'E08') return false;
      return look.mauChinh?.toLowerCase() === '#c39a27';
    },
    mucDo: 'vang',
    thongDiep: 'Sắc vàng chính sắc ở tỷ lệ lớn gợi liên hệ tới phẩm phục cung đình bậc cao, nên tiết chế trong sinh hoạt thường nhật.',
    cachSua: [
      {
        moTa: 'Hạ vàng xuống làm điểm nhấn viền, lấy ngà làm màu nền chính',
        apDung: (look: LookState): LookState => ({ ...look, mauChinh: '#F2EDE3' }),
      },
      {
        moTa: 'Chuyển sang màu hoàng yến nhạt dịu',
        apDung: (look: LookState): LookState => ({ ...look, mauChinh: '#E2C15E' }),
      },
    ],
    sourceIds: ['S03'],
    doChacChan: 'da_xac_lap',
    phanLoaiLoi: 'dien_che',
    apDung: (look: LookState): LookState => ({ ...look, mauChinh: '#F2EDE3' }),
    viDu: {
      thuongY: GARMENTS.find((g) => g.id === 'G04') || null,
      haY: GARMENTS.find((g) => g.id === 'G10') || null,
      thuPhuc: GARMENTS.find((g) => g.id === 'G12') || null,
      hai: GARMENTS.find((g) => g.id === 'G15') || null,
      phuKien: [],
      hoaVan: null,
      mauChinh: '#C39A27',
    },
  },
  {
    id: 'CR-05',
    ten: 'Trang phục toàn sắc trắng trong đám cưới',
    dieuKien: 'Toàn bộ trang phục sắc trắng hoặc ngà trong sự kiện đám cưới (E03)',
    kiemTra: (look: LookState, boiCanh?: EventContext): boolean => {
      if (boiCanh?.id !== 'E03') return false;
      const isNga = (c?: string) => c === '#F2EDE3' || c === '#FBF8F2' || c?.toLowerCase() === '#ffffff';
      const mainIsNga = isNga(look.mauChinh);
      const topIsNga = look.thuongY ? isNga(look.thuongY.mauTruyenThong[0]) : true;
      const bottomIsNga = look.haY ? isNga(look.haY.mauTruyenThong[0]) : true;
      return Boolean(mainIsNga && topIsNga && bottomIsNga);
    },
    mucDo: 'do',
    thongDiep: 'Trắng toàn phần gắn với tang phục trong quan niệm truyền thống, và ở hôn lễ hiện đại còn dễ lấn át vị trí của cô dâu.',
    cachSua: [
      {
        moTa: 'Đổi màu hạ y hoặc thân áo sang màu chàm đĩnh đạc',
        apDung: (look: LookState): LookState => ({ ...look, mauChinh: '#16243A' }),
      },
      {
        moTa: 'Điểm xuyết màu nâu non hoặc the đen',
        apDung: (look: LookState): LookState => ({ ...look, mauChinh: '#6E5439' }),
      },
    ],
    sourceIds: ['S01', 'S10'],
    doChacChan: 'thuc_hanh_hien_nay',
    phanLoaiLoi: 'nghi_le',
    apDung: (look: LookState): LookState => ({ ...look, mauChinh: '#16243A' }),
    viDu: {
      thuongY: GARMENTS.find((g) => g.id === 'G04') || null,
      haY: GARMENTS.find((g) => g.id === 'G10') || null,
      thuPhuc: GARMENTS.find((g) => g.id === 'G12') || null,
      hai: GARMENTS.find((g) => g.id === 'G15') || null,
      phuKien: [],
      hoaVan: null,
      mauChinh: '#F2EDE3',
    },
  },
  {
    id: 'CR-06',
    ten: 'Đơn sắc thuần trắng hoặc thuần đen ngày Tết',
    dieuKien: 'Toàn bộ trang phục mang sắc trắng ngà hoặc thuần đen trong dịp Tết và du xuân (E01)',
    kiemTra: (look: LookState, boiCanh?: EventContext): boolean => {
      if (boiCanh?.id !== 'E01') return false;
      const isAllWhite = look.mauChinh === '#F2EDE3' || look.mauChinh === '#FBF8F2';
      const isAllBlack = look.mauChinh === '#2C2A26' || look.mauChinh === '#0D1826' || look.mauChinh === '#1C1C1A';
      return Boolean(isAllWhite || isAllBlack);
    },
    mucDo: 'vang',
    thongDiep: 'Ngày đầu năm mới, hai thái cực trắng tang và đen tuyền đều được dân gian kiêng kỵ để đón sinh khí cát tường.',
    cachSua: [
      {
        moTa: 'Thêm điểm nhấn màu điều may mắn ấm áp',
        apDung: (look: LookState): LookState => ({ ...look, mauChinh: '#A8322A' }),
      },
      {
        moTa: 'Chọn sắc lục biếc đâm chồi ngày xuân',
        apDung: (look: LookState): LookState => ({ ...look, mauChinh: '#3F6B5A' }),
      },
    ],
    sourceIds: ['S10', 'S12'],
    doChacChan: 'thuc_hanh_hien_nay',
    phanLoaiLoi: 'nghi_le',
    apDung: (look: LookState): LookState => ({ ...look, mauChinh: '#A8322A' }),
    viDu: {
      thuongY: GARMENTS.find((g) => g.id === 'G04') || null,
      haY: GARMENTS.find((g) => g.id === 'G10') || null,
      thuPhuc: GARMENTS.find((g) => g.id === 'G12') || null,
      hai: GARMENTS.find((g) => g.id === 'G15') || null,
      phuKien: [],
      hoaVan: null,
      mauChinh: '#2C2A26',
    },
  },
  {
    id: 'CR-07',
    ten: 'Khách mời mặc sắc đỏ điều hoặc hoàng rực rỡ ở đám cưới',
    dieuKien: 'Khách mời mặc sắc đỏ điều (#A8322A) hoặc hoàng kim trong lễ cưới (E03)',
    kiemTra: (look: LookState, boiCanh?: EventContext): boolean => {
      if (boiCanh?.id !== 'E03') return false;
      const isDieuOrHoang = look.mauChinh === '#A8322A' || look.mauChinh === '#C39A27' || look.mauChinh === '#E2C15E';
      return isDieuOrHoang;
    },
    mucDo: 'vang',
    thongDiep: 'Sắc đỏ điều rực rỡ thường dành riêng cho tân lang tân nương; khách mời nên chọn sắc thái nhã nhặn hơn để tôn vinh chủ nhân tiệc cưới.',
    cachSua: [
      {
        moTa: 'Chuyển sang màu lục biếc thanh lịch',
        apDung: (look: LookState): LookState => ({ ...look, mauChinh: '#3F6B5A' }),
      },
      {
        moTa: 'Chuyển sang màu tam giang nền nã',
        apDung: (look: LookState): LookState => ({ ...look, mauChinh: '#7B8FA1' }),
      },
    ],
    sourceIds: ['S10', 'S12'],
    doChacChan: 'thuc_hanh_hien_nay',
    phanLoaiLoi: 'nghi_le',
    apDung: (look: LookState): LookState => ({ ...look, mauChinh: '#3F6B5A' }),
    viDu: {
      thuongY: GARMENTS.find((g) => g.id === 'G04') || null,
      haY: GARMENTS.find((g) => g.id === 'G10') || null,
      thuPhuc: GARMENTS.find((g) => g.id === 'G12') || null,
      hai: GARMENTS.find((g) => g.id === 'G15') || null,
      phuKien: [],
      hoaVan: null,
      mauChinh: '#A8322A',
    },
  },
  {
    id: 'CR-08',
    ten: 'Thiếu kín đáo trong không gian tự viện lễ chùa',
    dieuKien: 'Chỉ mặc yếm hoặc trang phục hở vai khi tham gia lễ chùa (E04)',
    kiemTra: (look: LookState, boiCanh?: EventContext): boolean => {
      if (boiCanh?.id !== 'E04') return false;
      const onlyYem = look.thuongY?.id === 'G16';
      const noTop = !look.thuongY;
      return Boolean(onlyYem || noTop);
    },
    mucDo: 'do',
    thongDiep: 'Không gian thờ tự cửa thiền đòi hỏi y phục kín đáo, trang nghiêm để gìn giữ sự thanh tịnh tôn nghiêm.',
    cachSua: [
      {
        moTa: 'Khoác thêm áo ngũ thân kín đáo tề chỉnh',
        apDung: (look: LookState): LookState => {
          const nguThan = GARMENTS.find((g) => g.id === 'G04');
          return { ...look, thuongY: nguThan || look.thuongY };
        },
      },
      {
        moTa: 'Khoác áo giao lĩnh cổ truyền kín cổ',
        apDung: (look: LookState): LookState => {
          const giaoLinh = GARMENTS.find((g) => g.id === 'G01');
          return { ...look, thuongY: giaoLinh || look.thuongY };
        },
      },
    ],
    sourceIds: ['S10'],
    doChacChan: 'da_xac_lap',
    phanLoaiLoi: 'nghi_le',
    apDung: (look: LookState): LookState => {
      const nguThan = GARMENTS.find((g) => g.id === 'G04');
      return { ...look, thuongY: nguThan || look.thuongY };
    },
    viDu: {
      thuongY: GARMENTS.find((g) => g.id === 'G16') || null,
      haY: GARMENTS.find((g) => g.id === 'G11') || null,
      thuPhuc: null,
      hai: GARMENTS.find((g) => g.id === 'G15') || null,
      phuKien: [],
      hoaVan: null,
      mauChinh: '#A8322A',
    },
  },
  {
    id: 'CR-09',
    ten: 'Mấn hoặc khăn Huế phối cùng áo bà ba Nam Bộ',
    dieuKien: 'Khăn vấn hoặc khăn đóng kiểu Huế (G12, G13) kết hợp áo bà ba Nam Bộ (G09)',
    kiemTra: (look: LookState): boolean => {
      const isBaBa = look.thuongY?.id === 'G09';
      const isKhanHue = look.thuPhuc?.id === 'G12' || look.thuPhuc?.id === 'G13';
      return Boolean(isBaBa && isKhanHue);
    },
    mucDo: 'vang',
    thongDiep: 'Áo bà ba và khăn vấn Huế thuộc hai vùng miền và tầng mức nghi lễ khác biệt, tạo cảm giác chênh lệch phong vị.',
    cachSua: [
      {
        moTa: 'Bỏ khăn vấn để tóc tự nhiên đúng phong thái Nam Bộ mộc mạc',
        apDung: (look: LookState): LookState => ({ ...look, thuPhuc: null }),
      },
      {
        moTa: 'Đổi áo bà ba sang áo ngũ thân tay chẽn để ăn nhập với khăn vấn',
        apDung: (look: LookState): LookState => {
          const nguThan = GARMENTS.find((g) => g.id === 'G04');
          return { ...look, thuongY: nguThan || look.thuongY };
        },
      },
    ],
    sourceIds: ['S01', 'S09'],
    doChacChan: 'thuc_hanh_hien_nay',
    phanLoaiLoi: 'lech_vung',
    apDung: (look: LookState): LookState => ({ ...look, thuPhuc: null }),
    viDu: {
      thuongY: GARMENTS.find((g) => g.id === 'G09') || null,
      haY: GARMENTS.find((g) => g.id === 'G10') || null,
      thuPhuc: GARMENTS.find((g) => g.id === 'G12') || null,
      hai: GARMENTS.find((g) => g.id === 'G15') || null,
      phuKien: [],
      hoaVan: null,
      mauChinh: '#16243A',
    },
  },
  {
    id: 'CR-10',
    ten: 'Nón quai thao Bắc Bộ lạc địa giới văn hoá',
    dieuKien: 'Nón quai thao Bắc Bộ (G14) được chọn khi bối cảnh vùng là Nam Bộ hoặc Trung Bộ',
    kiemTra: (look: LookState, _boiCanh?: EventContext, regionId?: string): boolean => {
      const isNonQuaiThao = look.thuPhuc?.id === 'G14';
      const isSouthOrCentral = regionId === 'R02' || regionId === 'R03' || regionId === 'trung' || regionId === 'nam';
      return Boolean(isNonQuaiThao && isSouthOrCentral);
    },
    mucDo: 'vang',
    thongDiep: 'Nón quai thao gắn chặt với hội làng Kinh Bắc, dễ tạo độ lệch cảnh quan khi đặt vào không gian phương Nam hay xứ Huế.',
    cachSua: [
      {
        moTa: 'Đổi sang nón lá trung tính phổ biến mọi miền',
        apDung: (look: LookState): LookState => ({ ...look, thuPhuc: null }),
      },
    ],
    sourceIds: ['S05'],
    doChacChan: 'thuc_hanh_hien_nay',
    phanLoaiLoi: 'lech_vung',
    apDung: (look: LookState): LookState => ({ ...look, thuPhuc: null }),
    viDu: {
      thuongY: GARMENTS.find((g) => g.id === 'G04') || null,
      haY: GARMENTS.find((g) => g.id === 'G10') || null,
      thuPhuc: GARMENTS.find((g) => g.id === 'G14') || null,
      hai: GARMENTS.find((g) => g.id === 'G15') || null,
      phuKien: [],
      hoaVan: null,
      mauChinh: '#16243A',
    },
  },
  {
    id: 'CR-11',
    ten: 'Váy đụp Bắc Bộ phối cùng áo dài tân thời',
    dieuKien: 'Váy đụp dân gian (G11) đi cùng áo dài Le Mur tân thời (G08)',
    kiemTra: (look: LookState): boolean => {
      const isAoDaiTanThoi = look.thuongY?.id === 'G08';
      const isVayDup = look.haY?.id === 'G11';
      return Boolean(isAoDaiTanThoi && isVayDup);
    },
    mucDo: 'vang',
    thongDiep: 'Hai món thuộc hai hệ trang phục và hai thời kỳ cách biệt, tạo sự xung đột giữa nét cách tân thành thị và chất mộc thôn quê.',
    cachSua: [
      {
        moTa: 'Đổi sang quần lụa ống rộng mềm rủ đúng phom dáng tân thời',
        apDung: (look: LookState): LookState => {
          const quanLua = GARMENTS.find((g) => g.id === 'G10');
          return { ...look, haY: quanLua || look.haY };
        },
      },
    ],
    sourceIds: ['S01', 'S05'],
    doChacChan: 'da_xac_lap',
    phanLoaiLoi: 'lech_thoi_ky',
    apDung: (look: LookState): LookState => {
      const quanLua = GARMENTS.find((g) => g.id === 'G10');
      return { ...look, haY: quanLua || look.haY };
    },
    viDu: {
      thuongY: GARMENTS.find((g) => g.id === 'G08') || null,
      haY: GARMENTS.find((g) => g.id === 'G11') || null,
      thuPhuc: null,
      hai: GARMENTS.find((g) => g.id === 'G15') || null,
      phuKien: [],
      hoaVan: null,
      mauChinh: '#3F6B5A',
    },
  },
  {
    id: 'CR-12',
    ten: 'Áo tứ thân mang hoa văn cung đình',
    dieuKien: 'Áo tứ thân dân gian (G03) kết hợp hoa văn hoàng gia phượng hoàng (M07) hoặc rồng (M08)',
    kiemTra: (look: LookState): boolean => {
      const isTuThan = look.thuongY?.id === 'G03';
      const isRoyalMotif = look.hoaVan?.id === 'M07' || look.hoaVan?.id === 'M08';
      return Boolean(isTuThan && isRoyalMotif);
    },
    mucDo: 'vang',
    thongDiep: 'Tứ thân là y phục dân gian lao động và hội hè mộc mạc vùng Bắc Bộ, không mang các đồ án thuộc phẩm phục cung đình.',
    cachSua: [
      {
        moTa: 'Đổi hoa văn sang chữ Thọ hoặc hoa sen dân gian',
        apDung: (look: LookState): LookState => {
          const tho = MOTIFS.find((m) => m.id === 'M01');
          return { ...look, hoaVan: tho || null };
        },
      },
      {
        moTa: 'Để mộc trơn thuần khiết theo đúng nếp xưa',
        apDung: (look: LookState): LookState => ({ ...look, hoaVan: null }),
      },
    ],
    sourceIds: ['S01', 'S05'],
    doChacChan: 'da_xac_lap',
    phanLoaiLoi: 'dien_che',
    apDung: (look: LookState): LookState => {
      const tho = MOTIFS.find((m) => m.id === 'M01');
      return { ...look, hoaVan: tho || null };
    },
    viDu: {
      thuongY: GARMENTS.find((g) => g.id === 'G03') || null,
      haY: GARMENTS.find((g) => g.id === 'G11') || null,
      thuPhuc: GARMENTS.find((g) => g.id === 'G14') || null,
      hai: GARMENTS.find((g) => g.id === 'G15') || null,
      phuKien: [],
      hoaVan: MOTIFS.find((m) => m.id === 'M08') || null,
      mauChinh: '#6E5439',
    },
  },
  {
    id: 'CR-13',
    ten: 'Áo giao lĩnh phối phụ kiện đương đại',
    dieuKien: 'Áo giao lĩnh (G01) kết hợp sneaker hoặc phụ kiện tân thời ngoài không gian dạo phố sáng tạo (E07, E08)',
    kiemTra: (look: LookState, boiCanh?: EventContext): boolean => {
      const isGiaoLinh = look.thuongY?.id === 'G01';
      const hasModernAcc = Boolean(look.phuKienHienDai);
      const isAllowedEvent = boiCanh?.id === 'E07' || boiCanh?.id === 'E08';
      return Boolean(isGiaoLinh && hasModernAcc && !isAllowedEvent);
    },
    mucDo: 'vang',
    thongDiep: 'Giao lĩnh thuộc tầng trang phục cổ kính trang nghiêm, việc phối đồ phá cách cần đặt trong không gian nghệ thuật phù hợp.',
    cachSua: [
      {
        moTa: 'Đổi sang hài thêu hoặc guốc mộc truyền thống',
        apDung: (look: LookState): LookState => {
          const haiTheu = GARMENTS.find((g) => g.id === 'G15');
          return { ...look, phuKienHienDai: false, hai: haiTheu || look.hai };
        },
      },
    ],
    sourceIds: ['S01'],
    doChacChan: 'dang_tranh_luan',
    phanLoaiLoi: 'lech_thoi_ky',
    apDung: (look: LookState): LookState => {
      const haiTheu = GARMENTS.find((g) => g.id === 'G15');
      return { ...look, phuKienHienDai: false, hai: haiTheu || look.hai };
    },
    viDu: {
      thuongY: GARMENTS.find((g) => g.id === 'G01') || null,
      haY: GARMENTS.find((g) => g.id === 'G10') || null,
      thuPhuc: GARMENTS.find((g) => g.id === 'G12') || null,
      hai: GARMENTS.find((g) => g.id === 'G15') || null,
      phuKien: [],
      hoaVan: null,
      mauChinh: '#16243A',
      phuKienHienDai: true,
    },
  },
  {
    id: 'CR-14',
    ten: 'Sneaker đi cùng áo tấc trong nghi lễ gia tiên',
    dieuKien: 'Giày thể thao hiện đại đi kèm áo tấc trang trọng trong lễ cúng giỗ gia tiên (E05)',
    kiemTra: (look: LookState, boiCanh?: EventContext): boolean => {
      const isAoTac = look.thuongY?.id === 'G05';
      const hasSneaker = Boolean(look.phuKienHienDai);
      const isE05 = boiCanh?.id === 'E05';
      return Boolean(isAoTac && hasSneaker && isE05);
    },
    mucDo: 'vang',
    thongDiep: 'Remix giày thể thao có thể thú vị trên đường phố, nhưng trong không gian thờ tự tổ tiên trang trọng sẽ làm vơi đi nét cung kính.',
    cachSua: [
      {
        moTa: 'Đổi sang hài thêu mũi cong hoặc giày vải tối giản',
        apDung: (look: LookState): LookState => {
          const haiTheu = GARMENTS.find((g) => g.id === 'G15');
          return { ...look, phuKienHienDai: false, hai: haiTheu || look.hai };
        },
      },
    ],
    sourceIds: ['S10'],
    doChacChan: 'thuc_hanh_hien_nay',
    phanLoaiLoi: 'nghi_le',
    apDung: (look: LookState): LookState => {
      const haiTheu = GARMENTS.find((g) => g.id === 'G15');
      return { ...look, phuKienHienDai: false, hai: haiTheu || look.hai };
    },
    viDu: {
      thuongY: GARMENTS.find((g) => g.id === 'G05') || null,
      haY: GARMENTS.find((g) => g.id === 'G10') || null,
      thuPhuc: GARMENTS.find((g) => g.id === 'G12') || null,
      hai: null,
      phuKien: [],
      hoaVan: null,
      mauChinh: '#16243A',
      phuKienHienDai: true,
    },
  },
  {
    id: 'CR-15',
    ten: 'Áo tấc gấm trong thời tiết nắng nóng trên 32°C',
    dieuKien: 'Áo tấc gấm mặc khi nhiệt độ môi trường vượt quá 32°C',
    kiemTra: (look: LookState): boolean => {
      const isAoTac = look.thuongY?.id === 'G05';
      const isHot = (look.nhietDo ?? 25) > 32;
      return Boolean(isAoTac && isHot);
    },
    mucDo: 'vang',
    thongDiep: 'Tay thụng rộng và chất liệu gấm dầy dễ gây ngột ngạt khi sinh hoạt ngoài trời nắng nóng. Đây là lưu ý tiện dụng cho người mặc.',
    cachSua: [
      {
        moTa: 'Đổi sang áo ngũ thân tay chẽn chất the hoặc đũi thoáng mát',
        apDung: (look: LookState): LookState => {
          const nguThan = GARMENTS.find((g) => g.id === 'G04');
          return { ...look, thuongY: nguThan || look.thuongY };
        },
      },
    ],
    sourceIds: ['S12'],
    doChacChan: 'thuc_hanh_hien_nay',
    phanLoaiLoi: 'tien_dung',
    apDung: (look: LookState): LookState => {
      const nguThan = GARMENTS.find((g) => g.id === 'G04');
      return { ...look, thuongY: nguThan || look.thuongY };
    },
    viDu: {
      thuongY: GARMENTS.find((g) => g.id === 'G05') || null,
      haY: GARMENTS.find((g) => g.id === 'G10') || null,
      thuPhuc: GARMENTS.find((g) => g.id === 'G12') || null,
      hai: GARMENTS.find((g) => g.id === 'G15') || null,
      phuKien: [],
      hoaVan: null,
      mauChinh: '#16243A',
      nhietDo: 36,
    },
  },
  {
    id: 'CR-16',
    ten: 'Đầu trần trong đại lễ nghi thức cấp cao',
    dieuKien: 'Không đội mũ khăn thủ phục trong sự kiện có mức trang trọng từ 4 trở lên',
    kiemTra: (look: LookState, boiCanh?: EventContext): boolean => {
      const isHighFormality = (boiCanh?.mucTrangTrongYeuCau ?? 0) >= 4;
      const noHeadwear = !look.thuPhuc;
      return Boolean(isHighFormality && noHeadwear);
    },
    mucDo: 'vang',
    thongDiep: 'Theo quy thức trang phục truyền thống, ở mức đại lễ trang trọng, đầu tóc để trần làm tổng thể y phục thiếu đi vẻ tề chỉnh trọn vẹn.',
    cachSua: [
      {
        moTa: 'Bổ sung khăn vấn hoặc khăn đóng chỉnh tề',
        apDung: (look: LookState): LookState => {
          const khanVan = GARMENTS.find((g) => g.id === 'G12');
          return { ...look, thuPhuc: khanVan || look.thuPhuc };
        },
      },
    ],
    sourceIds: ['S01', 'S10'],
    doChacChan: 'da_xac_lap',
    phanLoaiLoi: 'nghi_le',
    apDung: (look: LookState): LookState => {
      const khanVan = GARMENTS.find((g) => g.id === 'G12');
      return { ...look, thuPhuc: khanVan || look.thuPhuc };
    },
    viDu: {
      thuongY: GARMENTS.find((g) => g.id === 'G05') || null,
      haY: GARMENTS.find((g) => g.id === 'G10') || null,
      thuPhuc: null,
      hai: GARMENTS.find((g) => g.id === 'G15') || null,
      phuKien: [],
      hoaVan: null,
      mauChinh: '#16243A',
    },
  },
  {
    id: 'CR-17',
    ten: 'Tách lẻ trang phục dân tộc thiểu số làm phụ kiện',
    dieuKien: 'Một món thuộc trang phục dân tộc thiểu số được chọn lẻ, không kèm các món cùng bộ chỉnh thể',
    kiemTra: (look: LookState): boolean => {
      return Boolean(look.isEthnicMinoritySingle);
    },
    mucDo: 'do',
    thongDiep: 'Trang phục các dân tộc thiểu số là một chỉnh thể văn hóa thiêng liêng có chủ thể xác định; việc tách rời từng món làm phụ kiện thời trang dễ làm suy suyển ý nghĩa cội nguồn.',
    cachSua: [
      {
        moTa: 'Chọn trọn bộ theo tộc người để giữ trọn vẹn bản sắc',
        apDung: (look: LookState): LookState => ({ ...look, isEthnicMinoritySingle: false }),
      },
      {
        moTa: 'Bỏ món trang sức tách lẻ để giữ sự thuần khiết cho trang phục',
        apDung: (look: LookState): LookState => ({ ...look, isEthnicMinoritySingle: false }),
      },
    ],
    sourceIds: ['S11'],
    doChacChan: 'da_xac_lap',
    phanLoaiLoi: 'ban_sac',
    apDung: (look: LookState): LookState => ({ ...look, isEthnicMinoritySingle: false }),
    viDu: {
      thuongY: GARMENTS.find((g) => g.id === 'G04') || null,
      haY: GARMENTS.find((g) => g.id === 'G10') || null,
      thuPhuc: GARMENTS.find((g) => g.id === 'G12') || null,
      hai: GARMENTS.find((g) => g.id === 'G15') || null,
      phuKien: [],
      hoaVan: null,
      mauChinh: '#16243A',
      isEthnicMinoritySingle: true,
    },
  },
  {
    id: 'CR-18',
    ten: 'Đắp ghép hoa văn thổ cẩm lên áo dài Việt',
    dieuKien: 'Hoa văn thổ cẩm đặc thù của tộc người thiểu số gắn lên thân áo ngũ thân hoặc áo dài',
    kiemTra: (look: LookState): boolean => {
      const isVietTop = look.thuongY?.id === 'G04' || look.thuongY?.id === 'G08';
      return Boolean(isVietTop && look.hasEthnicEmbroideryOnVietTop);
    },
    mucDo: 'vang',
    thongDiep: 'Hoa văn thổ cẩm mang mã số biểu tượng riêng của từng tộc người và từng dòng họ, không nên xem như hoạ tiết trang trí chung.',
    cachSua: [
      {
        moTa: 'Sử dụng đồ án trang trí mỹ thuật truyền thống người Việt',
        apDung: (look: LookState): LookState => {
          const tho = MOTIFS.find((m) => m.id === 'M01');
          return { ...look, hasEthnicEmbroideryOnVietTop: false, hoaVan: tho || null };
        },
      },
      {
        moTa: 'Chuyển sang chọn trọn bộ trang phục tộc người',
        apDung: (look: LookState): LookState => ({ ...look, hasEthnicEmbroideryOnVietTop: false }),
      },
    ],
    sourceIds: ['S11'],
    doChacChan: 'thuc_hanh_hien_nay',
    phanLoaiLoi: 'ban_sac',
    apDung: (look: LookState): LookState => {
      const tho = MOTIFS.find((m) => m.id === 'M01');
      return { ...look, hasEthnicEmbroideryOnVietTop: false, hoaVan: tho || null };
    },
    viDu: {
      thuongY: GARMENTS.find((g) => g.id === 'G04') || null,
      haY: GARMENTS.find((g) => g.id === 'G10') || null,
      thuPhuc: GARMENTS.find((g) => g.id === 'G12') || null,
      hai: GARMENTS.find((g) => g.id === 'G15') || null,
      phuKien: [],
      hoaVan: null,
      mauChinh: '#16243A',
      hasEthnicEmbroideryOnVietTop: true,
    },
  },
  {
    id: 'CR-19',
    ten: 'Gộp chung định danh trang phục Tây Bắc',
    dieuKien: 'Vùng Tây Bắc được chọn nhưng phần trang phục gộp chung nhiều tộc người mà không ghi rõ tên tộc người cụ thể',
    kiemTra: (look: LookState, _boiCanh?: EventContext, regionId?: string): boolean => {
      const isTayBac = regionId === 'R04' || regionId === 'tay_bac';
      return Boolean(isTayBac && look.isGopChungTayBac);
    },
    mucDo: 'vang',
    thongDiep: 'Mỗi cộng đồng dân tộc Tây Bắc có hệ trang phục riêng biệt, gọi gộp chung làm mờ nhạt căn tính văn hóa của từng tộc người.',
    cachSua: [
      {
        moTa: 'Chỉ rõ trang phục thuộc về tộc người cụ thể (Thái, Mông, Dao...)',
        apDung: (look: LookState): LookState => ({ ...look, isGopChungTayBac: false }),
      },
    ],
    sourceIds: ['S11'],
    doChacChan: 'da_xac_lap',
    phanLoaiLoi: 'ban_sac',
    apDung: (look: LookState): LookState => ({ ...look, isGopChungTayBac: false }),
    viDu: {
      thuongY: GARMENTS.find((g) => g.id === 'G04') || null,
      haY: GARMENTS.find((g) => g.id === 'G10') || null,
      thuPhuc: GARMENTS.find((g) => g.id === 'G12') || null,
      hai: GARMENTS.find((g) => g.id === 'G15') || null,
      phuKien: [],
      hoaVan: null,
      mauChinh: '#16243A',
      isGopChungTayBac: true,
    },
  },
  {
    id: 'CR-20',
    ten: 'Cổ áo hoặc vạt áo buông lỏng khi hành lễ',
    dieuKien: 'Cổ áo giao lĩnh hay ngũ thân mặc buông lỏng hoặc lệch vạt trong nghi lễ trang nghiêm (E04, E05)',
    kiemTra: (look: LookState, boiCanh?: EventContext): boolean => {
      const isSolemn = boiCanh?.id === 'E04' || boiCanh?.id === 'E05';
      const isTradTop = look.thuongY?.id === 'G01' || look.thuongY?.id === 'G04';
      return Boolean(isSolemn && isTradTop && !look.phuKienHienDai);
    },
    mucDo: 'xanh',
    thongDiep: 'Đường cổ áo ngũ thân khép kín và giao lĩnh vắt chéo là biểu trưng của phong thái đàng hoàng, cần giữ ngay ngắn khi tham dự lễ bái.',
    cachSua: [
      {
        moTa: 'Chỉnh trang vạt áo ngay ngắn, gài khuy tề chỉnh',
        apDung: (look: LookState): LookState => ({ ...look, phuKienHienDai: false }),
      },
    ],
    sourceIds: ['S01', 'S10'],
    doChacChan: 'da_xac_lap',
    phanLoaiLoi: 'nghi_le',
    apDung: (look: LookState): LookState => ({ ...look, phuKienHienDai: false }),
    viDu: {
      thuongY: GARMENTS.find((g) => g.id === 'G04') || null,
      haY: GARMENTS.find((g) => g.id === 'G10') || null,
      thuPhuc: GARMENTS.find((g) => g.id === 'G12') || null,
      hai: GARMENTS.find((g) => g.id === 'G15') || null,
      phuKien: [],
      hoaVan: null,
      mauChinh: '#16243A',
      phuKienHienDai: false,
    },
  },
];
