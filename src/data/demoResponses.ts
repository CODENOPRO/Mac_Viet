export const DEMO_RESPONSES = {
  suggestOutfits: {
    phuongAn: [
      {
        ten: 'Việt Phục Du Xuân Đĩnh Đạc',
        lyDo: 'Áo ngũ thân tay chẽn màu chàm sẫm kết hợp quần lụa trắng và khăn vấn chuẩn mực, vừa trang nhã vừa thích hợp dạo xuân phố phường.',
        thuongY: 'G04',
        haY: 'G10',
        thuPhuc: 'G12',
        hai: 'G15',
        phuKien: [],
        mauChinh: '#16243A',
        mauPhu: '#F2EDE3',
        mucPhuHop: 98,
        sourceIds: ['S01', 'S03'],
      },
      {
        ten: 'Giao Lĩnh Kinh Bắc Hoài Niệm',
        lyDo: 'Áo giao lĩnh buông vạt thanh tú màu lục biếc, mang âm hưởng mỹ cảm Lý - Trần tĩnh tại và thanh cao.',
        thuongY: 'G01',
        haY: 'G10',
        thuPhuc: 'G12',
        hai: 'G15',
        phuKien: [],
        mauChinh: '#3F6B5A',
        mauPhu: '#F2EDE3',
        mucPhuHop: 92,
        sourceIds: ['S01', 'S05'],
      },
      {
        ten: 'Tân Thời Sắc Đào Thanh Lịch',
        lyDo: 'Áo dài tân thời màu yếm đào dịu dàng, tôn vinh vẻ duyên dáng đương đại của phụ nữ Việt trong các buổi gặp gỡ đầu năm.',
        thuongY: 'G08',
        haY: 'G10',
        thuPhuc: 'G12',
        hai: 'G15',
        phuKien: [],
        mauChinh: '#C9556A',
        mauPhu: '#F2EDE3',
        mucPhuHop: 89,
        sourceIds: ['S07', 'S10'],
      },
    ],
  },

  explainGarment: {
    cauChuyen:
      'Áo ngũ thân tay chẽn ra đời từ cuộc cải cách trang phục của chúa Nguyễn Phúc Khoát năm 1744 tại Đàng Trong, sau đó được vua Minh Mạng chuẩn hóa trên toàn quốc từ năm 1827. Thân áo cấu thành từ năm mảnh vải tượng trưng cho đạo lý ngũ thường: nhân, lễ, nghĩa, trí, tín; năm chiếc khuy gài tượng trưng cho ngũ luân. Thiết kế cổ đứng đoan trang và tay chẽn gọn gàng tạo nên phong thái đàng hoàng, khiêm nhường nhưng đầy đĩnh đạc của người Việt qua nhiều thế kỷ.',
    nienDaiNoiBat: '1744 (Đàng Trong) — 1827 (Toàn quốc triều Nguyễn)',
    aiTungMac: 'Quan lại, sĩ phu và thường dân trong các dịp lễ tiết, giao tế và sinh hoạt trang trọng.',
    yNghiaHoaVan: 'Áo ngũ thân thường để vải trơn hoặc dệt hoa văn chữ Thọ, hoa sen, mây hoá ẩn chìm thanh nhã.',
    sourceIds: ['S01', 'S02', 'S03'],
    doChacChan: 'da_xac_lap',
  },

  cultureCheck: {
    dienGiai: [
      {
        ruleId: 'CR-01',
        thongDiepDeHieu:
          'Áo Nhật Bình vốn là phẩm phục tôn nghiêm của hoàng hậu và phi tần triều Nguyễn, chỉ dùng trong đại lễ cung đình hoặc ngày hôn lễ trọng đại. Phối đi cà phê hàng ngày làm mờ nhạt đi tính linh thiêng của lễ phục.',
        boiCanhLichSu:
          'Quy chế Khâm định Đại Nam hội điển sự lệ quy định phẩm phục Nhật Bình thêu dải cổ ngũ hành nghiêm ngặt theo phẩm hàm cung thất.',
        sourceIds: ['S01', 'S03', 'S04'],
      },
    ],
    cachSuaThem: [
      {
        moTa: 'Chuyển sang áo tấc tay thụng trang trọng hoặc áo ngũ thân thanh lịch, giữ nguyên nét hoài cổ mà không vi phạm điển chế.',
        doUuTien: 1,
      },
    ],
  },

  askCuNghe: {
    traLoi:
      'Chào bạn trẻ. Tôi mừng khi thấy người trẻ ngày nay tìm về nếp áo ông cha. Về áo ngũ thân tay chẽn, bạn cứ nhớ cái cốt là năm thân ghép lại và năm cúc gài ngay ngắn. Áo này mặc vào người tự khắc đứng thẳng, đi đứng từ tốn. Mùa nóng thì người xưa mặc vải the mỏng mát rượi, mùa đông thì mặc gấm lót bông ấm áp. Chơi cổ phục cốt ở cái tâm kính trọng và biết mình đang mặc câu chuyện gì trên người, chứ không cốt ở chỗ khoe mẽ.',
    goiYBaoTang: [
      { id: 'G04', ten: 'Áo ngũ thân tay chẽn' },
      { id: 'G05', ten: 'Áo tấc' },
      { id: 'S01', ten: 'Sách Ngàn năm áo mũ (Trần Quang Đức)' },
    ],
  },

  nameAndCaption: {
    tenLook: 'Chàm Phố Đoan Trang',
    captionNgan: 'Gói trọn nét đĩnh đạc của tà ngũ thân giữa nhịp sống phố phường hiện đại.',
    captionDai:
      'Một sớm thong dong với tà áo ngũ thân màu chàm và quần ngà dệt lụa. Nếp cổ năm khuy cài kín nhắc nhở về sự tề chỉnh khiêm nhường, để mỗi bước chân xuống phố là một lời chào trang nhã gửi đến di sản ông cha.',
    hashtags: ['macviet', 'aonguthan', 'vietphuc', 'cotruyen', 'diendoantrang'],
  },
};
