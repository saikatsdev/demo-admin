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

  const menus = [
    { title: "Dashboard", icon: "🏠", path: "/dashboard" },
    {
      title: "User Management",
      icon: "👥",
      submenus: [
        { label: "Customers", path: "/customer" },
        { label: "Management", path: "/management" },
        { label: "Employee", path: "/employee" },
        { label: "Roles", path: "/roles" },
      ],
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
        { label: "Product Catelog", path: "/product/catalogs" },
        { label: "GTM Manage", path: "/gtm-manage" },
        { label: "Microsoft Clarity", path: "/clarity-id" },
        { label: "Google Analytical", path: "/google-analytical" },
        { label: "Facebook Meta Pixel", path: "/facebook/meta/pixel" },
        { label: "Pusher Setup", path: "/pusher/settings" },
      ],
    },
    {
      title: "Order Management",
      icon: <PropertySafetyOutlined />,
      submenus: [
        { label: "Orders", path: "/orders" },
        { label: "Incomplete", path: "/incomplete/orders" },
        { label: "Follow Up Order", path: "/followup-sell" },
        { label: "Cancel Reason", path: "/cancel-reasons" },
        { label: "Delivery Charge", path: "/delivery/charge" },
        { label: "Free Delivery", path: "/free/delivery" },
        { label: "Payment Gateway", path: "/payment-gateways" },
        { label: "Payment Discount", path: "/online-payment/discounts" },
        { label: "Order Status", path: "/statuses" },
        { label: "Coupon", path: "/coupons" },
        { label: "Order Tag", path: "/order-tag" },
        { label: "Customer Type", path: "/types/customer" },
        { label: "Delivery Man", path: "/couriers" },
      ],
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
        { label: "All", path: "/all/couriers" },
        { label: "SteadFast", path: "/steadfast" },
        { label: "Pathao", path: "/pathao" },
        { label: "Redx", path: "/redx" },
        { label: "Settings", path: "/courier/settings" },
      ],
    },

    {
      title: "Fake Order Solution",
      icon: <FallOutlined />,
      submenus: [
        { label: "Block List", path: "/block-users" },
        { label: "Block Settings", path: "/block-settings" },
        { label: "Fraud Checker", path: "/currier-report" },
      ],
    },

    {
      title: "Report",
      icon: <BarChartOutlined />,
      submenus: [
        { label: "Order Report", path: "/report/orders" },
        { label: "Sell Report", path: "/sales/report" },
        { label: "Customer Report", path: "/all/customer/report" },
        { label: "Upsell Report", path: "/upsell/report" },
        { label: "Downsell Report", path: "/downsell/report" },
        { label: "Followup Report", path: "/followup/report" },
        { label: "Stock Report", path: "/stock/report" },
        { label: "Cross Sell Report", path: "/cross/sell/report" },
        { label: "Return Report", path: "/return/report" },
        { label: "Cancel Report", path: "/cancel/report" },
        { label: "Product Report", path: "/product/report" },
        { label: "Location Report", path: "/location/report" },
        { label: "Courier Report", path: "/courier/report" },
      ],
    },

    {
      title: "Blog Management",
      icon: <PropertySafetyOutlined />,
      submenus: [
        { label: "Blog Post", path: "/blogs" },
        { label: "Add Blog Post", path: "/add/blog" },
        { label: "Blog Category", path: "/blog/categories" },
        { label: "Blog Tags", path: "/blog/tag" },
      ],
    },

    { title: "Seo Pages", icon: <FileTextOutlined />, path: "/seo-pages" },

    { title: "Campaigns", icon: <NotificationOutlined />, path: "/campaigns" },

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

    { title: "Settings", icon: "⚙️", path: "/settings" },

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
