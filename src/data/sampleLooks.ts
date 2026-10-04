import { LookCardData } from '../types';
import { GARMENTS } from './garments';

// Ba bộ mẫu tham khảo chuẩn mực theo bối cảnh truyền thống
// Dữ liệu tĩnh chỉ đọc, tuyệt đối không lưu vào localStorage
export const SAMPLE_LOOKS: LookCardData[] = [
  {
    id: 'look-sample-01',
    ten: 'Việt Phục Ngũ Thân Du Xuân',
    ngayTao: '', // Không hiển thị ngày ở thẻ mẫu
    eventContextId: 'E01',
    look: {
      thuongY: GARMENTS.find((g) => g.id === 'G04') || null,
      haY: GARMENTS.find((g) => g.id === 'G10') || null,
      thuPhuc: GARMENTS.find((g) => g.id === 'G12') || null,
      hai: GARMENTS.find((g) => g.id === 'G15') || null,
      phuKien: [],
      hoaVan: null,
      mauChinh: '#16243A',
    },
    ghiChu: 'Phối màu Chàm chuẩn mực du xuân Tết nguyên đán, kín đáo và đĩnh đạc.',
  },
  {
    id: 'look-sample-02',
    ten: 'Giao Lĩnh Kinh Bắc Trẩy Hội',
    ngayTao: '', // Không hiển thị ngày ở thẻ mẫu
    eventContextId: 'E01',
    look: {
      thuongY: GARMENTS.find((g) => g.id === 'G01') || null,
      haY: GARMENTS.find((g) => g.id === 'G10') || null,
      thuPhuc: GARMENTS.find((g) => g.id === 'G12') || null,
      hai: GARMENTS.find((g) => g.id === 'G15') || null,
      phuKien: [],
      hoaVan: null,
      mauChinh: '#3F6B5A',
    },
    ghiChu: 'Giao lĩnh dáng thụng cổ kính sắc xanh lục trẩy hội mùa xuân đất Kinh Bắc.',
  },
  {
    id: 'look-sample-03',
    ten: 'Áo Tấc Lễ Nghi Gia Tiên',
    ngayTao: '', // Không hiển thị ngày ở thẻ mẫu
    eventContextId: 'E04',
    look: {
      thuongY: GARMENTS.find((g) => g.id === 'G05') || null,
      haY: GARMENTS.find((g) => g.id === 'G10') || null,
      thuPhuc: GARMENTS.find((g) => g.id === 'G12') || null,
      hai: GARMENTS.find((g) => g.id === 'G15') || null,
      phuKien: [],
      hoaVan: null,
      mauChinh: '#A8322A',
    },
    ghiChu: 'Áo tấc tay thụng sắc điều trang trọng trong nghi lễ cúng bái tổ tiên và hiếu hỷ.',
  },
];
