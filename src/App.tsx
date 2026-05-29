import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { Plus, Trash2, Globe, FileText, Download } from 'lucide-react';
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
    creatorText: 'สร้างสรรค์โดย ฅนไทย-ไฟ-ลน เพื่อช่วยเหลือพ่อค้าแม่ค้าชาวไทย',
    buyMeCoffee: 'สนับสนุนเพื่อเป็นกำลังใจให้ผู้พัฒนา',
    noProducts: 'ยังไม่มีสินค้า',
    delete: 'ลบ',
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
    capNote: '* Gov pays max 200 Baht per day',
    creatorText: 'Created by ฅนไทย-ไฟ-ลน to help Thai sellers',
    buyMeCoffee: 'Buy Me a Coffee',
    noProducts: 'No products added yet',
    delete: 'Delete',
  }
};

export default function App() {
  const [lang, setLang] = useState<'th' | 'en'>('th');
  const [shopName, setShopName] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [fontSize, setFontSize] = useState(28);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');

  const t = translations[lang];

  useEffect(() => {
    const savedLang = localStorage.getItem('appLang');
    const savedShopName = localStorage.getItem('appShopName');
    const savedProducts = localStorage.getItem('appProducts');
    const savedFontSize = localStorage.getItem('appFontSize');

    if (savedLang) setLang(savedLang as 'th' | 'en');
    if (savedShopName) setShopName(savedShopName);
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    if (savedFontSize) setFontSize(Number(savedFontSize));
  }, []);

  useEffect(() => {
    localStorage.setItem('appLang', lang);
    localStorage.setItem('appShopName', shopName);
    localStorage.setItem('appProducts', JSON.stringify(products));
    localStorage.setItem('appFontSize', fontSize.toString());
  }, [lang, shopName, products, fontSize]);

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
      const pageHeightLimit = testDiv.clientHeight - 40; // subtract padding/margins
      document.body.removeChild(testDiv);

      const header = measuringDiv.querySelector('.measuring-header');
      const headerHeight = header ? header.clientHeight : 160;

      const rows = measuringDiv.querySelectorAll('.measuring-row');
      const thead = measuringDiv.querySelector('thead');
      const theadHeight = thead ? thead.clientHeight : 50;

      const footerHeight = 40; // cap note height

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
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i] as HTMLElement;
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff'
        });
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
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;

      for (let i = 0; i < elements.length; i++) {
        const element = elements[i] as HTMLElement;
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff'
        });
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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans">
      {/* Control Panel */}
      <div className="w-full md:w-1/3 bg-white shadow-lg p-6 flex flex-col no-print h-auto md:h-screen overflow-y-auto border-r border-gray-200">
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

        <div className="mb-6 flex-1 overflow-y-auto min-h-[150px]">
          <h3 className="text-md font-semibold mb-2 text-gray-700">Product List</h3>
          {products.length === 0 ? (
            <p className="text-gray-500 text-sm italic">{t.noProducts}</p>
          ) : (
            <ul className="space-y-2">
              {products.map(p => (
                <li key={p.id} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded border border-gray-200">
                  <span className="truncate flex-1 mr-2">{p.name} ({formatMoney(p.price)})</span>
                  <button onClick={() => deleteProduct(p.id)} className="text-red-500 hover:text-red-700 p-1" title={t.delete}>
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mb-6">
          <label htmlFor="fontSizeSlider" className="block text-sm font-medium text-gray-700 mb-1">
            Print Font Size: {fontSize}px
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

        {/* Hardcoded Creator Footer */}
        <div className="mt-auto pt-4 border-t border-gray-200 text-center text-sm text-gray-600 pb-2 shrink-0">
          <p className="mb-2 font-medium">{t.creatorText}</p>
          <a
            href="https://buymeacoffee.com/thammanoonj"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#FFDD00] text-black font-semibold px-4 py-2 rounded-full hover:bg-[#FFC300] transition hover:scale-105 transform duration-200"
          >
            ☕ {t.buyMeCoffee}
          </a>
        </div>
      </div>

      {/* Preview Panel / Print Area */}
      <div className="w-full md:w-2/3 p-4 md:p-8 flex flex-col items-center gap-8 overflow-y-auto bg-gray-200 print-area">
        {productPages.map((pageProducts, pageIndex) => (
          <div
            key={pageIndex}
            className="bg-white shadow-xl p-8 print:shadow-none print:p-0 w-full max-w-[210mm] min-h-[297mm] print:min-h-[297mm] print:w-full flex flex-col justify-between print:break-after-page page-container"
            style={{ fontSize: `${fontSize}px` }}
          >
            <div>
              {/* Header (Only on Page 1) */}
              {pageIndex === 0 ? (
                <div className="flex justify-between items-start mb-6 border-b-4 border-thai-blue pb-4">
                  <div className="flex items-end gap-3">
                    {/* Note: The user should place their logo as logo.png or logo.jpg in the public folder */}
                    <img src="/logo.png" alt="ไทยช่วยไทย" className="h-24 object-contain print:h-20" onError={(e) => {
                      // Fallback if image not found
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }} />
                    <h1 className="hidden text-[2em] font-extrabold text-thai-blue print:text-black">ไทยช่วยไทย</h1>
                    <span className="text-[1.8em] font-extrabold text-thai-blue print:text-black pb-1"></span>
                  </div>
                  {shopName && (
                    <div className="bg-thai-blue text-white px-6 py-2 rounded-lg print:bg-gray-200 print:text-black print:border-2 print:border-gray-800">
                      <h2 className="text-[1.3em] font-bold">ร้าน: {sanitize(shopName)}</h2>
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
              <table className="w-full border-collapse border-2 border-gray-800">
                <thead>
                  <tr className="bg-thai-blue text-white print:bg-gray-200 print:text-black">
                    <th className="border-2 border-gray-800 p-3 text-left w-2/5">{t.product}</th>
                    <th className="border-2 border-gray-800 p-3 text-right w-1/5">{t.fullPrice}</th>
                    <th className="border-2 border-gray-800 p-3 text-right text-yellow-300 print:text-gray-800 w-1/5">{t.govPays}</th>
                    <th className="border-2 border-gray-800 p-3 text-right text-green-300 print:text-black w-1/5">{t.youPay}</th>
                  </tr>
                </thead>
                <tbody>
                  {pageProducts.map(p => {
                    const govPays = Math.min(p.price * 0.60, 200);
                    const customerPays = p.price - govPays;
                    return (
                      <tr key={p.id} className="text-gray-900 font-bold">
                        <td className="border-2 border-gray-800 p-3 bg-gray-50 print:bg-white">{p.name}</td>
                        <td className="border-2 border-gray-800 p-3 text-right bg-gray-50 print:bg-white text-thai-blue print:text-thai-blue">
                          {formatMoney(p.price)}
                        </td>
                        <td className="border-2 border-gray-800 p-3 text-right text-thai-red bg-red-50 print:bg-white print:text-thai-red">
                          -{formatMoney(govPays)}
                        </td>
                        <td className="border-2 border-gray-800 p-3 text-right text-green-700 bg-green-50 print:bg-white print:text-green-700 text-[1.2em]">
                          {formatMoney(customerPays)}
                        </td>
                      </tr>
                    );
                  })}
                  {pageProducts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="border-2 border-gray-800 p-6 text-center text-gray-400 italic font-normal">
                        {t.noProducts}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-between items-center text-[0.6em] text-gray-500 font-medium">
              <div>{t.capNote}</div>
              {productPages.length > 1 && <div>หน้า {pageIndex + 1} จาก {productPages.length}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Hidden measuring container */}
      <div id="measuring-container" className="absolute opacity-0 pointer-events-none" style={{ width: '210mm', fontSize: `${fontSize}px`, left: '-9999px', top: '0' }}>
        <div className="measuring-header flex justify-between items-start mb-6 border-b-4 border-thai-blue pb-4">
          <div className="flex items-end gap-3">
            <img src="/logo.png" alt="ไทยช่วยไทย" className="h-24 object-contain" onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }} />
            <h1 className="hidden text-[2em] font-extrabold text-thai-blue">ไทยช่วยไทย</h1>
            <span className="text-[1.8em] font-extrabold text-thai-blue pb-1"></span>
          </div>
          {shopName && (
            <div className="bg-thai-blue text-white px-6 py-2 rounded-lg">
              <h2 className="text-[1.3em] font-bold">ร้าน: {sanitize(shopName)}</h2>
            </div>
          )}
        </div>
        <table className="w-full border-collapse border-2 border-gray-800">
          <thead>
            <tr className="bg-thai-blue text-white">
              <th className="border-2 border-gray-800 p-3 text-left w-2/5">{t.product}</th>
              <th className="border-2 border-gray-800 p-3 text-right w-1/5">{t.fullPrice}</th>
              <th className="border-2 border-gray-800 p-3 text-right w-1/5">{t.govPays}</th>
              <th className="border-2 border-gray-800 p-3 text-right w-1/5">{t.youPay}</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => {
              const govPays = Math.min(p.price * 0.60, 200);
              const customerPays = p.price - govPays;
              return (
                <tr key={p.id} className="measuring-row text-gray-900 font-bold">
                  <td className="border-2 border-gray-800 p-3 bg-gray-50">{p.name}</td>
                  <td className="border-2 border-gray-800 p-3 text-right bg-gray-50 text-thai-blue">{formatMoney(p.price)}</td>
                  <td className="border-2 border-gray-800 p-3 text-right text-thai-red bg-red-50">-{formatMoney(govPays)}</td>
                  <td className="border-2 border-gray-800 p-3 text-right text-green-700 bg-green-50 text-[1.2em]">{formatMoney(customerPays)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
