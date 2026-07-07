import { ArrowLeftOutlined, CloseOutlined, DeleteOutlined, PhoneOutlined, InboxOutlined, LoadingOutlined, PlusOutlined, InfoCircleOutlined, HistoryOutlined, UserOutlined, ShoppingCartOutlined, CreditCardOutlined, MessageOutlined, CalendarOutlined, GlobalOutlined, CarOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { DatePicker, Breadcrumb, Button, Card, Col, Divider, Empty, Form, Grid, Image, Input, InputNumber, message, Popconfirm, Row, Select, Space, Spin, Table, Typography, Modal, Tag } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { getDatas, postData } from '../../api/common/common'
import useTitle from '../../hooks/useTitle'
import CourierDeliveryReport from './followupsell/CourierDeliveryReport'
import OrderHistoryModal from '../../components/order/OrderHistoryModal'
import OrderNote from '../../components/order/OrderNote'
import { useSelector } from 'react-redux'
import './OrderAdd.css';

const currency = (value) => `৳ ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const OrderEdit = () => {
    // Hook
    useTitle("Edit Order");

    // Variable
    const navigate        = useNavigate();
    const params          = useParams();
    const orderId         = params.id;
    const { state }       = useLocation();
    const currentStatusId = state?.statusId;
    const user            = useSelector((state) => state.auth.user);
    const canEditSource   = user?.roles?.some(r => r.id === 1 || r.id === 2);

    // State variables
    const [products, setProducts]                           = useState([]);
    const [productInfo, setProductInfo]                     = useState(null);
    const [attributesList, setAttributesList]               = useState([]);
    const [cartItems, setCartItems]                         = useState([]);
    const [messageApi, contextHolder]                       = message.useMessage();
    const [phoneNumber, setPhoneNumber]                     = useState('');
    const [courierAreaId, setCourierAreaId]                 = useState('');
    const [customerName, setCustomerName]                   = useState('');
    const [district, setDistrict]                           = useState(null);
    const [address, setAddress]                             = useState('');
    const [statusId, setStatusId]                           = useState('');
    const [orderFromId, setOrderFromId]                     = useState('');
    const [deliveryChargeId, setDeliveryChargeId]           = useState('');
    const [paymentGatewayId, setPaymentGatewayId]           = useState('');
    const [paymentStatus, setPaymentStatus]                 = useState('unpaid');
    const [variationId, setVariationId]                     = useState(null);
    const [quantity, setQuantity]                           = useState(1);
    const [advancePayment, setAdvancePayment]               = useState(0);
    const [changeableChargeValue, setChangeableChargeValue] = useState(0);
    const [specialDiscount, setSpecialDiscount]             = useState(0);
    const [orderNote, setOrderNote]                         = useState('');
    const [customerTypeId, setCustomerTypeId]               = useState('');
    const [cancelReasonId, setCancelReasonId]               = useState('');
    const [searchQuery, setSearchQuery]                     = useState('');
    const [deliveryFee, setDeliveryFee]                     = useState('');
    const [deliveryName, setDeliveryName]                   = useState('');
    const [fromName, setFromName]                           = useState('');
    const [hiddenSearchProducts, setHiddenSearchProducts]   = useState(true);
    const [searchError, setSearchError]                     = useState('');
    const [addLoading, setAddLoading]                       = useState(false);
    const [deleteLoading, setDeleteLoading]                 = useState(null);
    const [submitLoading, setSubmitLoading]                 = useState(false);
    const [isPathao, setIsPathao]                           = useState(false);
    const [isRedx, setIsRedx]                               = useState(false);
    const [pathaoStores, setPathaoStores]                   = useState([]);
    const [pathaoStoreId, setPathaoStoreId]                 = useState('');
    const [pathaoCityOptions, setPathaoCityOptions]         = useState([]);
    const [selectedSearchArea, setSelectedSearchArea]       = useState('');
    const [itemWeight, setItemWeight]                       = useState('0.5');
    const [redxAreaId, setRedxAreaId]                       = useState('');
    const [redxPickupStoreId, setRedxPickupStoreId]         = useState('');
    const [areaLoading, setAreaLoading]                     = useState(false);
    const [noteList, setNoteList]                           = useState([]);
    const [note, setNote]                                   = useState('');
    const [noteId, setNoteId]                               = useState('');
    const [noteLoading, setNoteLoading]                     = useState(false);
    const [errors, setErrors]                               = useState({});
    const [loading, setLoading]                             = useState(false);
    const [isModalVisible, setIsModalVisible]               = useState(false);
    const [customerData, setCustomerData]                   = useState(null);
    const [showHistory, setShowHistory]                     = useState(false);
    const [selectedOrderId, setSelectedOrderId]             = useState(null);
    const [itemQuantity, setItemQuantity]                   = useState("");
    const [itemDescription, setItemDescription]             = useState("");

    // Redux State
    const paymentGateways           = useSelector((state) => state.paymentGateway.list);
    const districts                 = useSelector((state) => state.districts.list);
    const orderFromList             = useSelector((state) => state.orderFrom.list);
    const couriers                  = useSelector((s) => s.courier.list);
    const defaultCourierId          = useSelector((s) => s.courier.defaultCourierId);
    const [courierId, setCourierId] = useState("");
    const customerTypes             = useSelector((s) => s.customerType.list);
    const cancelReasonTypes         = useSelector((s) => s.cancelReason.list);
    const statuses                  = useSelector((state) => state.status.list);
    const deliveryGateways          = useSelector((state) => state.deliveryGateway.list);

    const getAttributeValue = async (id) => {
        const res = await getDatas(`/admin/attribute-values/${id}`)
        return res?.result
    }

    const getOrderDetails = useCallback(async () => {
        const res = await getDatas(`/admin/orders/${orderId}`)
        if (res?.success) {
            const orderInfo = res?.result

            setPhoneNumber(orderInfo?.phone_number || '');
            setCourierAreaId(orderInfo?.courier_area_id ? Number(orderInfo.courier_area_id) : null);
            setCustomerName(orderInfo?.customer_name || '');
            setDistrict(orderInfo?.district?.id || '');
            setAddress(orderInfo?.address_details || '');
            setStatusId(orderInfo?.current_status?.id || 1);
            setOrderFromId(orderInfo?.order_from?.id || '');
            setCustomerTypeId(orderInfo?.customer_type?.id || '');
            setDeliveryChargeId(orderInfo?.delivery_gateway?.id || '');
            setPaymentGatewayId(orderInfo?.payment_gateway?.id || '');
            setPaymentStatus(orderInfo?.paid_status || 'unpaid');
            setOrderNote(orderInfo?.note || '');
            setCourierId(orderInfo?.courier?.id || defaultCourierId || "");
            setPathaoStoreId(orderInfo?.pickup_store_id || '');
            setRedxAreaId(orderInfo?.area_id || '');
            setRedxPickupStoreId(orderInfo?.delivery_area || '');
            setItemWeight(orderInfo?.item_weight || '0.5');
            setItemQuantity(orderInfo?.item_quantity || '0');
            setItemDescription(orderInfo?.item_description || '');
            setAdvancePayment(orderInfo?.advance_payment || 0);
            setSpecialDiscount(orderInfo?.special_discount || 0);
            setChangeableChargeValue(orderInfo?.delivery_charge || 0);
            
            // Load Pathao area if exists
            if (orderInfo?.city_id && orderInfo?.zone_id && orderInfo?.area_id) {
                await remoteMethod('', orderInfo.city_id, orderInfo.zone_id, orderInfo.area_id)
            }

            // Load cart items
            const items = orderInfo?.details || []
            const cartData = []

            for (let item of items) {
                let variation1 = item?.attribute_value_1 ? await getAttributeValue(item.attribute_value_1.id) : null
                let variation2 = item?.attribute_value_2 ? await getAttributeValue(item.attribute_value_2.id) : null
                let variation3 = item?.attribute_value_3 ? await getAttributeValue(item.attribute_value_3.id) : null

                cartData.push({
                    item_id    : item?.product?.id,
                    key        : `${item?.product?.id}_${Date.now()}_${Math.random()}`,
                    name       : item?.product?.name,
                    image      : item?.product?.img_path,
                    buy_price  : item?.buy_price || 0,
                    mrp        : item?.mrp || 0,
                    offer_price: item?.sell_price || 0,
                    discount   : item?.discount || 0,
                    variation_1: variation1,
                    variation_2: variation2,
                    variation_3: variation3,
                    quantity   : item?.quantity || 1,
                    variations : item?.product?.variations,
                })
            }

            setCartItems(cartData)
        }
    }, [orderId, defaultCourierId])

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            await getOrderDetails()
            await Promise.all([
                getAttributeList(),
                getPathaoStoreData(),
                getNoteList(),
                checkOrderLock(),
            ])
        }
        fetchData()

        return () => {
            unlockOrder()
        }
    }, [orderId, getOrderDetails])

    useEffect(() => {
        if (couriers.length && !courierId) {
            const initialCourier = defaultCourierId || "";
            setCourierId(initialCourier);
            getCourierWiseData(initialCourier);
        }
    }, [couriers, defaultCourierId, courierId]);

    useEffect(() => {
        if (courierId) {
            getCourierWiseData(courierId)
        }
    }, [courierId])

    useEffect(() => {
        if (pathaoStores?.length === 1) {
            setPathaoStoreId(pathaoStores[0].store_id);
        }
    }, [pathaoStores]);

    const insertOrderFrom = async () => {
        setAddLoading(true)
        const res = await postData('/admin/order-froms', {name: fromName,status: 'active'})
        if (res?.success) {
            setTimeout(() => {
                setFromName('')
                setAddLoading(false)
                setOrderFromId('')
                message.success('Order source added successfully')
            }, 1000)
        } else {
            setAddLoading(false)
        }
    }

    const insertDeliveryGateway = async () => {
        setAddLoading(true)
        const res = await postData('/admin/delivery-gateways', {name: deliveryName,deliveryFee: deliveryFee,status: 'active'})
        if (res && res?.success) {
            setTimeout(() => {
                setDeliveryChargeId('');
                setDeliveryFee('');
                setDeliveryName('');
                setAddLoading(false);
                message.success('Delivery gateway added successfully');
            }, 1000)
        } else {
            setAddLoading(false);
        }
    }

    const searchProduct = async () => {
        if (!searchQuery) return
        
        try {
            setLoading(true);
            const res = await getDatas('/admin/products/search', { page: 1, per_page: 10, search_key: searchQuery })
            if (res && res?.success) {
                setProducts(res?.result || [])
                setHiddenSearchProducts(false)
            }
        } catch (error) {
            console.log(error);
        }finally{
            setLoading(false);
        }

    }

    useEffect(() => {
        const delay = setTimeout(() => {
            searchProduct();
        }, 200);

        return () => clearTimeout(delay);
    }, [searchQuery]);

    const getAttributeList = async () => {
        const res = await getDatas('/admin/attributes/list')
        if (res?.success) {
            setAttributesList(res?.result || [])
        }
    }

    const attributeName = (attributeId) => {
        const attribute = attributesList?.find((i) => i.id === Number(attributeId))
        return attribute?.name || ''
    }

    const getPathaoStoreData = async () => {
        const res = await getDatas('/admin/pathao/stores')
        if (res?.result?.data) {
            setPathaoStores(Array.isArray(res?.result?.data?.data) ? res.result.data?.data : []);
        }
    }

    const remoteMethod = async (query = '', cityId = '', zoneId = '', areaId = '') => {
        setAreaLoading(true);

        try {
            const res = await getDatas('/admin/pathao/search-areas', {
                area_name: query,
                city_id  : cityId,
                zone_id  : zoneId,
                area_id  : areaId,
            });

            const areas = res?.result || [];
            setPathaoCityOptions(areas);

            if (areas.length > 0) {
                setSelectedSearchArea(areas[0].id);
            }
        } catch (error) {
            console.error("Pathao area search failed:", error);
            setPathaoCityOptions([]);
        } finally {
            setAreaLoading(false);
        }
    };

    const handlePathaoAreaChange = (value) => {
        setSelectedSearchArea(value);
    };

    useEffect(() => {
        if (address) {
            remoteMethod(address.replace(/\s+/g, ' ').trim());
        }
    }, [address]);

    useEffect(() => {
        if (!pathaoCityOptions.length) return;

        if (courierAreaId) {
            const matched = pathaoCityOptions.find(item => Number(item.id) === Number(courierAreaId));

            if (matched) {
                setSelectedSearchArea(matched.id);
                return;
            }
        }

        setSelectedSearchArea(pathaoCityOptions[0].id);

    }, [pathaoCityOptions, courierAreaId]);

    const getCourierWiseData = (courierIdValue) => {
        if (courierIdValue == 2) {
            setIsPathao(true)
            setIsRedx(false)
        } else if (courierIdValue == 3) {
            setIsRedx(true)
            setIsPathao(false)
        } else if (courierIdValue == 1) {
            setIsPathao(false)
            setIsRedx(false)
        }
    }

    const shippingCharge = (id) => {
        const charge = deliveryGateways?.find((i) => id == i.id)
        setChangeableChargeValue(charge?.delivery_fee || 0)
    }

    const removeAddField = () => {
        setDeliveryChargeId('')
        setDeliveryFee('')
        setDeliveryName('')
        setOrderFromId('')
        setFromName('')
    }

    const addProduct = (product) => {
        setSearchQuery(product.name)
        setHiddenSearchProducts(true)
        setProductInfo(product)
    }

    const addToCart = async (product) => {
        if (!product?.id) {
            setSearchError('Product and Variation is required');
            return;
        }

        let newItem = {
            item_id  : product.id,
            key      : `${product.id}_${Date.now()}`,
            name     : product.name,
            image    : product.image,
            quantity : quantity,
            is_upsell: 1,
        };

        if (product.variations?.length > 0) {
            if (variationId === null || variationId === undefined) {
                setSearchError('Please Select Variation');
                return;
            }

            const selectedVariation = product.variations[variationId];
            newItem = {
                ...newItem,
                buy_price  : selectedVariation.buy_price,
                mrp        : selectedVariation.mrp,
                offer_price: selectedVariation.offer_price,
                discount   : selectedVariation.discount,
                variation_1: selectedVariation?.attribute_value_1,
                variation_2: selectedVariation?.attribute_value_2,
                variation_3: selectedVariation?.attribute_value_3,
                variations : product.variations,
            };
        } else {
            newItem = {
                ...newItem,
                buy_price  : product.buy_price,
                mrp        : product.mrp,
                offer_price: product.offer_price,
                discount   : product.discount,
            };
        }

        setCartItems((prev) => [...prev, newItem]);

        setSearchQuery('');
        setQuantity(1);
        setVariationId(null);
        setProductInfo(null);
        setSearchError('');
    };

    const deleteCartItem = (index) => {
        setDeleteLoading(index)

        setTimeout(() => {
            setCartItems((prev) => prev.filter((_, i) => i !== index))
            setDeleteLoading(null)
        }, 1000)
    }

    const updateCartQuantity = (index, newQuantity) => {setCartItems((prev) => prev.map((item, i) => (i === index ? { ...item, quantity: newQuantity || 1 } : item)))}

    const updateDiscount = (index, newvalue) => {
        setCartItems((prev) =>
            prev.map((item, i) => (i === index ? { ...item, discount: newvalue || 1 } : item))
        )
    }

    // Order notes functions
    const getNoteList = async () => {
        const res = await getDatas('/admin/orders/notes', {order_id: orderId})
        if (res?.success) {
            setNoteList(res?.result || [])
        }
    }

    const editNote = (data) => {
        setNoteId(data?.id)
        setNote(data?.note)
    }

    const deleteNote = async (id) => {
        try {
            const res = await postData(`/admin/orders/notes/${id}`, { _method: 'delete' })
            if (res && res?.success) {
                message.success('Note deleted successfully')
                getNoteList()
            }
        } catch (error) {
            console.error('Error:', error)
            message.error('Failed to delete note')
        }
    }

    const createNote = async () => {
        setNoteLoading(true)
        const formData = new FormData()
        formData.append('order_id', orderId)
        formData.append('note', note)

        let api = '/admin/orders/notes'
        if (noteId) {
            api = `/admin/orders/notes/${noteId}`
            formData.append('_method', 'put')
        }

        const res = await postData(api, formData)

        if (res && res?.success) {
            setNote('')
            setNoteId('')
            setNoteLoading(false)
            getNoteList()
            message.success('Note saved successfully')
        } else {
            setNoteLoading(false)
            message.error('Failed to save note')
        }
    }

    // Order lock system
    const checkOrderLock = async () => {
        const res = await getDatas(`/admin/orders/locked-status/${orderId}`)
        if (res?.success) {
            // setLockedInfo(res?.result)
        }
    }

    const unlockOrder = async () => {
        try {
            await postData(`/admin/orders/unlocked/${orderId}`)
        } catch (error) {
            console.error('Error unlocking order:', error)
        }
    }

    const formatDateTime = (isoString) => {
        const date = new Date(isoString)
        const day = date.getDate()
        const month = date.getMonth() + 1
        const year = date.getFullYear()
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        const seconds = String(date.getSeconds()).padStart(2, '0')
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
    }

    // Phone calling
    const connectPhone = () => {
        const phoneLink = `tel:${phoneNumber}`
        window.location.href = phoneLink
    }

    // Price calculations
    const totalPrice = useMemo(() => {
        const totalOfferPrice = cartItems.reduce((total, item) => total + item.offer_price * item.quantity, 0)
        const totalMrp = cartItems.reduce((total, item) => total + item.mrp * item.quantity, 0)
        const totalDiscount = cartItems.reduce((total, item) => total + item.discount * item.quantity, 0)
        return {
            mrp_price: totalMrp,
            offer_price: totalOfferPrice,
            discount_price: totalDiscount,
        }
    }, [cartItems])

    const payablePrice = useMemo(() => {
        return (
            parseFloat(totalPrice.mrp_price) - parseFloat(totalPrice.discount_price) + parseFloat(changeableChargeValue) - parseFloat(specialDiscount || 0) - parseFloat(advancePayment || 0)
        )
    }, [totalPrice, changeableChargeValue, specialDiscount, advancePayment])

    const handleOpenHistory = (id) => {
        setSelectedOrderId(id);
        setShowHistory(true);
    };

    console.log(isRedx);

    // Submit order update
    const submit = async () => {
        setSubmitLoading(true);

        const formData = new FormData();

        formData.append('payment_gateway_id', paymentGatewayId);
        formData.append('delivery_gateway_id', deliveryChargeId);
        formData.append('current_status_id', statusId);
        formData.append('coupon_id', '');
        formData.append('paid_status', paymentStatus);
        formData.append('delivery_charge', changeableChargeValue)
        formData.append('special_discount', specialDiscount);
        formData.append('advance_payment', advancePayment);
        formData.append('address_details', address);
        formData.append('district_id', district);
        formData.append('customer_name', customerName);
        formData.append('phone_number', phoneNumber);
        formData.append('order_from_id', orderFromId);
        formData.append('courier_id', courierId);
        formData.append('pickup_store_id', isPathao ? pathaoStoreId : redxPickupStoreId);
        formData.append('courier_area_id',isPathao ? selectedSearchArea : redxAreaId);
        formData.append('item_weight', itemWeight || '');
        formData.append('item_quantity', itemQuantity || '');
        formData.append('item_description', itemDescription || '');
        formData.append('customer_type_id', customerTypeId);
        formData.append('cancel_reason_id', cancelReasonId);
        formData.append('order_note', orderNote);

        formData.append('_method', 'PUT');

        let cartIndex = 0;
        
        for (const item of cartItems) {
            formData.append(`items[${cartIndex}][product_id]`, item?.item_id || '')
            formData.append(`items[${cartIndex}][buy_price]`, item?.buy_price || 0)
            formData.append(`items[${cartIndex}][mrp]`, item?.mrp || 0)
            formData.append(`items[${cartIndex}][sell_price]`, item?.offer_price || 0)
            formData.append(`items[${cartIndex}][discount]`, item?.discount || 0)
            formData.append(`items[${cartIndex}][attribute_value_id_1]`, item?.variation_1?.id || '')
            formData.append(`items[${cartIndex}][attribute_value_id_2]`, item?.variation_2?.id || '')
            formData.append(`items[${cartIndex}][attribute_value_id_3]`, item?.variation_3?.id || '')
            formData.append(`items[${cartIndex}][quantity]`, Number(item?.quantity))
            formData.append(`items[${cartIndex}][is_upsell]`, item?.is_upsell)
            cartIndex++
        }

        const res = await postData(`/admin/orders/${orderId}`, formData)

        try {
            setSubmitLoading(false)

            if (res && res?.success) {
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });
                setTimeout(() => {
                    navigate('/orders', {
                        state: {
                            statusId: currentStatusId
                        },
                    });
                }, 300);
            } else if(res?.success === false) {
                setErrors(res?.errors || {})
                messageApi.open({
                    type: "error",
                    content: res.message,
                });
            }
        } catch (error) {
            console.log(error);
        }
    }

    const productColumns = 
    [
        {
            title: 'Image',
            dataIndex: 'image',
            key: 'image',
            width: 80,
            render: (src) => (
                <Image src={src} width={50} height={50} style={{ objectFit: 'cover', borderRadius: '8px' }} preview={false} />
            ),
        },
        {
            title: 'Product Info',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <div>
                    <Typography.Text strong style={{ fontSize: '15px' }}>{text}</Typography.Text>
                    <div style={{ marginTop: 4 }}>
                        {record.variation_1 && (
                            <Tag className="variation-tag">
                                {attributeName(record.variation_1?.attribute?.id || record.variation_1?.attribute_id)}: {record.variation_1?.value}
                            </Tag>
                        )}
                        {record.variation_2 && (
                            <Tag className="variation-tag">
                                {attributeName(record.variation_2?.attribute?.id || record.variation_2?.attribute_id)}: {record.variation_2?.value}
                            </Tag>
                        )}
                        {record.variation_3 && (
                            <Tag className="variation-tag">
                                {attributeName(record.variation_3?.attribute?.id || record.variation_3?.attribute_id)}: {record.variation_3?.value}
                            </Tag>
                        )}
                    </div>
                </div>
            )
        },
        {
            title: 'Qty',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 100,
            render: (value, record, index) => (
                <InputNumber size="middle" min={1} value={value} onChange={(v) => updateCartQuantity(index, v)} style={{ borderRadius: '6px' }}/>
            ),
        },
        {
            title: 'Pricing',
            key: 'pricing',
            width: 180,
            render: (_, record, index) => (
                <div>
                    <div style={{ color: '#64748b', fontSize: '12px', textDecoration: 'line-through' }}>{currency(record.mrp)}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>Disc:</span>
                        <InputNumber size="small" min={0} value={record.discount} onChange={(v) => updateDiscount(index, v)} style={{ width: '80px', borderRadius: '4px' }}/>
                    </div>
                </div>
            ),
        },
        {
            title: 'Subtotal',
            key: 'total',
            width: 120,
            render: (_, r) => (
                <Typography.Text strong style={{ color: '#2563eb' }}>
                    {currency((r.mrp - r.discount) * r.quantity)}
                </Typography.Text>
            ),
        },
        {
            title: '',
            key: 'action',
            width: 50,
            align: 'center',
            render: (_, r, index) => (
                <Popconfirm title="Remove this item?" okText="Yes" cancelText="No" onConfirm={() => deleteCartItem(index)}>
                    <Button danger type="text" shape="circle" icon={deleteLoading === index ? <LoadingOutlined /> : <DeleteOutlined />}/>
                </Popconfirm>
            ),
        },
    ]

    const handleInfoClick = async () => {
        if (!phoneNumber) return;
        setIsModalVisible(true);
        setLoading(true);
        setCustomerData(null);
        try {
            const res = await getDatas("/admin/orders/courier/delivery/report", {phone_number: phoneNumber});
            if (res && res?.success) {
                setCustomerData(res.result || null);
            } else {
                message.error(res?.msg || "Failed to load courier report");
            }
        } catch (error) {
            console.log("Something went wrong", error);
        }finally{
            setLoading(false);
        }
    };

    useEffect(() => {
        if (pathaoStores?.length) {
            const defaultStore = pathaoStores.find(
                (s) => s.store_name?.toLowerCase() === "stylon"
            );

            if (defaultStore) {
                setPathaoStoreId(defaultStore.store_id);
            }
        }
    }, [pathaoStores]);

    return (
        <div className="order-add-container">
            {contextHolder}
            <div className="page-header">
                <div>
                    <Typography.Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
                        Edit Order #{orderId}
                    </Typography.Title>
                    <Breadcrumb 
                        items={[
                            { title: 'Dashboard', href: '/admin/dashboard' }, 
                            { title: 'Orders', href: '/orders' }, 
                            { title: 'Order Editing' }
                        ]} 
                        style={{ marginTop: 8 }}
                    />
                </div>
                <Space>
                    <Button size="small" icon={<HistoryOutlined />} onClick={() => handleOpenHistory(orderId)} style={{ borderRadius: '10px', backgroundColor: '#1e293b', color: '#fff' }}>
                        History
                    </Button>

                    <Button size="small" icon={<ArrowLeftOutlined />} onClick={() => window.history.back()} style={{ borderRadius: '10px', fontWeight: 600 }}>
                        Back
                    </Button>
                </Space>
            </div>

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={17}>
                    <Form layout="vertical" className="custom-form">
                        <Card className="modern-card" title={<><div className="section-icon icon-blue"><UserOutlined /></div><span>Customer Information</span></>}>
                            <Row gutter={[20, 0]}>
                                <Col xs={24} md={8}>
                                    <Form.Item label={<Space>Phone Number <InfoCircleOutlined style={{ color: "#3b82f6", cursor: "pointer" }} onClick={handleInfoClick}/></Space>} required className="custom-form-item">
                                        <Space.Compact style={{ width: "100%" }}>
                                            <Button type="primary" icon={<PhoneOutlined />} onClick={() => connectPhone()} style={{ backgroundColor: "#10b981", height: '42px' }}/>
                                            <Input placeholder="Enter phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="custom-input" />
                                        </Space.Compact>
                                        {errors.phone_number && <Typography.Text type="danger" style={{ fontSize: '12px' }}>{errors.phone_number[0]}</Typography.Text>}
                                    </Form.Item>
                                </Col>

                                <Col xs={24} md={8}>
                                    <Form.Item label="Full Name" required className="custom-form-item">
                                        <Input placeholder="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="custom-input" />
                                        {errors.customer_name && <Typography.Text type="danger" style={{ fontSize: '12px' }}>{errors.customer_name[0]}</Typography.Text>}
                                    </Form.Item>
                                </Col>

                                <Col xs={24} md={8}>
                                    <Form.Item label="District" className="custom-form-item">
                                        <Select placeholder="Select district" value={district} onChange={(v) => setDistrict(v)} showSearch filterOption={(i, o) => o.children.toLowerCase().includes(i.toLowerCase())}>
                                            {districts?.map((d) => (
                                                <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>

                                <Col xs={24}>
                                    <Form.Item label="Detailed Address" className="custom-form-item">
                                        <Input.TextArea rows={3} placeholder="Address detail..." value={address} onChange={(e) => setAddress(e.target.value)} className="custom-input" />
                                        {errors.address_details && <Typography.Text type="danger" style={{ fontSize: '12px' }}>{errors.address_details[0]}</Typography.Text>}
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>

                        <Card className="modern-card" title={
                                <>
                                    <div className="section-icon icon-orange">
                                        <CarOutlined />
                                    </div>
                                    <span>Logistics & Status</span>
                                </>
                        }>
                            <Row gutter={[20, 0]}>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Preferred Courier" className="custom-form-item">
                                        <Select value={courierId} onChange={(v) => {setCourierId(v); getCourierWiseData(v);}}>
                                            {couriers.map((c) => (
                                                <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Order Status" required className="custom-form-item">
                                        <Select value={statusId} onChange={(v) => setStatusId(v)}>
                                            {statuses?.map((s) => (
                                                <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>

                                <Col xs={24} md={8}>
                                    <Form.Item label="Customer Segment" className="custom-form-item">
                                        <Select value={customerTypeId} onChange={(v) => setCustomerTypeId(v)}>
                                            {customerTypes?.map((t) => (
                                                <Select.Option key={t.id} value={t.id}>{t.name}</Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>

                                {isPathao && (
                                    <Col xs={24} style={{ marginTop: 16 }}>
                                        <div style={{ padding: 20, backgroundColor: '#f0f9ff', borderRadius: 12, border: '1px solid #bae6fd' }}>
                                            <Typography.Title level={5} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <GlobalOutlined style={{ color: '#0284c7' }} /> Pathao Integration
                                            </Typography.Title>

                                            <Row gutter={[16, 16]}>
                                                <Col xs={24} md={12}>
                                                    <Form.Item label="Pathao Store" required>
                                                        <Select value={pathaoStoreId} onChange={(v) => setPathaoStoreId(v)} showSearch>
                                                            {pathaoStores?.map((s) => (
                                                                <Select.Option key={s.store_id} value={s.store_id}>{s.store_name}</Select.Option>
                                                            ))}
                                                        </Select>
                                                    </Form.Item>
                                                </Col>

                                                <Col xs={24} md={12}>
                                                    <Form.Item label="Delivery Area" required>
                                                        <Select value={selectedSearchArea} onChange={handlePathaoAreaChange} showSearch onSearch={remoteMethod} filterOption={false} notFoundContent={areaLoading ? <Spin size="small" /> : null}
                                                        >
                                                            {pathaoCityOptions.map((i) => (
                                                                <Select.Option key={i.id} value={i.id}>{i.area_name}</Select.Option>
                                                            ))}
                                                        </Select>
                                                    </Form.Item>
                                                </Col>

                                                <Col xs={24} md={8}>
                                                    <Form.Item label="Weight">
                                                        <Input value={itemWeight} onChange={(e) => setItemWeight(e.target.value)}/>
                                                    </Form.Item>
                                                </Col>

                                                <Col xs={24} md={8}>
                                                    <Form.Item label="Quantity">
                                                        <Input value={itemQuantity} onChange={(e) => setItemQuantity(e.target.value)}/>
                                                    </Form.Item>
                                                </Col>

                                                <Col xs={24} md={8}>
                                                    <Form.Item label="Desc">
                                                        <Input value={itemDescription} onChange={(e) => setItemDescription(e.target.value)}/>
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                        </div>
                                    </Col>
                                )}

                                {statusId == 8 && (
                                    <Col xs={24} md={8}>
                                        <Form.Item label="Cancel Reason" required className="custom-form-item">
                                            <Select value={cancelReasonId} onChange={(v) => setCancelReasonId(v)}>
                                                {cancelReasonTypes?.map((r) => (
                                                    <Select.Option key={r.id} value={r.id}>{r.name}</Select.Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                )}
                            </Row>
                        </Card>

                        <Card className="modern-card" title={
                            <>
                                <div className="section-icon icon-purple">
                                    <ShoppingCartOutlined />
                                </div>
                                <span>Product Selection</span>
                            </>
                        }>
                            <div style={{ marginBottom: 32 }}>
                                {searchError && <Typography.Text type="danger">{searchError}</Typography.Text>}
                                <Row gutter={16} align="bottom">
                                    <Col flex="auto">
                                        <Form.Item label="Search Products" className="custom-form-item" style={{ marginBottom: 0 }}>
                                            <div style={{ position: 'relative' }}>
                                                <Input size="large" placeholder="Search to add more products..." value={searchQuery} onChange={(e) => {setSearchQuery(e.target.value); searchProduct();}} prefix={<InboxOutlined style={{ color: '#94a3b8' }} />} className="custom-input"/>
                                                {loading && 
                                                    <div style={{position: 'absolute', right: 12, top: 12}}>
                                                        <Spin size="small" />
                                                    </div>
                                                }
                                                {!hiddenSearchProducts && (
                                                    <Card className="product-search-dropdown" size="small" style={{position: 'absolute', top: '105%', left: 0, right: 0, zIndex: 1000, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', borderRadius: '12px', maxHeight: '400px', overflow: 'auto'}}>
                                                        {products?.length > 0 ? (
                                                            <div>
                                                                {products.map((p) => (
                                                                    <div key={p.id} onClick={() => addProduct(p)} style={{ cursor: 'pointer', padding: '12px', borderRadius: '8px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                                                        <Row gutter={12} align="middle">
                                                                            <Col>
                                                                                <Image src={p.image} width={48} height={48} style={{ borderRadius: '6px' }} preview={false}/>
                                                                            </Col>

                                                                            <Col flex="auto">
                                                                                <Typography.Text strong>{p.name}</Typography.Text>
                                                                                <div style={{ color: '#64748b', fontSize: '12px' }}>
                                                                                    {p.category?.name} • {currency(p.mrp)}
                                                                                </div>
                                                                            </Col>
                                                                        </Row>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : <div style={{ padding: 20, textAlign: 'center' }}>No products found</div>}
                                                    </Card>
                                                )}
                                            </div>
                                        </Form.Item>
                                    </Col>

                                    {productInfo?.variations?.length > 0 && (
                                        <Col span={6}>
                                            <Form.Item label="Variation" className="custom-form-item" style={{ marginBottom: 0 }}>
                                                <Select size="large" value={variationId} onChange={(v) => setVariationId(v)}>
                                                    {productInfo.variations.map((v, idx) => {
                                                        const lbl = [
                                                            v?.attribute_value_1 && `${attributeName(v.attribute_value_1.attribute_id)}: ${v.attribute_value_1.value}`,
                                                            v?.attribute_value_2 && `${attributeName(v.attribute_value_2.attribute_id)}: ${v.attribute_value_2.value}`,
                                                            v?.attribute_value_3 && `${attributeName(v.attribute_value_3.attribute_id)}: ${v.attribute_value_3.value}`
                                                        ].filter(Boolean).join(' | ');
                                                        return <Select.Option key={idx} value={idx}>{lbl}</Select.Option>
                                                    })}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    )}

                                    <Col span={3}>
                                        <Form.Item label="Qty" className="custom-form-item" style={{ marginBottom: 0 }}>
                                            <InputNumber size="large" min={1} value={quantity} onChange={(v) => setQuantity(v || 1)} style={{ width: '100%' }} />
                                        </Form.Item>
                                    </Col>

                                    <Col>
                                        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => addToCart(productInfo)} style={{ height: '48px', borderRadius: '10px' }}>
                                            Add
                                        </Button>
                                    </Col>
                                </Row>
                            </div>

                            <Table 
                                className="cart-table"
                                rowKey="key" 
                                columns={productColumns} 
                                dataSource={cartItems} 
                                pagination={false} 
                            />
                            {errors?.items && <Typography.Text type="danger" style={{ display: 'block', marginTop: 12 }}>{errors.items[0]}</Typography.Text>}
                        </Card>

                        <Card className="modern-card" title={<><div className="section-icon icon-green"><GlobalOutlined /></div><span>Source & Payments</span></>} >
                            <Row gutter={[20, 0]}>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Order Source">
                                        {orderFromId === 'add' ? (
                                            <Space.Compact style={{ width: '100%' }}>
                                                <Input placeholder="New source" value={fromName} onChange={(e) => setFromName(e.target.value)} disabled={!canEditSource}/>
                                                <Button type="primary" loading={addLoading} onClick={insertOrderFrom} icon={<PlusOutlined />} disabled={!canEditSource}/>
                                                <Button onClick={removeAddField} icon={<CloseOutlined />} disabled={!canEditSource}/>
                                            </Space.Compact>
                                        ) : (
                                            <Select value={orderFromId} onChange={(v) => setOrderFromId(v)} disabled={!canEditSource}>
                                                <Select.Option value="add" style={{ color: '#3b82f6' }}>+ Add New</Select.Option>
                                                {orderFromList?.map(t => <Select.Option key={t.id} value={t.id}>{t.name}</Select.Option>)}
                                            </Select>
                                        )}
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Shipping Area">
                                        {deliveryChargeId === 'add' ? (
                                            <Space.Compact style={{ width: '100%' }}>
                                                <Input style={{ width: '60%' }} placeholder="Area" value={deliveryName} onChange={(e) => setDeliveryName(e.target.value)}/>
                                                <Input style={{ width: '40%' }} placeholder="Fee" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)}/>
                                                <Button type="primary" loading={addLoading} onClick={insertDeliveryGateway} icon={<PlusOutlined />} />
                                                <Button onClick={removeAddField} icon={<CloseOutlined />} />
                                            </Space.Compact>
                                        ) : (
                                            <Select value={deliveryChargeId} onChange={(v) => {setDeliveryChargeId(v); shippingCharge(v);}}>
                                                <Select.Option value="add" style={{ color: '#3b82f6' }}>+ Add New</Select.Option>
                                                {deliveryGateways?.map(c => <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>)}
                                            </Select>
                                        )}
                                    </Form.Item>
                                </Col>

                                <Col xs={24} md={8}>
                                    <Form.Item label="Payment Gateway" required>
                                        <Select value={paymentGatewayId} onChange={(v) => setPaymentGatewayId(v)}>
                                            {paymentGateways?.map(g => 
                                                <Select.Option key={g.id} value={g.id}>{g.name}</Select.Option>
                                            )}
                                        </Select>
                                    </Form.Item>
                                </Col>

                                <Col xs={24} md={8}>
                                    <Form.Item label="Payment Status" required>
                                        <Select value={paymentStatus} onChange={(v) => setPaymentStatus(v)}>
                                            <Select.Option value="paid"><Tag color="success">Paid</Tag></Select.Option>
                                            <Select.Option value="unpaid"><Tag color="error">Unpaid</Tag></Select.Option>
                                        </Select>
                                    </Form.Item>
                                </Col>

                                <Col xs={24} md={16}>
                                    <Form.Item label="Internal Order Note">
                                        <Input.TextArea rows={1} value={orderNote} onChange={(e) => setOrderNote(e.target.value)}/>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>

                        <OrderNote noteList={noteList} note={note} setNote={setNote} noteLoading={noteLoading} noteId={noteId} onSubmit={createNote} onEdit={editNote} onDelete={deleteNote} formatDateTime={formatDateTime}/>
                    </Form>
                </Col>

                <Col xs={24} lg={7}>
                    <div className="order-summary-card">
                        <Typography.Title level={4} style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <CreditCardOutlined style={{ color: '#2563eb' }} /> Order Pricing
                        </Typography.Title>

                        <div className="summary-row">
                            <span>Regular Price</span>
                            <span>{currency(totalPrice.mrp_price)}</span>
                        </div>

                        <div className="summary-row">
                            <span>Total Discount</span>
                            <span style={{ color: '#ef4444' }}>-{currency(totalPrice.discount_price)}</span>
                        </div>

                        <Divider style={{ margin: '12px 0' }} />

                        <div className="summary-row" style={{ fontWeight: 600 }}>
                            <span>Shipping</span>
                            <div style={{ width: '120px' }}>
                                <InputNumber min={0} value={changeableChargeValue} onChange={(v) => setChangeableChargeValue(v || 0)} size="small" style={{ width: '100%' }} formatter={v => `৳ ${v}`} parser={v => v.replace(/[^\d.]/g, '')}/>
                            </div>
                        </div>

                        <div className="summary-row">
                            <span>Special Disc.</span>
                            <div style={{ width: '120px' }}>
                                <InputNumber min={0} value={specialDiscount} onChange={(v) => setSpecialDiscount(v || 0)} size="small" style={{ width: '100%', color: '#ef4444' }} formatter={v => `- ৳ ${v}`} parser={v => v.replace(/[^\d.]/g, '')}/>
                            </div>
                        </div>

                        <div className="summary-row">
                            <span>Advance Paid</span>
                            <div style={{ width: '120px' }}>
                                <InputNumber min={0} value={advancePayment} onChange={(v) => setAdvancePayment(v || 0)} size="small" style={{ width: '100%', color: '#10b981' }} formatter={v => `- ৳ ${v}`} parser={v => v.replace(/[^\d.]/g, '')}/>
                            </div>
                        </div>

                        <div className="summary-total">
                            <div className="total-label">
                                Grand Total
                            </div>
                            <div className="total-value">
                                {currency(payablePrice)}
                            </div>
                        </div>

                        <Button type="primary" className="submit-btn" loading={submitLoading} onClick={submit} icon={<CheckCircleOutlined />}>
                            {submitLoading ? "Updating..." : "Save Changes"}
                        </Button>
                    </div>
                </Col>
            </Row>

            <Modal title="Customer Intelligence Report" open={isModalVisible} width={960} onCancel={() => setIsModalVisible(false)} footer={null}>
                {loading ? <div style={{ textAlign: "center", padding: 32 }}><Spin /></div> : customerData ? <CourierDeliveryReport data={customerData} onRecheck={handleInfoClick}/> : <Empty />}
            </Modal>

            <OrderHistoryModal orderId={selectedOrderId} open={showHistory} onClose={() => setShowHistory(false)}/>
        </div>
    )
}

export default OrderEdit

