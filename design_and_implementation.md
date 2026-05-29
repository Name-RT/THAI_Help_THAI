# Thai Helps Thai Plus 60/40 - Design & Implementation

## 1. Design & Localization
- **Language (i18n):** The application relies on a simple dictionary object (`translations`) in `App.tsx`. A state variable `lang` toggles between `'th'` and `'en'`, updating the UI immediately. Thai is the default language.
- **Theme Colors:** The styling predominantly uses the Thai government color scheme, applying `#1E3A8A` (Thai Blue) for headers, primary buttons, and table headers. Accent colors like red and white are used to highlight deductions and backgrounds.
- **Target Audience:** The font size slider, defaulting to 28px, helps easily generate highly readable infographics for elderly customers.
- **Layout:** Utilizing Tailwind CSS Flexbox and responsive grids (`flex-col md:flex-row`), the app separates into two logical sections. The left panel handles inputs, while the right panel (with a simulated A4 aspect ratio) functions as a live preview.

## 2. Core Functionalities & Logic
- **Shop Settings & Product CRUD:** React `useState` hooks maintain the shop name and a list of `Product` objects.
- **The 60/40 Calculation Logic:** The calculation executes per product within the render loop for the table:
  ```javascript
  const govPays = Math.min(p.price * 0.60, 200);
  const customerPays = p.price - govPays;
  ```
- **Local Storage:** `useEffect` hooks read from and write to `localStorage` for `lang`, `shopName`, `products`, and `fontSize`. The hook immediately synchronizes state on component mount.
- **Security:** To prevent Cross-Site Scripting (XSS), user inputs (Shop Name and Product Name) are passed through `DOMPurify.sanitize` with strict configuration (`{ ALLOWED_TAGS: [] }`) before rendering.

## 3. The A4 Infographic Table (Preview & Print)
- **Header & Table Columns:** The preview table updates dynamically based on the translation dictionary.
- **Number Formatting:** Prices are formatted using `toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })` to ensure consistent comma separators and decimal representations.
- **Print Function:** Triggers the native `window.print()` method.
- **Print CSS (`@media print`):** Custom CSS is defined in `index.css`. The `.no-print` class effectively hides the control panel, while `page-break-inside: avoid` on `tr` elements prevents rows from tearing awkwardly across pages. The A4 layout takes the entire viewport during printing.

## 4. Creator & Donation Section
- A hardcoded section resides at the bottom of the control panel, thanking the creator and offering a "Buy Me a Coffee" link, built with standard Tailwind utility classes to make it persistent and unmodifiable by standard user flows.
