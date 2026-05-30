import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { Plus, Trash2, Globe, FileText, Download, Pencil, Check, X, GripVertical } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface Product {
  id: string;
  name: string;
  price: number;
}

const translations = {
  th: {
    language: 'ภาษา',
    shopName: 'ชื่อร้าน',
    productName: 'ชื่อสินค้า',
    fullPrice: 'ราคา(บาท)',
    add: 'เพิ่มสินค้า',
    saveImage: 'บันทึกรูปภาพ',
    savePDF: 'บันทึกเป็นไฟล์ PDF',
    product: 'สินค้า',
    govPays: 'รัฐจ่าย',
    youPay: 'ลูกค้าจ่าย',
    capNote: '* รัฐช่วยจ่ายสูงสุด 200 บาท/วัน\n หรือ ราคาเต็ม 333 บาท/วัน',
    creatorText: 'สร้างโดย คนไทย เพื่อช่วยเหลือพ่อค้าแม่ค้าชาวไทย \nสนับสนุนผู้พัฒนาได้ผ่าน QR พร้อมเพย์ ',
    buyMeCoffee: 'สนับสนุนผู้พัฒนา',
    promptPay: 'QR พร้อมเพย์',
    noProducts: 'ยังไม่มีสินค้า',
    delete: 'ลบ',
    edit: 'แก้ไข',
    save: 'บันทึก',
    cancel: 'ยกเลิก',
    fontSize: 'ปรับขนาดตัวหนังสือ',
  },
  en: {
    language: 'Language',
    shopName: 'Shop Name',
    productName: 'Product Name',
    fullPrice: 'Price(Baht)',
    add: 'Add Product',
    saveImage: 'Save as Image',
    savePDF: 'Save as PDF',
    product: 'Product',
    govPays: 'Gov Pays',
    youPay: 'You Pay',
    capNote: '* Gov pays max 200 Baht/day\n or Full price 333 Baht/day',
    creatorText: 'Created by คนไทย to help Thai sellers',
    buyMeCoffee: 'Support Developer',
    promptPay: 'QR PromptPay',
    noProducts: 'No products added yet',
    delete: 'Delete',
    edit: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    fontSize: 'Font Size',
  }
};

export default function App() {
  const [lang, setLang] = useState<'th' | 'en'>('th');
  const [shopName, setShopName] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [fontSize, setFontSize] = useState(28);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [scale, setScale] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  // Edit & Drag-and-drop state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  
  const [showForceBrowserOverlay, setShowForceBrowserOverlay] = useState(false);
  const [showDownloadGuide, setShowDownloadGuide] = useState(false);

  const isInAppBrowser = () => {
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    return /FBAN|FBAV|Line|Instagram/i.test(ua);
  };

  const base64EncodeUnicode = (str: string) => {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }));
  };

  const base64DecodeUnicode = (str: string) => {
    return decodeURIComponent(atob(str).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  };

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      if (width < 768) {
        // A4 page-container has padding/margins of 32px
        // The target width of A4 container is 210mm (which is ~794px)
        const targetWidth = 794;
        const availableWidth = width - 32;
        setScale(Math.min(availableWidth / targetWidth, 1));
      } else {
        setScale(1);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const t = translations[lang];

  useEffect(() => {
    if (isInAppBrowser()) {
      setShowForceBrowserOverlay(true);
    }

    // Try to restore state from URL query parameter first (browser cross-sharing)
    const urlParams = new URLSearchParams(window.location.search);
    const stateParam = urlParams.get('state');
    let loadedFromUrl = false;

    if (stateParam) {
      try {
        const decoded = base64DecodeUnicode(stateParam);
        const parsed = JSON.parse(decoded);
        if (parsed) {
          if (parsed.l) setLang(parsed.l);
          if (parsed.s !== undefined) setShopName(parsed.s);
          if (parsed.f) setFontSize(Number(parsed.f));
          if (parsed.p) setProducts(parsed.p);
          loadedFromUrl = true;
          
          // Clear query param for clean URL
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('state');
          window.history.replaceState(null, '', newUrl.toString());
        }
      } catch (e) {
        console.error('Failed to parse URL state', e);
      }
    }

    if (!loadedFromUrl) {
      const savedLang = localStorage.getItem('appLang');
      const savedShopName = localStorage.getItem('appShopName');
      const savedProducts = localStorage.getItem('appProducts');
      const savedFontSize = localStorage.getItem('appFontSize');
      const savedNewName = localStorage.getItem('appNewName');
      const savedNewPrice = localStorage.getItem('appNewPrice');

      if (savedLang) setLang(savedLang as 'th' | 'en');
      if (savedShopName) setShopName(savedShopName);
      if (savedFontSize) setFontSize(Number(savedFontSize));
      if (savedNewName) setNewName(savedNewName);
      if (savedNewPrice) setNewPrice(savedNewPrice);
      if (savedProducts) {
        try {
          setProducts(JSON.parse(savedProducts));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('appLang', lang);
    localStorage.setItem('appShopName', shopName);
    localStorage.setItem('appProducts', JSON.stringify(products));
    localStorage.setItem('appFontSize', fontSize.toString());
    localStorage.setItem('appNewName', newName);
    localStorage.setItem('appNewPrice', newPrice);

    // Sync state to URL query parameter dynamically for browser cross-sharing
    try {
      const stateObj = { s: shopName, p: products, f: fontSize, l: lang };
      const jsonStr = JSON.stringify(stateObj);
      const b64 = base64EncodeUnicode(jsonStr);
      
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('state', b64);
      window.history.replaceState(null, '', newUrl.toString());
    } catch (e) {
      console.error('Failed to sync state to URL', e);
    }
  }, [lang, shopName, products, fontSize, newName, newPrice]);

  const sanitize = (html: string) => {
    return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] }); // text only
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPrice.trim()) return;
    const priceNum = parseFloat(newPrice);
    if (isNaN(priceNum) || priceNum <= 0) return;

    const newProduct: Product = {
      id: Date.now().toString(),
      name: sanitize(newName.trim()),
      price: priceNum,
    };

    setProducts([...products, newProduct]);
    setNewName('');
    setNewPrice('');
  };

  const deleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditName(product.name);
    setEditPrice(product.price.toString());
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim() || !editPrice.trim()) return;
    const priceNum = parseFloat(editPrice);
    if (isNaN(priceNum) || priceNum <= 0) return;

    setProducts(products.map(p => p.id === id ? { ...p, name: sanitize(editName.trim()), price: priceNum } : p));
    setEditingId(null);
    setEditName('');
    setEditPrice('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditPrice('');
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...products];
    const item = updated.splice(draggedIndex, 1)[0];
    updated.splice(index, 0, item);
    setProducts(updated);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const [productPages, setProductPages] = useState<Product[][]>([[]]);

  useEffect(() => {
    if (products.length === 0) {
      setProductPages([[]]);
      return;
    }

    const timer = setTimeout(() => {
      const measuringDiv = document.getElementById('measuring-container');
      if (!measuringDiv) return;

      // Calculate A4 Page Height in pixels dynamically based on 297mm element
      const testDiv = document.createElement('div');
      testDiv.style.height = '297mm';
      testDiv.style.visibility = 'hidden';
      document.body.appendChild(testDiv);
      const pageHeightLimit = testDiv.clientHeight - 90; // subtract padding/margins and add safety buffer
      document.body.removeChild(testDiv);

      const header = measuringDiv.querySelector('.measuring-header');
      const headerHeight = header ? header.clientHeight : 160;

      const rows = measuringDiv.querySelectorAll('.measuring-row');
      const thead = measuringDiv.querySelector('thead');
      const theadHeight = thead ? thead.clientHeight : 50;

      const footerHeight = 65; // cap note + qr code footer height

      let currentPage: Product[] = [];
      const newPages: Product[][] = [];

      let currentHeight = headerHeight + theadHeight + footerHeight;

      for (let i = 0; i < products.length; i++) {
        const rowHeight = rows[i] ? rows[i].clientHeight : (fontSize * 1.5 + 24);

        // If adding this row exceeds A4 page limit, move to a new page
        if (currentHeight + rowHeight > pageHeightLimit) {
          if (currentPage.length > 0) {
            newPages.push(currentPage);
          }
          currentPage = [products[i]];
          // Subsequent page heights start with sub-header (ร้าน:ต่อ) and thead
          const subHeaderHeight = 50;
          currentHeight = subHeaderHeight + theadHeight + footerHeight + rowHeight;
        } else {
          currentPage.push(products[i]);
          currentHeight += rowHeight;
        }
      }

      if (currentPage.length > 0) {
        newPages.push(currentPage);
      }

      setProductPages(newPages.length > 0 ? newPages : [[]]);
    }, 150); // delay to let DOM render

    return () => clearTimeout(timer);
  }, [products, fontSize, shopName]);

  const handleSaveImage = async () => {
    const elements = document.querySelectorAll('.page-container');
    if (elements.length === 0) return;
    try {
      await document.fonts.ready;

      // Facebook / LINE In-App Browser Workaround
      if (isInAppBrowser()) {
        setShowDownloadGuide(true);
        return;
      }

      for (let i = 0; i < elements.length; i++) {
        const element = elements[i] as HTMLElement;

        // Temporarily clear scale transform so html2canvas renders the page at normal size
        const originalTransform = element.style.transform;
        element.style.transform = 'none';

        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff'
        });

        // Restore scale transform
        element.style.transform = originalTransform;

        const link = document.createElement('a');
        const pageSuffix = elements.length > 1 ? `-page-${i + 1}` : '';
        link.download = `${shopName || 'thaihelpthai'}-receipt${pageSuffix}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        if (elements.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    } catch (err) {
      console.error('Error saving image:', err);
    }
  };

  const handleSavePDF = async () => {
    const elements = document.querySelectorAll('.page-container');
    if (elements.length === 0) return;

    // Facebook / LINE In-App Browser Workaround for PDF
    if (isInAppBrowser()) {
      setShowDownloadGuide(true);
      return;
    }

    try {
      await document.fonts.ready;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;

      for (let i = 0; i < elements.length; i++) {
        const element = elements[i] as HTMLElement;

        // Temporarily clear scale transform so html2canvas renders the page at normal size
        const originalTransform = element.style.transform;
        element.style.transform = 'none';

        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff'
        });

        // Restore scale transform
        element.style.transform = originalTransform;

        const imgData = canvas.toDataURL('image/png');

        if (i > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, pageHeight);
      }
      pdf.save(`${shopName || 'thaihelpthai'}-receipt.pdf`);
    } catch (err) {
      console.error('Error saving PDF:', err);
    }
  };

  const renderTopControls = () => {
    const isInApp = isInAppBrowser();
    return (
      <>
        {isInApp && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 leading-relaxed shadow-sm">
            <p className="font-bold mb-2 flex items-center gap-1.5 text-[13px]">
              <span>💡</span> คำแนะนำสำหรับผู้ใช้ Facebook / LINE
            </p>
            <ol className="list-decimal list-inside space-y-1.5 font-medium mb-3">
              <li>กดปุ่ม <b>จุดสามจุด (...) หรือไอคอนเว็บที่มุมขวาบนสุดของหน้าต่าง Facebook/LINE</b></li>
              <li>เลือกคำสั่ง <b>"เปิดด้วยเบราว์เซอร์เริ่มต้น"</b> หรือ <b>"เปิดในเบราว์เซอร์ปกติ" (Open in Safari / Chrome)</b></li>
            </ol>
            <p className="text-red-600 font-bold border-t border-amber-200 pt-2 text-[10.5px]">
              * การสลับเบราว์เซอร์จะทำให้ข้อมูลที่กรอกไว้หาย (ไม่ย้ายตามไป) แนะนำให้กดเปิดเบราว์เซอร์ภายนอก
            </p>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-thai-blue">Thai Helps Thai Plus</h1>
        <button
          onClick={() => setLang(lang === 'th' ? 'en' : 'th')}
          className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
        >
          <Globe size={16} />
          {lang.toUpperCase()}
        </button>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">{t.shopName}</label>
        <input
          type="text"
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-thai-blue"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          placeholder={t.shopName}
        />
      </div>

      <div className="mb-6 bg-blue-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-3 text-thai-blue">{t.add}</h2>
        <form onSubmit={handleAddProduct} className="flex flex-col gap-3">
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-thai-blue"
            placeholder={t.productName}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <input
            type="number"
            min="0"
            step="0.01"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-thai-blue"
            placeholder={t.fullPrice}
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
          />
          <button
            type="submit"
            className="bg-thai-blue text-white rounded-md px-4 py-2 hover:bg-blue-900 transition flex items-center justify-center gap-2 font-medium"
          >
            <Plus size={18} /> {t.add}
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto min-h-[150px] md:min-h-0">
        <h3 className="text-md font-semibold mb-2 text-gray-700">Product List</h3>
        {products.length === 0 ? (
          <p className="text-gray-500 text-sm italic">{t.noProducts}</p>
        ) : (
          <ul className="space-y-2">
            {products.map((p, index) => (
              <li
                key={p.id}
                draggable={editingId === null}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex justify-between items-center bg-gray-50 px-3 py-2 rounded border border-gray-200 gap-2 ${draggedIndex === index ? 'opacity-50 border-thai-blue border-dashed' : ''
                  } ${editingId === null ? 'cursor-grab active:cursor-grabbing' : ''}`}
              >
                {editingId === p.id ? (
                  <div className="flex flex-col gap-2 w-full">
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-thai-blue font-sans"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder={t.productName}
                    />
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-2/3 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-thai-blue font-sans"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        placeholder={t.fullPrice}
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(p.id)}
                        className="bg-green-600 text-white p-1.5 rounded hover:bg-green-700 transition"
                        title={t.save}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="bg-gray-400 text-white p-1.5 rounded hover:bg-gray-500 transition"
                        title={t.cancel}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                      <div className="text-gray-400 shrink-0 cursor-grab">
                        <GripVertical size={16} />
                      </div>
                      <span className="truncate text-gray-800 font-medium">
                        {p.name} <span className="text-thai-blue text-sm font-semibold">({formatMoney(p.price)}฿)</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(p)}
                        className="text-gray-500 hover:text-thai-blue p-1"
                        title={t.edit}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteProduct(p.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title={t.delete}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};

  const renderBottomControls = () => (
    <>
      <div className="mb-6">
        <label htmlFor="fontSizeSlider" className="block text-sm font-medium text-gray-700 mb-1">
          {t.fontSize}: {fontSize}px
        </label>
        <input
          id="fontSizeSlider"
          type="range"
          min="16" max="48"
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="w-full accent-thai-blue"
          title="Print Font Size"
        />
      </div>

      <div className="flex flex-col gap-3 mb-6">
        <button
          onClick={handleSaveImage}
          className="w-full bg-thai-blue text-white rounded-lg px-4 py-3 hover:bg-blue-900 transition flex items-center justify-center gap-2 font-bold text-lg shadow-md"
        >
          <Download size={20} /> {t.saveImage}
        </button>

        <button
          onClick={handleSavePDF}
          className="w-full bg-thai-red text-white rounded-lg px-4 py-3 hover:bg-red-700 transition flex items-center justify-center gap-2 font-bold text-lg shadow-md"
        >
          <FileText size={20} /> {t.savePDF}
        </button>
      </div>

      {/* Creator Footer with Support and Feedback */}
      <div className="pt-4 border-t border-gray-200 text-center text-sm text-gray-600 pb-2 shrink-0">
        <p className="mb-1 font-semibold text-gray-700">{lang === 'th' ? 'สร้างโดย คนไทย เพื่อช่วยเหลือพ่อค้าแม่ค้าชาวไทย' : 'Created by คนไทย to help Thai sellers'}</p>
        <p className="text-xs text-gray-500 mb-2 whitespace-pre-line">
          {lang === 'th' 
            ? 'สนับสนุนผู้พัฒนาได้ผ่าน QR Code หรือ PromptPay' 
            : 'Support the developer via QR Code or PromptPay'}
        </p>
        <div className="flex flex-col items-center gap-2 mt-1">
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="inline-flex items-center justify-center gap-1 bg-[#003D6B] text-white font-semibold px-4 py-2 rounded-full hover:bg-[#002D4F] transition hover:scale-105 transform duration-200 text-xs shadow-sm"
            >
              💙 {t.promptPay}
            </button>
            
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText('0997854459');
                alert(lang === 'th' ? 'คัดลอกเบอร์ PromptPay 0997854459 เรียบร้อยแล้ว!' : 'PromptPay number 0997854459 copied to clipboard!');
              }}
              className="inline-flex items-center justify-center gap-1.5 bg-teal-600 text-white font-semibold px-4 py-2 rounded-full hover:bg-teal-700 transition hover:scale-105 transform duration-200 text-xs shadow-sm"
              title="คัดลอกเบอร์ PromptPay"
            >
              📋 {lang === 'th' ? 'คัดลอกเบอร์ 0997854459' : 'Copy PromptPay: 0997854459'}
            </button>
          </div>
          
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSecsjjRIQevvQX0Mn3KOIWljfkB9MTyv6Kv8J_jRPg558hx8Q/viewform?usp=publish-editor"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1 bg-amber-500 text-white font-semibold px-4 py-2 rounded-full hover:bg-amber-600 transition hover:scale-105 transform duration-200 text-xs shadow-sm mt-1"
          >
            📝 แจ้งปัญหา/เสนอแนะ
          </a>
        </div>
      </div>

      {/* Privacy Note */}
      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500 leading-relaxed shrink-0">
        <p className="flex items-center gap-1.5 font-bold text-gray-700 mb-1">
          <span>🔒</span> นโยบายความเป็นส่วนตัว (Privacy Note)
        </p>
        <p>
          ข้อมูลทั้งหมดของคุณ ไม่มีการเก็บหรืออัปโหลดไปยังเซิร์ฟเวอร์ภายนอกใดๆ
        </p>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans">
      {!isMobile ? (
        /* Control Panel (Desktop Sidebar) */
        <div className="w-full md:w-1/3 bg-white shadow-lg p-6 flex flex-col no-print h-auto md:h-screen overflow-y-auto border-r border-gray-200">
          {renderTopControls()}
          <div className="mt-auto md:mt-6 pt-6 border-t border-gray-100">
            {renderBottomControls()}
          </div>
        </div>
      ) : (
        /* Control Panel (Mobile Top Block) */
        <div className="w-full bg-white shadow-md p-6 flex flex-col border-b border-gray-200 no-print">
          {renderTopControls()}
        </div>
      )}

      {/* Preview Panel / Print Area */}
      <div className="w-full md:w-2/3 p-4 md:p-8 flex flex-col items-center gap-8 overflow-y-auto bg-gray-200 print-area order-2 md:order-none">
        {productPages.map((pageProducts, pageIndex) => (
          <div
            key={pageIndex}
            className="flex justify-center w-full page-wrapper"
            style={{
              width: scale < 1 ? `${794 * scale}px` : 'auto',
              height: scale < 1 ? `${297 * 3.779 * scale}px` : 'auto',
              overflow: 'hidden'
            }}
          >
            <div
              className="bg-white shadow-xl p-8 print:shadow-none print:p-0 w-[210mm] min-h-[297mm] print:min-h-[297mm] flex flex-col justify-between print:break-after-page page-container origin-top shrink-0"
              style={{
                fontSize: `${fontSize}px`,
                transform: scale < 1 ? `scale(${scale})` : 'none',
              }}
            >
              <div>
                {/* Header (Only on Page 1) */}
                {pageIndex === 0 ? (
                  <div className="flex justify-between items-start mb-6 border-b-4 border-thai-blue pb-4">
                    <div className="flex items-end gap-3 shrink-0">
                      {/* Note: The user should place their logo as logo.png or logo.jpg in the public folder */}
                      <img src="logo.png" alt="ไทยช่วยไทย" className="h-24 object-contain print:h-20" onError={(e) => {
                        // Fallback if image not found
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }} />
                      <h1 className="hidden text-[2em] font-extrabold text-thai-blue print:text-black">ไทยช่วยไทย</h1>
                    </div>
                    {shopName && (
                      <div className="bg-thai-blue text-white px-6 py-3 rounded-lg print:bg-gray-200 print:text-black print:border-2 print:border-gray-800 max-w-[55%] break-words overflow-visible flex items-center min-h-[3.5em]">
                        <h2 className={`font-bold whitespace-pre-wrap leading-snug w-full ${shopName.length > 25 ? 'text-[0.8em]' : shopName.length > 15 ? 'text-[1.0em]' : 'text-[1.3em]'}`}>
                          ร้าน: {sanitize(shopName)}
                        </h2>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex justify-between items-center mb-6 border-b-2 border-thai-blue pb-2">
                    <span className="text-[1em] font-bold text-thai-blue">ร้าน: {sanitize(shopName)} (ต่อ)</span>
                    <span className="text-[0.8em] text-gray-500">หน้า {pageIndex + 1}/{productPages.length}</span>
                  </div>
                )}

                {/* Table */}
                <div className="w-full border-2 border-gray-800 flex flex-col font-bold">
                  {/* Header Row */}
                  <div className="bg-thai-blue text-white flex flex-row border-b-2 border-gray-800 text-[0.9em] print:bg-gray-200 print:text-black">
                    <div className="w-[40%] border-r-2 border-gray-800 px-4 py-3 text-left">{t.product}</div>
                    <div className="w-[20%] border-r-2 border-gray-800 px-1.5 py-3 text-right">{t.fullPrice}</div>
                    <div className="w-[20%] border-r-2 border-gray-800 px-1.5 py-3 text-right text-yellow-300 print:text-gray-800">{t.govPays}</div>
                    <div className="w-[20%] px-1.5 py-3 text-right text-green-300 print:text-black">{t.youPay}</div>
                  </div>

                  {/* Data Rows */}
                  {pageProducts.map(p => {
                    const govPays = Math.min(p.price * 0.60, 200);
                    const customerPays = p.price - govPays;
                    return (
                      <div key={p.id} className="flex flex-row border-b-2 border-gray-800 last:border-b-0 text-gray-900 text-[1em]">
                        <div className="w-[40%] border-r-2 border-gray-800 bg-gray-50 print:bg-white px-4 py-3 text-left whitespace-pre-wrap break-words">{p.name}</div>
                        <div className="w-[20%] border-r-2 border-gray-800 bg-gray-50 print:bg-white px-1.5 py-3 text-right text-thai-blue text-[0.88em]">{formatMoney(p.price)}</div>
                        <div className="w-[20%] border-r-2 border-gray-800 bg-red-50 print:bg-white px-1.5 py-3 text-right text-thai-red text-[0.88em]">-{formatMoney(govPays)}</div>
                        <div className="w-[20%] bg-green-50 print:bg-white px-1.5 py-3 text-right text-green-700 text-[0.88em]">{formatMoney(customerPays)}</div>
                      </div>
                    );
                  })}
                  {pageProducts.length === 0 && (
                    <div className="p-6 text-center text-gray-400 italic font-normal">{t.noProducts}</div>
                  )}
                </div>
              </div>

              <div
                className="mt-4 flex justify-between items-end text-gray-500 font-medium border-t border-gray-100 pt-3"
                style={{ fontSize: '15px' }}
              >
                <div className="whitespace-pre-line text-left leading-relaxed">{t.capNote}</div>
                <div className="flex items-center gap-2 text-right shrink-0">
                  <div className="flex flex-col items-end leading-normal">
                    <span className="text-gray-400 font-normal" style={{ fontSize: '12px' }}>สร้างป้ายราคาไทยช่วยไทยของคุณได้ที่</span>
                    <span className="text-thai-blue font-bold tracking-wide" style={{ fontSize: '15px' }}>bit.ly/thai_help</span>
                  </div>
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https%3A%2F%2Fbit.ly%2Fthai_help"
                    alt="QR Code"
                    className="w-14 h-14 border border-gray-300 rounded p-0.5 bg-white shadow-sm shrink-0"
                    crossOrigin="anonymous"
                  />
                  {productPages.length > 1 && <span className="ml-1 text-gray-400">หน้า {pageIndex + 1}/{productPages.length}</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isMobile && (
        /* Control Panel (Mobile Bottom Block) */
        <div className="w-full bg-white shadow-md p-6 flex flex-col border-t border-gray-200 no-print">
          {renderBottomControls()}
        </div>
      )}

      {/* Hidden measuring container */}
      <div id="measuring-container" className="absolute opacity-0 pointer-events-none" style={{ width: '210mm', fontSize: `${fontSize}px`, left: '-9999px', top: '0' }}>
        <div className="measuring-header flex justify-between items-start mb-6 border-b-4 border-thai-blue pb-4">
          <div className="flex items-end gap-3 shrink-0">
            <img src="logo.png" alt="ไทยช่วยไทย" className="h-24 object-contain" onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }} />
            <h1 className="hidden text-[2em] font-extrabold text-thai-blue">ไทยช่วยไทย</h1>
          </div>
          {shopName && (
            <div className="bg-thai-blue text-white px-6 py-3 rounded-lg max-w-[55%] break-words overflow-visible flex items-center min-h-[3.5em]">
              <h2 className={`font-bold whitespace-pre-wrap leading-snug w-full ${shopName.length > 25 ? 'text-[0.8em]' : shopName.length > 15 ? 'text-[1.0em]' : 'text-[1.3em]'}`}>
                ร้าน: {sanitize(shopName)}
              </h2>
            </div>
          )}
        </div>
        <div className="w-full border-2 border-gray-800 flex flex-col font-bold">
          {/* Header Row */}
          <div className="bg-thai-blue text-white flex flex-row border-b-2 border-gray-800 text-[0.9em]">
            <div className="w-[40%] border-r-2 border-gray-800 px-4 py-3 text-left">{t.product}</div>
            <div className="w-[20%] border-r-2 border-gray-800 px-1.5 py-3 text-right">{t.fullPrice}</div>
            <div className="w-[20%] border-r-2 border-gray-800 px-1.5 py-3 text-right">{t.govPays}</div>
            <div className="w-[20%] px-1.5 py-3 text-right">{t.youPay}</div>
          </div>

          {/* Data Rows */}
          {products.map(p => {
            const govPays = Math.min(p.price * 0.60, 200);
            const customerPays = p.price - govPays;
            return (
              <div key={p.id} className="measuring-row flex flex-row border-b-2 border-gray-800 last:border-b-0 text-gray-900">
                <div className="w-[40%] border-r-2 border-gray-800 bg-gray-50 px-4 py-3 text-left whitespace-pre-wrap break-words">{p.name}</div>
                <div className="w-[20%] border-r-2 border-gray-800 bg-gray-50 px-1.5 py-3 text-right text-thai-blue text-[0.88em]">{formatMoney(p.price)}</div>
                <div className="w-[20%] border-r-2 border-gray-800 bg-red-50 px-1.5 py-3 text-right text-thai-red text-[0.88em]">-{formatMoney(govPays)}</div>
                <div className="w-[20%] bg-green-50 px-1.5 py-3 text-right text-green-700 text-[0.88em]">{formatMoney(customerPays)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {showQrModal && (
        <div 
          onClick={() => setShowQrModal(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 no-print cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-sm w-full p-6 relative shadow-2xl border border-gray-100 flex flex-col items-center cursor-default"
          >
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition"
              title={lang === 'th' ? 'ปิดหน้าต่าง' : 'Close'}
              aria-label={lang === 'th' ? 'ปิดหน้าต่าง' : 'Close modal'}
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              {lang === 'th' ? 'QR Code พร้อมเพย์' : 'PromptPay QR Code'}
            </h3>
            <p className="text-xs text-gray-500 mb-4 text-center">
              {lang === 'th' 
                ? 'สแกนเพื่อสนับสนุนค่าน้ำชา/กาแฟ ให้แก่ผู้พัฒนาได้โดยตรงครับ' 
                : 'Scan to support tea/coffee costs directly to the developer.'}
            </p>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 mb-4 flex justify-center items-center">
              <img
                src="promptpay_qr.png"
                alt="PromptPay QR Code"
                className="w-60 h-auto object-contain rounded-lg shadow-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="w-full bg-[#003D6B] hover:bg-[#002D4F] text-white font-semibold py-2 rounded-xl transition text-sm shadow-md"
            >
              {lang === 'th' ? 'ปิดหน้าต่าง (Close)' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {showDownloadGuide && (
        <div 
          onClick={() => setShowDownloadGuide(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 no-print cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-8 relative shadow-2xl border border-gray-100 flex flex-col items-center text-center cursor-default"
          >
            <button
              type="button"
              onClick={() => setShowDownloadGuide(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition"
              title={lang === 'th' ? 'ปิดหน้าต่าง' : 'Close'}
              aria-label={lang === 'th' ? 'ปิดหน้าต่าง' : 'Close modal'}
            >
              <X size={18} />
            </button>
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-3xl mb-4 shrink-0">
              📥
            </div>
            <h2 className="text-xl font-bold text-gray-950 mb-2 font-sans shrink-0">
              {lang === 'th' ? 'กรุณาดาวน์โหลดผ่านเบราว์เซอร์ปกติ' : 'Please download via normal browser'}
            </h2>
            <p className="text-xs text-gray-500 mb-6 font-sans leading-relaxed shrink-0">
              {lang === 'th' 
                ? 'ไม่สามารถดาวน์โหลดไฟล์โดยตรงผ่านในแอป Facebook/LINE ได้ เนื่องจากติดระบบความปลอดภัย' 
                : 'Direct downloads are not supported inside Facebook/LINE app due to security sandboxing.'}
            </p>
            
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-[12px] text-amber-800 leading-relaxed mb-6 w-full text-left font-sans shadow-sm shrink-0">
              <p className="font-bold mb-2 text-center text-[13px] border-b border-amber-200 pb-1.5">
                📲 {lang === 'th' ? 'ขั้นตอนย้ายไปเบราว์เซอร์ปกติเพื่อดาวน์โหลด:' : 'Steps to switch to regular browser:'}
              </p>
              <ol className="list-decimal list-inside space-y-2 font-medium">
                <li>กดปุ่ม <b>จุดสามจุด (...) หรือไอคอนเว็บที่มุมขวาบนสุดของหน้าต่าง Facebook/LINE</b></li>
                <li>เลือกคำสั่ง <b>"เปิดด้วยเบราว์เซอร์เริ่มต้น"</b> หรือ <b>"เปิดในเบราว์เซอร์ปกติ" (Open in Safari / Chrome)</b></li>
              </ol>
            </div>

            <p className="text-[11px] text-teal-600 font-bold mb-6 leading-relaxed font-sans px-2 shrink-0">
              ⭐ {lang === 'th' 
                ? 'ข้อมูลที่ท่านกรอกแล้วจะไม่สูญหายเมื่อสลับเบราว์เซอร์' 
                : 'Your filled data will not be lost when switching browser.'}
            </p>
            
            <button
              type="button"
              onClick={() => setShowDownloadGuide(false)}
              className="w-full bg-[#003D6B] hover:bg-[#002D4F] text-white font-bold py-3 rounded-2xl transition text-sm shadow-md shrink-0"
            >
              {lang === 'th' ? 'ตกลง (OK)' : 'OK'}
            </button>
          </div>
        </div>
      )}


      {showForceBrowserOverlay && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[10000] flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 relative shadow-2xl border border-gray-100 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-3xl mb-4 animate-bounce shrink-0">
              💡
            </div>
            <h2 className="text-xl font-bold text-gray-950 mb-2 font-sans shrink-0">
              {lang === 'th' ? 'แนะนำให้เปิดด้วยเบราว์เซอร์ภายนอก' : 'Open in External Browser Recommended'}
            </h2>
            <p className="text-xs text-gray-500 mb-6 font-sans leading-relaxed shrink-0">
              {lang === 'th' 
                ? 'ยินดีต้อนรับสู่ ไทยช่วยไทย พลัส! เพื่อความราบรื่นและสามารถดาวน์โหลดรูปภาพหรือ PDF ป้ายราคาลงมือถือได้อย่างสมบูรณ์แบบ' 
                : 'Welcome to Thai Helps Thai Plus! For a smooth experience and successful price tag downloads (Image/PDF) to your mobile.'}
            </p>
            
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-[12px] text-amber-800 leading-relaxed mb-6 w-full text-left font-sans shadow-sm shrink-0">
              <p className="font-bold mb-2 text-center text-[13px] border-b border-amber-200 pb-1.5">
                📲 {lang === 'th' ? 'ขั้นตอนการเปิดเบราว์เซอร์ภายนอก:' : 'Steps to Open in External Browser:'}
              </p>
              <ol className="list-decimal list-inside space-y-2 font-medium">
                <li>กดปุ่ม <b>จุดสามจุด (...) หรือไอคอนเว็บที่มุมขวาบนสุดของหน้าต่าง Facebook/LINE</b></li>
                <li>เลือกคำสั่ง <b>"เปิดด้วยเบราว์เซอร์เริ่มต้น"</b> หรือ <b>"เปิดในเบราว์เซอร์ปกติ" (Open in Safari / Chrome)</b></li>
              </ol>
            </div>

            <p className="text-[11px] text-red-600 font-bold mb-6 leading-relaxed font-sans px-2 shrink-0">
              * การสลับเบราว์เซอร์จะทำให้ข้อมูลที่กรอกไว้หาย (ไม่ย้ายตามไป) แนะนำให้กดสลับเปิดเบราว์เซอร์ภายนอกตั้งแต่ตอนนี้เลยครับ
            </p>
            
            <button
              type="button"
              onClick={() => setShowForceBrowserOverlay(false)}
              className="w-full bg-[#003D6B] hover:bg-[#002D4F] text-white font-bold py-3 rounded-2xl transition text-sm shadow-md shrink-0"
            >
              {lang === 'th' ? 'รับทราบ (ฉันขอกรอกข้อมูลผ่านเบราว์เซอร์นี้ต่อ)' : 'Got it (Continue in this browser)'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
