import { ArrowLeftOutlined, CloseOutlined, DeleteOutlined, LoadingOutlined, PhoneOutlined, PlusOutlined, UserOutlined, ShoppingCartOutlined, CreditCardOutlined, MessageOutlined, CalendarOutlined, GlobalOutlined, CarOutlined, InboxOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { AutoComplete, Breadcrumb, Button, Card, Col, Divider, Form, Grid, DatePicker, Image, Input, InputNumber, message, Popconfirm, Row, Select, Space, Spin, Table, Typography, Tag } from 'antd'
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getDatas, postData } from '../../api/common/common';
import useTitle from '../../hooks/useTitle';
import { useSelector } from 'react-redux';
import './OrderAdd.css';

const currency = (value) => `৳ ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const mapPrefillItemToCart = (item, index) => {
    const product = item.product || item;
    const productId = product?.id || item.product_id || item.item_id;

    return {
        item_id: productId,
        key: `prefill_${productId || "item"}_${index}`,
        name: product?.name || item.name || "",
        image: product?.image || product?.img_path || item.image,
        buy_price: Number(item.buy_price ?? product?.buy_price ?? 0),
        mrp: Number(item.mrp ?? product?.mrp ?? 0),
        offer_price: Number(
            item.offer_price ?? item.sell_price ?? product?.offer_price ?? product?.sell_price ?? 0
        ),
        discount: Number(item.discount ?? product?.discount ?? 0),
        variation_1: item.attribute_value_1 || item.variation_1 || null,
        variation_2: item.attribute_value_2 || item.variation_2 || null,
        variation_3: item.attribute_value_3 || item.variation_3 || null,
        quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1,
        variations: product?.variations,
    };
};

export default function OrderAdd() {
    // Hook
    useTitle("Create Order");

    // Variable
    const [form] = Form.useForm();
    const navigate = useNavigate();

    // State
    const [messageApi, contextHolder]                       = message.useMessage();
    const [products, setProducts]                           = useState([]);
    const [productInfo, setProductInfo]                     = useState(null);
    const [attributesList, setAttributesList]               = useState([]);
    const [cartItems, setCartItems]                         = useState([]);
    const [phoneNumber, setPhoneNumber]                     = useState('');
    const [phoneOptions, setPhoneOptions]                   = useState([]);
    const [customerName, setCustomerName]                   = useState('');
    const [district, setDistrict]                           = useState('');
    const [address, setAddress]                             = useState('');
    const [statusId, setStatusId]                           = useState(1);
    const [orderFromId, setOrderFromId]                     = useState(null);
    const [deliveryChargeId, setDeliveryChargeId]           = useState(1);
    const [paymentGatewayId, setPaymentGatewayId]           = useState(1);
    const [paymentStatus, setPaymentStatus]                 = useState('unpaid');
    const [variationId, setVariationId]                     = useState(null);
    const [quantity, setQuantity]                           = useState(1);
    const [advancePayment, setAdvancePayment]               = useState(0);
    const [changeableChargeValue, setChangeableChargeValue] = useState(0);
    const [specialDiscount, setSpecialDiscount]             = useState(0);
    const [orderNote, setOrderNote]                         = useState('');
    const [customerTypeId, setCustomerTypeId]               = useState(1);
    const [searchQuery, setSearchQuery]                     = useState('');
    const [deliveryFee, setDeliveryFee]                     = useState('');
    const [deliveryName, setDeliveryName]                   = useState('');
    const [hiddenSearchProducts, setHiddenSearchProducts]   = useState(true);
    const [searchError, setSearchError]                     = useState('');
    const [isLoading, setIsLoading]                         = useState(false);
    const [addLoading, setAddLoading]                       = useState(false);
    const [deleteLoading, setDeleteLoading]                 = useState(null);
    const [submitLoading, setSubmitLoading]                 = useState(false);
    const [isPathao, setIsPathao]                           = useState(false);
    const [isRedx, setIsRedx]                               = useState(false);
    const [pathaoStores, setPathaoStores]                   = useState([]);
    const [pathaoStoreId, setPathaoStoreId]                 = useState('');
    const [pathaoCityOptions, setPathaoCityOptions]         = useState([]);
    const [selectedSearchArea, setSelectedSearchArea]       = useState('');
    const [selectedPathaoArea, setSelectedPathaoArea]       = useState(null);
    const [itemWeight, setItemWeight]                       = useState('0.5');
    const [areaLoading, setAreaLoading]                     = useState(false);
    const [orderFromError, setOrderFromError]               = useState('');
    const [shippingError, setShippingError]                 = useState('');
    const [errors, setErrors]                               = useState({});
    const [isIncomplte, setIsIncomplte]                     = useState(false);
    const [loading, setLoading]                             = useState(false);
    const location                                          = useLocation();
    const orderData                                         = location.state;
    const [itemQuantity, setItemQuantity]                   = useState("");
    const [itemDescription, setItemDescription]             = useState("");

    // Redux State
    const districts                 = useSelector((state) => state.districts.list);
    const paymentGateways           = useSelector((state) => state.paymentGateway.list);
    const customerTypes             = useSelector((s) => s.customerType.list);
    const couriers                  = useSelector((s) => s.courier.list);
    const defaultCourierId          = useSelector((s) => s.courier.defaultCourierId);
    const [courierId, setCourierId] = useState("");
    const orderFromList             = useSelector((state) => state.orderFrom.list);
    const statuses                  = useSelector((state) => state.status.list);
    const deliveryGateways          = useSelector((state) => state.deliveryGateway.list);

    useEffect(() => {
        if (!orderData || typeof orderData !== "object") return;

        const customer =
            orderData.customer_name ||
            orderData.name ||
            "";
        const phone =
            orderData.customer_phone ||
            orderData.phone_number ||
            "";
        const addr =
            orderData.customer_address ||
            orderData.address ||
            "";

        if (customer) setCustomerName(customer);
        if (phone) setPhoneNumber(phone);
        if (addr) setAddress(addr);
        if (orderData.district_id) setDistrict(orderData.district_id);

        if (orderData.is_incomplete === 1) {
            setIsIncomplte(true);
        }

        const prefillItems = orderData.items || orderData.products || [];
        if (prefillItems.length > 0) {
            setCartItems(prefillItems.map(mapPrefillItemToCart));
        } else if (Array.isArray(orderData.prefillCartItems) && orderData.prefillCartItems.length > 0) {
            setCartItems(orderData.prefillCartItems);
        }
    }, [location.key, orderData]);

    useEffect(() => {
        const fetchInitialData = async () => {
            await Promise.all([
                getAttributeList(),
                getPathaoStoreData(),
            ])
        }
        fetchInitialData()
    }, []);

    useEffect(() => {
        if (couriers.length && !courierId) {
            const initialCourier = defaultCourierId || "";
            setCourierId(initialCourier);
            getCourierWiseData(initialCourier);
        }
    }, [couriers, defaultCourierId, courierId]);

    useEffect(() => {
        if (orderFromList?.length) {
            const manualItem = orderFromList.find(item => item.slug === "manual");
            if (manualItem) {
                setOrderFromId(manualItem.id);
            }
        }
    }, [orderFromList]);

    const insertDeliveryGateway = async () => {
        setAddLoading(true)
        const res = await postData('/admin/delivery-gateways', {name: deliveryName,deliveryFee: deliveryFee,status: 'active'});

        if (res && res?.success) {
            setTimeout(() => {
                setDeliveryChargeId('')
                setDeliveryFee('')
                setDeliveryName('')
                setAddLoading(false)
                setShippingError('')
                message.success('Delivery gateway added successfully')
            }, 1000)
        } else {
            setShippingError(res?.errors || '')
            setAddLoading(false)
        }
    }

    const searchProduct = async () => {
        if (!searchQuery) return
        
        try {
            setLoading(true);
            const res = await getDatas('/admin/products/search', {search_key: searchQuery })

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
        if (res && res?.success) {
            setAttributesList(res?.result?.data || [])
        }
    }

    const attributeName = (attributeId) => {
        const attribute = attributesList?.find((i) => i.id === Number(attributeId))
        return attribute?.name || ''
    }

    const getPathaoStoreData = async () => {
        const res = await getDatas('/admin/pathao/stores')
        if (res && res?.result?.data) {
            setPathaoStores(res.result?.data?.data || []);
        }
    }

    useEffect(() => {
        if (pathaoStores?.length === 1) {
            setPathaoStoreId(pathaoStores[0].store_id);
        }
    }, [pathaoStores]);

    const remoteMethod = async (query) => {
        if (query !== '') {
            setAreaLoading(true)
            try {
                const res = await getDatas('/admin/pathao/search-areas', {area_name: query})
                setPathaoCityOptions(res?.result || [])
            } catch (err) {
                console.error('Error fetching cities:', err)
                setPathaoCityOptions([])
            } finally {
                setAreaLoading(false)
            }
        } else {
            setPathaoCityOptions([])
        }
    }

    const handlePathaoAreaChange = (value) => {
        setSelectedSearchArea(value)
        const match = pathaoCityOptions.find((item) => item.id === value)
        setSelectedPathaoArea(match || null)
    }

    const getCourierWiseData = (courierId) => {
        if (courierId == 2) {
            setIsPathao(true)
            setIsRedx(false)
        } else if (courierId == 3) {
            setIsRedx(true)
            setIsPathao(false)
        } else if (courierId == 1) {
            setIsPathao(false)
            setIsRedx(false)
        }
    }

    const shippingCharge = (id) => {
        if (!id) {
            setChangeableChargeValue(0);
            return;
        }
        const charge = deliveryGateways?.find((i) => String(i.id) === String(id));
        setChangeableChargeValue(Number(charge?.delivery_fee) || 0);
    };

    useEffect(() => {
        if (deliveryGateways.length) {
            const defaultId = 1;
            setDeliveryChargeId(defaultId);
            shippingCharge(defaultId);
        }
    }, [deliveryGateways]);

    const removeAddField = () => {
        setDeliveryChargeId('')
        setDeliveryFee('')
        setDeliveryName('')
        setOrderFromId('')
        setShippingError('')
        setOrderFromError('')
    }


    const addProduct = (product) => {
        setSearchQuery(product.name)
        setHiddenSearchProducts(true)
        setProductInfo(product)
    }

    const addToCart = async (product) => {
        if (product?.id) {
            if (product.variations?.length > 0) {
                if (variationId !== null && variationId !== undefined) {
                    const selectedVariation = product.variations[variationId];
                    const newItem = {
                        item_id    : product.id,
                        key        : `${product.id}_${Date.now()}`,
                        name       : product.name,
                        image      : product.image,
                        buy_price  : selectedVariation.buy_price,
                        mrp        : selectedVariation.mrp,
                        offer_price: selectedVariation.offer_price,
                        discount   : selectedVariation.discount,
                        variation_1: selectedVariation?.attribute_value_1,
                        variation_2: selectedVariation?.attribute_value_2,
                        variation_3: selectedVariation?.attribute_value_3,
                        quantity   : quantity,
                        variations : product.variations,
                    }
                    setCartItems((prev) => [...prev, newItem])
                    setSearchQuery('')
                    setQuantity(1)
                    setVariationId(null)
                    setProductInfo(null)
                    setSearchError('')
                } else {
                    setSearchError('Please Select Variation')
                }
            } else {
                const newItem = {
                    item_id    : product.id,
                    key        : `${product.id}_${Date.now()}`,
                    name       : product.name,
                    image      : product.image,
                    buy_price  : product.buy_price,
                    mrp        : product.mrp,
                    offer_price: product.offer_price,
                    discount   : product.discount,
                    quantity   : quantity,
                }
                setCartItems((prev) => [...prev, newItem])
                setSearchQuery('')
                setQuantity(1)
                setProductInfo(null)
                setSearchError('')
            }
        } else {
            setSearchError('Product and Variation is required')
        }
    }

    const deleteCartItem = (index) => {
        setDeleteLoading(index)
        setTimeout(() => {
            setCartItems((prev) => prev.filter((_, i) => i !== index));
            setDeleteLoading(null);
        }, 1000)
    }

    const updateCartQuantity = (index, newQuantity) => {
        setCartItems((prev) => prev.map((item, i) => (i === index ? { ...item, quantity: newQuantity || 1 } : item)))
    }

    const fetchPhoneOptions = async (query) => {
        setIsLoading(true)
        try {
            const response = await getDatas('/admin/orders/search-by/phone-number', {phone_number: query});
            setPhoneOptions(response?.result || []);
        } catch (error) {
            console.error('Error fetching phone options:', error);
        } finally {
            setIsLoading(false);
        }
    }

    const onPhoneSearch = (value) => {
        setPhoneNumber(value)
        if (value.length >= 3) {
            fetchPhoneOptions(value)
        }
    }

    const handlePhoneNumberChange = (value) => {
        setPhoneNumber(value)
        const res = phoneOptions.find((i) => i.phone_number == value)
        if (res) {
            setCourierId(res?.courier_id || 1);
            setAddress(res?.address_details || '');
            setCustomerName(res?.customer_name || '');
            setDistrict(res?.district_id || '');
            getCourierWiseData(res?.courier_id);
        }
    }

    const totalPrice = useMemo(() => {
        const totalOfferPrice = cartItems.reduce((total, item) => total + item.offer_price * item.quantity, 0)
        const totalMrp = cartItems.reduce((total, item) => total + item.mrp * item.quantity, 0)
        const totalDiscount = cartItems.reduce((total, item) => total + item.discount * item.quantity, 0)
        return {mrp_price: totalMrp,offer_price: totalOfferPrice,discount_price: totalDiscount}
    }, [cartItems]);

    const payablePrice = useMemo(() => {
        return (
            parseFloat(totalPrice.mrp_price) -
            parseFloat(totalPrice.discount_price) +
            parseFloat(changeableChargeValue) -
            parseFloat(specialDiscount || 0) -
            parseFloat(advancePayment || 0)
        )
    }, [totalPrice, changeableChargeValue, specialDiscount, advancePayment]);

    const submit = async () => {
        setSubmitLoading(true);
        const items = []
        cartItems.forEach((product) => {
            let item = {
                product_id          : product.item_id ?? product.id,
                attribute_value_id_1: product?.variation_1?.id ? product?.variation_1?.id: '',
                attribute_value_id_2: product?.variation_2?.id ? product?.variation_2?.id: '',
                attribute_value_id_3: product?.variation_3?.id ? product?.variation_3?.id: '',
                quantity            : product.quantity,
            }
            items.push(item)
        })

        const res = await postData('/admin/orders', {
            payment_gateway_id : paymentGatewayId,
            delivery_gateway_id: deliveryChargeId,
            current_status_id  : statusId,
            incomplete_order_id: orderData?.id || '',
            coupon_id          : '',
            paid_status        : paymentStatus,
            delivery_charge    : changeableChargeValue,
            special_discount   : specialDiscount,
            advance_payment    : advancePayment,
            address_details    : address,
            district_id        : district,
            customer_type_id   : customerTypeId,
            customer_name      : customerName,
            phone_number       : phoneNumber,
            order_from_id      : orderFromId,
            order_note         : orderNote,
            items              : items,
            delivery_type      : isPathao && !isRedx ? 12    : 48,
            courier_id         : courierId,
            pickup_store_id    : pathaoStoreId,
            courier_area_id    : selectedPathaoArea?.id || '',
            item_weight        : itemWeight,
            item_quantity      : itemQuantity,
            item_description   : itemDescription,
            is_incomplete      : isIncomplte ? 1             : 0
        })

        setSubmitLoading(false)

        if (res && res?.success) {
            messageApi.open({
                type: "success",
                content: res.msg,
            });
            setCartItems([])
            setTimeout(() => {
                navigate('/orders')
            }, 400);
        } else {
            setErrors(res?.errors || {})
            message.error('Failed to create order')
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

    const productColumns = 
    [
        {
            title: 'Image',
            dataIndex: 'image',
            key: 'image',
            width: 80,
            render: (src) => (
                <Image src={src} width={50} height={50} style={{ objectFit: 'cover', borderRadius: '8px' }} preview={false}/>
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
                                {attributeName(record.variation_1?.attribute_id)}: {record.variation_1?.value}
                            </Tag>
                        )}
                        {record.variation_2 && (
                            <Tag className="variation-tag">
                                {attributeName(record.variation_2?.attribute_id)}: {record.variation_2?.value}
                            </Tag>
                        )}
                        {record.variation_3 && (
                            <Tag className="variation-tag">
                                {attributeName(record.variation_3?.attribute_id)}: {record.variation_3?.value}
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
            width: 150,
            render: (_, r) => (
                <div>
                    <div style={{ color: '#64748b', fontSize: '12px', textDecoration: 'line-through' }}>{currency(r.mrp)}</div>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{currency(r.mrp - r.discount)}</div>
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
    ];

    return (
        <div className="order-add-container">
            {contextHolder}
            
            <div className="page-header">
                <div>
                    <Typography.Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
                        Create New Order
                    </Typography.Title>
                    <Breadcrumb 
                        items={[
                            { title: 'Dashboard', href: '/admin/dashboard' }, 
                            { title: 'Orders', href: '/orders' }, 
                            { title: 'Order Creation' }
                        ]} 
                        style={{ marginTop: 8 }}
                    />
                </div>
                <Button size="small" icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')} style={{ borderRadius: '10px', fontWeight: 600 }}>
                    Back to List
                </Button>
            </div>

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={17}>
                    <Form layout="vertical" form={form} className="custom-form">
                        <Card 
                            className="modern-card" 
                            title={
                                <>
                                    <div className="section-icon icon-blue"><UserOutlined /></div>
                                    <span>Customer Information</span>
                                </>
                            }
                        >
                            <Row gutter={[20, 0]}>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Phone Number" required className="custom-form-item">
                                        <AutoComplete value={phoneNumber} options={phoneOptions.map((p) => ({ value: p.phone_number }))} onSearch={onPhoneSearch} onSelect={handlePhoneNumberChange} onChange={(value) => setPhoneNumber(value)} 
                                            placeholder="Enter phone number" notFoundContent={isLoading ? <Spin size="small" /> : null}
                                        >
                                            <Input prefix={<PhoneOutlined />} className="custom-input" />
                                        </AutoComplete>

                                        {errors.phone_number && (
                                            <Typography.Text type="danger" style={{ fontSize: '12px' }}>{errors.phone_number[0]}</Typography.Text>
                                        )}
                                    </Form.Item>
                                </Col>

                                <Col xs={24} md={8}>
                                    <Form.Item label="Full Name" required className="custom-form-item">
                                        <Input placeholder="Write Your Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="custom-input" />
                                        {errors.customer_name && (
                                            <Typography.Text type="danger" style={{ fontSize: '12px' }}>{errors.customer_name[0]}</Typography.Text>
                                        )}
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item label="District" className="custom-form-item">
                                        <Select placeholder="Select district" value={district} onChange={(value) => setDistrict(value)} showSearch className="custom-select" filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}>
                                            {districts?.map((d) => (
                                                <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>

                                <Col xs={24}>
                                    <Form.Item label="Detailed Address" className="custom-form-item">
                                        <Input.TextArea rows={3} placeholder="House, Road, Area..." value={address} onChange={(e) => setAddress(e.target.value)} className="custom-input" />
                                        {errors.address_details && (
                                            <Typography.Text type="danger" style={{ fontSize: '12px' }}>{errors.address_details[0]}</Typography.Text>
                                        )}
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>

                        {/* Logistics Information Card */}
                        <Card 
                            className="modern-card" 
                            title={
                                <>
                                    <div className="section-icon icon-orange"><CarOutlined /></div>
                                    <span>Logistics & Status</span>
                                </>
                            }
                        >
                            <Row gutter={[20, 0]}>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Preferred Courier" className="custom-form-item">
                                        <Select placeholder="Select courier" value={courierId} onChange={(value) => {setCourierId(value);getCourierWiseData(value);}} showSearch>
                                            {couriers.map((c) => (
                                                <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>

                                <Col xs={24} md={8}>
                                    <Form.Item label="Order Status" required className="custom-form-item">
                                        <Select value={statusId} onChange={(value) => setStatusId(value)}>
                                            {statuses?.map((status) => (
                                                <Select.Option key={status.id} value={status.id}>{status.name}</Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>

                                <Col xs={24} md={8}>
                                    <Form.Item label="Customer Segment" className="custom-form-item">
                                        <Select value={customerTypeId} onChange={(value) => setCustomerTypeId(value)}>
                                            {customerTypes?.map((type) => (
                                                <Select.Option key={type.id} value={type.id}>{type.name}</Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>

                            {isPathao && (
                                <div style={{ marginTop: 24, padding: 24, backgroundColor: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                                    <Typography.Title level={5} style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <GlobalOutlined style={{ color: '#1890ff' }} /> Pathao Courier Integration
                                    </Typography.Title>
                                    <Row gutter={[20, 0]}>
                                        <Col xs={24} md={12}>
                                            <Form.Item label="Pathao Store" required>
                                                <Select placeholder="Select store" value={pathaoStoreId} onChange={(value) => setPathaoStoreId(value)} showSearch>
                                                    {pathaoStores?.map((store) => (
                                                        <Select.Option key={store.store_id} value={store.store_id}>{store.store_name}</Select.Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                        </Col>

                                        <Col xs={24} md={12}>
                                            <Form.Item label="Delivery Area" required>
                                                <Select placeholder="Search area" value={selectedSearchArea} onChange={handlePathaoAreaChange} showSearch onSearch={remoteMethod} filterOption={false}
                                                    notFoundContent={areaLoading ? <Spin size="small" /> : null}
                                                >
                                                    {pathaoCityOptions.map((item) => (
                                                        <Select.Option key={item.id} value={item.id}>{item.area_name}</Select.Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                        </Col>

                                        <Col xs={24} md={8}>
                                            <Form.Item label="Weight (kg)">
                                                <Input value={itemWeight} onChange={(e) => setItemWeight(e.target.value)} placeholder="0.5" />
                                            </Form.Item>
                                        </Col>

                                        <Col xs={24} md={8}>
                                            <Form.Item label="Item Quantity">
                                                <Input value={itemQuantity} onChange={(e) => setItemQuantity(e.target.value)} placeholder="1" />
                                            </Form.Item>
                                        </Col>

                                        <Col xs={24} md={8}>
                                            <Form.Item label="Description">
                                                <Input value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} placeholder="Items detail" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </div>
                            )}
                        </Card>

                        <Card className="modern-card" 
                            title={
                                <>
                                    <div className="section-icon icon-purple"><ShoppingCartOutlined /></div>
                                    <span>Product Selection</span>
                                </>
                            }
                        >
                            <div style={{ marginBottom: 32 }}>
                                {searchError && <Typography.Text type="danger" style={{ display: 'block', marginBottom: 12 }}>{searchError}</Typography.Text>}
                                <Row gutter={16} align="bottom">
                                    <Col flex="auto">
                                        <Form.Item label="Search Products" className="custom-form-item" style={{ marginBottom: 0 }}>
                                            <div style={{ position: 'relative' }}>
                                                <Input size="large" placeholder="Search by name, SKU or barcode..." value={searchQuery} onChange={(e) => {setSearchQuery(e.target.value); searchProduct();}} prefix={<InboxOutlined style={{ color: '#94a3b8' }} />} className="custom-input"/>
                                                {loading && <div style={{position: 'absolute', right: 12, top: 12}}><Spin size="small" /></div>}
                                                {!hiddenSearchProducts && (
                                                    <Card className="product-search-dropdown" size="small" style={{position: 'absolute', top: '105%', left: 0, right: 0, zIndex: 1000, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', borderRadius: '12px', maxHeight: '400px', overflow: 'auto'}}>
                                                        {products?.length > 0 ? (
                                                            <div>
                                                                {products.map((product) => (
                                                                    <div key={product.id} onClick={() => addProduct(product)} style={{ cursor: 'pointer', padding: '12px', borderRadius: '8px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                                                        <Row gutter={12} align="middle">
                                                                            <Col><Image src={product.image} width={48} height={48} style={{ borderRadius: '6px' }} preview={false}/></Col>
                                                                            <Col flex="auto">
                                                                                <Typography.Text strong style={{ fontSize: '14px' }}>{product.name}</Typography.Text>
                                                                                <div style={{ color: '#64748b', fontSize: '12px' }}>{product.category?.name} • {currency(product.mrp)}</div>
                                                                            </Col>
                                                                            <Col><PlusOutlined style={{ color: '#3b82f6' }} /></Col>
                                                                        </Row>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No products found</div>
                                                        )}
                                                    </Card>
                                                )}
                                            </div>
                                        </Form.Item>
                                    </Col>

                                    {productInfo?.variations?.length > 0 && (
                                        <Col span={6}>
                                            <Form.Item label="Variation" className="custom-form-item" style={{ marginBottom: 0 }}>
                                                <Select size="large" placeholder="Choose style" value={variationId !== null ? variationId : undefined} onChange={(value) => setVariationId(value)}>
                                                    {productInfo.variations.map((v, idx) => {
                                                        const label = [
                                                            v?.attribute_value_1 && `${attributeName(v.attribute_value_1.attribute_id)}: ${v.attribute_value_1.value}`,
                                                            v?.attribute_value_2 && `${attributeName(v.attribute_value_2.attribute_id)}: ${v.attribute_value_2.value}`,
                                                            v?.attribute_value_3 && `${attributeName(v.attribute_value_3.attribute_id)}: ${v.attribute_value_3.value}`
                                                        ].filter(Boolean).join(' | ');
                                                        return <Select.Option key={idx} value={idx}>{label}</Select.Option>
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
                                locale={{ emptyText: 'No items in cart' }}
                            />
                            {errors?.items && (
                                <Typography.Text type="danger" style={{ display: 'block', marginTop: 12 }}>{errors.items[0]}</Typography.Text>
                            )}
                        </Card>

                        <Card className="modern-card" title={<><div className="section-icon icon-green"><GlobalOutlined /></div><span>Source & Payments</span></>}>
                            <Row gutter={[20, 0]}>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Order Source">
                                        <Select value={orderFromId} onChange={(v) => setOrderFromId(v)} placeholder="Select source">
                                            <Select.Option value="add" style={{ color: '#3b82f6' }}>
                                                + Add New Source
                                            </Select.Option>
                                            {orderFromList?.map(tag => (
                                                <Select.Option key={tag.id} value={tag.id}>{tag.name}</Select.Option>
                                            ))}
                                        </Select>

                                        {orderFromError?.name && <Typography.Text type="danger" style={{ fontSize: '12px' }}>{orderFromError.name[0]}</Typography.Text>}
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
                                            <Select value={deliveryChargeId} onChange={(v) => {setDeliveryChargeId(v); shippingCharge(v);}} placeholder="Select gateway">
                                                {deliveryGateways?.map((charge) => (
                                                    <Select.Option key={charge.id} value={charge.id}>{charge.name} ({currency(charge.delivery_fee)})</Select.Option>
                                                ))}
                                            </Select>
                                        )}

                                        {shippingError?.name && (
                                            <Typography.Text type="danger">{shippingError.name[0]}</Typography.Text>
                                        )}
                                    </Form.Item>
                                </Col>

                                <Col xs={24} md={8}>
                                    <Form.Item label="Payment Gateway" required>
                                        <Select value={paymentGatewayId} onChange={(v) => setPaymentGatewayId(v)}>
                                            {paymentGateways?.map((gateway) => (
                                                <Select.Option key={gateway.id} value={gateway.id}>{gateway.name}</Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>

                                <Col xs={24} md={8}>
                                    <Form.Item label="Payment Status" required>
                                        <Select value={paymentStatus} onChange={(v) => setPaymentStatus(v)}>
                                            <Select.Option value="paid"><Tag color="success" style={{ border: 'none', margin: 0 }}>Paid</Tag></Select.Option>
                                            <Select.Option value="unpaid"><Tag color="error" style={{ border: 'none', margin: 0 }}>Unpaid</Tag></Select.Option>
                                        </Select>
                                    </Form.Item>
                                </Col>

                                <Col xs={24} md={16}>
                                    <Form.Item label="General Order Note">
                                        <Input.TextArea rows={1} value={orderNote} onChange={(e) => setOrderNote(e.target.value)} placeholder="Any special requests or notes..." />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>
                    </Form>
                </Col>

                <Col xs={24} lg={7}>
                    <div className="order-summary-card">
                        <Typography.Title level={4} style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <CreditCardOutlined style={{ color: '#2563eb' }} /> Order Summary
                        </Typography.Title>
                        
                        <div className="summary-row">
                            <span>Subtotal ({cartItems.length} items)</span>
                            <span>{currency(totalPrice.mrp_price)}</span>
                        </div>
                        
                        <div className="summary-row">
                            <span>Item Discount</span>
                            <span style={{ color: '#ef4444' }}>-{currency(totalPrice.discount_price)}</span>
                        </div>

                        <Divider style={{ margin: '12px 0' }} />

                        <div className="summary-row" style={{ fontWeight: 600, color: '#1e293b' }}>
                            <span>Shipping Charge</span>
                            <div style={{ width: '120px' }}>
                                <InputNumber min={0} value={changeableChargeValue} onChange={(v) => setChangeableChargeValue(v || 0)} size="small" style={{ width: '100%' }} formatter={v => `৳ ${v}`} parser={v => v.replace(/[^\d.]/g, '')} />
                            </div>
                        </div>

                        <div className="summary-row">
                            <span>Special Discount</span>
                            <div style={{ width: '120px' }}>
                                <InputNumber min={0} value={specialDiscount} onChange={(v) => setSpecialDiscount(v || 0)} size="small" style={{ width: '100%', color: '#ef4444' }} formatter={v => `- ৳ ${v}`} parser={v => v.replace(/[^\d.]/g, '')} />
                            </div>
                        </div>

                        <div className="summary-row">
                            <span>Advance Paid</span>
                            <div style={{ width: '120px' }}>
                                <InputNumber min={0} value={advancePayment} onChange={(v) => setAdvancePayment(v || 0)} size="small" style={{ width: '100%', color: '#10b981' }} formatter={v => `- ৳ ${v}`} parser={v => v.replace(/[^\d.]/g, '')} />
                            </div>
                        </div>

                        <div className="summary-total">
                            <div className="total-label">Payable Amount</div>
                            <div className="total-value">{currency(payablePrice)}</div>
                        </div>

                        <Button type="primary" className="submit-btn" loading={submitLoading} onClick={submit} icon={<CheckCircleOutlined />}>
                            Complete Order
                        </Button>
                        
                        <div style={{ marginTop: 16, textAlign: 'center' }}>
                            <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                                By clicking "Complete Order", you agree to the system's order policies.
                            </Typography.Text>
                        </div>
                    </div>
                </Col>
            </Row>
        </div>
    )
}

