# Project Structure & Architecture Summary

This document explains how the **Thai Helps Thai Plus 60/40** application works internally and describes the role of each file in the codebase.

---

## ⚙️ How the Program Works

The application is a single-page interactive React tool designed to configure, preview, and output standard A4-sized pricing infographics. 

### 1. Data Flow & State Management
- **React State Hooks (`useState`):** Manage user preferences (`lang`, `fontSize`), shop information (`shopName`), product forms (`newName`, `newPrice`), and the main dynamic list of products (`products`).
- **Persistence (`localStorage`):** Whenever state variables change, a synchronization effect writes their updated states to browser `localStorage`. When the app loads, it restores this data, preserving the user's progress.

### 2. The 60/40 Co-payment Calculation Logic
The calculation is executed per product in real-time during rendering:
- **Government Contribution:** Calculated as $60\%$ of the product price, capped at $200$ THB:
  $$\text{govPays} = \min(\text{price} \times 0.60, 200)$$
- **Customer Share:** The remainder of the price that the customer must pay ($40\%$ or more if capped):
  $$\text{customerPays} = \text{price} - \text{govPays}$$

### 3. Dynamic A4 Page Allocation (Pagination)
To prevent content overflow during printing, the application implements a dynamic layout height measuring routine:
- A hidden measuring container (`#measuring-container`) renders items off-screen.
- A `useEffect` script detects the physical client height of an A4 page (`297mm`) dynamically.
- The system measures header and row heights to determine how many product items can fit on each physical page.
- Products are grouped into structured page arrays (`productPages`), which React maps to separate simulated A4 page wrappers (`.page-container`).

### 4. Input Sanitization & Security
To prevent Cross-Site Scripting (XSS) via copy-pasted product names or malicious shop tags, all user-submitted text inputs pass through `DOMPurify.sanitize` with an empty allowed-tags profile (`{ ALLOWED_TAGS: [] }`) before rendering inside the HTML.

### 5. PDF, Image Export, & Direct Printing
- **PNG Export (`html2canvas`):** Iterates over A4 `.page-container` elements, captures their DOM configurations, and triggers browser downloads as clean `.png` images.
- **PDF Export (`jspdf`):** Converts DOM pages to canvas buffers and compiles them into a structured multi-page PDF document formatted to exact `a4` sizes.
- **Direct Printing (`window.print()`):** Handled via CSS `@media print` queries. The control panel uses the `.no-print` helper class to hide itself during printing, enabling the browser print interface to scale the simulated A4 page wrappers directly onto physical sheets.

---

## 📂 File Directory & Role of Each File

Below is the description of every file and directory in this repository:

### Core Configuration Files
* **[package.json](file:///d:/work/ThaiHelpThai/package.json):** Lists the application dependencies (`react`, `html2canvas`, `jspdf`, `dompurify`, `lucide-react`) and development scripts (`dev`, `build`, `lint`, `preview`).
* **[vite.config.ts](file:///d:/work/ThaiHelpThai/vite.config.ts):** Configuration script for Vite, bundling the React code and utilizing `@vitejs/plugin-react`.
* **[tsconfig.json](file:///d:/work/ThaiHelpThai/tsconfig.json) / [tsconfig.app.json](file:///d:/work/ThaiHelpThai/tsconfig.app.json) / [tsconfig.node.json](file:///d:/work/ThaiHelpThai/tsconfig.node.json):** Configuration parameters for the TypeScript compiler, specifying strict type-checking, JSX transformations, and build targets.
* **[postcss.config.js](file:///d:/work/ThaiHelpThai/postcss.config.js) / [tailwind.config.js](file:///d:/work/ThaiHelpThai/tailwind.config.js):** Configuration files for compiling Tailwind CSS utility classes and managing structural spacing/color schemes.
* **[eslint.config.js](file:///d:/work/ThaiHelpThai/eslint.config.js):** Custom ESLint static-analysis rules enforcing code quality, syntax formatting, and React hooks validation.

### Entrypoint & Web Layout
* **[index.html](file:///d:/work/ThaiHelpThai/index.html):** The primary HTML entrypoint containing the application target mount container `<div id="root"></div>` and responsive viewport meta configurations.
* **[public/](file:///d:/work/ThaiHelpThai/public/):** Directory containing static assets. Contains the default `logo.png` fallback image used as the co-payment campaign header logo.

### Application Logic & Styles
* **[src/App.tsx](file:///d:/work/ThaiHelpThai/src/App.tsx):** The central entrypoint of application logic. Contains the user state hooks, localized text dictionary, dynamic measuring layout, export/print handlers, input fields, and the UI panels.
* **[src/index.css](file:///d:/work/ThaiHelpThai/src/index.css):** Standard style layout importing Tailwind directives and housing custom utility classes. Defines custom colors like `.text-thai-blue` and specific `@media print` directives to hide controls (`.no-print`) and control layout breaks during physical printing.
* **[src/main.tsx](file:///d:/work/ThaiHelpThai/src/main.tsx):** Hooks the `App` component into the DOM entrypoint inside `index.html`.

### Project Documentation
* **[README.md](file:///d:/work/ThaiHelpThai/README.md):** User-facing handbook written in Thai explaining how shop owners can configure and use the interface, export documents, or print A4 sheets.
* **[design_and_implementation.md](file:///d:/work/ThaiHelpThai/design_and_implementation.md):** Low-level implementation draft noting localization details, the mathematical co-pay cap system, security strategies, and design paradigms.
