import { AccountBookOutlined, BookOutlined,DollarOutlined,TagsOutlined,SwapOutlined } from "@ant-design/icons";
import { lazy } from "react";

const Account               = lazy(() => import("./pages/account/Account"));
const AccountEditor         = lazy(() => import("./pages/account/AccountEditor"));
const AccountTransfer       = lazy(() => import("./pages/account-transfer/AccountTransfer"));
const AccountTransferEditor = lazy(() => import("./pages/account-transfer/AccountTransferEditor"));
const SupplierLedger        = lazy(() => import("./pages/supplier-ledger/SupplierLedger"));
const Expense               = lazy(() => import("./pages/expense/Expense"));
const ExpenseEditor         = lazy(() => import("./pages/expense/ExpenseEditor"));
const ExpenseCategory       = lazy(() => import("./pages/expense-category/ExpenseCategory"));

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
        path: "/account-transfers", 
        component: AccountTransfer 
    },
    { 
        path: "/account-transfers/create", 
        component: AccountTransferEditor 
    },
    { 
        path: "/account-transfers/:id/edit", 
        component: AccountTransferEditor 
    },
    { 
        path: "/supplier-ledger", 
        component: SupplierLedger 
    },
    { 
        path: "/expenses", 
        component: Expense 
    },
    { 
        path: "/expenses/create", 
        component: ExpenseEditor 
    },
    { 
        path: "/expenses/:id/edit", 
        component: ExpenseEditor 
    },
    { 
        path: "/expense-categories", 
        component: ExpenseCategory 
    },
];

const getNavigation = ({ can }) => {
    const canAccounts          = can("accounts-read");
    const canTransfers         = can("account-transfers-read");
    const canSupplierLedger    = can("supplier-ledgers-read") || can("suppliers-read");
    const canExpenses          = can("expenses-read");
    const canExpenseCategories = can("expense-categories-read");

    if (!canAccounts && !canTransfers && !canSupplierLedger && !canExpenses && !canExpenseCategories) return null;

    const submenus = [];
    if (canAccounts) submenus.push({ label: "Accounts", path: "/accounts" });
    if (canTransfers) submenus.push({ label: "Account Transfer", path: "/account-transfers", icon: <SwapOutlined /> });
    if (canSupplierLedger) submenus.push({ label: "Supplier Ledger", path: "/supplier-ledger", icon: <BookOutlined /> });
    if (canExpenses) submenus.push({ label: "Expenses", path: "/expenses", icon: <DollarOutlined /> });
    if (canExpenseCategories) submenus.push({ label: "Expense Categories", path: "/expense-categories", icon: <TagsOutlined /> });

    return { title: "Account Management", icon: <AccountBookOutlined />, submenus };
};

export const accountingModule = {
    key: "Accounting",
    name: "Accounting Management",
    routes,
    getNavigation,
};
