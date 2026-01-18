import "antd/dist/reset.css";
import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import "./print.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "./assets/css/admin.css";
import "./assets/css/dynamic-menu.css";
import AdminLayout from "./components/AdminLayout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Role from "./pages/auth/Role";
import User from "./pages/auth/User";
import AddBlog from "./pages/blog/AddBlog";
import Blog from "./pages/blog/Blog";
import BlogCategory from "./pages/blog/BlogCategory";
import BlogTag from "./pages/blog/BlogTag";
import EditBlog from "./pages/blog/EditBlog";
import AddCampaign from "./pages/campaigns/AddCampaign";
import Campaigns from "./pages/campaigns/Campaigns";
import EditCampaign from "./pages/campaigns/EditCampaign";
import AddCategorySection from "./pages/categorySection/AddCategorySection";
import CategorySection from "./pages/categorySection/CategorySection";
import EditCategorySection from "./pages/categorySection/EditCategorySection";
import Pathao from "./pages/courier/Pathao";
import REDX from "./pages/courier/RedX";
import SteadFast from "./pages/courier/SteadFast";
import Dashboard from "./pages/Dashboard";
import BlockList from "./pages/order/blocklist/BlockList";
import BlockSettings from "./pages/order/blocklist/BlockSettings";
import FraudCheck from "./pages/order/blocklist/FraudCheck";
import CancelReason from "./pages/order/CancelReason";
import Courier from "./pages/order/courier/Courier";
import CustomerType from "./pages/order/CustomerType";
import DeliveryCharge from "./pages/order/DeliveryCharge";
import DownSellCoupon from "./pages/order/DownSellCoupon";
import FreeDelivery from "./pages/order/FreeDelivery";
import EditIncomepleteOrder from "./pages/order/incomplete/EditIncomepleteOrder";
import InCompleteOrder from "./pages/order/incomplete/InCompleteOrder";
import MarketCoupon from "./pages/order/MarketCoupon";
import OnlinePaymentDiscount from "./pages/order/OnlinePaymentDiscount";
import Order from "./pages/order/Order";
import OrderAdd from "./pages/order/OrderAdd";
import OrderEdit from "./pages/order/OrderEdit";
import OrderStatus from "./pages/order/OrderStatus";
import OrderTag from "./pages/order/OrderTag";
import PaymentGateway from "./pages/order/PaymentGateway";
import Attribute from "./pages/product/attribute/Attribute";
import SectionBanner from "./pages/product/banner/SectionBanner";
import Brand from "./pages/product/brand/Brand";
import Category from "./pages/product/category/Category";
import AddProductCatelog from "./pages/product/catelog/AddProductCatelog";
import EditProductCatelog from "./pages/product/catelog/EditProductCatelog";
import ProductCatelog from "./pages/product/catelog/ProductCatelog";
import GtmSetting from "./pages/product/catelog/GtmSetting";
import Product from "./pages/product/Product";
import ProductAdd from "./pages/product/ProductAdd";
import ProductEdit from "./pages/product/ProductEdit";
import SubCategory from "./pages/product/subcategory/SubCategory";
import SubSubCategory from "./pages/product/subsubcategory/SubSubCategory";
import AddSection from "./pages/section&product/AddSection";
import EditSection from "./pages/section&product/EditSection";
import SectionProdcut from "./pages/section&product/SectionProdcut";
import Settings from "./pages/setting/Settings";
import RedirectIfAuth from "./routes/RedirectIfAuth";
import RequireAuth from "./routes/RequireAuth";
import {InvoiceA4,InvoiceA5,InvoicePos,MultipleInvoice} from "./pages/invoice";
import Customer from "./pages/auth/Customer";
import Employee from "./pages/auth/Employee";
import Clarity from "./pages/product/catelog/Clarity";
import GoogleAnalytic from "./pages/product/catelog/GoogleAnalytic";
import SEO from "./pages/seo/SEO";
import CustomerReport from "./pages/report/CustomerReport";
import SaleReport from "./pages/report/SaleReport";
import AddUpSell from "./pages/product/thankyou/AddUpSell";
import EditUpSell from "./pages/product/thankyou/EditUpSell";
import OrderReport from "./pages/report/OrderReport";
import UpsellSetting from "./pages/product/thankyou/UpsellSetting";
import Tutorial from "./pages/tutorial/Tutorial";
import FacebookMeta from "./pages/product/catelog/FacebookMeta";
import AddDownSell from "./pages/order/downsell/AddDownSell";
import EditDownSell from "./pages/order/downsell/EditDownSell";
import AddCustomer from "./pages/auth/AddCustomer";
import EditAttribute from "./pages/product/attribute/EditAttribute";
import Review from "./pages/product/review/Review";
import AddReview from "./pages/product/review/AddReview";
import EditReview from "./pages/product/review/EditReview";
import EditCustomer from "./pages/auth/EditCustomer";
import AddPaymentGateway from "./pages/order/incomplete/AddPaymentGateway";
import EditPaymentGateway from "./pages/order/incomplete/EditPaymentGateway";
import Gallary from "./pages/gallary/Gallary";
import AddSubCategory from "./pages/product/subcategory/AddSubCategory";
import EditSubCategory from "./pages/product/subcategory/EditSubCategory";
import AddBlogCategory from "./pages/blog/AddBlogCategory";
import EditBlogCategory from "./pages/blog/EditBlogCategory";
import FollowupSell from "./pages/order/followupsell/FollowupSell";
import AddSubSubCategory from "./pages/product/subsubcategory/AddSubSubCategory";
import EditSubSubCategory from "./pages/product/subsubcategory/EditSubSubCategory";
import AddEmployee from "./pages/auth/employee/AddEmployee";
import EditEmployee from "./pages/auth/employee/EditEmployee";
import AddManagement from "./pages/auth/management/AddManagement";
import EditManagement from "./pages/auth/management/EditManagement";
import Management from "./pages/auth/management/Management";
import AddBrand from "./pages/product/brand/AddBrand";
import EditBrand from "./pages/product/brand/EditBrand";
import AddCategory from "./pages/product/category/AddCategory";
import EditCategory from "./pages/product/category/EditCategory";
import AddCourier from "./pages/order/courier/AddCourier";
import EditCourier from "./pages/order/courier/EditCourier";
import ProductType from "./pages/product/producttype/ProductType";
import AddProductType from "./pages/product/producttype/AddProductType";
import EditProductType from "./pages/product/producttype/EditProductType";
import EditBanner from "./pages/product/banner/EditBanner";
import UpsellReport from "./pages/report/UpsellReport";
import DownsellReport from "./pages/report/DownsellReport";
import FollowupReport from "./pages/report/FollowupReport";
import StockReport from "./pages/report/StockReport";
import CrossSellReport from "./pages/report/CrossSellReport";
import ReturnReport from "./pages/report/ReturnReport";
import CancelReport from "./pages/report/CancelReport";
import ProductReport from "./pages/report/ProductReport";
import LocationReport from "./pages/report/LocationReport";
import CourierReport from "./pages/report/CourierReport";
import Pusher from "./pages/pusher/Pusher";
import PathaStore from "./pages/courier/PathaStore";
import StoreCreate from "./pages/courier/StoreCreate";
import AddBlockUser from "./pages/order/blocklist/AddBlockUser";
import UpSell from "./pages/product/thankyou/UpSell";
import TrashList from "./components/order/TrashList";
import CourierSetting from "./pages/order/courier/CourierSetting";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDistricts } from "./features/districts/districtSlice";
import { fetchOrderFromList } from "./features/orderFrom/orderFromSlice";
import { fetchCustomerTypes } from "./features/customerType/customerTypeSlice";
import { fetchCancelReasons } from "./features/cancelReason/cancelReasonSlice";
import { fetchPaymentGateways } from "./features/paymentGateway/paymentGatewaySlice";
import { fetchCouriers } from "./features/courier/courierSlice";
import { fetchStatuses } from "./features/status/statusSlice";
import { fetchDeliveryGateways } from "./features/deliveryGateway/deliveryGatewaySlice";
import About from "./pages/cms/about/About";
import AddAbout from "./pages/cms/about/AddAbout";
import EditAbout from "./pages/cms/about/EditAbout";
import Slider from "./pages/cms/slider/Slider";
import AddSlider from "./pages/cms/slider/AddSlider";
import EditSlider from "./pages/cms/slider/EditSlider";
import Contact from "./pages/cms/contacts/Contact";
import AddContact from "./pages/cms/contacts/AddContact";
import EditContact from "./pages/cms/contacts/EditContact";
import FAQ from "./pages/cms/faqs/FAQ";
import AddFaq from "./pages/cms/faqs/AddFaq";
import EditFaq from "./pages/cms/faqs/EditFaq";
import PrivacyPolicy from "./pages/cms/privacy/PrivacyPolicy";
import AddPrivacy from "./pages/cms/privacy/AddPrivacy";
import EditPrivacy from "./pages/cms/privacy/EditPrivacy";
import TermsCondition from "./pages/cms/terms&condition/TermsCondition";
import AddTermsCondition from "./pages/cms/terms&condition/AddTermsCondition";
import EditTermsCondition from "./pages/cms/terms&condition/EditTermsCondition";

function App() {

  const dispatch        = useDispatch();
  const auth = useSelector(state => state.auth);
  const districts       = useSelector((state) => state.districts.list);
  const orderFromList   = useSelector((state) => state.orderFrom.list);
  const customerTypes   = useSelector((s) => s.customerType.list);
  const cancelReasons   = useSelector((s) => s.cancelReason.list);
  const paymentGateways = useSelector((s) => s.paymentGateway.list);
  const couriers        = useSelector((s) => s.courier.list);
  const statuses        = useSelector((s) => s.status.list);
  const deliveryGateways = useSelector((s) => s.deliveryGateway.list);

  useEffect(() => {
    if (!auth?.token) return;

    if (!districts.length) dispatch(fetchDistricts());
    if (!orderFromList.length) dispatch(fetchOrderFromList());
    if (!customerTypes.length) dispatch(fetchCustomerTypes());
    if (!cancelReasons.length) dispatch(fetchCancelReasons());
    if (!paymentGateways.length) dispatch(fetchPaymentGateways());
    if (!couriers.length) dispatch(fetchCouriers());
    if (!statuses.length) dispatch(fetchStatuses());
    if (!deliveryGateways.length) dispatch(fetchDeliveryGateways());
  }, [auth]);

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <RedirectIfAuth>
            <Login />
          </RedirectIfAuth>
        }
      />
      <Route
        path="/register"
        element={
          <RedirectIfAuth>
            <Register />
          </RedirectIfAuth>
        }
      />

      <Route element={<RequireAuth />}>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/users" element={<User />} />
          <Route path="/roles" element={<Role />} />
          <Route path="/customer" element={<Customer />} />
          <Route path="/add/customer" element={<AddCustomer />} />
          <Route path="/edit/customer/:id" element={<EditCustomer />} />

          {/* Management */}
          <Route path="/management" element={<Management />} />
          <Route path="/add/management" element={<AddManagement />} />
          <Route path="/edit/management/:id" element={<EditManagement />} />

          {/* Employee */}
          <Route path="/employee" element={<Employee />} />
          <Route path="/add/employee" element={<AddEmployee />} />
          <Route path="/edit/employee/:id" element={<EditEmployee />} />

          {/* For Product Management */}
          <Route path="/brands" element={<Brand />} />
          <Route path="/add/brand" element={<AddBrand />} />
          <Route path="/edit/brand/:id" element={<EditBrand />} />

          <Route path="/product-types" element={<ProductType />} />
          <Route path="/add/product-type" element={<AddProductType />} />
          <Route path="/edit/product-type/:id" element={<EditProductType />} />

          <Route path="/categories" element={<Category />} />
          <Route path="/add/category" element={<AddCategory />} />
          <Route path="/edit/category/:id" element={<EditCategory />} />

          <Route path="/subcategories" element={<SubCategory />} />
          <Route path="/add/subcategory" element={<AddSubCategory />} />
          <Route path="/edit/subcategory/:id" element={<EditSubCategory />} />

          <Route path="/subsubcategories" element={<SubSubCategory />} />
          <Route path="/add/sub/subcategory" element={<AddSubSubCategory />} />
          <Route path="/edit/sub/subcategory/:id" element={<EditSubSubCategory />} />

          <Route path="/attributes" element={<Attribute />} />
          <Route path="/attributes/config/:id" element={<EditAttribute/>} />
          <Route path="/products" element={<Product />} />
          <Route path="/product-add" element={<ProductAdd />} />
          <Route path="/product-edit/:id" element={<ProductEdit />} />
          <Route path="/upsell" element={<UpSell />} />
          <Route path="/add/upsell" element={<AddUpSell />} />
          <Route path="/edit/upsell/:id" element={<EditUpSell />} />
          <Route path="/upsell/settings" element={<UpsellSetting />} />
          <Route path="/add/down-sell" element={<AddDownSell />} />

          <Route path="/edit/downsell/:id" element={<EditDownSell />} />

          <Route path="/review" element={<Review />} />
          <Route path="/add/review" element={<AddReview />} />
          <Route path="/edit/review/:id" element={<EditReview />} />

          <Route path="/section-banner" element={<SectionBanner />} />
          {/* For Product Management */}

          {/* For Catelog Management */}
          <Route path="/product/catalogs" element={<ProductCatelog />} />
          <Route path="/add/prodcut/catelog" element={<AddProductCatelog />} />
          <Route path="/edit/prodcut/catelog/:id" element={<EditProductCatelog />}/>

          <Route path="/gtm-manage" element={<GtmSetting />} />
          <Route path="/clarity-id" element={<Clarity />} />
          <Route path="/google-analytical" element={<GoogleAnalytic />} />
          <Route path="/facebook/meta/pixel" element={<FacebookMeta />} />

          <Route path="/pusher/settings" element={<Pusher />} />
          {/* For Catelog Management */}

          {/* For Order Management */}
          <Route path="/incomplete/orders" element={<InCompleteOrder />} />
          <Route path="/edit/incomplete-order/:id" element={<EditIncomepleteOrder />}/>
          <Route path="/delivery/charge" element={<DeliveryCharge />} />
          <Route path="/free/delivery" element={<FreeDelivery />} />

          <Route path="/payment-gateways" element={<PaymentGateway />} />
          <Route path="/add/payment/gateway" element={<AddPaymentGateway />} />
          <Route path="/edit/payment/gateway/:id" element={<EditPaymentGateway />} />

          <Route path="/online-payment/discounts" element={<OnlinePaymentDiscount />}/>
          <Route path="/statuses" element={<OrderStatus />} />
          <Route path="/coupons" element={<MarketCoupon />} />
          <Route path="/order-tag" element={<OrderTag />} />
          <Route path="/types/customer" element={<CustomerType />} />
          <Route path="/cancel-reasons" element={<CancelReason />} />

          <Route path="/couriers" element={<Courier />} />
          <Route path="/add/courier" element={<AddCourier />} />
          <Route path="/edit/courier/:id" element={<EditCourier />} />

          <Route path="/orders" element={<Order />} />
          <Route path="/order-add" element={<OrderAdd />} />
          <Route path="/order-edit/:id" element={<OrderEdit />} />
          <Route path="/downsell-coupon" element={<DownSellCoupon />} />


          <Route path="/trash/list" element={<TrashList />} />
          {/* For Order Management */}

          {/* Invoice Pages Routes */}
          <Route path="/invoice/:id" element={<InvoiceA4 />} />
          <Route path="/a5-invoice/:id" element={<InvoiceA5 />} />
          <Route path="/pos-invoice/:id" element={<InvoicePos />} />
          <Route path="/admin/multi-invoice" element={<MultipleInvoice />} />
          {/* Invoice Pages Routes */}

          {/* For Courier Management */}
          <Route path="/all/couriers" element={<Courier />} />

          <Route path="/steadfast" element={<SteadFast />} />

          <Route path="/pathao" element={<Pathao />} />
          <Route path="/store/create" element={<StoreCreate />} />
          <Route path="/all/store" element={<PathaStore />} />

          <Route path="/courier/settings" element={<CourierSetting />} />

          <Route path="/redx" element={<REDX />} />
          {/* For Courier Management */}

          {/* For Blog Management */}
          <Route path="/blogs" element={<Blog />} />
          <Route path="/add/blog" element={<AddBlog />} />
          <Route path="/edit/blog/:id" element={<EditBlog />} />
          <Route path="/blog/tag" element={<BlogTag />} />
          <Route path="/blog/categories" element={<BlogCategory />} />
          <Route path="/create/blog/category" element={<AddBlogCategory />} />
          <Route path="/edit/blog/category/:id" element={<EditBlogCategory />} />
          {/* For Blog Management */}

          {/* For Follow Up Sell */}
          <Route path="/followup-sell" element={<FollowupSell />} />
          {/* For Follow Up Sell */}

          {/* For CMS Management */}
          <Route path="/edit/banner/:id" element={<EditBanner />} />

          <Route path="/sliders" element={<Slider />} />
          <Route path="/add/slider" element={<AddSlider />} />
          <Route path="/slider/edit/:id" element={<EditSlider />} />

          <Route path="/about" element={<About />} />
          <Route path="/add/about" element={<AddAbout />} />
          <Route path="/edit/about/:id" element={<EditAbout />} />

          <Route path="/contacts" element={<Contact />} />
          <Route path="/add/contact" element={<AddContact />} />
          <Route path="/edit/contact/:id" element={<EditContact />} />

          <Route path="/faqs" element={<FAQ />} />
          <Route path="/add/faq" element={<AddFaq />} />
          <Route path="/edit/faq/:id" element={<EditFaq />} />

          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/add/privacy" element={<AddPrivacy />} />
          <Route path="/edit/privacy/:id" element={<EditPrivacy />} />

          <Route path="/terms-and-conditions" element={<TermsCondition />} />
          <Route path="/add/terms" element={<AddTermsCondition />} />
          <Route path="/edit/terms-condition/:id" element={<EditTermsCondition />} />
          {/* For CMS Management */}

          {/* For Fake Order Management */}
          <Route path="/block-users" element={<BlockList />} />
          <Route path="/add-block-user" element={<AddBlockUser />} />
          <Route path="/block-settings" element={<BlockSettings />} />
          <Route path="/currier-report" element={<FraudCheck />} />
          {/* For Fake Order Management */}

          {/* For Campaigns Management */}
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/add/campaign" element={<AddCampaign />} />
          <Route path="/edit/campaign/:id" element={<EditCampaign />} />
          {/* For Campaigns Management */}

          {/* report */}
          <Route path="/all/customer/report" element={<CustomerReport />} />
          <Route path="/sales/report" element={<SaleReport />} />
          <Route path="/report/orders" element={<OrderReport />} />
          <Route path="/upsell/report" element={<UpsellReport />} />
          <Route path="/downsell/report" element={<DownsellReport />} />
          <Route path="/followup/report" element={<FollowupReport />} />
          <Route path="/stock/report" element={<StockReport />} />
          <Route path="/cross/sell/report" element={<CrossSellReport />} />
          <Route path="/return/report" element={<ReturnReport />} />
          <Route path="/cancel/report" element={<CancelReport />} />
          <Route path="/product/report" element={<ProductReport />} />
          <Route path="/location/report" element={<LocationReport />} />
          <Route path="/courier/report" element={<CourierReport />} />
          {/* report */}

          <Route path="/seo-pages" element={<SEO />} />

          <Route path="/gallary" element={<Gallary />} />

          {/* Section & Product Management */}
          <Route path="/section-list" element={<SectionProdcut />} />
          <Route path="/add/section" element={<AddSection />} />
          <Route path="/edit/section/:id" element={<EditSection />} />
          {/* Section & Product Management */}

          {/* For Catgeory Section */}
          <Route path="/category-section-list" element={<CategorySection />} />
          <Route path="/add/category/section" element={<AddCategorySection />}/>
          <Route path="/edit/section-category/:id" element={<EditCategorySection />}/>
          {/* For Catgeory Section */}

          {/* For Settings */}
          <Route path="/settings" element={<Settings />} />
          {/* For Settings */}

          {/* For Settings */}
          <Route path="/Tutorial" element={<Tutorial />} />
          {/* For Settings */}

          
          <Route
            path="/system/basic-setting"
            element={
              <div className="empty">
                <h1>Basic Setting</h1>
              </div>
            }
          />
          <Route
            path="/system/user-management"
            element={
              <div className="empty">
                <h1>User Management</h1>
              </div>
            }
          />
          <Route
            path="*"
            element={
              <div className="empty">
                <h1>Not Found</h1>
              </div>
            }
          />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
