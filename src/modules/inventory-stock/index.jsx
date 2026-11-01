import { DatabaseOutlined } from "@ant-design/icons";
import { lazy } from "react";

const Supplier = lazy(() => import("./pages/supplier/Supplier"));
const SupplierEditor = lazy(() => import("./pages/supplier/SupplierEditor"));
const Warehouse = lazy(() => import("./pages/warehouse/Warehouse"));
const WarehouseEditor = lazy(() => import("./pages/warehouse/WarehouseEditor"));

const routes = [
    { path: "/suppliers", component: Supplier },
    { path: "/suppliers/create", component: SupplierEditor },
    { path: "/suppliers/:id/edit", component: SupplierEditor },
    { path: "/warehouses", component: Warehouse },
    { path: "/warehouses/create", component: WarehouseEditor },
    { path: "/warehouses/:id/edit", component: WarehouseEditor },
];

const getNavigation = ({ can }) => {
    const submenus = [
        can("suppliers-read") && { label: "Suppliers", path: "/suppliers" },
        can("warehouses-read") && { label: "Warehouses", path: "/warehouses" },
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
