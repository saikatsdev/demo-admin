# Admin Panel Module Implementation Guide

এই guide অনুসরণ করে React admin panel-এ নতুন optional module—যেমন Stock, Accounts বা Profit Management—যোগ করা যাবে।

## Module system কীভাবে কাজ করে

Admin panel তিনটি বিষয় একসঙ্গে যাচাই করে:

1. Backend module enabled কি না।
2. Frontend registry-তে module register করা আছে কি না।
3. Login করা user-এর প্রয়োজনীয় permission আছে কি না।

Flow:

```text
Backend modules_statuses.json
        ↓
GET /api/admin/modules/status
        ↓
ModuleProvider
        ↓
Frontend moduleRegistry
        ↓
Enabled routes + permission-based sidebar
```

Backend status `false` হলে module-এর sidebar এবং routes—দুটিই admin panel থেকে বন্ধ থাকবে।

---

## ১. Backend module key নির্ধারণ

ধরা যাক নতুন module-এর নাম `Stock`। Backend-এর `modules_statuses.json` file-এ key থাকবে:

```json
{
    "HRM": true,
    "Stock": true
}
```

Frontend module registration-এর `key` অবশ্যই backend key-এর সঙ্গে মিলতে হবে। Matching case বাধ্যতামূলক নয়, তবে একই naming ব্যবহার করা ভালো।

Backend module enable/disable commands:

```bash
php artisan module:enable Stock
php artisan module:disable Stock
php artisan module:list
```

Module status endpoint:

```http
GET /api/admin/modules/status
```

Expected response:

```json
{
    "success": true,
    "msg": "Active module status list",
    "result": {
        "HRM": true,
        "Stock": true,
        "Accounts": false
    }
}
```

---

## ২. Frontend module directory তৈরি

Recommended structure:

```text
src/modules/stock/
├── api/
│   └── stockApi.js
├── components/
│   └── StockSummaryCard.jsx
├── hooks/
│   └── useStockSummary.js
├── pages/
│   ├── StockDashboard.jsx
│   └── Warehouses.jsx
├── styles/
│   └── stock.css
└── index.jsx
```

সব folder বাধ্যতামূলক নয়। প্রয়োজন না থাকলে শুধু `pages` এবং `index.jsx` দিয়েও module শুরু করা যাবে। Git empty directory track করে না।

কোন code কোথায় থাকবে:

| Code | Location |
|---|---|
| Module pages | `src/modules/stock/pages` |
| শুধু Stock module-এ ব্যবহৃত component | `src/modules/stock/components` |
| Stock-specific hooks | `src/modules/stock/hooks` |
| Stock endpoint wrappers | `src/modules/stock/api` |
| Stock-wide styles | `src/modules/stock/styles` |
| Shared reusable components | `src/components` |
| Shared API helpers | `src/api/common/common.js` |

---

## ৩. Module pages তৈরি

`src/modules/stock/pages/StockDashboard.jsx`:

```jsx
import useTitle from "../../../hooks/useTitle";

export default function StockDashboard() {
    useTitle("Stock Dashboard");

    return (
        <section>
            <h1>Stock Dashboard</h1>
        </section>
    );
}
```

`src/modules/stock/pages/Warehouses.jsx`:

```jsx
import useTitle from "../../../hooks/useTitle";

export default function Warehouses() {
    useTitle("Warehouses");

    return (
        <section>
            <h1>Warehouses</h1>
        </section>
    );
}
```

---

## ৪. Module-specific API wrapper তৈরি

Global request helpers সব module ব্যবহার করতে পারবে:

```text
src/api/common/common.js
```

Stock-specific endpoint functions:

`src/modules/stock/api/stockApi.js`:

```jsx
import {
    deleteData,
    getDatas,
    postData,
    putData,
} from "../../../api/common/common";

export const getWarehouses = (params) =>
    getDatas("/admin/warehouses", params);

export const createWarehouse = (payload) =>
    postData("/admin/warehouses", payload);

export const updateWarehouse = (id, payload) =>
    putData(`/admin/warehouses/${id}`, payload);

export const deleteWarehouse = (id) =>
    deleteData(`/admin/warehouses/${id}`);
```

Page থেকে ব্যবহার:

```jsx
import { getWarehouses } from "../api/stockApi";
```

API wrapper বাধ্যতামূলক নয়। ছোট page হলে সরাসরি `common.js` ব্যবহার করা যাবে। বড় module-এ wrapper রাখলে endpoint maintenance সহজ হয়।

---

## ৫. Module registration file তৈরি

`src/modules/stock/index.jsx`:

```jsx
import { DatabaseOutlined } from "@ant-design/icons";
import { lazy } from "react";

const StockDashboard = lazy(() => import("./pages/StockDashboard"));
const Warehouses = lazy(() => import("./pages/Warehouses"));

const routes = [
    {
        path: "/stock",
        component: StockDashboard,
    },
    {
        path: "/stock/warehouses",
        component: Warehouses,
    },
];

const getNavigation = ({ can, canAny }) => {
    const submenus = [
        can("stock-dashboard-read") && {
            label: "Stock Dashboard",
            path: "/stock",
        },
        canAny("warehouses-read", "stock-read") && {
            label: "Warehouses",
            path: "/stock/warehouses",
        },
    ].filter(Boolean);

    if (!submenus.length) return null;

    return {
        title: "Stock Management",
        icon: <DatabaseOutlined />,
        submenus,
    };
};

export const stockModule = {
    // Must match modules_statuses.json
    key: "Stock",
    routes,
    getNavigation,
};
```

### কেন `lazy()` ব্যবহার করা হয়

`lazy()` ব্যবহার করলে Stock module enabled হলেও সব page initial bundle-এর সঙ্গে download হবে না। User যে route open করবে শুধু সেই page-এর JavaScript chunk load হবে। Module disabled থাকলে Stock page chunks load হবে না।

Lazy page load হওয়ার সময় global `ModulePageLoader` automatically দেখানো হবে।

---

## ৬. Global module registry-তে register

`src/modules/registry.js`:

```jsx
import { hrmModule } from "./hrm";
import { stockModule } from "./stock";

export const moduleRegistry = [
    hrmModule,
    stockModule,
];
```

শুধু এই registry-তে module add করতে হবে। `App.jsx` বা `Sidebar.jsx`-এ Stock-specific route/menu manually যোগ করা যাবে না।

Registry-তে add করার পর system automatically:

- Backend status check করবে।
- Enabled হলে routes register করবে।
- Permission থাকলে sidebar দেখাবে।
- Lazy page loader ব্যবহার করবে।
- Disabled হলে routes এবং navigation বাদ দেবে।

---

## ৭. Permissions তৈরি ও ব্যবহার

Backend permission examples:

```text
stock-dashboard-read
warehouses-read
warehouses-create
warehouses-update
warehouses-delete
```

Sidebar visibility:

```jsx
can("warehouses-read") && {
    label: "Warehouses",
    path: "/stock/warehouses",
}
```

একাধিক permission-এর যেকোনো একটি গ্রহণ করতে:

```jsx
canAny("warehouses-read", "stock-read") && {
    label: "Warehouses",
    path: "/stock/warehouses",
}
```

Page-এর action buttons-এও permission check করতে হবে:

```jsx
import { usePermission } from "../../../hooks/usePermission";

const { can } = usePermission();

{can("warehouses-create") && (
    <button>Add Warehouse</button>
)}
```

Module enabled থাকা permission-এর বিকল্প নয়। Backend controller-এও permission check থাকতে হবে।

---

## ৮. Module disable behavior

Backend থেকে:

```bash
php artisan module:disable Stock
```

Admin refresh/login-এর পরে:

- Stock Management sidebar আর দেখা যাবে না।
- Stock frontend routes register হবে না।
- Direct `/stock` URL-এ গেলে Not Found দেখাবে।
- Stock lazy chunks download হবে না।
- Backend Stock providers/routes load হবে না।

Admin panel খোলা থাকা অবস্থায় status change করলে বর্তমানে refresh প্রয়োজন।

---

## ৯. Existing shared files পরিবর্তন করার নিয়ম

নতুন module যোগ করতে সাধারণত নিচের shared files edit করা যাবে:

```text
src/modules/registry.js
```

নিচের files-এ module-specific code যোগ করা উচিত নয়:

```text
src/App.jsx
src/components/Sidebar.jsx
src/contexts/ModuleProvider.jsx
```

এগুলো global module infrastructure এবং সব modules-এর জন্য common।

---

## ১০. Validation checklist

Implementation শেষে যাচাই করো:

- [ ] Backend module name এবং frontend `key` একই।
- [ ] Module `modules_statuses.json`-এ আছে।
- [ ] Module `src/modules/registry.js`-এ registered।
- [ ] Page imports lazy loading ব্যবহার করছে।
- [ ] Route paths unique।
- [ ] Sidebar permissions backend permission-এর সঙ্গে match করছে।
- [ ] Create/update/delete buttons permission দিয়ে protected।
- [ ] Backend controllers permission check করছে।
- [ ] Module `true` হলে menu ও routes দেখা যাচ্ছে।
- [ ] Module `false` হলে menu ও routes hide হচ্ছে।
- [ ] Direct disabled-module URL Not Found দেখাচ্ছে।
- [ ] API URLs `/admin/...` prefix ব্যবহার করছে।
- [ ] ESLint pass করছে।
- [ ] Production build pass করছে।

Commands:

```bash
npx eslint src/modules/stock
npm run build
```

---

## Quick implementation summary

```text
1. Backend module তৈরি/enable
2. Permission তৈরি
3. src/modules/{module}/pages তৈরি
4. প্রয়োজন হলে api/components/hooks/styles তৈরি
5. module index.jsx-এ lazy routes + navigation তৈরি
6. src/modules/registry.js-এ register
7. Enabled/disabled এবং permission behavior test
8. ESLint + production build run
```

