import { InboxOutlined } from "@ant-design/icons";
import { lazy } from "react";

const CustomerInbox     = lazy(() => import("./pages/inbox/CustomerInbox"));
const ConnectedChannels = lazy(() => import("./pages/connected-channels/ConnectedChannels"));

const routes = 
[
    { 
        path     : '/inbox-customer',
        component: CustomerInbox
    },
    { 
        path: "/inbox-customer/channels", 
        component: ConnectedChannels 
    },
];

const getNavigation = ({ can }) => {
    const canInbox        = can("customer-inbox-read");
    const canReadChannels = can("customer-inbox-channels-read");

    const submenus = [];
    
    if (canInbox) submenus.push({ label: "Inbox", path: "/inbox-customer", end: true });
    if (canReadChannels) submenus.push({ label: "Connected Channels", path: "/inbox-customer/channels" });
    if (!submenus.length) return null;

    return {
        title: "Customer Inbox",
        icon: <InboxOutlined />,
        submenus,
    };
};

export const customerInboxModule = {
    key: "CustomerInbox",
    name: "Customer Inbox",
    routes,
    getNavigation,
};
