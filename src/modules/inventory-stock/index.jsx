import { DatabaseOutlined } from "@ant-design/icons";
import { lazy } from "react";

const Supplier                  = lazy(() => import("./pages/supplier/Supplier"));
const SupplierEditor            = lazy(() => import("./pages/supplier/SupplierEditor"));
const Warehouse                 = lazy(() => import("./pages/warehouse/Warehouse"));
const WarehouseEditor           = lazy(() => import("./pages/warehouse/WarehouseEditor"));
const Purchase                  = lazy(() => import("./pages/purchase/Purchase"));
const PurchaseEditor            = lazy(() => import("./pages/purchase/PurchaseEditor"));
const PurchaseReport            = lazy(() => import("./pages/purchase-report/PurchaseReport"));
const RawMaterial               = lazy(() => import("./pages/raw-material/RawMaterial"));
const RawMaterialEditor         = lazy(() => import("./pages/raw-material/RawMaterialEditor"));
const RawMaterialPurchase       = lazy(() => import("./pages/raw-material-purchase/RawMaterialPurchase"));
const RawMaterialPurchaseEditor = lazy(() => import("./pages/raw-material-purchase/RawMaterialPurchaseEditor"));
const RawMaterialPurchaseReport = lazy(() => import("./pages/raw-material-purchase-report/RawMaterialPurchaseReport"));
const StockOverview             = lazy(() => import("./pages/stock/StockOverview"));
const LowStockAlert             = lazy(() => import("./pages/low-stock-alert/LowStockAlert"));
const StockReport               = lazy(() => import("./pages/stock/StockReport"));
const StockAdjustment           = lazy(() => import("./pages/stock-adjustment/StockAdjustment"));
const StockAdjustmentEditor     = lazy(() => import("./pages/stock-adjustment/StockAdjustmentEditor"));
const StockTransfer             = lazy(() => import("./pages/stock-transfer/StockTransfer"));
const StockTransferEditor       = lazy(() => import("./pages/stock-transfer/StockTransferEditor"));
const PurchaseReturn            = lazy(() => import("./pages/purchase-return/PurchaseReturn"));
const PurchaseReturnEditor      = lazy(() => import("./pages/purchase-return/PurchaseReturnEditor"));

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
        path: "/purchase-report",
        component: PurchaseReport
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
        path: "/raw-material-purchase-report",
        component: RawMaterialPurchaseReport
    },
    { 
        path: "/stocks", 
        component: StockOverview 
    },
    {  
        path: "/stock-report", 
        component: StockReport 
    },
    { 
        path: "/stock-adjustments", 
        component: StockAdjustment 
    },
    {
        path: "/low-stock-alert",
        component: LowStockAlert
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
    {
        path: "/purchase-returns",
        component: PurchaseReturn
    },
    {
        path: "/purchase-returns/create",
        component: PurchaseReturnEditor
    },
    {
        path: "/purchase-returns/:id/edit",
        component: PurchaseReturnEditor
    },
];

const getNavigation = ({ can }) => {
    const submenus = [
        can("purchases-read") && { label: "Purchase", path: "/purchases" },
        can("purchases-read") && { label: "Purchase Report", path: "/purchase-report" },
        can("raw-material-purchases-read") && { label: "Raw Material Purchase", path: "/raw-material-purchases" },
        can("raw-material-purchases-read") && { label: "Raw Material Purchase Report", path: "/raw-material-purchase-report" },
        can("raw-materials-read") && { label: "Raw Materials", path: "/raw-materials" },
        can("stocks-read") && { label: "Stock Overview", path: "/stocks" },
        can("stocks-read") && { label: "Inventory Stock Report", path: "/stock-report" },
        can("stocks-read") && { label: "Low Stock Alert", path: "/low-stock-alert" },
        can("stock-adjustments-read") && { label: "Stock Adjustment", path: "/stock-adjustments" },
        can("stock-transfers-read") && { label: "Warehouse Transfer", path: "/stock-transfers" },
        can("purchase-returns-read") && { label: "Purchase Return", path: "/purchase-returns" },
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
