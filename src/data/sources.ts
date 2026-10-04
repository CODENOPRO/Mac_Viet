import { Source } from '../types';

// Mỗi nguồn có khối kiemChung: cách người xem tự kiểm, các liên kết đã mở thử được,
// và cần đối chiếu điều gì. Nguồn chưa có bản công bố thì nói thẳng, không gắn liên kết giả.
// Ngày kiểm tra liên kết gần nhất: xem NGAY_KIEM_TRA_LIEN_KET.
export const NGAY_KIEM_TRA_LIEN_KET = '04/10/2026';

export const SOURCES: Source[] = [
  {
    id: 'S01',
    ten: 'Ngàn năm áo mũ',
    tenNgan: 'Ngàn năm áo mũ',
    tacGia: 'Trần Quang Đức, Nhã Nam và Nhà xuất bản Thế giới',
    nam: 2013,
    loai: 'sach',
    ghiChu: 'Nguồn xương sống cho trang phục từ Lý tới Nguyễn',
    url: 'https://vi.wikipedia.org/wiki/Ng%C3%A0n_n%C4%83m_%C3%A1o_m%C5%A9',
    loaiTruyCap: 'tu_lieu_in',
    ghiChuTruyCap: 'Sách in, phát hành ngày 29/5/2013.',
    kiemChung: {
      cach: 'tra_cuu_sach',
      lienKet: [
        { nhan: 'Trang giới thiệu sách, Wikipedia tiếng Việt', url: 'https://vi.wikipedia.org/wiki/Ng%C3%A0n_n%C4%83m_%C3%A1o_m%C5%A9' },
      ],
      huongDan:
        'Sách in, có bán và có ở thư viện. Trang giới thiệu xác nhận tác giả, nhà xuất bản và phạm vi khảo cứu từ thời Lý tới thời Nguyễn. Nội dung chi tiết cần đối chiếu trực tiếp trên sách.',
    },
  },
  {
    id: 'S02',
    ten: 'Đại Nam thực lục',
    tenNgan: 'Đại Nam thực lục',
    tacGia: 'Quốc sử quán triều Nguyễn',
    nam: 'thế kỷ 19',
    loai: 'tu_lieu',
    ghiChu: 'Các chỉ dụ về y phục, trong đó có mốc 1744',
    url: 'https://vi.wikipedia.org/wiki/%C4%90%E1%BA%A1i_Nam_th%E1%BB%B1c_l%E1%BB%A5c',
    loaiTruyCap: 'truc_tuyen',
    ghiChuTruyCap: 'Bộ chính sử triều Nguyễn, phần đầu là Tiền biên 12 quyển.',
    kiemChung: {
      cach: 'tra_cuu_sach',
      lienKet: [
        { nhan: 'Trang giới thiệu bộ sử, Wikipedia tiếng Việt', url: 'https://vi.wikipedia.org/wiki/%C4%90%E1%BA%A1i_Nam_th%E1%BB%B1c_l%E1%BB%A5c' },
      ],
      huongDan:
        'Trang giới thiệu xác nhận bộ sử và cấu trúc Tiền biên, Chính biên. Mốc 1744 thuộc phần Tiền biên, chép thời chúa Nguyễn Phúc Khoát. Muốn đọc nguyên văn, tra bản dịch in của Viện Sử học.',
    },
  },
  {
    id: 'S03',
    ten: 'Khâm định Đại Nam hội điển sự lệ',
    tenNgan: 'Hội điển triều Nguyễn',
    tacGia: 'Nội các triều Nguyễn',
    nam: 'thế kỷ 19',
    loai: 'tu_lieu',
    ghiChu: 'Quy chế phẩm phục theo thứ bậc',
    url: 'https://vi.wikipedia.org/wiki/Kh%C3%A2m_%C4%91%E1%BB%8Bnh_%C4%90%E1%BA%A1i_Nam_h%E1%BB%99i_%C4%91i%E1%BB%83n_s%E1%BB%B1_l%E1%BB%87',
    loaiTruyCap: 'truc_tuyen',
    ghiChuTruyCap: 'Bộ điển lệ chép quy chế triều Nguyễn.',
    kiemChung: {
      cach: 'tra_cuu_sach',
      lienKet: [
        {
          nhan: 'Trang giới thiệu bộ điển lệ, Wikipedia tiếng Việt',
          url: 'https://vi.wikipedia.org/wiki/Kh%C3%A2m_%C4%91%E1%BB%8Bnh_%C4%90%E1%BA%A1i_Nam_h%E1%BB%99i_%C4%91i%E1%BB%83n_s%E1%BB%B1_l%E1%BB%87',
        },
      ],
      huongDan:
        'Trang giới thiệu xác nhận bộ điển lệ và phạm vi chép quy chế. Quy định phẩm phục cụ thể nằm trong các quyển về lễ bộ, cần tra bản dịch in.',
    },
  },
  {
    id: 'S04',
    ten: 'Bộ sưu tập trang phục cung đình Nguyễn',
    tenNgan: 'Bảo tàng Cổ vật Cung đình Huế',
    tacGia: 'Bảo tàng Cổ vật Cung đình Huế, Trung tâm Bảo tồn Di tích Cố đô Huế',
    nam: 'Thành lập 1923, bảo tồn liên tục',
    loai: 'bao_tang',
    ghiChu: 'Hiện vật trang phục cung đình triều Nguyễn',
    url: 'https://hueworldheritage.org.vn/',
    loaiTruyCap: 'hien_vat_bao_tang',
    ghiChuTruyCap: 'Trưng bày tại số 3 Lê Trực, Huế.',
    kiemChung: {
      cach: 'xem_hien_vat',
      lienKet: [
        { nhan: 'Trung tâm Bảo tồn Di tích Cố đô Huế, trang chính thức', url: 'https://hueworldheritage.org.vn/' },
        {
          nhan: 'Báo Văn hoá: bảo tàng tiếp nhận và trưng bày áo của Đức Từ Cung',
          url: 'https://baovanhoa.vn/van-hoa/hue-tiep-nhan-2-chiec-ao-cua-hoang-thai-hau-cuoi-cung-trieu-nguyen-135766.html',
        },
      ],
      huongDan:
        'Hiện vật xem trực tiếp tại bảo tàng, số 3 Lê Trực, Huế. Bài báo xác nhận bảo tàng đang lưu giữ và trưng bày trang phục triều Nguyễn. Trang chính thức có thể yêu cầu xác minh trình duyệt trước khi mở.',
    },
  },
  {
    id: 'S05',
    ten: 'Bộ sưu tập trang phục dân gian Bắc Bộ',
    tenNgan: 'Bảo tàng Dân tộc học',
    tacGia: 'Bảo tàng Dân tộc học Việt Nam',
    nam: 'Bảo tồn liên tục',
    loai: 'bao_tang',
    ghiChu: 'Áo tứ thân, yếm, váy đụp, nón quai thao',
    url: 'https://commons.wikimedia.org/wiki/File:Woman%27s_garment,_traditional_Viet_-_Vietnam_Museum_of_Ethnology_-_Hanoi,_Vietnam_-_DSC02552.JPG',
    loaiTruyCap: 'hien_vat_bao_tang',
    ghiChuTruyCap: 'Trưng bày tại đường Nguyễn Văn Huyên, Hà Nội.',
    kiemChung: {
      cach: 'xem_hien_vat',
      lienKet: [
        {
          nhan: 'Ảnh hiện vật áo tứ thân tại bảo tàng, Wikimedia Commons',
          url: 'https://commons.wikimedia.org/wiki/File:Woman%27s_garment,_traditional_Viet_-_Vietnam_Museum_of_Ethnology_-_Hanoi,_Vietnam_-_DSC02552.JPG',
        },
        { nhan: 'Bảo tàng Dân tộc học Việt Nam, trang chính thức', url: 'https://www.vme.org.vn/' },
      ],
      huongDan:
        'Ảnh trên Commons chụp hiện vật thật tại bảo tàng, kèm thông tin nơi chụp. Đây cũng là ảnh dùng ở tiền sảnh của app. Trang chính thức có thể yêu cầu xác minh trình duyệt trước khi mở.',
    },
  },
  {
    id: 'S06',
    ten: 'Hiện vật lịch sử tại Bảo tàng Lịch sử Quốc gia',
    tenNgan: 'Bảo tàng Lịch sử Quốc gia',
    tacGia: 'Bảo tàng Lịch sử Quốc gia',
    nam: 'Bảo tồn liên tục',
    loai: 'bao_tang',
    ghiChu: 'Hiện vật lịch sử Việt Nam từ thời tiền sử tới hết thời Nguyễn',
    url: 'https://baotanglichsu.vn/vi/Articles/3151/gioi-thieu-chung',
    loaiTruyCap: 'hien_vat_bao_tang',
    ghiChuTruyCap: 'Trưng bày tại số 1 Tràng Tiền, Hà Nội.',
    kiemChung: {
      cach: 'xem_hien_vat',
      lienKet: [
        { nhan: 'Giới thiệu chung, trang chính thức của bảo tàng', url: 'https://baotanglichsu.vn/vi/Articles/3151/gioi-thieu-chung' },
      ],
      huongDan:
        'Trang chính thức giới thiệu hệ thống trưng bày theo từng thời kỳ. Hiện vật cụ thể cần xem trực tiếp tại số 1 Tràng Tiền.',
    },
  },
  {
    id: 'S07',
    ten: 'Báo Phong Hoá số 90, mẫu áo Lemur của Cát Tường',
    tenNgan: 'Báo Phong Hoá, 1934',
    tacGia: 'Báo Phong Hoá, bài của hoạ sĩ Cát Tường',
    nam: '23/3/1934',
    loai: 'tu_lieu',
    ghiChu: 'Mốc cải cách áo dài đầu thế kỷ 20 mở đường cho áo dài tân thời',
    url: 'https://repository.vnu.edu.vn/handle/VNU_123/21135',
    loaiTruyCap: 'truc_tuyen',
    ghiChuTruyCap: 'Bản số hoá lưu tại kho tư liệu Đại học Quốc gia Hà Nội.',
    kiemChung: {
      cach: 'mo_truc_tuyen',
      lienKet: [
        { nhan: 'Bản số hoá số báo ra ngày 23/3/1934, Đại học Quốc gia Hà Nội', url: 'https://repository.vnu.edu.vn/handle/VNU_123/21135' },
        { nhan: 'Mục Áo dài trên Wikipedia tiếng Việt, đoạn về áo Lemur', url: 'https://vi.wikipedia.org/wiki/%C3%81o_d%C3%A0i' },
      ],
      huongDan:
        'Mở bản số hoá để xem nguyên trang báo. Mục Áo dài dẫn sách của Phạm Thảo Nguyên (2019) xác nhận mẫu áo Lemur đầu tiên đăng trên Phong Hoá số 90, ngày 23/3/1934.',
    },
  },
  {
    id: 'S08',
    ten: 'Nghề dệt lụa Vạn Phúc',
    tenNgan: 'Lụa Vạn Phúc',
    tacGia: 'Làng lụa Vạn Phúc, Hà Đông, Hà Nội',
    nam: 'Di sản văn hoá phi vật thể quốc gia, 2023',
    loai: 'tu_lieu',
    ghiChu: 'Chất liệu lụa Bắc Bộ',
    url: 'https://vi.wikipedia.org/wiki/L%C3%A0ng_l%E1%BB%A5a_V%E1%BA%A1n_Ph%C3%BAc',
    loaiTruyCap: 'truc_tuyen',
    ghiChuTruyCap: 'Làng nghề tại phường Vạn Phúc, Hà Đông.',
    kiemChung: {
      cach: 'mo_truc_tuyen',
      lienKet: [
        { nhan: 'Làng lụa Vạn Phúc, Wikipedia tiếng Việt', url: 'https://vi.wikipedia.org/wiki/L%C3%A0ng_l%E1%BB%A5a_V%E1%BA%A1n_Ph%C3%BAc' },
        {
          nhan: 'Báo Dân tộc và Phát triển: Vạn Phúc nhận bằng di sản phi vật thể quốc gia',
          url: 'https://dantocphattrien.vietnamnet.vn/lang-lua-van-phuc-ha-dong-nhan-bang-di-san-van-hoa-phi-vat-the-quoc-gia-1698385989084.htm',
        },
      ],
      huongDan:
        'Trang Wikipedia giới thiệu lịch sử làng nghề. Bài báo tháng 10/2023 xác nhận nghề dệt lụa Vạn Phúc nhận bằng Di sản văn hoá phi vật thể quốc gia.',
    },
  },
  {
    id: 'S09',
    ten: 'Áo bà ba và lụa Nam Bộ',
    tenNgan: 'Áo bà ba, Bảo tàng Phụ nữ',
    tacGia: 'Bảo tàng Phụ nữ Việt Nam; làng lụa Tân Châu, An Giang',
    nam: 'Hiện vật năm 1968; lụa truyền thống',
    loai: 'bao_tang',
    ghiChu: 'Áo bà ba Bến Tre năm 1968 làm hiện vật đối chiếu, lụa lãnh Mỹ A làm chất liệu Nam Bộ',
    url: 'https://commons.wikimedia.org/wiki/File:Costume_Ba_ba,_Viet,_Ben_Tre,_1968,_industrial_fabric_-_Vietnamese_Women%27s_Museum_-_Hanoi,_Vietnam_-_DSC04104.JPG',
    loaiTruyCap: 'hien_vat_bao_tang',
    ghiChuTruyCap: 'Hiện vật trưng bày tại số 36 Lý Thường Kiệt, Hà Nội.',
    kiemChung: {
      cach: 'xem_hien_vat',
      lienKet: [
        {
          nhan: 'Ảnh hiện vật áo bà ba Bến Tre 1968, Wikimedia Commons',
          url: 'https://commons.wikimedia.org/wiki/File:Costume_Ba_ba,_Viet,_Ben_Tre,_1968,_industrial_fabric_-_Vietnamese_Women%27s_Museum_-_Hanoi,_Vietnam_-_DSC04104.JPG',
        },
        { nhan: 'Bảo tàng Phụ nữ Việt Nam, trang chính thức', url: 'https://baotangphunu.org.vn/' },
        { nhan: 'Lãnh Mỹ A, Wikipedia tiếng Việt', url: 'https://vi.wikipedia.org/wiki/L%C3%A3nh_M%E1%BB%B9_A' },
      ],
      huongDan:
        'Ảnh trên Commons chụp hiện vật thật tại Bảo tàng Phụ nữ Việt Nam, ghi rõ áo bà ba Bến Tre năm 1968. Trang Lãnh Mỹ A giới thiệu loại lụa truyền thống của Tân Châu, An Giang.',
    },
  },
  {
    id: 'S10',
    ten: 'Thực hành của cộng đồng phục dựng hiện nay',
    tenNgan: 'Thực hành cộng đồng hiện nay',
    tacGia: 'Các nhóm phục dựng cổ phục',
    nam: 'Từ khoảng 2014 tới nay',
    loai: 'cong_dong',
    ghiChu: 'Cách cộng đồng phục dựng đang mặc hiện nay, không phải sử liệu',
    url: null,
    loaiTruyCap: 'chua_cong_bo',
    ghiChuTruyCap: 'Chưa có tư liệu công bố để tra cứu.',
    kiemChung: {
      cach: 'chua_cong_bo',
      lienKet: [],
      huongDan:
        'Đây là quan sát về cách cộng đồng phục dựng đang mặc, không phải tư liệu có thể tra cứu. Luật chỉ dựa vào nguồn này được xếp ở mức thực hành hiện nay và chỉ mang tính gợi ý.',
    },
  },
  {
    id: 'S11',
    ten: 'Trang phục cổ truyền các dân tộc Việt Nam',
    tenNgan: 'Ngô Đức Thịnh, Trang phục cổ truyền',
    tacGia: 'Ngô Đức Thịnh, Nhà xuất bản Văn hoá Dân tộc',
    nam: 1994,
    loai: 'sach',
    ghiChu: 'Trang phục riêng của từng tộc người, có chương riêng về người Thái, Dao, Mông. Dùng cho phần Tây Bắc và luật CR-17 tới CR-19',
    url: 'https://daklakmuseum.vn/nghien-cuu/bai-viet/gioi-thieu-sach-trang-phuc-co-truyen-cac-dan-toc-viet-nam',
    loaiTruyCap: 'tu_lieu_in',
    ghiChuTruyCap: 'Sách in, 251 trang.',
    kiemChung: {
      cach: 'tra_cuu_sach',
      lienKet: [
        {
          nhan: 'Bảo tàng Đắk Lắk giới thiệu sách, có mục lục từng chương',
          url: 'https://daklakmuseum.vn/nghien-cuu/bai-viet/gioi-thieu-sach-trang-phuc-co-truyen-cac-dan-toc-viet-nam',
        },
        { nhan: 'Tác giả Ngô Đức Thịnh, Wikipedia tiếng Việt', url: 'https://vi.wikipedia.org/wiki/Ng%C3%B4_%C4%90%E1%BB%A9c_Th%E1%BB%8Bnh' },
      ],
      huongDan:
        'Sách in, có ở thư viện. Bài giới thiệu của Bảo tàng Đắk Lắk liệt kê các chương về trang phục từng tộc người. Trang tác giả ghi bản in năm 1994, bài giới thiệu ghi bản năm 2000.',
    },
  },
  {
    id: 'S12',
    ten: 'Ghi chép điền dã của đội Mặc Việt, 2026',
    tenNgan: 'Ghi chép điền dã của đội',
    tacGia: 'Đội Mặc Việt',
    nam: 2026,
    loai: 'cong_dong',
    ghiChu: 'Tư liệu gốc do đội thực hiện',
    url: null,
    loaiTruyCap: 'chua_cong_bo',
    ghiChuTruyCap: 'Chưa công bố.',
    kiemChung: {
      cach: 'chua_cong_bo',
      lienKet: [],
      huongDan:
        'Ghi chép của đội chưa được công bố nên người xem chưa thể tự kiểm. Luật chỉ dựa vào nguồn này được xếp ở mức thực hành hiện nay và chỉ mang tính gợi ý.',
    },
  },
];
