import { DatabaseOutlined } from "@ant-design/icons";
import { lazy } from "react";

const Supplier        = lazy(() => import("./pages/supplier/Supplier"));
const SupplierEditor  = lazy(() => import("./pages/supplier/SupplierEditor"));
const Warehouse       = lazy(() => import("./pages/warehouse/Warehouse"));
const WarehouseEditor = lazy(() => import("./pages/warehouse/WarehouseEditor"));
const Purchase        = lazy(() => import("./pages/purchase/Purchase"));
const PurchaseEditor  = lazy(() => import("./pages/purchase/PurchaseEditor"));
const RawMaterial = lazy(() => import("./pages/raw-material/RawMaterial"));
const RawMaterialEditor = lazy(() => import("./pages/raw-material/RawMaterialEditor"));
const RawMaterialPurchase = lazy(() => import("./pages/raw-material-purchase/RawMaterialPurchase"));
const RawMaterialPurchaseEditor = lazy(() => import("./pages/raw-material-purchase/RawMaterialPurchaseEditor"));
const StockOverview = lazy(() => import("./pages/stock/StockOverview"));
const StockAdjustment = lazy(() => import("./pages/stock-adjustment/StockAdjustment"));
const StockAdjustmentEditor = lazy(() => import("./pages/stock-adjustment/StockAdjustmentEditor"));
const StockTransfer = lazy(() => import("./pages/stock-transfer/StockTransfer"));
const StockTransferEditor = lazy(() => import("./pages/stock-transfer/StockTransferEditor"));

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
    { 
        path: "/raw-materials", 
        component: RawMaterial 
    },
    { 
        path: "/raw-materials/create", 
        component: RawMaterialEditor 
    },
    { 
        path: "/raw-materials/:id/edit", 
        component: RawMaterialEditor 
    },
    { 
        path: "/raw-material-purchases", 
        component: RawMaterialPurchase 
    },
    { 
        path: "/raw-material-purchases/create", 
        component: RawMaterialPurchaseEditor 
    },
    { 
        path: "/raw-material-purchases/:id/edit", 
        component: RawMaterialPurchaseEditor 
    },
    { 
        path: "/stocks", component: StockOverview 
    },
    { 
        path: "/stock-adjustments", 
        component: StockAdjustment 
    },
    { 
        path: "/stock-adjustments/create", 
        component: StockAdjustmentEditor 
    },
    { 
        path: "/stock-adjustments/:id/edit", 
        component: StockAdjustmentEditor 
    },
    { 
        path: "/stock-transfers", 
        component: StockTransfer 
    },
    { 
        path: "/stock-transfers/create", 
        component: StockTransferEditor 
    },
    { 
        path: "/stock-transfers/:id/edit", 
        component: StockTransferEditor 
    },
];

const getNavigation = ({ can }) => {
    const submenus = [
        can("purchases-read") && { label: "Purchase", path: "/purchases" },
        can("raw-material-purchases-read") && { label: "Raw Material Purchase", path: "/raw-material-purchases" },
        can("raw-materials-read") && { label: "Raw Materials", path: "/raw-materials" },
        can("stocks-read") && { label: "Stock Overview", path: "/stocks" },
        can("stock-adjustments-read") && { label: "Stock Adjustment", path: "/stock-adjustments" },
        can("stock-transfers-read") && { label: "Warehouse Transfer", path: "/stock-transfers" },
        can("suppliers-read") && { label: "Suppliers", path: "/suppliers" },
        can("warehouses-read") && { label: "Warehouse", path: "/warehouses" },
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
