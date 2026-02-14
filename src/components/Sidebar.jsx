import {BarChartOutlined,DeliveredProcedureOutlined,FallOutlined,HeartTwoTone,NotificationOutlined,ProductOutlined,PropertySafetyOutlined,ToolOutlined,FileTextOutlined,BulbOutlined,PictureOutlined,} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePermission } from "../hooks/usePermission";

const Sidebar = ({ onMenuSelect }) => {
  const navigate                    = useNavigate();
  const location                    = useLocation();
  const [activeMenu, setActiveMenu] = useState(null);

  const {permissions} = usePermission();

  const can = (permission) => permissions?.includes(permission);

  const userManagementSubmenus = [
    can('users-read') && { label: "Customers", path: "/customer" },
    can('users-read') && { label: "Management", path: "/management" },
    can('users-read') && { label: "Employee", path: "/employee" },
    can('roles-read') && { label: "Roles", path: "/roles" },
  ].filter(Boolean);

  const reportSubmenus = [
    can('reports-read') && { label: "Order Report", path: "/report/orders" },
    can('reports-read') && { label: "Sell Report", path: "/sales/report" },
    can('reports-read') && { label: "Customer Report", path: "/all/customer/report" },
    can('reports-read') && { label: "Upsell Report", path: "/upsell/report" },
    can('reports-read') && { label: "Downsell Report", path: "/downsell/report" },
    can('reports-read') && { label: "Followup Report", path: "/followup/report" },
    can('reports-read') && { label: "Stock Report", path: "/stock/report" },
    can('reports-read') && { label: "Cross Sell Report", path: "/cross/sell/report" },
    can('reports-read') && { label: "Return Report", path: "/return/report" },
    can('reports-read') && { label: "Cancel Report", path: "/cancel/report" },
    can('reports-read') && { label: "Product Report", path: "/product/report" },
    can('reports-read') && { label: "Location Report", path: "/location/report" },
    can('reports-read') && { label: "Courier Report", path: "/courier/report" },
  ].filter(Boolean);

  const menus = [
    { title: "Dashboard", icon: "🏠", path: "/dashboard" },

    userManagementSubmenus.length > 0 && {
      title: "User Management",
      icon: "👥",
      submenus: userManagementSubmenus,
    },
    {
      title: "Product Management",
      icon: <ProductOutlined />,
      submenus: [
        can("products-read") && { label: "Products", path: "/products" },
        can("up-sells-read") && { label: "Upsell Products", path: "/upsell" },
        can("down-sells-read") && { label: "Downsell Products", path: "/downsell-coupon" },
        can("reviews-read") && { label: "Review", path: "/review" },
        can("attributes-read") && { label: "Attributes", path: "/attributes" },
        can("product-types-read") && { label: "Product Type", path: "/product-types" },
        can("categories-read") && { label: "Categories", path: "/categories" },
        can("sub-categories-read") && { label: "Sub Categories", path: "/subcategories" },
        can("sub-sub-categories-read") && { label: "Sub Sub Categories", path: "/subsubcategories" },
        can("brands-read") && { label: "Brand", path: "/brands" },
      ].filter(Boolean),
    },
    {
      title: "Marketing Tools",
      icon: <ToolOutlined />,
      submenus: [
        can('product-catalogs-read') && { label: "Product Catelog", path: "/product/catalogs" },
        can('gtm-read') && { label: "GTM Manage", path: "/gtm-manage" },
        can('microsoft-clarity') && { label: "Microsoft Clarity", path: "/clarity-id" },
        can('google-analytical') && { label: "Google Analytical", path: "/google-analytical" },
        can('facebook-meta-pixel') && { label: "Facebook Meta Pixel", path: "/facebook/meta/pixel" },
        can('pusher') && { label: "Pusher Setup", path: "/pusher/settings" },
      ].filter(Boolean),
    },
    {
      title: "Order Management",
      icon: <PropertySafetyOutlined />,
      submenus: [
        can('orders-read') && { label: "Orders", path: "/orders" },
        can('incomplete-orders-read') && { label: "Incomplete", path: "/incomplete/orders" },
        can('follow-up-read') && { label: "Follow Up Order", path: "/followup-sell" },
        can('cancel-reasons-read') && { label: "Cancel Reason", path: "/cancel-reasons" },
        can('delivery-gateways') && { label: "Delivery Charge", path: "/delivery/charge" },
        can('free-delivery-read') && { label: "Free Delivery", path: "/free/delivery" },
        can('payment-gateways-read') && { label: "Payment Gateway", path: "/payment-gateways" },
        can('online-payment-discounts-read') && { label: "Payment Discount", path: "/online-payment/discounts" },
        can('statuses-read') && { label: "Order Status", path: "/statuses" },
        can('coupons-read') && { label: "Coupon", path: "/coupons" },
        can('order-froms-read') && { label: "Order Tag", path: "/order-tag" },
        can('customer-types-read') && { label: "Customer Type", path: "/types/customer" },
        can('couriers-read') && { label: "Delivery Man", path: "/couriers" },
      ].filter(Boolean),
    },
    {
      title: "Media Management",
      icon: <PictureOutlined/>,
      submenus: [
        { label: "Gallary", path: "/gallary" },
      ],
    },
    {
      title: "Courier Management",
      icon: <DeliveredProcedureOutlined />,
      submenus: [
        can('couriers-read') && { label: "All", path: "/all/couriers" },
        can('stead-fast-read') && { label: "SteadFast", path: "/steadfast" },
        can('pathao-read') && { label: "Pathao", path: "/pathao" },
        can('redx-read') && { label: "Redx", path: "/redx" },
        can('couriers-settings-read') && { label: "Settings", path: "/courier/settings" },
      ].filter(Boolean),
    },
    {
      title: "Fake Order Solution",
      icon: <FallOutlined />,
      submenus: [
        can('order-guards-read') && { label: "Block List", path: "/block-users" },
        can('order-guards-read') && { label: "Block Settings", path: "/block-settings" },
        { label: "Fraud Checker", path: "/currier-report" },
      ],
    },
    reportSubmenus.length > 0 && {
      title: "Report",
      icon: <BarChartOutlined />,
      submenus: reportSubmenus,
    },

    {
      title: "Blog Management",
      icon: <PropertySafetyOutlined />,
      submenus: [
        can('blog-posts-read') && { label: "Blog Post", path: "/blogs" },
        can('blog-posts-create') && { label: "Add Blog Post", path: "/add/blog" },
        can('blog-post-categories-read') && { label: "Blog Category", path: "/blog/categories" },
        can('tags-read') && { label: "Blog Tags", path: "/blog/tag" },
      ],
    },

    can('seo-pages-read') && { title: "Seo Pages", icon: <FileTextOutlined />, path: "/seo-pages" },

    can('campaigns-read') && { title: "Campaigns", icon: <NotificationOutlined />, path: "/campaigns" },

    {
      title: "CMS",
      icon: <PropertySafetyOutlined />,
      submenus: [
        { label: "Section & Banner", path: "/section-list" },
        { label: "Slider", path: "/sliders" },
        { label: "About", path: "/about" },
        { label: "Contact", path: "/contacts" },
        { label: "Privacy & Policy", path: "/privacy-policy" },
        { label: "Terms & Condition", path: "/terms-and-conditions" },
      ],
    },

    can('settings-read') && { title: "Settings", icon: "⚙️", path: "/settings" },

    { title: "Tutorial", icon: <BulbOutlined />, path: "/tutorial" },
  ];

  const handleMenuClick = (menu) => {
    setActiveMenu(menu.title);
    if (menu.submenus) {
      onMenuSelect(menu.submenus);
      navigate(menu.submenus[0].path);
    } else {
      onMenuSelect([]);
      navigate(menu.path);
    }
  };

  useEffect(() => {
    const currentPath = location.pathname;
    const active = menus.find((menu) => {
      if (menu.path && menu.path === currentPath) return true;
      if (menu.submenus) {
        return menu.submenus.some((sub) => currentPath.startsWith(sub.path));
      }
      return false;
    });

    if (active) {
      setActiveMenu(active.title);
      if (active.submenus) onMenuSelect(active.submenus);
      else onMenuSelect([]);
    }
  }, [location.pathname]);

  const currentYear = new Date().getFullYear();

  return (
    <aside className="sidebar" aria-label="Sidebar">
      <div className="current">
        <span>Current Year</span>
        <strong>{currentYear}</strong>
      </div>

      <nav aria-label="Main navigation">
        {menus.map((menu, i) => {
          const isActive = activeMenu === menu.title;
          return (
            <div key={i} className="nav-group">
              <button className={`nav-item-menu ${isActive ? "active" : ""}`} onClick={() => handleMenuClick(menu)}>
                <span className="icon">{menu.icon}</span>
                <span className="label">{menu.title}</span>
              </button>
            </div>
          );
        })}
      </nav>
      <div className="bottom">
        <p>
          Developed By
          <a href="https://servicekey.com.bd/" target="_blank" rel="noopener noreferrer">
            Service Key
          </a>
          .
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
