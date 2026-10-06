import { Motif } from '../types';

// moTaHinhAnh và viTri là quy ước app dùng để dựng hoa văn trong ảnh cho thấy được ở khoảng cách toàn thân,
// không phải khẳng định về cách hoa văn được dùng trong lịch sử.

export const MOTIFS: Motif[] = [
  {
    id: 'M01',
    moTaHinhAnh: 'round longevity (tho) character medallions about the size of a palm, spaced evenly across the body and sleeves',
    viTri: 'Rải đều thân và tay áo',
    ten: 'Chữ Thọ',
    yNghia: 'Mong sống lâu',
    tangLop: 'dan_gian',
    canThan: false,
    mucDo: 'binh_thuong'
  },
  {
    id: 'M02',
    moTaHinhAnh: 'stylised auspicious cloud scrolls about the size of a palm, scattered across the body and sleeves',
    viTri: 'Rải đều thân và tay áo',
    ten: 'Mây hoá',
    yNghia: 'Chuyển hoá, cát tường',
    tangLop: 'dan_gian',
    canThan: false,
    mucDo: 'binh_thuong'
  },
  {
    id: 'M03',
    moTaHinhAnh: 'a wide band of stylised layered waves along the bottom hem of the robe and at the sleeve ends',
    viTri: 'Dải sóng ở gấu áo và cổ tay',
    ten: 'Thuỷ ba (sóng nước)',
    yNghia: 'Nền tảng, liên tục',
    tangLop: 'dan_gian',
    canThan: false,
    mucDo: 'binh_thuong'
  },
  {
    id: 'M04',
    moTaHinhAnh: 'a continuous interlocking key-fret border along the collar edge, the front opening, the sleeve ends and the hem',
    viTri: 'Đường viền cổ, nẹp, cổ tay, gấu áo',
    ten: 'Hồi văn chữ vạn',
    yNghia: 'Nối dài không dứt',
    tangLop: 'dan_gian',
    canThan: false,
    mucDo: 'binh_thuong'
  },
  {
    id: 'M05',
    moTaHinhAnh: 'lotus flowers with leaves about the size of a palm, scattered sparsely across the body',
    viTri: 'Rải thưa thân áo',
    ten: 'Sen',
    yNghia: 'Thanh sạch',
    tangLop: 'dan_gian',
    canThan: false,
    mucDo: 'binh_thuong'
  },
  {
    id: 'M06',
    moTaHinhAnh: 'sprigs of plum blossom, orchid, chrysanthemum and bamboo about the size of a palm, scattered sparsely across the body',
    viTri: 'Rải thưa thân áo',
    ten: 'Tứ quý (mai lan cúc trúc)',
    yNghia: 'Bốn mùa, phẩm chất người quân tử',
    tangLop: 'dan_gian',
    canThan: false,
    mucDo: 'binh_thuong'
  },
  {
    id: 'M07',
    moTaHinhAnh: 'a large phoenix roundel on the chest and on the back',
    viTri: 'Hình tròn lớn ở ngực và lưng',
    sourceIds: ['S01', 'S03'],
    ten: 'Phượng',
    yNghia: 'Gắn với hoàng hậu và mệnh phụ trong quy chế triều Nguyễn',
    tangLop: 'hoang_gia',
    canThan: true,
    mucDo: 'vang'
  },
  {
    id: 'M08',
    moTaHinhAnh: 'a large dragon roundel on the chest and on the back',
    viTri: 'Hình tròn lớn ở ngực và lưng',
    sourceIds: ['S01', 'S03'],
    ten: 'Rồng năm móng',
    yNghia: 'Gắn riêng với hoàng đế',
    tangLop: 'hoang_gia',
    canThan: true,
    mucDo: 'do'
  }
];
