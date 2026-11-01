import { DatabaseOutlined } from "@ant-design/icons";
import { lazy } from "react";

const Supplier = lazy(() => import("./pages/supplier/Supplier"));
const SupplierEditor = lazy(() => import("./pages/supplier/SupplierEditor"));

const routes = [
    { path: "/suppliers", component: Supplier },
    { path: "/suppliers/create", component: SupplierEditor },
    { path: "/suppliers/:id/edit", component: SupplierEditor },
];

const getNavigation = ({ can }) => {
    const submenus = [
        can("suppliers-read") && { label: "Suppliers", path: "/suppliers" },
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
