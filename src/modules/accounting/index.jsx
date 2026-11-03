import { AccountBookOutlined } from "@ant-design/icons";
import { lazy } from "react";

const Account = lazy(() => import("./pages/account/Account"));
const AccountEditor = lazy(() => import("./pages/account/AccountEditor"));

const routes = 
[
    { 
        path     : "/accounts",
        component: Account
    },
    { 
        path     : "/accounts/create",
        component: AccountEditor
    },
    { 
        path     : "/accounts/:id/edit",
        component: AccountEditor
    },
];

const getNavigation = ({ can }) => {
    if (!can("accounts-read")) return null;

    return {
        title: "Account Management",
        icon: <AccountBookOutlined />,
        submenus: [{ label: "Accounts", path: "/accounts" }],
    };
};

export const accountingModule = {
    key: "Accounting",
    name: "Accounting Management",
    routes,
    getNavigation,
};
