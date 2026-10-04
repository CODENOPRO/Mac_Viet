import { Region } from '../types';

export interface IslandTerritory {
  id: 'HOANG_SA' | 'TRUONG_SA';
  ten: string;
  donViHanhChinh: string;
  phanVungVanHoa: string;
  moTa: string;
  ghiChuPhanVung: string;
}

export const ISLAND_TERRITORIES: Record<'HOANG_SA' | 'TRUONG_SA', IslandTerritory> = {
  HOANG_SA: {
    id: 'HOANG_SA',
    ten: 'Quần đảo Hoàng Sa',
    donViHanhChinh: 'Thuộc thành phố Đà Nẵng',
    phanVungVanHoa: 'Duyên hải Trung Bộ',
    moTa: 'Quần đảo Hoàng Sa là phần lãnh thổ thiêng liêng không thể tách rời của Tổ quốc Việt Nam, được xác lập và thực thi chủ quyền liên tục, hòa bình từ thời các chúa Nguyễn đến triều Nguyễn qua các đội dân binh Hoàng Sa kiêm quản Trường Sa.',
    ghiChuPhanVung: 'Trong ứng dụng Mặc Việt, Hoàng Sa gắn liền với không gian duyên hải Trung Bộ. Ứng dụng chia bốn vùng theo đặc trưng trang phục và điều kiện địa lý, không phải theo đơn vị hành chính.',
  },
  TRUONG_SA: {
    id: 'TRUONG_SA',
    ten: 'Quần đảo Trường Sa',
    donViHanhChinh: 'Thuộc tỉnh Khánh Hoà',
    phanVungVanHoa: 'Duyên hải Nam Trung Bộ',
    moTa: 'Quần đảo Trường Sa là phần lãnh thổ thiêng liêng không thể tách rời của Tổ quốc Việt Nam. Nơi đây lưu giữ dấu tích cha ông vượt sóng gió cắm mốc chủ quyền, gắn chặt với đời sống của cư dân duyên hải miền Trung.',
    ghiChuPhanVung: 'Trong ứng dụng Mặc Việt, Trường Sa gắn liền với không gian duyên hải Nam Trung Bộ. Ứng dụng chia bốn vùng theo đặc trưng trang phục và điều kiện địa lý, không phải theo đơn vị hành chính.',
  },
};

export const REGIONS: Region[] = [
  {
    id: 'R01',
    ten: 'Bắc Bộ',
    khongGianVanHoa: 'Đồng bằng và trung du sông Hồng, vùng Kinh Bắc',
    dacTrung: 'Tông trầm, nâu non và the đen làm nền, điểm màu bằng yếm và dải thắt lưng.',
    trangPhucTieuBieu: ['áo tứ thân', 'yếm', 'váy đụp', 'nón quai thao', 'khăn mỏ quạ'],
    chatLieu: ['the', 'đũi', 'vải nâu', 'lụa Vạn Phúc'],
    bangMau: ['#6E5439', '#2C2A26', '#C9556A', '#F2EDE3'],
    ghiChuTonTrong: 'Đặc trưng tông trầm mộc mạc của đồng bằng sông Hồng, tôn trọng sự kín đáo nền nã của phụ nữ Kinh Bắc.'
  },
  {
    id: 'R02',
    ten: 'Trung Bộ, trọng tâm Huế',
    khongGianVanHoa: 'Dải ven biển miền Trung, trọng tâm cố đô Huế',
    dacTrung: 'Ảnh hưởng đậm của quy chế triều Nguyễn, màu tím Huế và các sắc trầm sang.',
    trangPhucTieuBieu: ['áo ngũ thân', 'áo tấc', 'áo Nhật Bình', 'mấn'],
    chatLieu: ['lụa', 'gấm', 'đoạn', 'sa'],
    bangMau: ['#5E3B5A', '#16243A', '#C39A27', '#F2EDE3'],
    ghiChuTonTrong: 'Đây là vùng có nhiều trang phục thuộc tầng nghi lễ cung đình, cần thận trọng nhất khi remix.'
  },
  {
    id: 'R03',
    ten: 'Nam Bộ',
    khongGianVanHoa: 'Đồng bằng sông Cửu Long và miền Đông',
    dacTrung: 'Gọn, mát, thực dụng, ít lớp.',
    trangPhucTieuBieu: ['áo bà ba', 'khăn rằn', 'quần lụa đen'],
    chatLieu: ['lụa', 'satin', 'vải bông'],
    bangMau: ['#F2EDE3', '#2C2A26', '#3F6B5A'],
    ghiChuTonTrong: 'Tôn trọng vẻ đẹp bình dị, khỏe khoắn và phóng khoáng của người dân sông nước phương Nam.'
  },
  {
    id: 'R04',
    ten: 'Tây Bắc',
    khongGianVanHoa: 'Vùng núi cao phía tây bắc, nơi cư trú của nhiều tộc người',
    dacTrung: 'Thổ cẩm dệt tay, hoa văn hình học mang ý nghĩa riêng của từng tộc người.',
    trangPhucTieuBieu: ['áo cóm', 'khăn piêu', 'váy xỉn thổ cẩm', 'cúc bướm'],
    chatLieu: ['thổ cẩm dệt tay', 'vải chàm nhuộm', 'bạc chế tác'],
    bangMau: ['#16243A', '#A8322A', '#C39A27', '#3F6B5A'],
    ghiChuTonTrong: 'Trang phục các dân tộc thiểu số luôn được trình bày như một chỉnh thể gắn với chủ thể văn hoá cụ thể. App không cho phép tách một món ra khỏi bộ để làm phụ kiện điểm nhấn, và không gộp chung nhiều tộc người thành một nhãn "Tây Bắc" trong phần mô tả chi tiết.'
  }
];
