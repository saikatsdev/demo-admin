import { AccountBookOutlined, BookOutlined,DollarOutlined,TagsOutlined,SwapOutlined,PlusCircleOutlined,DollarCircleOutlined,CreditCardOutlined } from "@ant-design/icons";
import { lazy } from "react";

const Account               = lazy(() => import("./pages/account/Account"));
const AccountEditor         = lazy(() => import("./pages/account/AccountEditor"));
const AccountTransfer       = lazy(() => import("./pages/account-transfer/AccountTransfer"));
const AccountTransferEditor = lazy(() => import("./pages/account-transfer/AccountTransferEditor"));
const SupplierLedger        = lazy(() => import("./pages/supplier-ledger/SupplierLedger"));
const Expense               = lazy(() => import("./pages/expense/Expense"));
const ExpenseEditor         = lazy(() => import("./pages/expense/ExpenseEditor"));
const ExpenseCategory       = lazy(() => import("./pages/expense-category/ExpenseCategory"));
const Income                = lazy(() => import("./pages/income/Income"));
const IncomeEditor          = lazy(() => import("./pages/income/IncomeEditor"));
const IncomeCategory        = lazy(() => import("./pages/income-category/IncomeCategory"));
const Payable               = lazy(() => import("./pages/payable/Payable"));
const Receivable            = lazy(() => import("./pages/receivable/Receivable"));

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
        path: "/incomes", 
        component: Income 
    },
    { 
        path: "/incomes/create", 
        component: IncomeEditor 
    },
    { 
        path: "/incomes/:id/edit", 
        component: IncomeEditor 
    },
    { 
        path: "/income-categories", 
        component: IncomeCategory 
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
    { 
        path: "/payables", 
        component: Payable 
    },
    { 
        path: "/receivables", 
        component: Receivable 
    },
];

const getNavigation = ({ can }) => {
    const canAccounts          = can("accounts-read");
    const canTransfers         = can("account-transfers-read");
    const canSupplierLedger    = can("supplier-ledgers-read") || can("suppliers-read");
    const canIncomes           = can("incomes-read");
    const canIncomeCategories  = can("income-categories-read");
    const canExpenses          = can("expenses-read");
    const canExpenseCategories = can("expense-categories-read");
    const canPayables          = can("payables-read") || can("supplier-ledgers-read") || can("suppliers-read");
    const canReceivables       = can("receivables-read");

    if (!canAccounts && !canTransfers && !canSupplierLedger && !canIncomes && !canIncomeCategories && !canPayables && !canExpenses && !canReceivables && !canExpenseCategories) return null;

    const submenus = [];
    if (canAccounts) submenus.push({ label: "Accounts", path: "/accounts" });
    if (canTransfers) submenus.push({ label: "Account Transfer", path: "/account-transfers", icon: <SwapOutlined /> });
    if (canSupplierLedger) submenus.push({ label: "Supplier Ledger", path: "/supplier-ledger", icon: <BookOutlined /> });
    if (canIncomes) submenus.push({ label: "Other Income", path: "/incomes", icon: <PlusCircleOutlined /> });
    if (canIncomeCategories) submenus.push({ label: "Income Categories", path: "/income-categories", icon: <TagsOutlined /> });
    if (canExpenses) submenus.push({ label: "Expenses", path: "/expenses", icon: <DollarOutlined /> });
    if (canExpenseCategories) submenus.push({ label: "Expense Categories", path: "/expense-categories", icon: <TagsOutlined /> });
    if (canPayables) {submenus.push({ label: "Payables", path: "/payables", icon: <CreditCardOutlined /> })}
    if (canReceivables) {submenus.push({ label: "Receivables", path: "/receivables", icon: <DollarCircleOutlined /> });}

    return { 
        title: "Account Management", 
        icon: <AccountBookOutlined />, 
        submenus 
    };
};

export const accountingModule = {
    key: "Accounting",
    name: "Accounting Management",
    routes,
    getNavigation,
};
