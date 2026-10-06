import { Component, ErrorInfo, ReactNode } from 'react';

// Khung chống lỗi cho từng khu vực lớn: một màn gặp lỗi khi vẽ thì chỉ màn đó hiện thông báo,
// thanh điều hướng và các màn khác vẫn dùng được.

interface Props {
  tenKhuVuc: string;
  children: ReactNode;
}

interface State {
  coLoi: boolean;
}

export default class KhungChongLoi extends Component<Props, State> {
  state: State = { coLoi: false };

  static getDerivedStateFromError(): State {
    return { coLoi: true };
  }

  componentDidCatch(loi: Error, thongTin: ErrorInfo) {
    console.error(`[${this.props.tenKhuVuc}] gặp lỗi khi hiển thị:`, loi, thongTin.componentStack);
  }

  render() {
    if (!this.state.coLoi) return this.props.children;
    return (
      <div className="max-w-xl mx-auto my-16 p-6 border border-[#A8322A]/40 bg-[#FBF8F2] text-[#2C2A26]">
        <p className="font-display text-xl">{this.props.tenKhuVuc} đang gặp lỗi hiển thị.</p>
        <p className="font-sans text-sm text-[#6E5439] mt-2">
          Các phần khác của Mặc Việt vẫn dùng được. Bạn thử mở lại khu vực này.
        </p>
        <button
          type="button"
          onClick={() => this.setState({ coLoi: false })}
          className="mt-4 px-4 py-2 bg-[#A8322A] text-[#F2EDE3] font-mono text-xs uppercase tracking-wider cursor-pointer"
        >
          Mở lại
        </button>
      </div>
    );
  }
}
