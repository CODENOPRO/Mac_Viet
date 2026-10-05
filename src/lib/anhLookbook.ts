// Ảnh mặc thử của các bộ đã lưu vào Lookbook.
// Lưu trong IndexedDB theo id của bộ, không lưu vào localStorage vì mỗi ảnh nặng hàng trăm KB.
// Mọi lỗi đều được nuốt: thiếu ảnh thì Lookbook vẫn chạy, chỉ là không hiện lại ảnh.

const TEN_CSDL = 'macviet_lookbook_anh';
const KHO = 'anh';

function moCsdl(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('Trình duyệt không hỗ trợ IndexedDB'));
      return;
    }
    const yeuCau = indexedDB.open(TEN_CSDL, 1);
    yeuCau.onupgradeneeded = () => {
      const db = yeuCau.result;
      if (!db.objectStoreNames.contains(KHO)) db.createObjectStore(KHO);
    };
    yeuCau.onsuccess = () => resolve(yeuCau.result);
    yeuCau.onerror = () => reject(yeuCau.error);
  });
}

async function giaoDich<T>(cheDo: IDBTransactionMode, viec: (kho: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
  try {
    const db = await moCsdl();
    return await new Promise<T | null>((resolve) => {
      const tx = db.transaction(KHO, cheDo);
      const yeuCau = viec(tx.objectStore(KHO));
      yeuCau.onsuccess = () => resolve((yeuCau.result as T) ?? null);
      yeuCau.onerror = () => resolve(null);
      tx.oncomplete = () => db.close();
    });
  } catch {
    return null;
  }
}

export async function luuAnhLook(idLook: string, anh: string): Promise<boolean> {
  const kq = await giaoDich('readwrite', (kho) => kho.put(anh, idLook));
  return kq !== null;
}

export async function docAnhLook(idLook: string): Promise<string | null> {
  const kq = await giaoDich<string>('readonly', (kho) => kho.get(idLook));
  return typeof kq === 'string' ? kq : null;
}

export async function xoaAnhLook(idLook: string): Promise<void> {
  await giaoDich('readwrite', (kho) => kho.delete(idLook));
}
