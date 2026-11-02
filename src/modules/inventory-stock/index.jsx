import { DatabaseOutlined } from "@ant-design/icons";
import { lazy } from "react";

const Supplier = lazy(() => import("./pages/supplier/Supplier"));
const SupplierEditor = lazy(() => import("./pages/supplier/SupplierEditor"));
const Warehouse = lazy(() => import("./pages/warehouse/Warehouse"));
const WarehouseEditor = lazy(() => import("./pages/warehouse/WarehouseEditor"));
const Purchase = lazy(() => import("./pages/purchase/Purchase"));
const PurchaseEditor = lazy(() => import("./pages/purchase/PurchaseEditor"));

const routes = 
[
    { 
        path: "/suppliers", 
        component: Supplier 
    },
    { 
        path: "/suppliers/create", 
        component: SupplierEditor 
    },
    { 
        path: "/suppliers/:id/edit", 
        component: SupplierEditor 
    },
    { 
        path: "/warehouses", 
        component: Warehouse 
    },
    { 
        path: "/warehouses/create", 
        component: WarehouseEditor 
    },
    { 
        path: "/warehouses/:id/edit", 
        component: WarehouseEditor 
    },
    { 
        path: "/purchases", 
        component: Purchase 
    },
    { 
        path: "/purchases/create", 
        component: PurchaseEditor 
    },
    { 
        path: "/purchases/:id/edit", 
        component: PurchaseEditor 
    },
];

const getNavigation = ({ can }) => {
    const submenus = [
        can("suppliers-read") && { label: "Suppliers", path: "/suppliers" },
        can("warehouses-read") && { label: "Warehouses", path: "/warehouses" },
        can("purchases-read") && { label: "Purchases", path: "/purchases" },
    ].filter(Boolean);

    if (!submenus.length) return null;

    return {
        title: "Inventory & Stock",
        icon: <DatabaseOutlined />,
        submenus,
    };
};

export const inventoryStockModule = {
    key: "InventoryStock",
    name: "Inventory & Stock Management",
    routes,
    getNavigation,
};
