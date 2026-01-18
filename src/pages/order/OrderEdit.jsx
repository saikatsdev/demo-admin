import {ArrowLeftOutlined,CloseOutlined,DeleteOutlined,PhoneOutlined,InboxOutlined,LoadingOutlined,PlusOutlined,InfoCircleOutlined,HistoryOutlined } from '@ant-design/icons'
import {DatePicker,Breadcrumb,Button,Card,Col,Divider,Empty,Form,Grid,Image,Input,InputNumber,message,Popconfirm,Row,Select,Space,Spin,Table,Typography,Modal} from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { getDatas, postData } from '../../api/common/common'
import useTitle from '../../hooks/useTitle'
import dayjs from "dayjs";
import CourierDeliveryReport from './followupsell/CourierDeliveryReport'
import OrderHistoryModal from '../../components/order/OrderHistoryModal'
import OrderNote from '../../components/order/OrderNote'
import { useSelector } from 'react-redux'

const currency = (value) => `${Number(value || 0).toFixed(2)} tk.`

const OrderEdit = () => {
    // Hook
    useTitle("Edit Order");

    // Variable
    const [form]          = Form.useForm();
    const screens         = Grid.useBreakpoint();
    const isMobile        = !screens.md
    const navigate        = useNavigate();
    const params          = useParams();
    const orderId         = params.id;
    const { state }       = useLocation();
    const currentStatusId = state?.statusId;

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
    const [followNote, setFollowNote]                       = useState('');
    const [approxStartDate, setApproxStartDate]             = useState('');
    const [approxEndDate, setApproxEndDate]                 = useState('');
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
    const [itemWeight, setItemWeight]                       = useState('');
    const [redxAreaId, setRedxAreaId]                       = useState('');
    const [redxPickupStoreId, setRedxPickupStoreId]         = useState('');
    const [areaLoading, setAreaLoading]                     = useState(false);
    const [noteList, setNoteList]                           = useState([]);
    const [note, setNote]                                   = useState('');
    const [noteId, setNoteId]                               = useState('');
    const [noteLoading, setNoteLoading]                     = useState(false);
    const [orderFromError, setOrderFromError]               = useState('');
    const [shippingError, setShippingError]                 = useState('');
    const [errors, setErrors]                               = useState({});
    const [loading, setLoading]                             = useState(false);
    const [isModalVisible, setIsModalVisible]               = useState(false);
    const [customerData, setCustomerData]                   = useState(null);
    const [showHistory, setShowHistory]                     = useState(false);
    const [selectedOrderId, setSelectedOrderId]             = useState(null);

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
            setItemWeight(orderInfo?.item_weight || '');
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
    }, [orderId])

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
            const initialCourier = defaultCourierId || (couriers[0] ? couriers[0].id : "");
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
            setOrderFromError(res?.errors || '')
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
                setShippingError('');
                message.success('Delivery gateway added successfully');
            }, 1000)
        } else {
            setShippingError(res?.errors || '');
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
        const res = await getDatas('/admin/attributes')
        if (res?.success) {
            setAttributesList(res?.result?.data || [])
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
        const charge = deliveryGateways?.data?.find((i) => id == i.id)
        setChangeableChargeValue(charge?.delivery_fee || 0)
    }

    const removeAddField = () => {
        setDeliveryChargeId('')
        setDeliveryFee('')
        setDeliveryName('')
        setOrderFromId('')
        setFromName('')
        setShippingError('')
        setOrderFromError('')
    }

    // Product functions
    const clearSearchProducts = () => {
        setSearchQuery('')
        setHiddenSearchProducts(true)
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
            image    : product.img_path,
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
            // You can add logic here to check if current user can edit
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
        const totalOfferPrice = cartItems.reduce((total, item) => {
            return total + item.offer_price * item.quantity
        }, 0)

        const totalMrp = cartItems.reduce((total, item) => {
            return total + item.mrp * item.quantity
        }, 0)

        const totalDiscount = cartItems.reduce((total, item) => {
            return total + item.discount * item.quantity
        }, 0)

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

    // Submit order update
    const submit = async () => {
        setSubmitLoading(true)
        const formData = new FormData()

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
        formData.append('pickup_store_id', pathaoStoreId);
        formData.append('courier_area_id',isPathao ? selectedSearchArea : redxAreaId);
        formData.append('item_weight', itemWeight || '');
        formData.append('customer_type_id', customerTypeId);
        formData.append('cancel_reason_id', cancelReasonId);
        formData.append('order_note', orderNote);

        if (approxStartDate) {
            formData.append('approx_start_date', approxStartDate);
        }

        if (approxEndDate) {
            formData.append('approx_end_date', approxEndDate);
        }

        if (followNote && followNote.trim() !== '') {
            formData.append('follow_note', followNote);
        }

        formData.append('_method', 'put');

        let cartIndex = 0
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
            } else {
                setErrors(res?.errors || {})
                message.error('Failed to update order')
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
            width: 70,
            render: (src) => (
                <Image src={src} width={40} height={40} style={{ objectFit: 'cover' }} preview={false} />
            ),
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Variation',
            key: 'variation',
            width: 200,
            responsive: ['md'],
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    {record.variation_1 && (
                        <Typography.Text style={{ fontSize: '12px' }}>
                        {attributeName(record.variation_1?.attribute?.id)}: {record.variation_1?.value}
                        </Typography.Text>
                    )}
                    {record.variation_2 && (
                        <Typography.Text style={{ fontSize: '12px' }}>
                        {attributeName(record.variation_2?.attribute?.id)}: {record.variation_2?.value}
                        </Typography.Text>
                    )}
                    {record.variation_3 && (
                        <Typography.Text style={{ fontSize: '12px' }}>
                        {attributeName(record.variation_3?.attribute?.id)}: {record.variation_3?.value}
                        </Typography.Text>
                    )}
                </Space>
            ),
        },
        {
            title: 'Qty',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 100,
            render: (value, record, index) => (
                <InputNumber size={isMobile ? 'small' : 'middle'} min={1} value={value} onChange={(v) => updateCartQuantity(index, v)}/>
            ),
        },
        {
            title: 'Unit Price',
            dataIndex: 'mrp',
            key: 'mrp',
            width: 120,
            render: (v) => currency(v),
            responsive: ['md'],
        },
        {
            title: 'Discount',
            dataIndex: 'discount',
            key: 'discount',
            width: 110,
            render: (value, record, index) => (
                <InputNumber size={isMobile ? 'small' : 'middle'} min={1} value={value} onChange={(v) => updateDiscount(index, v)}/>
            ),
            responsive: ['md'],
        },
        {
            title: 'Total Price',
            key: 'total',
            width: 120,
            render: (_, r) => currency((r.mrp - r.discount) * r.quantity),
        },
        {
            title: 'Action',
            key: 'action',
            width: 80,
            render: (_, r, index) => (
                <Popconfirm title="Delete this item?" okText="Yes" cancelText="No" onConfirm={() => deleteCartItem(index)}>
                    <Button danger type="text" icon={deleteLoading === index ? <LoadingOutlined /> : <DeleteOutlined />}/>
                </Popconfirm>
            ),
        },
    ]

    const handleInfoClick = async () => {
        if (!phoneNumber) {
            return;
        }
        
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

    return (
        <>
            {contextHolder}
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Row justify="space-between" align="middle">
                    <Col>
                        <Typography.Title level={3} style={{ marginBottom: 4 }}>
                            Order Edit
                        </Typography.Title>
                        <Breadcrumb items={[{ title: 'Dashboard' }, { title: 'Orders' }, { title: 'Order Edit' }]}/>
                    </Col>
                    <Col>
                        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')}>
                            Back
                        </Button>
                    </Col>
                </Row>

                <Row gutter={[16, 16]}>
                    <Col xs={24}>
                        <Card title="Order Information" extra={<Button type="text" icon={<HistoryOutlined />} onClick={() => handleOpenHistory(orderId)} style={{backgroundColor: "#1C558B",color: "#fff",borderRadius: 4,padding: "4px 12px"}}>History</Button>}
                            >
                            <Form layout="vertical" form={form}>
                                <Row gutter={[16, 0]}>
                                    <Col xs={24} sm={12} md={8}>
                                        <Form.Item
                                            label={
                                                <Space>
                                                    Customer Phone Number
                                                    <InfoCircleOutlined style={{ color: "#1890ff", cursor: "pointer" }} onClick={handleInfoClick}/>
                                                </Space>
                                            }
                                            required
                                        >
                                            <Space.Compact style={{ width: "100%" }}>
                                                <Button type="primary" icon={<PhoneOutlined />} onClick={() => connectPhone(phoneNumber)} style={{ backgroundColor: "#52c41a" }}/>
                                                <Input placeholder="Enter phone number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}/>
                                            </Space.Compact>
                                            {errors.phone_number && (
                                                <Typography.Text type="danger">{errors.phone_number[0]}</Typography.Text>
                                            )}
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} sm={12} md={8}>
                                        <Form.Item label="Customer Name" required>
                                            <Input placeholder="Full name" value={customerName} onChange={(e) => setCustomerName(e.target.value)}/>
                                            {errors.customer_name && (
                                                <Typography.Text type="danger">{errors.customer_name[0]}</Typography.Text>
                                            )}
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} sm={12} md={8}>
                                        <Form.Item label="District Name">
                                            <Select placeholder="Select district" value={district} onChange={(value) => setDistrict(value)} showSearch filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}>
                                                {districts?.map((d) => (
                                                    <Select.Option key={d.id} value={d.id}>
                                                        {d.name}
                                                    </Select.Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={[16, 0]}>
                                    <Col xs={24} sm={12} md={8}>
                                        <Form.Item label="Customer Address">
                                            <Input.TextArea rows={3} placeholder="Full address" value={address} onChange={(e) => setAddress(e.target.value)}/>
                                            {errors.address_details && (
                                                <Typography.Text type="danger">{errors.address_details[0]}</Typography.Text>
                                            )}
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} sm={12} md={8}>
                                        <Form.Item label="Courier">
                                            <Select placeholder="Select courier" value={courierId} onChange={(value) => {setCourierId(value);getCourierWiseData(value);}}>
                                                {couriers.map((c) => (
                                                    <Select.Option key={c.id} value={c.id}>
                                                        {c.name}
                                                    </Select.Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} sm={12} md={8}>
                                        <Form.Item label="Order Status" required>
                                            <Select placeholder="Select status" value={statusId} onChange={(value) => setStatusId(value)}>
                                                {statuses?.map((status) => (
                                                    <Select.Option key={status.id} value={status.id}>
                                                        {status.name}
                                                    </Select.Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>

                                    {statusId === 3 && (
                                        <Col xs={24} sm={12} md={8}>
                                            <Form.Item  label="Follow Up Start Date"  required  name="approx_start_date">
                                                <DatePicker style={{ width: "100%" }} value={approxStartDate ? dayjs(approxStartDate) : null} onChange={(date, dateString) => setApproxStartDate(dateString)}/>
                                            </Form.Item>
                                        </Col>
                                    )}

                                    {statusId === 3 && (
                                        <Col xs={24} sm={12} md={8}>
                                            <Form.Item  label="Follow Up End Date"  required  name="approx_end_date">
                                                <DatePicker style={{ width: "100%" }} value={approxEndDate ? dayjs(approxEndDate) : null} onChange={(date, dateString) => setApproxEndDate(dateString)}/>
                                            </Form.Item>
                                        </Col>
                                    )}

                                    {statusId === 3 && (
                                        <Col xs={24} sm={12} md={8}>
                                            <Form.Item  label="Follow Up Note"  required  name="followup_note">
                                                <Input.TextArea rows={3} placeholder="Follow Up Not" value={followNote} onChange={(e) => setFollowNote(e.target.value)}/>
                                            </Form.Item>
                                        </Col>
                                    )}
                                </Row>

                                {/* Pathao Fields */}
                                {isPathao && (
                                    <Row gutter={[16, 0]}>
                                        <Col xs={24} sm={12} md={8}>
                                            <Form.Item label="Pathao Store" required>
                                                <Select placeholder="Select store" value={pathaoStoreId} onChange={(value) => setPathaoStoreId(value)} showSearch filterOption={(input, option) =>
                                                    option.children.toLowerCase().includes(input.toLowerCase())}>
                                                    {pathaoStores?.map((store) => (
                                                        <Select.Option key={store.store_id} value={store.store_id}>
                                                            {store.store_name}
                                                        </Select.Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                        </Col>

                                        <Col xs={24} sm={12} md={8}>
                                            <Form.Item label="Pathao Search Area" required>
                                                <Select placeholder="Search area" value={selectedSearchArea} onChange={handlePathaoAreaChange} showSearch onSearch={remoteMethod}
                                                    filterOption={false} notFoundContent={areaLoading ? <Spin size="small" /> : null}>
                                                    {pathaoCityOptions.map(item => (
                                                        <Select.Option key={item.id} value={item.id}>
                                                            {item.area_name}
                                                        </Select.Option>
                                                    ))}
                                                </Select>

                                            </Form.Item>
                                        </Col>

                                        <Col xs={24} sm={12} md={8}>
                                            <Form.Item label="Item Weight">
                                                <Input placeholder="Estimated weight" value={itemWeight} onChange={(e) => setItemWeight(e.target.value)}/>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                )}

                                {/* RedX Fields */}
                                {isRedx && (
                                    <Row gutter={[16, 0]}>
                                        <Col xs={24} sm={12} md={8}>
                                            <Form.Item label="Area" required>
                                                <Select placeholder="Select area" value={redxAreaId} onChange={(value) => setRedxAreaId(value)} showSearch
                                                    filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}>
                                                    {/* {redxAreas?.map((area) => (
                                                        <Select.Option key={area.id} value={area.id}>
                                                            {area.name}
                                                        </Select.Option>
                                                    ))} */}
                                                </Select>
                                            </Form.Item>
                                        </Col>

                                        <Col xs={24} sm={12} md={8}>
                                            <Form.Item label="Pick Up Store" required>
                                                <Select placeholder="Select pick up store" value={redxPickupStoreId} onChange={(value) => setRedxPickupStoreId(value)} showSearch
                                                    filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}>
                                                    {/* {redxPickupStores?.map((store) => (
                                                        <Select.Option key={store.id} value={store.id}>
                                                            {store.name}
                                                        </Select.Option>
                                                    ))} */}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                )}

                                {statusId == 8 && (
                                    <Row gutter={[16, 0]}>
                                        <Col xs={24} sm={12} md={8}>
                                            <Form.Item label="Cancel Reason Tag" required>
                                                <Select placeholder="Select cancel reason" value={cancelReasonId} onChange={(value) => setCancelReasonId(value)}>
                                                    {cancelReasonTypes?.map((reason) => (
                                                        <Select.Option key={reason.id} value={reason.id}>
                                                            {reason.name}
                                                        </Select.Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                )}

                                <Row gutter={[16, 0]}>
                                    <Col xs={24} sm={12} md={8}>
                                        <Form.Item label="Order Source">
                                            {orderFromId === 'add' ? (
                                                <Input.Group compact>
                                                    <Input style={{ width: 'calc(100% - 70px)' }} placeholder="Name" value={fromName} onChange={(e) => setFromName(e.target.value)}/>
                                                    <Button type="primary" loading={addLoading} icon={<PlusOutlined />} onClick={insertOrderFrom}/>
                                                    <Button icon={<CloseOutlined />} onClick={removeAddField} />
                                                </Input.Group>
                                            ) : (
                                                <Select placeholder="Select source" value={orderFromId} onChange={(value) => setOrderFromId(value)}>
                                                    <Select.Option value="add" style={{ color: 'red' }}>
                                                        Add New
                                                    </Select.Option>

                                                    {orderFromList?.filter(tag => tag.id === orderFromId).map(tag => (
                                                        <Select.Option key={tag.id} value={tag.id}>
                                                            {tag.name}
                                                        </Select.Option>
                                                    ))}
                                                </Select>
                                            )}
                                            {orderFromError?.name && (
                                                <Typography.Text type="danger">{orderFromError.name[0]}</Typography.Text>
                                            )}
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} sm={12} md={8}>
                                        <Form.Item label="Customer Tag">
                                            <Select placeholder="Select customer type" value={customerTypeId} onChange={(value) => setCustomerTypeId(value)}>
                                                {customerTypes?.map((type) => (
                                                    <Select.Option key={type.id} value={type.id}>
                                                    {type.name}
                                                    </Select.Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} sm={12} md={8}>
                                        <Form.Item label="Shipping Area">
                                            {deliveryChargeId === 'add' ? (
                                                <Input.Group compact>
                                                    <Input style={{ width: 'calc(50% - 35px)' }} placeholder="Name" value={deliveryName} onChange={(e) => setDeliveryName(e.target.value)}/>
                                                    <Input style={{ width: 'calc(50% - 35px)' }} placeholder="Fee" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)}/>
                                                    <Button type="primary" loading={addLoading} icon={<PlusOutlined />} onClick={insertDeliveryGateway}/>
                                                    <Button icon={<CloseOutlined />} onClick={removeAddField} />
                                                </Input.Group>
                                            ) : (
                                                <Select placeholder="Select area" value={deliveryChargeId} onChange={(value) => {setDeliveryChargeId(value); shippingCharge(value)}}>
                                                    <Select.Option value="add" style={{ color: 'red' }}>
                                                        Add New
                                                    </Select.Option>
                                                    {deliveryGateways?.map((charge) => (
                                                        <Select.Option key={charge.id} value={charge.id}>
                                                            {charge.name}
                                                        </Select.Option>
                                                    ))}
                                                </Select>
                                            )}
                                            {shippingError?.name && (
                                                <Typography.Text type="danger">{shippingError.name[0]}</Typography.Text>
                                            )}
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={[16, 0]}>
                                    <Col xs={24} sm={12} md={8}>
                                        <Form.Item label="Payment Gateway" required>
                                            <Select placeholder="Select payment gateway" value={paymentGatewayId} onChange={(value) => setPaymentGatewayId(value)}>
                                                {paymentGateways?.map((gateway) => (
                                                    <Select.Option key={gateway.id} value={gateway.id}>
                                                        {gateway.name}
                                                    </Select.Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} sm={12} md={8}>
                                        <Form.Item label="Payment Status" required>
                                            <Select placeholder="Select payment status" value={paymentStatus} onChange={(value) => setPaymentStatus(value)}>
                                                <Select.Option value="paid">Paid</Select.Option>
                                                <Select.Option value="unpaid">Unpaid</Select.Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} sm={12} md={8}>
                                        <Form.Item label="Customer Note">
                                            <Input.TextArea rows={3} placeholder="Customer Note" value={orderNote} onChange={(e) => setOrderNote(e.target.value)}/>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Form>
                        </Card>
                    </Col>

                    <Col xs={24}>
                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                            {/* Product Section */}
                            <Card title="Product Information">
                                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                                    {searchError && <Typography.Text type="danger">{searchError}</Typography.Text>}
                                    <Row gutter={12} align="middle">
                                        <Col flex="auto">
                                            <div style={{ position: 'relative' }}>
                                                <Input placeholder="Search Product" value={searchQuery} onChange={(e) => {setSearchQuery(e.target.value);searchProduct()}}/>
                                                {!hiddenSearchProducts && (
                                                    <Button type="text" size="small" icon={<CloseOutlined />} onClick={clearSearchProducts} style={{position: 'absolute',right: 0,top: 0}}/>
                                                )}
                                                {!hiddenSearchProducts && (
                                                    <Card size="small" style={{position: 'absolute',top: '100%',left: 0,right: 0,zIndex: 1000,maxHeight: '300px',overflow: 'auto'}}>
                                                        {products?.length > 0 ? (
                                                            <Space direction="vertical" style={{ width: '100%' }}>
                                                                {products.map((product) => (
                                                                    <div key={product.id} onClick={() => addProduct(product)} style={{ cursor: 'pointer', padding: '8px' }}>
                                                                        <Row gutter={8}>
                                                                            <Col>
                                                                                <Image src={product.img_path} width={40} preview={false} />
                                                                            </Col>
                                                                            <Col flex="auto">
                                                                                <Typography.Text strong>{product.name}</Typography.Text>
                                                                                <br />
                                                                                <Typography.Text type="secondary">
                                                                                    Category: {product.category?.name}
                                                                                </Typography.Text>
                                                                            </Col>
                                                                        </Row>
                                                                    </div>
                                                                ))}
                                                            </Space>
                                                        ) : (
                                                            <Typography.Text type="danger">No Product Found</Typography.Text>
                                                        )}
                                                    </Card>
                                                )}
                                            </div>
                                        </Col>
                                        
                                        {productInfo?.variations?.length > 0 && (
                                            <Col>
                                                <Select placeholder="Select Variation" value={variationId !== null ? variationId : undefined} onChange={(value) => {setVariationId(value)}} style={{ width: 200 }}>
                                                    {productInfo.variations.map((variation, idx) => {
                                                        const displayText = []
                                                        
                                                        if (variation?.attribute_value_1?.attribute_id) {
                                                            displayText.push(`${attributeName(variation.attribute_value_1.attribute_id)}: ${variation.attribute_value_1.value}`)
                                                        }

                                                        if (variation?.attribute_value_2?.attribute_id) {
                                                            displayText.push(`${attributeName(variation.attribute_value_2.attribute_id)}: ${variation.attribute_value_2.value}`)
                                                        }

                                                        if (variation?.attribute_value_3?.attribute_id) {
                                                            displayText.push(`${attributeName(variation.attribute_value_3.attribute_id)}: ${variation.attribute_value_3.value}`)
                                                        }

                                                        return (
                                                            <Select.Option key={idx} value={idx}>
                                                                {displayText.join(', ')}
                                                            </Select.Option>
                                                        )
                                                    })}
                                                </Select>
                                            </Col>
                                        )}

                                        <Col>
                                            <InputNumber min={1} value={quantity} onChange={(v) => setQuantity(v || 1)} />
                                        </Col>

                                        <Col>
                                            <Button type="primary" icon={<PlusOutlined />} onClick={() => addToCart(productInfo)}>
                                                Add
                                            </Button>
                                        </Col>
                                    </Row>

                                    <Row gutter={[16, 16]} align="top">
                                        <Col xs={24} md={16}>
                                            <Table size="middle" rowKey="key" columns={productColumns} dataSource={cartItems} pagination={false} scroll={{ x: isMobile ? 520 : undefined }}
                                                locale={{
                                                    emptyText: (
                                                        <Empty image={<InboxOutlined style={{ fontSize: 60, color: '#bfbfbf' }} />}
                                                            imageStyle={{ height: 80 }}
                                                            description={<Typography.Text type="secondary">No data</Typography.Text>}
                                                        />
                                                    ),
                                                }}
                                            />
                                            {errors?.items && (
                                                <Typography.Text type="danger">{errors.items[0]}</Typography.Text>
                                            )}
                                        </Col>

                                        <Col xs={24} md={8}>
                                            <Card size="small" bordered>
                                                <Space direction="vertical" style={{ width: '100%' }}>
                                                    <Row justify="space-between">
                                                        <Col>Regular Price</Col>
                                                        <Col>: {currency(totalPrice.mrp_price)}</Col>
                                                    </Row>

                                                    <Row justify="space-between">
                                                        <Col>Discount</Col>
                                                        <Col>: -{currency(totalPrice.discount_price)}</Col>
                                                    </Row>

                                                    <Row justify="space-between">
                                                        <Col>Sell Price</Col>
                                                        <Col>
                                                            : {currency(totalPrice.mrp_price - totalPrice.discount_price)}
                                                        </Col>
                                                    </Row>

                                                    <Row justify="space-between" align="middle" gutter={8}>
                                                        <Col flex="auto">Advanced Payment</Col>
                                                        <Col>
                                                            <InputNumber min={0} value={advancePayment} onChange={(v) => setAdvancePayment(v || 0)} size="small"/>
                                                        </Col>
                                                    </Row>

                                                    <Row justify="space-between" align="middle" gutter={8}>
                                                        <Col flex="auto">Delivery Charge</Col>
                                                        <Col>
                                                            <InputNumber min={0} value={changeableChargeValue} onChange={(v) => setChangeableChargeValue(v || 0)} size="small"/>
                                                        </Col>
                                                    </Row>

                                                    <Row justify="space-between" align="middle" gutter={8}>
                                                        <Col flex="auto">Special Discount</Col>
                                                        <Col>
                                                            <InputNumber min={0} value={specialDiscount} onChange={(v) => setSpecialDiscount(v || 0)} size="small"/>
                                                        </Col>
                                                    </Row>

                                                    <Divider style={{ margin: '8px 0' }} />

                                                    <Row justify="space-between">
                                                        <Col style={{ fontWeight: 600 }}>Payable Price</Col>
                                                        <Col style={{ fontWeight: 600 }}>: {currency(payablePrice)}</Col>
                                                    </Row>
                                                </Space>
                                            </Card>

                                            <div style={{ textAlign: 'right', marginTop: 16 }}>
                                                <Button type="primary" size="large" loading={submitLoading} onClick={submit}>
                                                    {submitLoading ? "Updating" : "Update Order"}
                                                </Button>
                                            </div>
                                        </Col>
                                    </Row>
                                </Space>
                            </Card>

                            <OrderNote noteList={noteList} note={note} setNote={setNote} noteLoading={noteLoading} noteId={noteId} onSubmit={createNote} onEdit={editNote} onDelete={deleteNote}formatDateTime={formatDateTime}/>
                        </Space>
                    </Col>
                </Row>

                <Modal title="Customer Info" open={isModalVisible} width={960} onCancel={() => setIsModalVisible(false)} footer={null}>
                    {loading ? (
                        <div style={{ textAlign: "center", padding: "32px 0" }}>
                            <Spin />
                        </div>
                    ) : customerData ? (
                        <CourierDeliveryReport data={customerData} onRecheck={handleInfoClick}/>
                    ) : (
                        <Empty description="No data" />
                    )}
                </Modal>

                <OrderHistoryModal  orderId={selectedOrderId} open={showHistory} onClose={() => setShowHistory(false)}/>
            </Space>
        </>
    )
}

export default OrderEdit
