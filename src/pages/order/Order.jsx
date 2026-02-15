import {CopyOutlined,DeleteFilled,DeleteOutlined,DownloadOutlined,EditOutlined,EyeOutlined,InboxOutlined,InfoCircleOutlined,LoadingOutlined,LockOutlined,PhoneOutlined,PlusOutlined,PrinterOutlined,SearchOutlined,EnvironmentOutlined,WhatsAppOutlined,ExclamationCircleOutlined,ContainerOutlined,ArrowLeftOutlined,HistoryOutlined} from "@ant-design/icons";
import {Badge,Button,Col,DatePicker,Dropdown,Form,Input,InputNumber,message,Modal,Popover,Row,Select,Space,Spin,Table,Tag,Tooltip} from "antd";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import {deleteData,getDatas,postData} from "../../api/common/common";
import { useAuth } from "../../hooks/useAuth";
import useAxios from "../../hooks/useAxios";
import useTitle from "../../hooks/useTitle";
import "./Order.css";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import OrderHistoryModal from "../../components/order/OrderHistoryModal";
import {useAppSettings} from "../../contexts/useAppSettings";
import CourierInfo from "../../components/order/CourierInfo";
import { formatCourierData } from "../../helpers/courier.helper";
import { cachedFetch } from "../../utils/cacheApi";
import { useSelector } from "react-redux";
import CourierStatusModal from "../../components/order/CourierStatusModal";

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

export default function Order() {
    // Hook
    useTitle("All Orders");
    const { settings} = useAppSettings();

    // Variable
    const navigate        = useNavigate();
    const location        = useLocation();
    const { user }        = useAuth();
    const initialStatusId = location.state?.statusId ?? sessionStorage.getItem("orderStatusId");

    useAxios();

    const [form] = Form.useForm();

    // State
    const [messageApi, contextHolder]                                                                  = message.useMessage();
    const [searchQuery, setSearchQuery]                                                                = useState("");
    const [statusId, setStatusId]                                                                      = useState(null);
    const [orderStatus, setOrderStatus]                                                                = useState([]);
    const [loading, setLoading]                                                                        = useState(false);
    const [authPermission, setAuthPermission]                                                          = useState([]);
    const [isPaid, setIsPaid]                                                                          = useState(null);
    const [orders, setOrders]                                                                          = useState(null);
    const [orderTagId, setOrderTagId]                                                                  = useState(null);
    const [districtId, setDistrictId]                                                                  = useState("");
    const [cancelReasonId, setCancelReasonId]                                                          = useState("");
    const [selectedOrderIds, setSelectedOrderIds]                                                      = useState([]);
    const [isActionShow, setIsActionShow]                                                              = useState(false);
    const [isAllOrders, setIsAllOrders]                                                                = useState(true);
    const [selectedAction, setSelectedAction]                                                          = useState("");
    const [orderPaidOrUnpaidStatus, setOrderPaidOrUnpaidStatus]                                        = useState("");
    const [orderCurrentStatus, setOrderCurrentStatus]                                                  = useState("");
    const [orderAssign, setOrderAssign]                                                                = useState("");
    const [printInvoice, setPrintInvoice]                                                              = useState("");
    const [users, setUsers]                                                                            = useState("");
    const [orderWiseProducts, setOrderWiseProducts]                                                    = useState("");
    const [returnAndDamageOrderStatus, setReturnAndDamageOrderStatus]                                  = useState("");
    const [returnAndDamageOrderType, setReturnAndDamageOrderType]                                      = useState("");
    const [returnAndDamageOrderReason, setReturnAndDamageOrderReason]                                  = useState("");
    const [orderId, setOrderId]                                                                        = useState("");
    const [pickingList, setPickingList]                                                                = useState("");
    const [curierDeliveryReports, setCurierDeliveryReports]                                            = useState({});
    const [startDate, setStartDate]                                                                    = useState();
    const [endDate, setEndDate]                                                                        = useState();
    const [errors, setErrors]                                                                          = useState("");
    const [duplicateOrder, setDuplicateOrder]                                                          = useState(0);
    const [isMobile, setIsMobile]                                                                      = useState(false);
    const [invoiceNumber, setInvoiceNumber]                                                            = useState("");
    const [phoneNumber, setPhoneNumber]                                                                = useState("");
    const [websiteName, setWebsiteName]                                                                = useState("");
    const [courierData, setCourierData]                                                                = useState([]);
    const [courierDataTableShow, setCourierDataTableShow]                                              = useState(false);
    const [localOrderSummary,setLocalOrderSummary]                                                     = useState({});
    const [websiteAdminBaseUrl, setWebsiteAdminBaseUrl]                                                = useState("");
    const [isTrash, setIsTrash]                                                                        = useState(false);
    const [lockedInfo, setLockedInfo]                                                                  = useState("");
    const [courierList, setCourierList]                                                                = useState([]);
    const [districtWiseList, setDistrictWiseList]                                                      = useState([]);
    const [selectedDistrictId, setSelectedDistrictId]                                                  = useState(null);
    const [employeeList, setEmployeeList]                                                              = useState([]);
    const [employeeId, setEmployeeId]                                                                  = useState(null);
    const [invoiceStatus, setInvoiceStatus]                                                            = useState(null);
    const [customerTypeList, setCustomerTypeList]                                                      = useState([]);
    const [selectedCustomerTypeId, setSelectedCustomerTypeId]                                          = useState(null);
    const [courierId, setCourierId]                                                                    = useState(null);
	const [courierStatusId, setCourierStatusId]                                                        = useState(null);
    const scanEnabled                                                                                  = true;
    const scanBufferRef                                                                                = useRef("");
    const scanTimerRef                                                                                 = useRef(null);
    const [previewSrc, setPreviewSrc]                                                                  = useState(null);
    const [pos, setPos]                                                                                = useState({ x: 0, y: 0 });
    const [handleselectedActionChangeStatusModal,setHandleselectedActionChangeStatusModal]             = useState(false);
    const [handleselectedActionCurrentOrderStatusModal,setHandleselectedActionCurrentOrderStatusModal] = useState(false);
    const [handleselectedActionOrderAssignModal,setHandleselectedActionOrderAssignModal]               = useState(false);
    const [handleselectedActionPrintInvoiceModal,setHandleselectedActionPrintInvoiceModal]             = useState(false);
    const [handleReturnAndDamageModal, setHandleReturnAndDamageModal]                                  = useState(false);
    const [handlePickingListModal, setHandlePickingListModal]                                          = useState(false);
    const [largeModal, setLargeModal]                                                                  = useState(false);
    const [previewOpen, setPreviewOpen]                                                                = useState(false);
    const [previewOrder, setPreviewOrder]                                                              = useState(null);
    const [previewItems, setPreviewItems]                                                              = useState([]);
    const [approxStartDate, setApproxStartDate]                                                        = useState("");
    const [approxEndDate, setApproxEndDate]                                                            = useState("");
    const [followNote, setFollowNote]                                                                  = useState("");
    const [totalOrder, setTotalOrder]                                                                  = useState(0);
    const [currentPage, setCurrentPage]                                                                = useState(1);
    const [historyModalOpen, setHistoryModalOpen]                                                      = useState(false);
    const [selectedOrderId, setSelectedOrderId]                                                        = useState(null);
    const [isNoteModalOpen, setIsNoteModalOpen]                                                        = useState(false);
    const [isNotesModalOpen, setIsNotesModalOpen]                                                      = useState(false);
    const [loadingNotes, setLoadingNotes]                                                              = useState(false);
    const [notes, setNotes]                                                                            = useState([]);
    const [editingNoteId, setEditingNoteId]                                                            = useState(null);
    const [noteLoader, setNoteLoader]                                                                  = useState(false);
    const [isCourierModalOpen, setIsCourierModalOpen]                                                  = useState(false);
    const [courierLogs, setCourierLogs]                                                                = useState([]);
    const [pageSize, setPageSize]                                                                      = useState(orders?.per_page);
    const [bulkLoading, setBulLoading]                                                                 = useState(false);

    // Redux State
    const orderTagList  = useSelector((state) => state.orderFrom.list);
    const cancelReasons = useSelector((state) => state.cancelReason.list)
    const districtList  = useSelector((state) => state.districts.list);
    const couriers        = useSelector((s) => s.courier.list);

    const authenticateUserPermission = async () => {
        try {
            const auth = localStorage.getItem("auth");
            if (auth) {
                try {
                    const parsedAuth = JSON.parse(auth);
                    if (parsedAuth?.user?.roles?.[0]?.permissions) {
                        const permissions = parsedAuth.user.roles[0].permissions;
                        setAuthPermission(permissions);
                        return;
                    }
                } catch (parseError) {
                    console.error("Error parsing auth from localStorage:", parseError);
                }
            }
        
            const res = await getDatas("/admin/user/permissions");
        
            if (res?.success) {
                const permissions = res?.result || [];
        
                setAuthPermission(permissions);
            } else {
                console.error("API returned success=false:", res);
          }
        } catch (error) {
          console.error("Error fetching permissions:", error);
        }
    };

    const getOrders = async (page = 1, overrides = {}) => {
        setLoading(true);
        try {
            const res = await getDatas("/admin/orders/list", {
                page              : page,
                paginate_size     : "paginate_size" in overrides ? overrides.paginate_size          : pageSize,
                search_key        : "search_key" in overrides ? overrides.search_key                : searchQuery,
                paid_status       : "paid_status" in overrides ? overrides.paid_status              : isPaid,
                customer_type_id  : "customer_type_id" in overrides ? overrides.customer_type_id    : selectedCustomerTypeId,
                order_from_id     : "order_from_id" in overrides ? overrides.order_from_id          : orderTagId,
                current_status_id : "current_status_id" in overrides ? overrides.current_status_id  : statusId,
                district_id       : "district_id" in overrides ? overrides.district_id              : districtId,
                cancel_reason_id  : "cancel_reason_id" in overrides ? overrides.cancel_reason_id    : cancelReasonId,
                start_date        : "start_date" in overrides ? overrides.start_date                : startDate ? dayjs(startDate).format("YYYY-MM-DD"): "",
                end_date          : "end_date" in overrides ? overrides.end_date                    : endDate ? dayjs(endDate).format("YYYY-MM-DD")    : "",
                is_duplicate      : "is_duplicate" in overrides ? overrides.is_duplicate            : duplicateOrder,
                courier_id        : "courier_id" in overrides ? overrides.courier_id                : courierId,
				courier_status_id : "courier_status_id" in overrides ? overrides.courier_status_id  : courierStatusId,
                is_invoice_printed: "is_invoice_printed" in overrides ? overrides.is_invoice_printed: invoiceStatus,
            });
            
        
            if (res && res?.success) {
                setOrders(res?.result?.orders || []);
        
                setCurrentPage(res?.result?.orders?.meta?.current_page);
                setPageSize(res?.result?.orders?.meta?.per_page);
        
                const keysToCheck = ["paid_status", "order_from_id","start_date", "end_date", "is_invoice_printed", "customer_type_id"];
                const hasRelevantOverride = keysToCheck.some(key => key in overrides);

                if (hasRelevantOverride && statusId) {
                    setStatusId(null);
                    setIsAllOrders(true); 
                }

                if (hasRelevantOverride) {
                    setTotalOrder(res.result?.total_orders || 0);
                } else if (!("current_status_id" in overrides)) {
                    setTotalOrder(res?.result?.orders?.orders_count || 0);
                }
        
                setDuplicateOrder(0);

                setOrderStatus(res?.result?.status_report || []);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleUnload = () => {
            sessionStorage.removeItem("orderStatusId");
        };

        window.addEventListener("beforeunload", handleUnload);

        return () => {
            window.removeEventListener("beforeunload", handleUnload);
        };
    }, []);

    const getUserInformation = async () => {
        try {
            const data = await cachedFetch("users", async () => {
                const res = await getDatas("/admin/users/list");
                return res?.success ? res?.result?.data : [];
            });

            setUsers(Array.isArray(data) ? data : []);

        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const getCourierList = async () => {
        try {
            const res = await getDatas("/admin/couriers/list", {status_id:statusId});

            if (res && res?.success) {
                setCourierList(res?.result);
            }

        } catch (error) {
            console.error("Error fetching courier list:", error);
        }
    };

    const getDistrictWiseList = async () => {
        try {
            const res = await getDatas("/admin/districts/list", {status_id: statusId});
            
            if (res?.success) {
                setDistrictWiseList(res?.result);
            }
        } catch (error) {
            console.error("Error fetching courier list:", error);
        }
    };

    const getEmployees = async () => {
        try {
            const data = await cachedFetch("employees", async () => {
                const res = await getDatas("/admin/users/list", { user_category_id: 3 });
                return res?.success ? res.result.data : [];
            });

            setEmployeeList(data);
        } catch (e) {
            console.error(e);
        }
    };

    const getCustomerType = async () => {
        try {
            const data = await cachedFetch("customer_types", async () => {
                const res = await getDatas("/admin/customer-types/list");
                return res?.success ? res.result : [];
            });

            setCustomerTypeList(data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleStatusChange = (status) => {
        if (status === "all-order") {
            allOrderStatus();
        } else if (status === "new-order") {
            setStatusId(1);
            setIsAllOrders(false);
            getOrders(1, { current_status_id: 1 });
        } else if (status === "cancel-order") {
            setStatusId(8);
            setIsAllOrders(false);
            getOrders(1, { current_status_id: 8 });
        } else if (status === "confirm-order") {
            setStatusId(3);
            setIsAllOrders(false);
            getOrders(1, { current_status_id: 3 });
        } else if (status === "return-order") {
            setStatusId(9);
            setIsAllOrders(false);
            getOrders(1, { current_status_id: 9 });
        } else if (status === "delivered-order") {
            setStatusId(7);
            setIsAllOrders(false);
            getOrders(1, { current_status_id: 7 });
        } else if (status === "paid-order") {
            setIsPaid("paid");
            setIsAllOrders(false);
            getOrders(1, { paid_status: "paid" });
        } else if (status === "unpaid-order") {
            setIsPaid("unpaid");
            setIsAllOrders(false);
            getOrders(1, { paid_status: "unpaid" });
        }
    };

    useEffect(() => {
        authenticateUserPermission();
        getCustomerType();
        getOrders(1);
        getEmployees();
        getUserInformation();

        const status = new URLSearchParams(location.search).get("status");

        if (status) {
            handleStatusChange(status);
        }

        checkScreenSize();
        window.addEventListener("resize", checkScreenSize);

        return () => {
            window.removeEventListener("resize", checkScreenSize);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!settings) return;

        const invoiceNumber = settings.invoice_number;
        const phoneNumber   = settings.phone_number;
        const websiteName   = settings.title;
        const adminbaseUrl  =  window.location.origin;

        setInvoiceNumber(invoiceNumber);
        setPhoneNumber(phoneNumber);
        setWebsiteName(websiteName);

        if(adminbaseUrl !== ""){
            setWebsiteAdminBaseUrl(adminbaseUrl);
        }else{
            setWebsiteAdminBaseUrl(window.location.origin);
        }
    }, [settings]);

    const addOrder = () => {
        if (
            authPermission.some((permission) => permission?.name === "orders-create")
        ) {
            navigate("/order-add");
        } else {
            message.error("You don't have permission to create Order");
        }
    };

    const filterData = () => {
        getOrders();
    };

    const backPage = () => {
        navigate("/admin/dashboard");
    };

    const handleEdit = async (orderInfo) => {
        try {
            const res = await getDatas(`/admin/orders/locked-status/${orderInfo.id}`);

            if (res.success) {
                setLockedInfo(res?.result);
            }

            if (res?.result?.locked_by_id) {
                setLargeModal(true);
            } else {
                if (authPermission.some((permission) => permission?.name === "orders-update")) {
                    await postData(`/admin/orders/locked/${orderInfo.id}`);
                    navigate(`/order-edit/${orderInfo.id}`, {state: {statusId}});
                } else {
                    message.error("You have no permission to Order Edit");
                }
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const overwrite = async () => {
        if (authPermission.some((permission) => permission?.name === "orders-update")) {
            try {
                const res = await postData(
                    `/admin/orders/locked/${lockedInfo?.order_id}`
                );
                if (res?.success) {
                    setLargeModal(false);
                    navigate(`/order-edit/${res?.result?.order_id}`);
                }
            } catch (error) {
                console.error("Error:", error);
            }
        } else {
            message.error("You have no permission to Order Edit");
        }
    };

    const backOrders = () => {
        setIsTrash(false);
        getOrders();
    };

    const trashDestroy = async (destroyId) => {
        try {
            const result = await Swal.fire({
                title             : "Are you sure delete this Order?",
                icon              : "warning",
                showCancelButton  : true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor : "#d33",
                confirmButtonText : "Yes, delete it!",
            });

            if (result.isConfirmed) {
                const res = await deleteData(`/admin/orders/${destroyId}`);
                if (res?.success) {
                    
                    messageApi.open({
                        type: "success",
                        content: "Order Deleted Successfully",
                    });

                    getOrders(1);
                }
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const getStatusWiseOrder = (id = "") => {
        sessionStorage.setItem("orderStatusId", id);
        setCourierId(null);

        if (id === 3) {
            setDistrictId("");
            setCancelReasonId("");
        } else if (id === 2) {
            setDistrictId("");
            setCancelReasonId("");
        } else if (id === 8) {
            setDistrictId("");
        } else if (id === 9 || id === 10) {
            setDistrictId("");
        } else {
            setDistrictId("");
            setCancelReasonId("");
        }

        setStatusId(id);
        setIsAllOrders(false);
        getOrders(1, {current_status_id: id,district_id: "",cancel_reason_id: "",courier_id: null,});
    };

    const handleSelectionChange = (selectedRowKeys) => {
        setSelectedOrderIds(selectedRowKeys);
        setIsActionShow(selectedRowKeys.length > 0);
        setSelectedAction("");
    };

    const handleOrderAction = async (value) => {
        setHandleselectedActionChangeStatusModal(false);

        if (value === "change-status") {
            setHandleselectedActionChangeStatusModal(true);
        }

        if (value === "change-current-order-status") {
            setHandleselectedActionCurrentOrderStatusModal(true);
        }

        if (value === "order-assign") {
            setHandleselectedActionOrderAssignModal(true);
        }

        if (value === "print-invoice") {
            setHandleselectedActionPrintInvoiceModal(true);
        }

        if (value === "steadfast") {
            downloadExcel();
        }

        if (value === "pathao") {
            downloadPathaoExcel();
        }
    };

    const orderPaidOrUnpaidStatusUpdate = async () => {
        try {
            const res = await postData("/admin/orders/update-paid-status", {order_ids: selectedOrderIds,paid_status: orderPaidOrUnpaidStatus});
            if (res?.success) {
                message.success("Order Status updated Successfully");
                setHandleselectedActionChangeStatusModal(false);
                setSelectedAction("");
                setSelectedOrderIds([]);
                setOrderPaidOrUnpaidStatus("");
                getOrders();
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const orderCurrentStatusUpdate = async () => {
        try {
            setBulLoading(true);
            const payload = {
                order_ids        : selectedOrderIds,
                current_status_id: orderCurrentStatus,
                cancel_reason_id : cancelReasonId || null,
            };

            if (orderCurrentStatus == 3) {
                payload.approx_start_date = approxStartDate;
                payload.approx_end_date   = approxEndDate;
                payload.follow_note       = followNote;
            }

            const res = await postData("/admin/orders/update-status", payload);

            if (res?.success) {
            
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });

                setHandleselectedActionCurrentOrderStatusModal(false);
                setSelectedAction("");
                setOrderCurrentStatus("");
                setSelectedOrderIds([]);
                getOrders();
            }

            if(res?.success === false){
                alert(res.message);
            }

        } catch (error) {
            console.error("Error:", error);
        }finally{
            setBulLoading(false);
        }
    };

    const orderAssignUpdate = async () => {
        try {
            const res = await postData("/admin/orders/assign", {user_id: orderAssign,order_ids: selectedOrderIds});
            if (res?.success) {
            
                messageApi.open({
                    type: "success",
                    content: "Order assigned successfully",
                });

                setHandleselectedActionOrderAssignModal(false);
                setSelectedAction("");
                getOrders();
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const allOrderStatus = () => {
        setIsAllOrders(true);
        setIsPaid(null);
        setStatusId(null);
        setCancelReasonId("");
        setDistrictId("");
        setOrderTagId(null);
        setCourierId(null);
        getOrders(1, {paid_status: null,current_status_id: null,cancel_reason_id: "",district_id: "",order_from_id: null,courier_id: null,customer_type_id:null});
        setIsTrash(false);
    };

    const getCancelReasonOrder = (id) => {
        setCancelReasonId(id);
        getOrders(1, { cancel_reason_id: id });
    };

    const getCourierWiseOrder = (id = "") => {
        setCourierId(id);
        getOrders(1, { courier_id: id, courier_status_id : null });
    };
	
	const getCourierStatusWiseOrder = (id = "") => {
        setCourierStatusId(id);
        getOrders(1, { courier_status_id: id});
    };

    const getDistrictWiseOrder = (id = "") => {
        setDistrictId(id);
        getOrders(1, { district_id: id });
    };

    const resetInvoiceHoverData = () => {
        setOrderWiseProducts(null);
    };

    const copyInvoiceOrPhoneNo = (id, type) => {
        const textToCopy = type === "invoice" ? `${invoiceNumber || "SVK-000"}${id}` : String(id);

        const onSuccess = () => {
            if (type === "invoice") {
                message.success("Invoice number copied");
            } else {
                message.success("Phone number copied");
            }
        };

        const onError = () => {
            message.error("Failed to copy");
        };

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(textToCopy).then(onSuccess).catch(onError);
        } else {
            try {

                const textArea = document.createElement("textarea");

                textArea.value = textToCopy;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";

                document.body.appendChild(textArea);

                textArea.focus();
                textArea.select();

                const successful = document.execCommand("copy");

                document.body.removeChild(textArea);

                if (successful) {
                    onSuccess();
                } else {
                    onError();
                }
            } catch {
                onError();
            }
        }
    };

    const getInvoicePrint = () => {
        navigate(`/admin/multi-invoice?orders=${selectedOrderIds.join(",")}`);
    };

    const returnAndDamage = async (id) => {
        setOrderId(id);
        setHandleReturnAndDamageModal(true);
        if (id) {
            await getOrderWiseProducts(id);
        }
    };

    const returnOrderDetailsRemove = (orderId) => {
        const index = orderWiseProducts?.result?.findIndex((i) => i.id === orderId);

        if (index !== -1) {
            const newProducts = [...orderWiseProducts.result];
            newProducts.splice(index, 1);
            setOrderWiseProducts({ ...orderWiseProducts, result: newProducts });
        }
    };

    const handleReturnAndDamage = async () => {
        const items = orderWiseProducts?.result?.map((item) => ({
            product_id          : item.product.id,
            attribute_value_id_1: item.attribute_value_1?.id || null,
            attribute_value_id_2: item.attribute_value_2?.id || null,
            attribute_value_id_3: item.attribute_value_3?.id || null,
            quantity            : item.quantity,
            buy_price           : item.buy_price,
            mrp                 : item.mrp,
            discount            : 0,
            sell_price          : item.sell_price,
        }));
    
        try {
            const res = await postData("/admin/order/return-or-damages", {order_id: orderId,status_id: returnAndDamageOrderStatus,type: returnAndDamageOrderType,reason: returnAndDamageOrderReason,items: items,});
    
            if (res.success) {
                message.success("Return/Damage order created successfully");
                setReturnAndDamageOrderStatus("");
                setReturnAndDamageOrderType("");
                setReturnAndDamageOrderReason("");
                setHandleReturnAndDamageModal(false);
                getOrders();
            } else {
                setErrors(res?.errors);
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const getReturnAndDamageOrder = () => {
        setStatusId(9);
        setIsAllOrders(false);
        setDistrictId("");
        getOrders(1, { current_status_id: 9, district_id: "" });
    };

    const getOrderWiseProducts = async (orderId) => {
        try {
            const res = await getDatas("/admin/orders/item/list", {order_id: orderId});

            if (res.success) {
                setOrderWiseProducts(res);
                return res.result;
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const updateQuantity = (index, newValue) => {
        const updatedResult = [...orderWiseProducts.result];
        updatedResult[index] = {
            ...updatedResult[index],
            quantity: newValue,
        };

        setOrderWiseProducts({...orderWiseProducts,result: updatedResult});
    };

    const handlePickingList = async () => {
        setHandlePickingListModal(true);
        try {
            const res = await getDatas("/admin/orders/piking/list");
            setPickingList(res);
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const pickingListPrintInvoice = () => {
        const printContent = document.getElementById("print-section").innerHTML;

        const iframe = document.createElement("iframe");
        iframe.style.position = "absolute";
        iframe.style.top = "-10000px";
        
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(`
                <html>
                    <head>
                        <style>
                            @media print {
                                body {
                                    margin: 0;
                                    font-family: Arial, sans-serif;
                                }
                                table {
                                    width: 100%;
                                    border-collapse: collapse;
                                }
                                th, td {
                                    border: 1px solid #ddd;
                                    padding: 8px;
                                    text-align: left;
                                }
                            }
                        </style>
                    </head>
                    <body>
                        ${printContent}
                    </body>
                </html>
            `);
        iframeDoc.close();

        iframe.contentWindow.focus();
        iframe.contentWindow.print();

        document.body.removeChild(iframe);
    };

    const formatDate = (dateString) => {
        return dayjs(dateString).format("MMMM DD, YYYY hh:mm:ss A");
    };

    const toTk = (n) => {
        if (n === null || n === undefined || n === "") return "0.00 Tk";
        const num = Number(n) || 0;
        return `${num.toFixed(2)} Tk`;
    };

    const getCurierDeliveryReports = async (phoneNumber) => {
        try {
            const res = await getDatas("/admin/orders/courier/delivery/report", {phone_number: phoneNumber});

            if (res.success) {
                setCurierDeliveryReports(res?.result?.courier_delivery_report?.summary);

                const deliveryReport = res.result?.courier_delivery_report || [];

                setLocalOrderSummary(res?.result?.order_summary);

                setCourierData(formatCourierData(deliveryReport));
            }
        } catch (error) {
            console.error("Error fetching courier delivery reports:", error);
        }
    };

    const handleDuplicateOrder = () => {
        setDuplicateOrder(1);
        setStatusId(1);
        getOrders(1, { is_duplicate: 1, current_status_id: 1 });
    };

    const exportToCSV = () => {
        const rows = pickingList?.result.map((row) => {
        const variations = [];
            if (row.attribute_value_1) variations.push(`${row.attribute_value_1.attribute.name} - ${row.attribute_value_1.value}`);

            if (row.attribute_value_2) variations.push(`${row.attribute_value_2.attribute.name} - ${row.attribute_value_2.value}`);

            if (row.attribute_value_3) variations.push(`${row.attribute_value_3.attribute.name} - ${row.attribute_value_3.value}`);

            return {
                "Product Name": row.product?.name ?? "",
                Variations: variations.length ? variations.join(", ") : "No variation",
                Qty: row.quantity ?? 0,
                "Available Qty":
                row.product?.variations?.length > 0 ? row.product.variations[0]?.current_stock : row.product?.current_stock ?? 0,
            };
        });

        const csvContent = [["Product Name", "Variations", "Qty", "Available Qty"],...rows.map((item) => [item["Product Name"],item["Variations"],item["Qty"],item["Available Qty"]])].map((e) => e.join(",")).join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "picking_list.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(16);
        doc.text("Picking List Report", 14, 15);

        const rows = pickingList?.result.map((row) => {
            const variations = [];

            if (row.attribute_value_1) variations.push(`${row.attribute_value_1.attribute.name} - ${row.attribute_value_1.value}`);

            if (row.attribute_value_2) variations.push(`${row.attribute_value_2.attribute.name} - ${row.attribute_value_2.value}`);

            if (row.attribute_value_3) variations.push(`${row.attribute_value_3.attribute.name} - ${row.attribute_value_3.value}`);

            return [
                row.product?.name ?? "",variations.length ? variations.join(", ") : "No variation",row.quantity ?? 0,
                row.product?.variations?.length > 0 ? row.product.variations[0]?.current_stock : row.product?.current_stock ?? 0,
            ];
        });

        autoTable(doc, {
            head: [["Product Name", "Variations", "Qty", "Available Qty"]],
                body: rows,
                startY: 25,
                theme: "striped",
                headStyles: {
                fillColor: [220, 53, 69],
                textColor: [255, 255, 255],
            },
        });

        const date = new Date().toLocaleString();
        doc.setFontSize(10);
        doc.text(`Generated on: ${date}`, 14, doc.internal.pageSize.height - 10);

        doc.save("picking_list.pdf");
    };

    const checkScreenSize = () => {
        setIsMobile(window.innerWidth <= 425);
    };

    const handleHistoryClick = (orderId) => {
        setSelectedOrderId(orderId);
        setHistoryModalOpen(true);
    }

    const handleDoubleClick = (orderId, type) => {
        if (type === "payment-status") {
            setSelectedOrderIds([orderId]);
            setHandleselectedActionChangeStatusModal(true);
        } else {
            setSelectedOrderIds([orderId]);
            setHandleselectedActionCurrentOrderStatusModal(true);
        }
    };

    const downloadExcel = () => {
        if (!selectedOrderIds.length) {
            
            messageApi.open({
                type: "success",
                content: "Please select at least one order to download.",
            });

            return;
        }
    
        const selectedOrders = orders?.data.filter((order) => selectedOrderIds.includes(order.id));
    
        if (!selectedOrders.length) {
            messageApi.open({
                type: "success",
                content: "No matching orders found!",
            });

            return;
        }
    
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(
            selectedOrders.map((order, index) => ({SL: index + 1,"Invoice No": order.invoice_number,"Customer Name": order.customer_name,"Phone No": order.phone_number,Address: order.address_details,Note: order.note || "N/A","Contact Name": websiteName,"Contact Phone": phoneNumber}))
        );
    
        XLSX.utils.book_append_sheet(wb, ws, "Selected Orders");
        XLSX.writeFile(wb,`steadfast_orders_${new Date().toISOString().split("T")[0]}.xlsx`);
    
        setSelectedOrderIds([]);
        setSelectedAction("");
        
        messageApi.open({
            type: "success",
            content: "Steadfast CSV downloaded successfully!",
        });
    };
    
    const downloadPathaoExcel = async () => {
        if (!selectedOrderIds.length) {
            
            messageApi.open({
                type: "success",
                content: "Please select at least one order to download.",
            });

            return;
        }

        const selectedOrders = orders?.data.filter((order) =>
            selectedOrderIds.includes(order.id)
        );

        if (!selectedOrders.length) {
            
            messageApi.open({
                type: "success",
                content: "No matching orders found!",
            });

            return;
        }

        try {
            let allFormattedOrders = [];

            for (const order of selectedOrders) {
                const items = await getOrderWiseProducts(order.id);

                if (items && Array.isArray(items)) {
                    for (const item of items) {
                        allFormattedOrders.push({
                            ItemType          : "parcel",
                            StoreName         : "self",
                            MerchantOrderId   : order.id,
                            RecipientName     : order.customer_name,
                            RecipientPhone    : order.phone_number || "N/A",
                            RecipientCity     : "N/A",
                            RecipientZone     : "N/A",
                            RecipientArea     : "N/A",
                            RecipientAddress  : order.address_details || "N/A",
                            AmountToCollect   : order.payable_price || "N/A",
                            ItemQuantity      : item.quantity || "N/A",
                            ItemWeight        : order.item_weight || "N/A",
                            ItemDesc          : order.note || "N/A",
                            SpecialInstruction: order.note || "N/A",
                        });
                    }
                }
            }

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(allFormattedOrders);

            XLSX.utils.book_append_sheet(wb, ws, "Selected Orders");
            XLSX.writeFile(wb,`pathao_orders_${new Date().toISOString().split("T")[0]}.xlsx`);

            setSelectedOrderIds([]);
            setSelectedAction("");

            messageApi.open({
                type: "success",
                content: "Pathao CSV downloaded successfully!",
            });
        } catch (error) {
            console.error("Error downloading Pathao CSV:", error);
            message.error("Failed to download Pathao CSV");
        }
    };

    const connectPhone = (number) => {
        const phoneLink = `tel:${number}`;
        window.location.href = phoneLink;
    };

    const openPreview = async (order) => {
        setPreviewOrder(order);
        setPreviewOpen(true);
        const items = await getOrderWiseProducts(order.id);
        setPreviewItems(Array.isArray(items) ? items : []);
    };

    const closePreview = () => {
        setPreviewOpen(false);
        setPreviewOrder(null);
        setPreviewItems([]);
    };

    useEffect(() => {
        getDistrictWiseList();
        getCourierList();
    }, [statusId]);

    useEffect(() => {
        if (couriers?.length > 0) {
            const defaultCourier = couriers.find(
                (c) => c.is_default === "1"
            );

            if (defaultCourier) {
                setCourierId(defaultCourier.id);
            }
        }
    }, [couriers]);

    useEffect(() => {
        if (!scanEnabled) return;

        const handleKeyDown = (e) => {
            const tag = e.target.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA") return;

            if (e.key.length === 1) {
                scanBufferRef.current += e.key;

                if (scanTimerRef.current) clearTimeout(scanTimerRef.current);

                scanTimerRef.current = setTimeout(() => {
                    scanBufferRef.current = "";
                }, 200);

                return;
            }

            if (e.key === "Enter") {
                if (scanTimerRef.current) clearTimeout(scanTimerRef.current);

                const raw = scanBufferRef.current.trim();
                scanBufferRef.current = "";

                if (!raw) return;

                const id = Number(raw);
                if (Number.isNaN(id)) {
                    message.error("Invalid barcode");
                    return;
                }

                processScan(id);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
        };
    }, [scanEnabled]);

    const processScan = async (orderId) => {
        try {
            const canUpdate = authPermission.some((p) => p?.name === "orders-update");
            if (!canUpdate) {
                message.error("You don't have permission to update Order status");
                return;
            }

            setLoading(true);

            let order = orders?.data?.find((o) => Number(o.id) === Number(orderId));

            if (!order) {
                const res = await getDatas(`/admin/orders/${orderId}`);
                if (res?.success) {
                    order = res?.result;
                }
            }

            if (!order) {
                message.error(`Order #${orderId} not found`);
                return;
            }

            const currentStatusId = order.current_status_id ?? order?.current_status?.id ?? order?.status_id ?? null;

            if (currentStatusId !== 5) {
                message.warning(
                    `Order #${orderId} current status ID is ${
                    currentStatusId ?? "N/A"
                    }. Required: 5`
                );
                return;
            }

            const resUp = await postData("/admin/orders/update-status", {order_ids: [orderId],current_status_id: 7});

            if (resUp?.success) {
                message.success(`Order #${orderId} marked as Delivered`);
                await Promise.all([getOrders()]);
            } else {
                message.error(resUp?.msg || "Failed to update order status");
            }
        } catch (err) {
            console.error("Scan update failed:", err);
            message.error("Something went wrong during scan update");
        } finally {
            setLoading(false);
        }
    };

    const orderWiseColumns = 
    [
        {
            title: "SL",
            dataIndex: "id",
            width: 80,
            align: "center",
        },
        {
            title: "Product Name",
            dataIndex: ["product", "name"],
            width: 180,
        },
        {
            title: "Image",
            width: 100,
            render: (_, record) => (
                <img src={record.product?.img_path} alt="" style={{ width: "100%" }}/>
            ),
        },
        {
            title: "Variations",
            width: 300,
            render: (_, record) => (
                <div>
                    {record.attribute_value_1 || record.attribute_value_2 || record.attribute_value_3 ? (
                        <>
                            {record.attribute_value_1 && (
                                <Tag color="error" style={{ marginRight: 8 }}>
                                    {
                                        record.attribute_value_1?.attribute?.name
                                    }- {record.attribute_value_1?.value}
                                </Tag>
                            )}
                            {record.attribute_value_2 && (
                                <Tag color="error" style={{ marginRight: 8 }}>
                                    {
                                        record.attribute_value_2?.attribute
                                        ?.name
                                    } - {record.attribute_value_2?.value}
                                </Tag>
                            )}
                            
                            {record.attribute_value_3 && (
                                <Tag color="error" style={{ marginRight: 8 }}>
                                    {
                                        record.attribute_value_3?.attribute
                                        ?.name
                                    } - {record.attribute_value_3?.value}
                                </Tag>
                            )}
                        </>
                    ) : (
                        "No variation"
                    )}
                </div>
            ),
        },
        {
            title: "Qty",
            dataIndex: "quantity",
            width: 60,
            align: "center",
        },
        {
            title: "Available Qty",
            width: 120,
            render: (_, record) => (
                <span>
                    {record.product?.variations?.length > 0 ? record.product.variations[0] ?.current_stock : record.product?.current_stock}
                </span>
            ),
        },
    ]

    const noteColumns = 
    [
        {
            title: "SL",
            key: "sl",
            width: 50,
            render: (_, __, index) => index + 1,
        },
        { 
            title: "Note", 
            dataIndex: "note" 
        },
        {
            title: "Created By",
            dataIndex: ["created_by", "username"],
            width: 120,
        },
        {
            title: "Date",
            width: 150,
            render: (_, noteRecord) => formatDate(noteRecord.updated_at),
        },
        {
            title: "Actions",
            width: 150,
            render: (_, noteRecord) => (
                <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={() => openEditNoteModal(noteRecord)}/>

                    <Button size="small" icon={<DeleteOutlined />} onClick={() => deleteNote(noteRecord.id)}/>
                </Space>
            ),
        },
    ]

    const returnOrderColumns = 
    [
        { 
            title: "Name", 
            dataIndex: ["product", "name"] 
        },
        {
            title: "Variations",
            render: (_, record) => (
                <>
                    {record.attribute_value_1 && (
                        <Tag color="error" style={{ marginRight: 8 }}>
                            {record.attribute_value_1?.attribute?.name} -
                            {record.attribute_value_1?.value}
                        </Tag>
                    )}

                    {record.attribute_value_2 && (
                        <Tag color="error" style={{ marginRight: 8 }}>
                            {record.attribute_value_2?.attribute?.name} -
                            {record.attribute_value_2?.value}
                        </Tag>
                    )}

                    {record.attribute_value_3 && (
                        <Tag color="error" style={{ marginRight: 8 }}>
                            {record.attribute_value_3?.attribute?.name} -
                            {record.attribute_value_3?.value}
                        </Tag>
                    )}
                </>
            ),
        },
        {
            title: "Qty",
            render: (_, record, index) => (
                <InputNumber value={orderWiseProducts?.result?.[index]?.quantity} onChange={(newValue) => updateQuantity(index, newValue)} min={1} max={record.quantity}/>
            ),
        },
        { 
            title: "Price", 
            dataIndex: "sell_price" 
        },
        {
            title: "Actions",
            fixed: "right",
            width: 100,
            render: (_, record) => (
                <Button size="small" icon={<DeleteFilled style={{ color: "red" }} />} onClick={() => returnOrderDetailsRemove(record.id)}/>
            ),
        },
    ];

    const pickingListColumns = 
    [
        {
            title: "Image",
            width: 120,
            render: (_, record) => {
                if (!record.product) return <span>No Image</span>;

                return (
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {record.product.img_path && (
                            <img src={record.product.img_path} alt={record.product.name} style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 4 }}/>
                        )}

                        {record.product.variations?.length > 0 && record.product.variations.map((v) => (
                            v.img_path && (<img key={v.id} src={v.img_path} alt={`Variation ${v.id}`} style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 4 }}/>)
                        ))}
                    </div>
                );
            },
        },
        {
            title: "Product Name",
            dataIndex: ["product", "name"],
            width: 200,
        },
        {
            title: "Variations",
            width: 300,
            render: (_, record) => (
                <div>
                    {record.attribute_value_1 || record.attribute_value_2 || record.attribute_value_3 ? (
                    <>
                        {record.attribute_value_1 && (
                            <Tag color="error" style={{ marginRight: 8 }}>
                                {record.attribute_value_1?.attribute?.name} -
                                {record.attribute_value_1?.value}
                            </Tag>
                        )}

                        {record.attribute_value_2 && (
                            <Tag color="error" style={{ marginRight: 8 }}>
                                {record.attribute_value_2?.attribute?.name} -
                                {record.attribute_value_2?.value}
                            </Tag>
                        )}

                        {record.attribute_value_3 && (
                            <Tag color="error" style={{ marginRight: 8 }}>
                                {record.attribute_value_3?.attribute?.name} -
                                {record.attribute_value_3?.value}
                            </Tag>
                        )}
                    </>
                    ) : (
                        "No variation"
                    )}
                </div>
            ),
        },
        {
            title: "Qty",
            dataIndex: "quantity",
            width: 60,
            align: "center",
        },
        {
            title: "Available Qty",
            width: 300,
            render: (_, record) => (
                <span>
                    {record.product?.variations?.length > 0 ? record.product.variations[0]?.current_stock : record.product?.current_stock}
                </span>
            ),
        },
    ]

    const openCourierModal = (data) => {
        setCourierLogs(data || []);
        setIsCourierModalOpen(true);
    };

    const columns = 
    [
        {
            title: "SL",
            key: "sl",
            width: 60,
            render: (_, __, index) => {
                return (currentPage - 1) * pageSize + index + 1;
            },
        },
        {
            title: "Invoice No.",
            dataIndex: "id",
            key: "id",
            width: 220,
            fixed: !isMobile ? "left" : false,
            render: (id, record) => {
                const printedStatus = Number(record?.is_invoice_printed ?? 1);
                const products = record?.products ?? [];
        
                return(
                    <div>
                        <div style={{ marginBottom: 8 }}>
                            <Tag color={record.order_from?.name === "Website" ? "success" : record.order_from?.name === "Landing Page" ? "blue" : "error"}>
                                {record.order_from?.name}
                            </Tag>
                        </div>

                        <div>
                            <Space>
                                {![1, 2].includes(record.current_status?.id) ? (
                                    <Dropdown
                                        menu={{
                                            items: [
                                                {
                                                    key: "a5",
                                                    label: (
                                                        <a href={`${websiteAdminBaseUrl}/a5-invoice/${id}`} target="_blank" rel="noopener noreferrer">
                                                            A5 Invoice
                                                        </a>
                                                    ),
                                                },
                                                {
                                                    key: "pos",
                                                    label: (
                                                        <a href={`${websiteAdminBaseUrl}/pos-invoice/${id}`} target="_blank" rel="noopener noreferrer">
                                                            Pos Invoice
                                                        </a>
                                                    ),
                                                },
                                                {
                                                    key: "normal",
                                                    label: (
                                                        <a href={`${websiteAdminBaseUrl}/invoice/${id}`} target="_blank" rel="noopener noreferrer">
                                                            Normal Invoice
                                                        </a>
                                                    ),
                                                },
                                            ],
                                        }}
                                    >
                                        <Tooltip title={printedStatus === 1 ? "Printed" : "Not Printed"}>
                                            <PrinterOutlined style={{fontSize: 18, color: "#52c41a",cursor: "pointer",marginRight: 8,}}/>
                                        </Tooltip>
                                    </Dropdown>
                                ) : (
                                    <Tooltip title="First approve your order">
                                        <PrinterOutlined style={{fontSize: 18,color: "#ccc",cursor: "not-allowed",marginRight: 8,}}/>
                                    </Tooltip>
                                )}
                    
                                <Tooltip title="Copy Invoice No.">
                                    <CopyOutlined style={{fontSize: 18,color: "#1890ff",cursor: "pointer",marginRight: 8}} onClick={() => copyInvoiceOrPhoneNo(id, "invoice")}/>
                                </Tooltip>

                                <Popover
                                    content={
                                        <div style={{ width: 700 }}>
                                            {loading ? (
                                                <div style={{ textAlign: "center" }}>
                                                    <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}/>
                                                </div>
                                            ) : (
                                            <div >
                                                <h6 style={{ fontWeight: "bold" }}>

                                                <span style={{ color: "black" }}>Invoice NO:</span>

                                                <span style={{ color: "#1C558B" }}>SVK-000{id}</span>

                                                </h6>
                                                <Table dataSource={orderWiseProducts?.result} rowKey="id" pagination={false} size="small"
                                                columns={orderWiseColumns}
                                                />
                                            </div>
                                            )}
                                        </div>
                                    }
                                    trigger="hover"
                                    onOpenChange={(visible) => {
                                        if (visible) {
                                            getOrderWiseProducts(id);
                                        } else {
                                            resetInvoiceHoverData();
                                        }
                                    }}>
                                    <InfoCircleOutlined style={{ fontSize: 18, cursor: "pointer" }}/>
                                </Popover>
                            </Space>
                        </div>

                        <div style={{ fontWeight: 600, color: "#1C558B", marginTop: 8 }}>
                            {record.invoice_number}
                        </div>

                        <div>{formatDate(record?.created_at)}</div>
                        
                        <div style={{marginTop: 6,display: "flex",gap: 4,flexWrap: "wrap"}}>
                            {products.map((p, index) => (
                                <img key={index} src={p.img} alt=""
                                    onMouseEnter={(e) => {const rect = e.target.getBoundingClientRect();
                                    setPos({
                                        x: rect.right + 10,
                                        y: rect.top - 50,
                                    });
                                    setPreviewSrc(p.img);
                                    }}
                                    onMouseLeave={() => setPreviewSrc(null)}
                                    style={{width: 40,height: 40,borderRadius: "50%",objectFit: "fill",border: "1px solid #f0f0f0",cursor: "pointer",}}
                                />
                            ))}
                        </div>
                
                        {previewSrc && (
                            <img src={previewSrc} className="order_invoice_columns_img" style={{ top: pos.y, left: pos.x }}/>
                        )}
                    </div>
                );
            },
        },
        {
            title: "Customer Information",
            dataIndex: "customer_name",
            key: "customer_name",
            width: 280,
            render: (name, record) => (
                <div>
                    <Button type="default" size="small" icon={<HistoryOutlined />} onClick={() => handleHistoryClick(record.id)}></Button>
        
                    <div style={{ fontWeight: 600, color: "#1C558B" }}>{name}</div>
        
                    <div style={{ marginTop: 4, marginBottom: 4 }}>
                        <Tag color="warning" style={{ marginRight: 8 }}>
                            {record.customer_type ? record.customer_type?.name : "No Type Selected"}
                        </Tag>
            
                        <Popover
                            content={
                                <CourierInfo record={record} name={name} loading={loading} courierData={courierData} courierDataTableShow={courierDataTableShow} setCourierDataTableShow={setCourierDataTableShow} curierDeliveryReports={curierDeliveryReports} localOrderSummary={localOrderSummary}/>
                            }
                            trigger="hover"
                            placement="right"
                            onOpenChange={(visible) => {
                                if (visible) {
                                    getCurierDeliveryReports(record.phone_number);
                                } else {
                                    setCourierData([]);
                                    setCurierDeliveryReports({});
                                    setLocalOrderSummary({});
                                }
                            }}
                        >
                            <InfoCircleOutlined style={{fontSize: 20,verticalAlign: "middle",cursor: "pointer"}}/>
                        </Popover>
                    </div>

                    <div style={{ marginTop: 4 }}>
                        <Tooltip title="Phone Number">
                            <PhoneOutlined style={{fontSize: 15,color: "#1890ff",cursor: "pointer",marginRight: 10}} onClick={() => connectPhone(record.phone_number)}/>
                        </Tooltip>

                        <span style={{ fontWeight: 500, color: "black", marginRight: 8 }}>
                            {record.phone_number}
                        </span>

                        <Tooltip title="WhatsApp">
                            <WhatsAppOutlined style={{fontSize: 17,color: "#25D366",cursor: "pointer",marginRight: 10}} onClick={() => openWhatsApp(record.phone_number)}/>
                        </Tooltip>

                        <Tooltip title="Copy">
                            <CopyOutlined style={{ fontSize: 15, color: "#1890ff", cursor: "pointer" }} onClick={() => copyInvoiceOrPhoneNo(record.phone_number, "phone")}/>
                        </Tooltip>
                    </div>

                    <div style={{ marginTop: 4 }}>{record.address_details}</div>

                    <div style={{ marginTop: 4 }}>
                        <Tag color="blue">{record.payment_gateway?.name}</Tag>
                    </div>

                    {(statusId === 2 || statusId === 8) && record?.notes?.data && (
                        <p>
                            <span style={{ fontWeight: 600 }}>Last Note</span>:
                            {record?.notes?.data?.at(-1)?.note}
                        </p>
                    )}
                </div>
            ),
        },
        {
            title: "Status",
            key: "status",
            width: 120,
            align: "center",
            render: (_, record) => (
                <div>
                    <p style={{ cursor: "pointer", marginBottom: 8 }}>
                        <Tag
                            style={{backgroundColor: `rgba(${parseInt(record?.current_status?.bg_color?.slice(1, 3),16)}, ${parseInt(record?.current_status?.bg_color?.slice(3,5),16)}, ${parseInt(record?.current_status?.bg_color?.slice(5,7),16)}, 0.1)`,
                                color: record?.current_status?.bg_color,
                                borderColor: record?.current_status?.bg_color,
                            }}

                            onClick={() => handleDoubleClick(record?.id, "order-status")}>

                            {record?.current_status?.name}
                        </Tag>
                    </p>
                    <p style={{ cursor: "pointer" }}>
                        <Tag color={record?.paid_status === "paid" ? "success" : "error"} onClick={() => handleDoubleClick(record?.id, "payment-status")}>
                            {record?.paid_status}
                        </Tag>
                    </p>
                </div>
            ),
        },
        {
            title: "Courier",
            key: "courier",
            width: 120,
            align: "center",
            render: (_, record) => (
                <div>
                    {record?.courier?.name?.toLowerCase() === "steadfast" && (
                        <>
                            <Tag color="success">{record?.courier?.name}</Tag>
                            <Tooltip title="Courier status details">
                                <InfoCircleOutlined style={{ cursor: "pointer", color: "#1890ff" }} onClick={() => openCourierModal(record.callback_response)} />
                            </Tooltip>
                        </>
                    )}

                    {record?.courier?.name?.toLowerCase() === "pathao" && (
                        <>
                            <Tag color="error">{record?.courier?.name}</Tag>
                            <Tooltip title="Courier status details">
                                <InfoCircleOutlined style={{ cursor: "pointer", color: "#1890ff" }} onClick={() => openCourierModal(record.callback_response)} />
                            </Tooltip>
                        </>
                    )}

                    {record?.courier?.name?.toLowerCase() === "redx" && (
                        <>
                            <Tag color="error">{record?.courier?.name}</Tag>
                            <Tooltip title="Courier status details">
                                <InfoCircleOutlined style={{ cursor: "pointer", color: "#1890ff" }} onClick={() => openCourierModal(record.callback_response)} />
                            </Tooltip>
                        </>
                    )}

                    {record?.consignment_id && (
                        <Tag color="error">{record?.consignment_id}</Tag>
                    )}

                    {record?.courier_status && (
                        <Tag style={{ textTransform: "capitalize" }}>
                            {record.courier_status}
                        </Tag>
                    )}
                </div>
            ),
        },
        {
            title: "Updated By",
            dataIndex: ["updated_by", "username"],
            key: "updated_by",
            width: 120,
            align: "center",
        },
        {
            title: "Payment Info",
            key: "payment_info",
            width: 180,
			render: (_, record) => {
				const specialDiscount = Number(record.special_discount || 0);
				
                const products = record?.products ?? [];
                const money = (v) => `৳ ${Number(v || 0).toLocaleString('en-BD')}`;

                return (
                    <div>
                        <p style={{ marginBottom: 5 }}>
                            <span style={{ fontWeight: "bold" }}>Advanced Payment:</span>
                            {money(record.advance_payment)}
                        </p>

                        <p style={{ marginBottom: 5 }}>
                            <span style={{ fontWeight: "bold" }}>Discount:</span>
                            {money(record.Discount)}
                        </p>

                        <p style={{ marginBottom: 5 }}>
                            <span style={{ fontWeight: "bold" }}>Delivery Charge:</span>
                            {money(record.delivery_charge)}
                        </p>
						
						{specialDiscount > 0 && (
                            <p style={{ marginBottom: 5 }}>
                                <span style={{ fontWeight: "bold" }}>Special Discount:</span>
                                {money(specialDiscount)}
                            </p>
                        )}

                        {products.map((p, index) => (
                            <p key={index} style={{ marginBottom: 5 }}>
                                <strong>Sell Price:</strong> {money(p.sell_price)}
                            </p>
                        ))}
                        
                        <p style={{ marginBottom: 5 }}>
                            <span style={{ fontWeight: "bold" }}>Payable Amount:</span>{" "}
                            {record.payable_price > 0 ? record.payable_price - (record.advance_payment || 0) : record.payable_price}
                        </p>
                    </div>
                );
            },
        },
        {
            title: "Order Note",
            key: "order_note",
            width: 120,
            align: "center",
            render: (_, record) => (
                <div>
                    <Space>
                        <Button size="small" onClick={() => openNotesModal(record.id)}>
                            <EyeOutlined /> Notes
                        </Button>

                        <Button size="small" icon={<PlusOutlined />} onClick={() => openNoteModal(record.id)}/>
                    </Space>
                </div>
            ),
        },
        {
            title: "Actions",
            key: "actions",
            width: 120,
            align: "center",
            fixed: !isMobile ? "right" : false,
            render: (_, record) => (
                <div>
                    {!isTrash && (
                        <>
                            <button className="block-user-btn" onClick={() => handleBlockUser(record.phone_number)}>
                                Block
                            </button>
            
                            <div style={{ marginBottom: 8, marginTop: 15, }}>
                                <Space>
                                    <Button size="small" icon={<EyeOutlined />} onClick={() => openPreview(record)}/>
                                    {authPermission &&
                                        authPermission.some((permission) => permission?.name === "orders-create") && (
                                        <Button size="small" icon={record?.locked_by_id ? (<LockOutlined />) : (<EditOutlined />)} onClick={() => handleEdit(record)}>
                                            {!record?.locked_by_id && "Edit"}
                                        </Button>
                                    )}
                                </Space>
                            </div>

                            {statusId >= 5 && (
                                <div>
                                    <Button size="small" type="default" style={{backgroundColor: "#faad14", borderColor: "#faad14", color: "white",}} onClick={() => returnAndDamage(record.id)}>
                                        Return
                                    </Button>
                                </div>
                            )}
            
                            <Tooltip title="Delete This...?">
                                <Button size="small" danger onClick={() => trashDestroy(record.id)}>
                                    <DeleteOutlined />
                                </Button>
                            </Tooltip>
                        </>
                    )}
                </div>
            ),
        },
    ];

    const openNoteModal = (orderId) => {
        setSelectedOrderId(orderId);
        form.resetFields();
        setIsNoteModalOpen(true);
    };

    const openEditNoteModal = (noteRecord) => {
        setSelectedOrderId(noteRecord.order_id);
        setEditingNoteId(noteRecord.id);

        form.setFieldsValue({
            note: noteRecord.note,
        });

        setIsNoteModalOpen(true);
    };

    const openNotesModal = async (orderId) => {
        setLoadingNotes(true);
        setSelectedOrderId(orderId);
        setIsNotesModalOpen(true);

        await fetchNotes(orderId);
    };

    const handleNoteSubmit = async () => {
        try {
            const { note } = await form.validateFields();
            await createNote(selectedOrderId, note, editingNoteId);
            setIsNoteModalOpen(false);
            form.resetFields();
            fetchNotes(selectedOrderId);
        } catch (err) {
            console.error(err);
        }
    };

    const createNote = async (orderId, noteValue, noteId = null) => {
        try {
            setNoteLoader(true);

            let api = "";
            const formData = new FormData();

            formData.append("order_id", orderId);
            formData.append("note", noteValue);

            if (noteId) {
                api = `/admin/orders/notes/${noteId}`;
                formData.append("_method", "put");
            } else {
                api = `/admin/orders/notes`;
            }

            const res = await postData(api, formData);

            if (res?.success) {
                messageApi.open({
                    type: "success",
                    content: "Note saved successfully",
                });

                getOrders();
            }
        } catch (error) {
            console.error("Error:", error);
        }finally{
            setNoteLoader(false);
        }
    };

    const deleteNote = async (id) => {
        try {
            const result = await Swal.fire({
                title             : "Are You Sure Remove This Data?",
                icon              : "warning",
                showCancelButton  : true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor : "#d33",
                confirmButtonText : "Yes, delete it!",
            });

            if (result.isConfirmed) {
                const res = await deleteData(`/admin/orders/notes/${id}`);
                if (res?.success) {
                    
                    messageApi.open({
                        type: "success",
                        content: "Note deleted successfully",
                    });
                    getOrders();
                    fetchNotes(selectedOrderId);
                }
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const fetchNotes = async (orderId) => {
        try {
            const res = await getDatas("/admin/orders/notes", { order_id: orderId });

            if (res?.success) {
                setNotes(res.result);
            } else {
                setNotes([]);
            }
        } catch (err) {
            console.error(err);
            setNotes([]);
        } finally {
            setLoadingNotes(false);
        }
    };

    const rowSelection = {
        selectedRowKeys: selectedOrderIds,
        onChange: handleSelectionChange,
    };

    const handleBlockUser = async (phone) => {
        const payload = {phone_number: phone,is_permanent_block: 1};

        try {
            const res = await postData("/admin/block-users/by-phone", payload);

            if(res && res?.success){
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });
            }
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        if (initialStatusId !== null && initialStatusId !== undefined) {
            const parsedId = initialStatusId === "" ? "" : Number(initialStatusId);

            setStatusId(parsedId);
            getStatusWiseOrder(parsedId);
        }
    }, []);

    const handleTrashClick = () => {
        navigate("/trash/list");
    }

    const openWhatsApp = (phone) => {
        if (!phone) return;

        let formattedPhone = phone.replace(/\D/g, "");

        if (!formattedPhone.startsWith("88")) {
            formattedPhone = "88" + formattedPhone;
        }

        const whatsappUrl = `https://wa.me/${formattedPhone}`;
        window.open(whatsappUrl, "_blank");
    };
                                                    
    return (
        <>
            {contextHolder}

            <Row>
                <Col span={24}>
                    <Row style={{ marginBottom: 25 }}>
                        <Col xs={24} md={16} style={{ display: "flex", justifyContent: "flex-start" }}></Col>
                        
                        <Col xs={24} md={8} style={{display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap"}}>
                            <div className="form-actions" style={{ display: "flex", gap: 8,  }}>
                                <div>
                                    {isActionShow && (
                                        <Select value={selectedAction} onChange={handleOrderAction} placeholder="Action" style={{ width: 150, height: 40 }}>
                                            <Option value="">Select Action</Option>
                                            <Option value="change-status">Payment Status</Option>
                                            <Option value="print-invoice">Print Invoice</Option>
                                            <Option value="change-current-order-status">Order Status</Option>
                                            <Option value="order-assign">Order Assign</Option>
                                            <Option value="steadfast">Steadfast CSV</Option>
                                            <Option value="pathao">Pathao CSV</Option>
                                        </Select>
                                    )}
                                </div>

                                {authPermission?.some((p) => p?.name === "orders-create") && (
                                    <Button type="primary" onClick={addOrder} icon={<PlusOutlined/>}>
                                        Add
                                    </Button>
                                )}
                
                                <Col>
                                    <Button danger icon={<DeleteOutlined />} onClick={handleTrashClick}>Trash</Button>
                                </Col>
                
                                <Button onClick={isTrash ? backOrders : backPage} icon={<ArrowLeftOutlined />}>
                                    Back
                                </Button>
                            </div>
                        </Col>
                    </Row>

                    <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                        <Col xs={24} md={24}>
                            <div className="filter-actions" style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                                <div className="filter-item">
                                    <label className="filter-label">Payment Status</label>
                                    <Select value={isPaid} onChange={(value) => {setIsPaid(value);getOrders(1, { paid_status: value });}} placeholder="Is Paid" style={{ width: 170, height: 40 }}allowClear>
                                        <Option value="Paid">Paid</Option>
                                        <Option value="Unpaid">Unpaid</Option>
                                    </Select>
                                </div>
        
                                <div className="filter-item">
                                    <label className="filter-label">Order Tag</label>
                                    <Select value={orderTagId} onChange={(value) => {setOrderTagId(value);getOrders(1, { order_from_id: value });}} placeholder="Order Tag" style={{ width: 170, height: 40 }} allowClear>
                                        {orderTagList?.map((item) => (
                                            <Option key={item.id} value={item.id}>
                                                {item.name}
                                            </Option>
                                        ))}
                                    </Select>
                                </div>

                                <div className="filter-item">
                                    <label className="filter-label">Customer Type</label>
                                    <Select value={selectedCustomerTypeId} onChange={(value) => {setSelectedCustomerTypeId(value);getOrders(1, { customer_type_id: value });}} placeholder="Customer Type" style={{ width: 170, height: 40 }} allowClear>
                                        {customerTypeList?.map((item) => (
                                            <Option key={item.id} value={item.id}>
                                                {item.name}
                                            </Option>
                                        ))}
                                    </Select>
                                </div>

                                <div className="filter-item">
                                    <label className="filter-label">Employee</label>
                                    <Select value={employeeId} onChange={(value) => {setEmployeeId(value);getOrders(1, { assign_user_id: value });}}placeholder="Employee" style={{ width: 170, height: 40 }} allowClear>
                                        {employeeList?.map((item) => (
                                            <Option key={item.id} value={item.id}>
                                                {item.username}
                                            </Option>
                                        ))}
                                    </Select>
                                </div>
        
                                <div className="filter-item">
                                    <label className="filter-label">Start Date</label>
                                    <DatePicker value={startDate ? dayjs(startDate) : null} onChange={(date) => {setStartDate(date); getOrders(1, {start_date: date ? dayjs(date).format("YYYY-MM-DD"): "",
                                        });}} style={{ width: 170, height: 40 }}/>
                                </div>
        
                                <div className="filter-item">
                                    <label className="filter-label">End Date</label>
                                    <DatePicker value={endDate ? dayjs(endDate) : null} onChange={(date) => {setEndDate(date);getOrders(1, {end_date: date? dayjs(date).format("YYYY-MM-DD"): "",
                                        });}} style={{ width: 170, height: 40 }}/>
                                </div>
        
                                <div className="filter-item">
                                    <label className="filter-label">Invoice Status</label>
                                    <Select value={invoiceStatus} onChange={(value) => {setInvoiceStatus(value);getOrders(1, { is_invoice_printed: value });}} placeholder="Invoice Status"style={{ width: 170, height: 40 }}allowClear>
                                        <Option value={1}>Printed</Option>
                                        <Option value={0}>Not Printed</Option>
                                    </Select>
                                </div>
        
                                <div className="filter-item">
                                    <label className="filter-label">Search</label>
                                    <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onPressEnter={filterData} placeholder="Search Key..." prefix={<SearchOutlined />}
                                        style={{width: 250,height: 40,borderRadius: 6,boxShadow: "0 2px 6px rgba(64, 169, 255, 0.2)"}}
                                    />
                                </div>
                            </div>
            
                            <div style={{marginTop: 10, display: "flex",flexWrap: "wrap",gap: 8}}>
                                {statusId && (
                                    <Tag closable onClose={() => {allOrderStatus();}}>
                                        Status: {orderStatus?.find((o) => Number(o.status_id) === statusId)?.status_name || "N/A"}
                                    </Tag>
                                )}
            
                                {isPaid && (
                                    <Tag closable onClose={() => {setIsPaid(null);getOrders(1);}}>
                                        Paid: {isPaid}
                                    </Tag>
                                )}
            
                                {selectedCustomerTypeId && (
                                    <Tag closable onClose={() => {setSelectedCustomerTypeId(null);getOrders(1, { customer_type_id: null });}}>
                                        Customer Type: {customerTypeList?.find((c) => c.id === selectedCustomerTypeId)?.name || "N/A"}
                                    </Tag>
                                )}
            
                                {orderTagId && (
                                    <Tag closable onClose={() => {setOrderTagId(null); getOrders(1);}}>
                                        Order Tag: {orderTagList?.find((t) => t.id === orderTagId)?.name || "N/A"}
                                    </Tag>
                                )}
            
                                {selectedDistrictId && (
                                    <Tag closable onClose={() => {setSelectedDistrictId(null);getOrders(1);}}>
                                        District:{districtList?.find((d) => d.id === selectedDistrictId)?.name || "N/A"}
                                    </Tag>
                                )}
            
                                {employeeId && (
                                    <Tag closable onClose={() => {setEmployeeId(null);getOrders(1);}}>
                                        Employee:{employeeList?.find((e) => e.id === employeeId)?.name || "N/A"}
                                    </Tag>
                                )}
            
                                {startDate && (
                                    <Tag closable onClose={() => {setStartDate(null);getOrders(1);}}>
                                        Start: {dayjs(startDate).format("YYYY-MM-DD")}
                                    </Tag>
                                )}
            
                                {endDate && (
                                    <Tag closable onClose={() => {setEndDate(null);getOrders(1);}}>
                                        End: {dayjs(endDate).format("YYYY-MM-DD")}
                                    </Tag>
                                )}
            
                                {invoiceStatus !== null && invoiceStatus !== undefined && (
                                    <Tag closable onClose={() => {setInvoiceStatus(null);getOrders(1);}}>
                                        Invoice: {invoiceStatus === 1 ? "Printed" : "Not Printed"}
                                    </Tag>
                                )}
            
                                {searchQuery && (
                                    <Tag closable onClose={() => {setSearchQuery("");getOrders(1);}}>
                                        Search: {searchQuery}
                                    </Tag>
                                )}
                            </div>
                        </Col>
                    </Row>
        
                    <Row>
                        <Col span={24}>
                            <div className="all-status-tags">
                                <span className={isAllOrders ? "status-tags-child-active" : "status-tags-child"} data-tooltip={`BDT ${orders?.total_amount}`} onClick={allOrderStatus}>
                                    All Orders
                                    <span className={isAllOrders ? "status-tags-child-child-active" : "status-tags-child-child"}>
                                        {totalOrder}
                                    </span>
                                </span>

                                {orderStatus?.slice(0, 8).map((status) => (
                                    <span key={status.status_id} className={Number(status.status_id) === statusId ? "status-tags-child-active" : "status-tags-child"}
                                        data-tooltip={`BDT ${status.total_payable}`} onClick={() => getStatusWiseOrder(Number(status.status_id))}>
                                        {status.status_name}

                                        <span className={Number(status.status_id) === statusId ? "status-tags-child-child-active" : "status-tags-child-child"}>
                                            {status.order_count}
                                        </span>
                                    </span>
                                ))}

                                {orderStatus?.some((s) => [9, 10].includes(Number(s.status_id))) && (
                                    <span className={[9, 10, 11, 12].includes(statusId) ? "status-tags-child-active" : "status-tags-child"} data-tooltip={`BDT ${orderStatus?.filter((s) => [9, 10].includes(Number(s.status_id))).reduce((total, s) => total + Number(s.total_payable || 0), 0)}`} onClick={getReturnAndDamageOrder}>
                                        Return & Damage
                                        <span className={[9, 10, 11, 12].includes(statusId) ? "status-tags-child-child-active" : "status-tags-child-child"}>
                                            {orderStatus?.filter((s) => [9, 10].includes(Number(s.status_id))).reduce((total, s) => total + s.order_count, 0)}
                                        </span>
                                    </span>
                                )}
                            </div>
                        </Col>
            
                        {statusId === 5 && (
                            <Row>
                                <Col span={24}>
                                    <div className="all-status-tags" style={isMobile ? {marginBottom: 15,padding: "10px 10px",border: "1px solid #cbcbcb"} : {}}>
                                        {courierList?.map((courier, index) => (
                                            <span className="order-status-courier" key={index} onClick={() => getCourierWiseOrder(courier?.id)} data-tooltip={`BDT ${courier?.total_amount}`}
                                                style={{ border: courier?.id === courierId ? "1px solid #5f6841ff" : "1px solid #4ba9ceff",backgroundColor: courier?.id === courierId ? "#4ba9ceff" : "#8a71c5ff",
                                                    color: courier?.id === courierId ? "#fff" : "#fff",
                                                }}
                                                onMouseEnter={e => {
                                                    if (courier?.id !== courierId) e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
                                                }}
                                                onMouseLeave={e => {
                                                    if (courier?.id !== courierId) e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
                                                }}
                                                >

                                                <span style={{ marginRight: 4, display: "flex", alignItems: "center" }}>
                                                    <ContainerOutlined style={{fontSize: 12,color: courier?.id === courierId ? "#fff" : "#fff"}}/>
                                                </span>
                        
                                                {courier?.name}
                        
                                                <span style={{ marginLeft: 6, fontWeight: "bold" }}>
                                                    {courier?.orders_count}
                                                </span>
                                            </span>
                                        ))}
                
                                        {orderStatus?.filter(status => Number(status.status_id) === 5).map((status, index) => (
                                            <span key={index} onClick={() => getCourierStatusWiseOrder(Number(13))} data-tooltip={`BDT ${status?.courier_pending_amount}`} className="order-status-partial" onMouseEnter={(e) => {e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";}} onMouseLeave={(e) => {e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";}}>
                                                <span style={{ marginRight: 6, display: "flex", alignItems: "center" }}>
                                                    <ExclamationCircleOutlined style={{fontSize: 14,color: "#C98209"}}/>
                                                </span>

                                                Courier Pending:

                                                <span style={{ marginLeft: 6, fontWeight: "bold" }}>
                                                    {status?.courier_pending_count}
                                                </span>
                                            </span>
                                        ))}
                
                                        {orderStatus?.filter(status => Number(status.status_id) === 5).map((status, index) => (
                                            <Tooltip title={`BDT ${status?.courier_received_amount}`}>
                                                <span className="order-status-received" key={index} onClick={() => getCourierStatusWiseOrder(Number(14))} 
                                                    onMouseEnter={(e) => {e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";}} onMouseLeave={(e) => {e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";}}>
                                                    <span style={{ marginRight: 6, display: "flex", alignItems: "center" }}>
                                                        <InboxOutlined style={{fontSize: 14,color: "#2E7D32"}}/>
                                                    </span>
                        
                                                    Courier Received:
                        
                                                    <span style={{ marginLeft: 6, fontWeight: "bold" }}>
                                                        {status?.courier_received_count}
                                                    </span>
                                                </span>
                                            </Tooltip>
                                        ))}
                
                                        {districtWiseList?.map((district, index) => (
                                            <span className="order-status-district" key={index} onClick={() => getDistrictWiseOrder(district?.id)} data-tooltip={`BDT ${district?.total_amount}`}
                                                style={{
                                                    border: district?.id === districtId ? "1px solid #4ba9ceff" : "1px solid #4ba9ceff",
                                                    backgroundColor: district?.id === districtId ? "#4ba9ceff" : "#e4f5fcff",
                                                    color: district?.id === districtId ? "#fff" : "#333",
                                                }}
                                                onMouseEnter={e => {if(district?.id !== districtId) e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";}}
                                                onMouseLeave={e => {if(district?.id !== districtId) e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";}}
                                            >
                                                <span style={{marginRight: 4, display: "flex", alignItems: "center"}}>
                                                    <EnvironmentOutlined style={{fontSize: 12,color: district?.id === districtId ? "#fff" : "#555"}}/>
                                                </span>
                        
                                                {district?.name}
                                                <span style={{marginLeft: 6, fontWeight: "bold"}}>
                                                    {district?.orders_count}
                                                </span>
                                            </span>
                                        ))}
                                    </div>
                                </Col>
                            </Row>
                        )}
            
                        {(statusId === 9 || statusId === 10 || statusId === 11 || statusId === 12) && (
                            <Col span={24} style={{ marginBottom: 16 }}>
                                {orderStatus?.filter((status) => [9, 10, 11, 12].includes(Number(status.status_id))).map((status) => (
                                    <span key={Number(status?.status_id)} className={Number(status?.status_id) === statusId ? "status-tags-child-active" : "status-tags-child"} data-tooltip={`BDT ${status?.total_amount}`}
                                        onClick={() => getStatusWiseOrder(Number(status?.status_id))} style={{ cursor: "pointer", marginRight: 10 }}>
                                        {status?.status_name}
                                        <span className={Number(status?.status_id) === statusId ? "status-tags-child-child-active" : "status-tags-child-child"}>
                                            {status.order_count}
                                        </span>
                                    </span>
                                ))}
                            </Col>
                        )}
            
                        {(statusId === 3 || statusId === 7) && (
                            <Col span={24}>
                                <div className="all-location-tags" style={{ marginBottom: 15 }}>
                                    {statusId === 3 && (
                                        <span className="picking-list-for-order" onClick={handlePickingList} style={{padding: 7,marginRight: 10,borderRadius: 2,cursor: "pointer",backgroundColor: "#1C558B",color: "white",fontWeight: 600}}>
                                            Picking
                                        </span>
                                    )}
            
                                    {statusId === 7 && (
                                    orderStatus?.filter(status => Number(status.status_id) === 13).map((status, index) => (
                                        <span className="order-status-partial" key={index} onClick={() => getCourierWiseOrder(Number(status?.status_id))} data-tooltip={`BDT ${status?.total_payable}`}
                                            onMouseEnter={(e) => {e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";}}
                                            onMouseLeave={(e) => {e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";}}>
                                            <span style={{ marginRight: 6, display: "flex", alignItems: "center" }}>
                                                <InboxOutlined style={{ fontSize: 14, color: "#CC5500" }} />
                                            </span>
                
                                            Partial Delivered:
                
                                            <span style={{ marginLeft: 6, fontWeight: "bold" }}>
                                                {status?.courier_pending_count}
                                            </span>
                                        </span>
                                        ))
                                    )}
            
                                    {districtWiseList?.map((district, index) => (
                                        <span className="order-status-district" key={index} onClick={() => getDistrictWiseOrder(district?.id)} data-tooltip={`BDT ${district?.total_amount}`}
                                            style={{
                                                border: district?.id === districtId ? "1px solid #4ba9ceff" : "1px solid #4ba9ceff",
                                                backgroundColor: district?.id === districtId ? "#4ba9ceff" : "#e4f5fcff",
                                                color: district?.id === districtId ? "#fff" : "#333",
                                            }}
                                            onMouseEnter={e => {if(district?.id !== districtId) e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";}}
                                            onMouseLeave={e => {if(district?.id !== districtId) e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";}}
                                        >
                                            <span style={{marginRight: 4, display: "flex", alignItems: "center"}}>
                                                <EnvironmentOutlined style={{fontSize: 12,color: district?.id === districtId ? "#fff" : "#555"}}/>
                                            </span>
                    
                                            {district?.name}

                                            <span style={{marginLeft: 6, fontWeight: "bold"}}>
                                                {district?.orders_count}
                                            </span>
                                        </span>
                                    ))}
                                </div>
                            </Col>
                        )}
            
                        {statusId === 8 && (
                            <Col span={24}>
                                <div className="all-location-tags" style={{ marginBottom: 15 }}>
                                    {cancelReasons?.map((cancelReason, index) => (
                                        <span key={index} className={cancelReason.id === cancelReasonId ? "location-tags-child-active" : "location-tags-child"}
                                            data-tooltip={`BDT ${cancelReason.total_amount}`} onClick={() => getCancelReasonOrder(cancelReason.id)} style={{ cursor: "pointer", marginRight: 10 }}>
                                            {cancelReason.name}
                                            <span className={cancelReason.id === cancelReasonId ? "location-tags-child-child-active" : "location-tags-child-child"}>
                                                {cancelReason.orders_count}
                                            </span>
                                        </span>
                                    ))}
                                </div>
                            </Col>
                        )}
            
                        {statusId === 1 && (
                            <Col span={24}>
                                <div style={{ marginBottom: 15 }}>
                                    <Badge count={orders?.duplicate_orders_count} onClick={handleDuplicateOrder}>
                                        <Button>Duplicate Orders</Button>
                                    </Badge>
                                </div>
                            </Col>
                        )}
                    </Row>
        
                    <Row>
                        <Col span={24}>
                            <Table columns={columns} loading={loading} dataSource={orders?.data} rowKey="id" rowSelection={rowSelection} bordered scroll={{ x: 1600, y: "84vh" }}
                                pagination={{
                                    current: currentPage,
                                    pageSize: pageSize,
                                    total: orders?.meta?.total || 0,
                                    showSizeChanger: true,
                                    pageSizeOptions: [10, 20, 50, 100,150,200,250,300,400,500],
                                    showQuickJumper: true,
                                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                
                                    onChange: (page, size) => {
                                        const targetPage = size !== pageSize ? 1 : page;
                                        setCurrentPage(targetPage);
                                        setPageSize(size);
                                        getOrders(targetPage, { paginate_size: size });
                                    },
                                }}
                            />
                        </Col>
                    </Row>
                </Col>
            </Row>

            <Modal
                title={
                    <div style={{display: "flex",justifyContent: "space-between",alignItems: "center",}}>
                        <span> Order Preview 
                            <span style={{ color: "#6b7280" }}> — {previewOrder?.invoice_number || "—"} </span>
                        </span>
                    </div>
                } open={previewOpen} onCancel={closePreview} footer={null} width={1000}>

                {previewOrder ? (
                    <>
                        <Row gutter={[12, 12]}>
                            <Col xs={24} md={12}>
                                <div className="opm-card">
                                    <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>
                                        Customer Information
                                    </div>

                                    <div style={{ marginBottom: 10 }}>
                                        <div style={{fontSize: 12,color: "#6b7280",marginBottom: 4,}}>
                                            Phone Number
                                        </div>

                                        <div style={{fontSize: 14,fontWeight: 600,color: "#1f2937"}}>
                                            {previewOrder.phone_number || "—"}
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: 10 }}>
                                        <div style={{fontSize: 12,color: "#6b7280",marginBottom: 4}}>
                                            Name
                                        </div>
                                        <div style={{fontSize: 14,fontWeight: 600,color: "#1f2937"}}>
                                            {previewOrder.customer_name || "—"}
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: 10 }}>
                                        <div style={{fontSize: 12,color: "#6b7280",marginBottom: 4,}}>
                                            District
                                        </div>

                                        <div style={{fontSize: 14,fontWeight: 600,color: "#1f2937"}}>
                                            —
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{fontSize: 12,color: "#6b7280",marginBottom: 4}}>
                                            Address
                                        </div>

                                        <div style={{fontSize: 14,fontWeight: 500,color: "#1f2937",lineHeight: "1.5"}}>
                                            {previewOrder.address_details || "—"}
                                        </div>
                                    </div>
                                </div>
                            </Col>

                            <Col xs={24} md={12}>
                                <div className="opm-card">

                                    <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>
                                        Order Information
                                    </div>

                                    <Row gutter={[8, 8]}>
                                        <Col span={12}>
                                            <div style={{ marginBottom: 8 }}>
                                                <div style={{fontSize: 12,color: "#6b7280",marginBottom: 4}}>
                                                    Order Status
                                                </div>
                                                <Tag
                                                    style={{backgroundColor: `rgba(${parseInt(previewOrder?.current_status?.bg_color?.slice(1,3),16)}, ${parseInt(previewOrder?.current_status?.bg_color?.slice(3,5),16
                                                    )}, ${parseInt(previewOrder?.current_status?.bg_color?.slice(5,7),16)}, .9)`, color: previewOrder?.current_status?.text_color || "#fff", border: "none", padding: "4px 12px", fontSize: 13, fontWeight: 600}}
                                                >
                                                    {previewOrder?.current_status?.name || "—"}
                                                </Tag>
                                            </div>
                                        </Col>

                                        <Col span={12}>
                                            <div style={{ marginBottom: 8 }}>
                                                <div style={{fontSize: 12,color: "#6b7280",marginBottom: 4,}}>
                                                    Order Form
                                                </div>
                                                <div style={{fontSize: 14,fontWeight: 600,color: "#1f2937"}}>
                                                    {previewOrder?.order_from?.name || "—"}
                                                </div>
                                            </div>
                                        </Col>

                                        <Col span={12}>
                                            <div style={{ marginBottom: 8 }}>
                                                <div style={{fontSize: 12,color: "#6b7280",marginBottom: 4,}}>
                                                    Delivery Gateway
                                                </div>

                                                <div style={{fontSize: 14,fontWeight: 600,color: "#1f2937",}}>
                                                    {previewOrder?.payment_gateway?.name || "—"}
                                                </div>
                                            </div>
                                        </Col>

                                        <Col span={12}>
                                            <div style={{ marginBottom: 8 }}>
                                                <div style={{fontSize: 12,color: "#6b7280",marginBottom: 4}}>
                                                    Paid Status
                                                </div>

                                                <div style={{fontSize: 14,fontWeight: 600,color: "#1f2937",textTransform: "capitalize"}}>
                                                    {previewOrder?.paid_status || "—"}
                                                </div>
                                            </div>
                                        </Col>

                                        <Col span={12}>
                                            <div style={{ marginBottom: 8 }}>
                                                <div style={{fontSize: 12,color: "#6b7280",marginBottom: 4,}}>
                                                    Created By
                                                </div>
                                                <div style={{fontSize: 14,fontWeight: 600,color: "#1f2937"}}>
                                                    {previewOrder?.created_by?.username || previewOrder?.created_by?.id || "—"}
                                                </div>
                                            </div>
                                        </Col>

                                        <Col span={12}>
                                            <div style={{ marginBottom: 8 }}>
                                                <div style={{fontSize: 12,color: "#6b7280",marginBottom: 4,}}>
                                                    Updated By
                                                </div>

                                                <div style={{fontSize: 14,fontWeight: 600,color: "#1f2937"}}>
                                                    {previewOrder?.updated_by?.username || previewOrder?.updated_by?.id || "—"}
                                                </div>
                                            </div>
                                        </Col>

                                        <Col span={12}>
                                            <div style={{ marginBottom: 8 }}>
                                                <div style={{fontSize: 12,color: "#6b7280",marginBottom: 4}}>
                                                    Prepared By
                                                </div>
                                                <div style={{fontSize: 14,fontWeight: 600,color: "#1f2937"}}>
                                                    {previewOrder?.prepared_by?.username || previewOrder?.prepared_by?.id || "—"}
                                                </div>
                                            </div>
                                        </Col>

                                        <Col span={12}>
                                            <div style={{ marginBottom: 8 }}>
                                                <div style={{fontSize: 12,color: "#6b7280",marginBottom: 4}}>
                                                    Created At
                                                </div>

                                                <div style={{fontSize: 13,fontWeight: 600,color: "#1f2937"}}>
                                                    {formatDate(previewOrder?.created_at)}
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                </div>
                            </Col>
                        </Row>
            
                        <div className="opm-card" style={{ marginTop: 16 }}>
                            <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>
                                Product Information
                            </div>
                            {Array.isArray(previewItems) && previewItems.length > 0 ? (
                                <Table size="small" bordered pagination={false} rowKey={(r, i) => r.id ?? i} dataSource={previewItems} className="preview-product-table"
                                    columns={
                                    [
                                        {
                                            title: "SL",
                                            width: 60,
                                            align: "center",
                                            render: (_, __, i) => (
                                                <span style={{ fontWeight: 600, color: "#4b5563" }}>
                                                    {i + 1}
                                                </span>
                                            ),
                                        },
                                        {
                                            title: "Name",
                                            dataIndex: ["product", "name"],
                                            render: (text) => (
                                                <span style={{ fontWeight: 500, color: "#1f2937" }}>
                                                    {text}
                                                </span>
                                            ),
                                        },
                                        {
                                            title: "Variations",
                                            render: (_, r) => {
                                                const parts = [];

                                                if (r.attribute_value_1) parts.push(`${r.attribute_value_1?.attribute?.name} - ${r.attribute_value_1?.value}`);

                                                if (r.attribute_value_2) parts.push(`${r.attribute_value_2?.attribute?.name} - ${r.attribute_value_2?.value}`);

                                                if (r.attribute_value_3) parts.push(`${r.attribute_value_3?.attribute?.name} - ${r.attribute_value_3?.value}`);

                                                return parts.length ? (
                                                    <span style={{ fontSize: 13, color: "#6b7280" }}>
                                                        {parts.join(", ")}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: "#9ca3af" }}>—</span>
                                                );
                                            },
                                        },
                                        {
                                            title: "Quantity",
                                            dataIndex: "quantity",
                                            width: 90,
                                            align: "center",
                                            render: (v) => (
                                                <span style={{ fontWeight: 600, color: "#1f2937" }}>
                                                    {v}
                                                </span>
                                            ),
                                        },
                                        {
                                            title: "Mrp",
                                            dataIndex: "mrp",
                                            width: 120,
                                            align: "right",
                                            render: (v) => (
                                                <span style={{ fontWeight: 500, color: "#6b7280" }}>
                                                    {toTk(v)}
                                                </span>
                                            ),
                                        },
                                        {
                                            title: "Sell Price",
                                            dataIndex: "sell_price",
                                            width: 120,
                                            align: "right",
                                            render: (v) => (
                                                <span style={{ fontWeight: 600, color: "#059669" }}>
                                                    {toTk(v)}
                                                </span>
                                            ),
                                        },
                                    ]
                                }
                                />
                            ) : (
                                <div style={{padding: 16,border: "1px dashed #e5e7eb",borderRadius: 6,background: "#fafafa",color: "#6b7280",textAlign: "center"}}>
                                    <InboxOutlined style={{ fontSize: 32, color: "#d1d5db", marginBottom: 8 }}/>
                                    <div style={{ fontSize: 14 }}>
                                        No items found for this order.
                                    </div>
                                </div>
                            )}
                        </div>
            
                        <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
                            <Col xs={24} md={12} />
                            <Col xs={24} md={12}>
                                <Table size="small" pagination={false} showHeader={false} bordered rowKey={(r) => r.label}
                                    dataSource={
                                        [
                                            { 
                                                label: "Regular Price", 
                                                value: toTk(previewOrder?.mrp) 
                                            },
                                            { 
                                                label: "Discount", 
                                                value: toTk(previewOrder?.discount) 
                                            },
                                            {
                                                label: "Sell Price",
                                                value: toTk(previewOrder?.sell_price),
                                            },
                                            {
                                                label: "Delivery Charge",
                                                value: toTk(previewOrder?.delivery_charge),
                                            },
                                            {
                                                label: "Special Discount",
                                                value: toTk(previewOrder?.special_discount),
                                            },
                                            {
                                                label: "Coupon Discount",
                                                value: toTk(previewOrder?.coupon_value),
                                            },
                                            {
                                                label: "Advance Payment",
                                                value: toTk(previewOrder?.advance_payment),
                                            },
                                            {
                                                label: "__TOTAL__",
                                                value: toTk(previewOrder?.payable_price),
                                                isTotal: true,
                                            },
                                        ]
                                    }
                                    columns={
                                        [
                                            {
                                                dataIndex: "label",
                                                render: (t, r) =>
                                                r.isTotal ? <b>Total</b> : <span>{t}</span>,
                                            },
                                            {
                                                dataIndex: "value",
                                                align: "right",
                                                render: (t, r) => (r.isTotal ? <b>{t}</b> : t),
                                            },
                                        ]
                                    }
                                />
                            </Col>
                        </Row>
            
                        {previewOrder?.note ? (
                            <div style={{ marginTop: 12 }}>
                                <b>Note:</b> {previewOrder.note}
                            </div>
                        ) : null}
                    </>
                ) : null}
            </Modal>

            <Modal title="Order Locked" open={largeModal} onCancel={() => setLargeModal(false)} footer={null} width={500}>
                <div style={{ padding: "20px", textAlign: "center" }}>
                    <h4>
                        This order right now Locked by
                        <span style={{ fontWeight: 700, textTransform: "capitalize" }}>
                            {lockedInfo.locked_by}
                        </span>
                    </h4>

                    <p style={{width: 300,textAlign: "center",margin: "auto",marginBottom: 15}}>
                        Are you overwrite or unlocked this order. Please Click Overwrite
                    </p>

                    <Space>
                        <Button onClick={() => setLargeModal(false)}>Close</Button>
                        <Button type="primary" onClick={overwrite}>
                            Overwrite
                        </Button>
                    </Space>
                </div>
            </Modal>

            <Modal title="Change Your Payment Status" open={handleselectedActionChangeStatusModal} onCancel={() => setHandleselectedActionChangeStatusModal(false)} onOk={orderPaidOrUnpaidStatusUpdate} width={300}>
                <Select value={orderPaidOrUnpaidStatus} onChange={(value) => setOrderPaidOrUnpaidStatus(value)} style={{ width: "100%" }}>
                    <Option value="unpaid">Unpaid</Option>
                    <Option value="paid">Paid</Option>
                </Select>
            </Modal>

            <Modal title="Change Your Order Status" loading={bulkLoading} open={handleselectedActionCurrentOrderStatusModal} onCancel={() => setHandleselectedActionCurrentOrderStatusModal(false)}
                onOk={orderCurrentStatusUpdate} width={300}>
                <Select value={orderCurrentStatus} onChange={(value) => setOrderCurrentStatus(value)} style={{ width: "100%", marginBottom: 16 }}>
                    {orderStatus?.filter((status) => status.status_id !== 9 && status.status_id !== 10)
                    .map((status, index) => (
                        <Option key={index} value={status.status_id}>
                            {status.status_name}
                        </Option>
                    ))}
                </Select>
        
                {orderCurrentStatus == 5 && (
                    <Select value={courierId} onChange={(value) => setCourierId(value)} style={{ width: "100%" }} placeholder="Select Courier">
                        {couriers?.map((item, index) => (
                            <Option key={index} value={item.id}>
                                {item.name}
                            </Option>
                        ))}
                    </Select>
                )}

                {orderCurrentStatus == 8 && (
                    <Select value={cancelReasonId} onChange={(value) => setCancelReasonId(value)} style={{ width: "100%" }}>
                        {cancelReasons?.map((reason, index) => (
                            <Option key={index} value={reason.id}>
                            {reason.name}
                            </Option>
                        ))}
                    </Select>
                )}
        
                {orderCurrentStatus == 3 && (
                    <>
                        <Input type="date" placeholder="Approx Start Date" value={approxStartDate} onChange={(e) => setApproxStartDate(e.target.value)} style={{ marginBottom: 12 }}/>
            
                        <Input type="date" placeholder="Approx End Date" value={approxEndDate} onChange={(e) => setApproxEndDate(e.target.value)} style={{ marginBottom: 12 }}/>
            
                        <Input.TextArea placeholder="Follow-up Note" value={followNote} onChange={(e) => setFollowNote(e.target.value)} rows={3}/>
                    </>
                )}
            </Modal>

            <Modal title="Order Assign User" open={handleselectedActionOrderAssignModal} onCancel={() => setHandleselectedActionOrderAssignModal(false)} onOk={orderAssignUpdate} width={300}>
                <Select value={orderAssign} onChange={(value) => setOrderAssign(value)} style={{ width: "100%" }}>
                    {users?.map((user, index) => (
                        <Option key={index} value={user?.id}>
                            {user?.username}
                        </Option>
                    ))}
                </Select>
            </Modal>

            <Modal title="Print Invoice" open={handleselectedActionPrintInvoiceModal} onCancel={() => setHandleselectedActionPrintInvoiceModal(false)} onOk={getInvoicePrint} width={300}>
                <Select value={printInvoice} onChange={(value) => setPrintInvoice(value)} style={{ width: "100%" }}>
                    <Option value="a4-invoice">A4 Print Invoice</Option>
                    <Option value="a5-invoice">A5 Print Invoice</Option>
                    <Option value="pos-invoice">Pos Invoice</Option>
                </Select>
            </Modal>

            <Modal title="Return Order Details" open={handleReturnAndDamageModal} onCancel={() => setHandleReturnAndDamageModal(false)} onOk={handleReturnAndDamage} width={800}>
                <Row>
                    <Col span={24}>
                        <Row>
                            <Col md={6}>
                                <Form.Item label="Order Status">
                                    <Select value={returnAndDamageOrderStatus} onChange={(value) => setReturnAndDamageOrderStatus(value)} size="large">
                                        <Option value="9">Return</Option>
                                        <Option value="10">Damage</Option>
                                    </Select>
                                    {errors?.status_id && (
                                        <span className="text-danger">{errors?.status_id[0]}</span>
                                    )}
                                </Form.Item>
                            </Col>

                            <Col md={6}>
                                <Form.Item label="Order Type">
                                    <Select value={returnAndDamageOrderType} onChange={(value) => setReturnAndDamageOrderType(value)} size="large">
                                        <Option value="full">Full</Option>
                                        <Option value="partial">Partial</Option>
                                    </Select>
                                        {errors?.type && (
                                        <span className="text-danger">{errors?.type[0]}</span>
                                    )}
                                </Form.Item>
                            </Col>

                            <Col md={12}>
                                <Form.Item label="Reason">
                                    <TextArea value={returnAndDamageOrderReason} onChange={(e) => setReturnAndDamageOrderReason(e.target.value)} rows={2} placeholder="Please input"/>
                                    {errors?.reason && (
                                        <span className="text-danger">{errors?.reason[0]}</span>
                                    )}
                                </Form.Item>
                            </Col>
                        </Row>
                    </Col>

                    <Col span={24}>
                        <Table dataSource={orderWiseProducts?.result} rowKey="id" bordered pagination={false} columns={returnOrderColumns}/>
                    </Col>
                </Row>
            </Modal>

            <Modal title="Product and Stock Checklist" open={handlePickingListModal} onCancel={() => setHandlePickingListModal(false)}
                footer={[
                    <Button key="print" style={{backgroundColor: "#1C558B",color: "aliceblue",fontWeight: 600}} icon={<PrinterOutlined />} onClick={pickingListPrintInvoice}>
                        Print
                    </Button>,

                    <Button key="export" style={{backgroundColor: "#DC3545",color: "aliceblue",fontWeight: 600}} icon={<DownloadOutlined />} onClick={exportToPDF}>
                        Export PDF
                    </Button>,

                    <Button key="export" style={{backgroundColor: "#1C558B", color: "aliceblue", fontWeight: 600,}} icon={<DownloadOutlined />} onClick={exportToCSV}>
                        Export As CSV
                    </Button>,
                ]} width={900}>

                {loading ? (
                    <div style={{ textAlign: "center" }}>
                        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}/>
                    </div>
                ) : (
                    <div id="print-section">
                        <Table bordered dataSource={pickingList?.result} rowKey="id" pagination={false} columns={pickingListColumns}/>
                    </div>
                )}
            </Modal>

            <Modal title="Add Note" open={isNoteModalOpen} loading={noteLoader} onCancel={() => setIsNoteModalOpen(false)} onOk={handleNoteSubmit} okText="Submit" destroyOnClose>
                <Form form={form}>
                    <Form.Item name="note" label="Note" rules={[{ required: true, message: "Please write a note" }]}>
                        <TextArea rows={4} placeholder="Write your note here..." />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal title="Order Notes" open={isNotesModalOpen} onCancel={() => setIsNotesModalOpen(false)} footer={null} width={800} destroyOnClos>
                <Table rowKey="id" columns={noteColumns} dataSource={notes} loading={loadingNotes} pagination={false} size="small"/>
            </Modal>

            <OrderHistoryModal orderId={selectedOrderId} open={historyModalOpen} onClose={() => setHistoryModalOpen(false)}/>

            <CourierStatusModal open={isCourierModalOpen} onClose={() => setIsCourierModalOpen(false)} data={courierLogs}/>
        </>
    )
}
