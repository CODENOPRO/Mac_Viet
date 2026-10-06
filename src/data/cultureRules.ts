import { CultureRule, LookState, EventContext } from '../types';
import { GARMENTS } from './garments';
import { MOTIFS } from './motifs';
import { mauHaY, mauThuPhuc, cungMau } from '../lib/mauLook';

/**
 * Luật đã viết sẵn nhưng chưa chạy được: chúng xét các món trang phục dân tộc thiểu số, mà kho hiện vật
 * chưa có món nào như vậy. Màn Luật văn hoá ghi rõ trạng thái này và không cho bấm xem ví dụ,
 * thay vì dựng một bộ áo người Kinh rồi gắn cờ dân tộc thiểu số cho nó.
 */
export const LUAT_CHO_DU_LIEU = ['CR-17', 'CR-18', 'CR-19'];

export const CULTURE_RULES: CultureRule[] = [
  {
    id: 'CR-01',
    ten: 'Phẩm phục Nhật Bình trong bối cảnh thường ngày',
    dieuKien: 'Áo Nhật Bình mặc vào dịp không mang tính nghi lễ, như cà phê, dạo phố, Tết, kỷ yếu, ra mắt gia đình',
    kiemTra: (look: LookState, boiCanh?: EventContext): boolean => {
      // Đúng các dịp đời thường mà điều kiện liệt kê, không suy từ mức trang trọng:
      // gia chủ đón Tết có mức 4 nhưng Tết vẫn không phải dịp nghi lễ cung đình.
      const DIP_DOI_THUONG = ['E01', 'E02', 'E06', 'E07']; // Tết, kỷ yếu, ra mắt, dạo phố
      return look.thuongY?.id === 'G06' && DIP_DOI_THUONG.includes(boiCanh?.id ?? '');
    },
    mucDo: 'do',
    thongDiep: 'Nhật Bình là phẩm phục của hậu phi và mệnh phụ triều Nguyễn, gắn với nghi lễ cung đình. Đưa vào bối cảnh thường ngày làm lớp nghĩa nghi lễ của nó mờ đi.',
    cachSua: [
      // Không gợi ý áo tấc: garments.ts ghi áo tấc là lễ phục, không dùng khi đi chơi thường ngày.
      {
        moTa: 'Đổi sang áo ngũ thân tay chẽn thanh thoát',
        apDung: (look: LookState): LookState => {
          const nguThan = GARMENTS.find((g) => g.id === 'G04');
          return { ...look, thuongY: nguThan || look.thuongY };
        },
      },
      {
        moTa: 'Đổi sang áo dài tân thời, hợp dạo phố và chụp ảnh',
        apDung: (look: LookState): LookState => {
          const aoDai = GARMENTS.find((g) => g.id === 'G08');
          return { ...look, thuongY: aoDai || look.thuongY };
        },
      },
    ],
    sourceIds: ['S01', 'S03', 'S04'],
    doChacChan: 'da_xac_lap',
    phanLoaiLoi: 'nghi_le',
    apDung: (look: LookState): LookState => {
      const nguThan = GARMENTS.find((g) => g.id === 'G04');
      return { ...look, thuongY: nguThan || look.thuongY };
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
    dieuKien: 'Hoa văn rồng năm móng trên trang phục của người thường; chỉ người biểu diễn tái hiện trên sân khấu được miễn',
    kiemTra: (look: LookState, boiCanh?: EventContext): boolean => {
      // Miễn đúng một trường hợp: người biểu diễn ở dịp biểu diễn (tiết mục tái hiện cung đình)
      if (boiCanh?.id === 'E08' && boiCanh.vaiTro === 'bieu_dien') return false;
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
    dieuKien: 'Hoa văn phượng hoàng dùng trong dịp thường ngày, dạo phố hoặc có lễ nhỏ',
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
    dieuKien: 'Màu vàng hoàng kim chiếm trên một nửa bộ trang phục, trừ người biểu diễn trên sân khấu',
    kiemTra: (look: LookState, boiCanh?: EventContext): boolean => {
      // Bối cảnh biểu diễn là người đứng trên sân khấu, không phải khán giả hay người dẫn
      if (boiCanh?.id === 'E08' && (!boiCanh.vaiTro || boiCanh.vaiTro === 'bieu_dien')) return false;
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
    dieuKien: 'Áo và quần cùng màu trắng hoặc ngà khi đi dự đám cưới',
    kiemTra: (look: LookState, boiCanh?: EventContext): boolean => {
      if (boiCanh?.id !== 'E03') return false;
      const isNga = (c?: string) => ['#F2EDE3', '#FBF8F2', '#FFFFFF'].some((m) => cungMau(c, m));
      // Màu áo là màu người dùng chọn (mauChinh), không phải màu mặc định của món
      const aoNga = isNga(look.mauChinh);
      const quanNga = look.haY ? isNga(mauHaY(look)) : true;
      return Boolean(look.thuongY && aoNga && quanNga);
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
    dieuKien: 'Áo, quần và khăn cùng toàn màu trắng ngà hoặc cùng toàn màu đen trong dịp Tết và du xuân',
    kiemTra: (look: LookState, boiCanh?: EventContext): boolean => {
      if (boiCanh?.id !== 'E01') return false;
      // Xét cả bộ: áo, quần và khăn (nếu có) cùng toàn trắng ngà hoặc cùng toàn đen
      const cacMau = [look.mauChinh, mauHaY(look), mauThuPhuc(look)].filter((m): m is string => Boolean(m));
      const toanBo = (bang: string[]) => cacMau.length > 0 && cacMau.every((m) => bang.some((x) => cungMau(m, x)));
      return toanBo(['#F2EDE3', '#FBF8F2']) || toanBo(['#2C2A26', '#1C1C1A']);
    },
    mucDo: 'vang',
    thongDiep: 'Ngày đầu năm mới, hai thái cực trắng tang và đen tuyền đều được dân gian kiêng kỵ để đón sinh khí cát tường.',
    cachSua: [
      {
        moTa: 'Đổi áo sang màu điều ấm áp ngày xuân',
        apDung: (look: LookState): LookState => ({ ...look, mauChinh: '#A8322A' }),
      },
      {
        moTa: 'Đổi áo sang sắc lục biếc đâm chồi',
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
      // Quần và khăn cũng đen, đúng nghĩa toàn bộ trang phục một màu đen
      mauHaY: '#2C2A26',
      mauThuPhuc: '#2C2A26',
    },
  },
  {
    id: 'CR-07',
    ten: 'Khách mời mặc sắc đỏ điều hoặc hoàng rực rỡ ở đám cưới',
    dieuKien: 'Khách mời mặc màu đỏ điều hoặc vàng hoàng kim rực trong lễ cưới',
    kiemTra: (look: LookState, boiCanh?: EventContext): boolean => {
      if (boiCanh?.id !== 'E03') return false;
      // Luật này dành cho khách mời. Người nhà hai họ, đội bê tráp là một phần của lễ, mặc theo nếp hai họ.
      if (boiCanh.vaiTro && boiCanh.vaiTro !== 'khach_moi') return false;
      // Hoàng yến (#E2C15E) là vàng nhạt, không phải hoàng kim rực; CR-04 còn gợi ý chính màu này làm cách sửa
      const isDieuOrHoang = cungMau(look.mauChinh, '#A8322A') || cungMau(look.mauChinh, '#C39A27');
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
    dieuKien: 'Chỉ mặc yếm hoặc trang phục hở vai khi đi lễ chùa, đền',
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
    doChacChan: 'thuc_hanh_hien_nay',
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
    ten: 'Khăn vấn, khăn đóng phối cùng áo bà ba',
    dieuKien: 'Khăn vấn hoặc khăn đóng, vốn đi với lễ phục, đội cùng áo bà ba thường phục Nam Bộ',
    kiemTra: (look: LookState): boolean => {
      const isBaBa = look.thuongY?.id === 'G09';
      const isKhanLePhuc = look.thuPhuc?.id === 'G12' || look.thuPhuc?.id === 'G13';
      return Boolean(isBaBa && isKhanLePhuc);
    },
    mucDo: 'vang',
    thongDiep: 'Áo bà ba là thường phục Nam Bộ, đi cùng khăn rằn hoặc để đầu trần; khăn vấn, khăn đóng thuộc lễ phục. Đặt chung dễ lệch cả vùng miền lẫn tầng nghi lễ.',
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
    dieuKien: 'Nón quai thao Bắc Bộ được chọn khi vùng là Nam Bộ hoặc Trung Bộ',
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
    dieuKien: 'Váy đụp dân gian đi cùng áo dài tân thời',
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
    dieuKien: 'Áo tứ thân dân gian đi cùng hoa văn hoàng gia như phượng hoặc rồng',
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
    dieuKien: 'Áo giao lĩnh đi cùng giày thể thao hoặc phụ kiện hiện đại, ngoài bối cảnh dạo phố và biểu diễn',
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
    dieuKien: 'Giày thể thao hiện đại đi cùng áo tấc trong lễ giỗ, lễ gia tiên',
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
    ten: 'Áo tấc trong thời tiết nắng nóng trên 32°C',
    dieuKien: 'Áo tấc mặc khi nhiệt độ bạn nhập ở bước bối cảnh vượt quá 32°C',
    kiemTra: (look: LookState): boolean => {
      const isAoTac = look.thuongY?.id === 'G05';
      const isHot = (look.nhietDo ?? 25) > 32;
      return Boolean(isAoTac && isHot);
    },
    mucDo: 'vang',
    thongDiep: 'Áo tấc thân dài, tay thụng rộng, may bằng gấm thì càng dày, dễ gây ngột ngạt khi ở ngoài trời nắng nóng. Đây là lưu ý tiện dụng cho người mặc.',
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
    ten: 'Đầu trần khi đứng trong nghi lễ',
    dieuKien: 'Mặc áo lễ (giao lĩnh, viên lĩnh, ngũ thân, áo tấc, Nhật Bình) mà để đầu trần khi bạn là người đứng trong nghi lễ: chủ lễ, con cháu dự giỗ, gia chủ đón Tết, người nhà hai họ, đội bê tráp, người biểu diễn',
    kiemTra: (look: LookState, boiCanh?: EventContext): boolean => {
      // Khách cưới, người đi chùa, người mặc áo dài tân thời để đầu trần là bình thường; chỉ người
      // đứng trong nghi lễ mặc áo lễ mới cần khăn đi cùng bộ.
      const AO_LE = ['G01', 'G02', 'G04', 'G05', 'G06'];
      const VAI_TRONG_LE = ['chu_le', 'con_chau', 'chu_nha', 'nguoi_nha', 'be_trap', 'bieu_dien'];
      if (look.thuPhuc || !look.thuongY || !AO_LE.includes(look.thuongY.id)) return false;
      if (boiCanh?.vaiTro) return VAI_TRONG_LE.includes(boiCanh.vaiTro);
      // Bối cảnh không kèm vai (trang giới thiệu): dùng mức trang trọng của dịp
      return (boiCanh?.mucTrangTrongYeuCau ?? 0) >= 4;
    },
    mucDo: 'vang',
    thongDiep: 'Với người đứng trong nghi lễ, áo lễ thường đi cùng khăn vấn hoặc khăn đóng; để đầu trần làm bộ lễ phục thiếu phần đầu. Khách dự và người đi lễ thì không cần đội.',
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
    doChacChan: 'thuc_hanh_hien_nay',
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
    ten: 'Nhắc chỉnh cổ áo, vạt áo khi hành lễ',
    dieuKien: 'Lời nhắc khi mặc áo giao lĩnh hoặc ngũ thân đi lễ chùa, lễ gia tiên. App không nhìn được cổ áo thật nên đây chỉ là lời nhắc, không phải phát hiện lỗi',
    kiemTra: (look: LookState, boiCanh?: EventContext): boolean => {
      const isSolemn = boiCanh?.id === 'E04' || boiCanh?.id === 'E05';
      const isTradTop = look.thuongY?.id === 'G01' || look.thuongY?.id === 'G04';
      return Boolean(isSolemn && isTradTop);
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
    doChacChan: 'thuc_hanh_hien_nay',
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
  {
    // Bịt khoảng trống: trước đây chỉ Nhật Bình có luật về lễ phục mặc vào dịp thường ngày.
    // Dữ liệu garments.ts đã ghi áo tấc và áo viên lĩnh không dùng cho sinh hoạt thường ngày.
    id: 'CR-21',
    ten: 'Lễ phục mặc vào dịp thường ngày',
    dieuKien: 'Áo lễ phục như áo tấc, áo viên lĩnh mặc vào dịp đời thường như cà phê, dạo phố',
    kiemTra: (look: LookState, boiCanh?: EventContext): boolean => {
      const ao = look.thuongY;
      if (!ao || !boiCanh) return false;
      // Nhật Bình đã có luật riêng CR-01
      if (ao.id === 'G06') return false;
      return ao.mucTrangTrong - boiCanh.mucTrangTrongYeuCau >= 3;
    },
    mucDo: 'vang',
    thongDiep: 'Đây là áo lễ phục, dữ liệu hiện vật ghi không dùng cho sinh hoạt thường ngày. Mặc vào dịp đời thường dễ làm bộ đồ nặng nề và mờ đi ý nghĩa nghi lễ của chiếc áo.',
    cachSua: [
      {
        moTa: 'Đổi sang áo ngũ thân tay chẽn thanh thoát',
        apDung: (look: LookState): LookState => {
          const nguThan = GARMENTS.find((g) => g.id === 'G04');
          return { ...look, thuongY: nguThan || look.thuongY };
        },
      },
      {
        moTa: 'Đổi sang áo dài tân thời, hợp dạo phố và chụp ảnh',
        apDung: (look: LookState): LookState => {
          const aoDai = GARMENTS.find((g) => g.id === 'G08');
          return { ...look, thuongY: aoDai || look.thuongY };
        },
      },
    ],
    sourceIds: ['S01'],
    doChacChan: 'thuc_hanh_hien_nay',
    phanLoaiLoi: 'nghi_le',
    apDung: (look: LookState): LookState => {
      const nguThan = GARMENTS.find((g) => g.id === 'G04');
      return { ...look, thuongY: nguThan || look.thuongY };
    },
    viDu: {
      thuongY: GARMENTS.find((g) => g.id === 'G05') || null,
      haY: GARMENTS.find((g) => g.id === 'G10') || null,
      thuPhuc: GARMENTS.find((g) => g.id === 'G13') || null,
      hai: GARMENTS.find((g) => g.id === 'G15') || null,
      phuKien: [],
      hoaVan: null,
      mauChinh: '#16243A',
    },
  },
];
