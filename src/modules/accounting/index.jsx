import { AccountBookOutlined, BookOutlined } from "@ant-design/icons";
import { lazy } from "react";

const Account = lazy(() => import("./pages/account/Account"));
const AccountEditor = lazy(() => import("./pages/account/AccountEditor"));
const SupplierLedger = lazy(() => import("./pages/supplier-ledger/SupplierLedger"));

const routes = 
[
    { 
        path: "/accounts", 
        component: Account 
    },
    { 
        path: "/accounts/create", 
        component: AccountEditor 
    },
    { 
        path: "/accounts/:id/edit", 
        component: AccountEditor 
    },
    { 
        path: "/supplier-ledger", 
        component: SupplierLedger 
    },
];

const getNavigation = ({ can }) => {
    const canAccounts = can("accounts-read");
    const canSupplierLedger = can("supplier-ledgers-read") || can("suppliers-read");

    if (!canAccounts && !canSupplierLedger) return null;

    const submenus = [];
    if (canAccounts) submenus.push({ label: "Accounts", path: "/accounts" });
    if (canSupplierLedger) submenus.push({ label: "Supplier Ledger", path: "/supplier-ledger", icon: <BookOutlined /> });

    return {
        title: "Account Management",
        icon: <AccountBookOutlined />,
        submenus,
    };
};

export const accountingModule = {
    key: "Accounting",
    name: "Accounting Management",
    routes,
    getNavigation,
};
