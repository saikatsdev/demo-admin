import { ArrowLeftOutlined, CloseOutlined, DeleteOutlined, LoadingOutlined, PhoneOutlined, PlusOutlined } from '@ant-design/icons'
import { AutoComplete, Breadcrumb, Button, Card, Col, Divider, Form, Grid, Image, Input, InputNumber, message, Popconfirm, Row, Select, Space, Spin, Table, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getDatas, postData } from '../../api/common/common';
import useTitle from '../../hooks/useTitle';
import { useSelector } from 'react-redux';

const currency = (value) => `${Number(value || 0).toFixed(2)} tk.`

export default function OrderAdd() {
    // Hook
    useTitle("Create Order");

    // Variable
    const [form] = Form.useForm();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
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
    const [orderFromId, setOrderFromId]                     = useState(1);
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
    const [fromName, setFromName]                           = useState('');
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
    const [itemWeight, setItemWeight]                       = useState('');
    const [areaLoading, setAreaLoading]                     = useState(false);
    const [orderFromError, setOrderFromError]               = useState('');
    const [shippingError, setShippingError]                 = useState('');
    const [errors, setErrors]                               = useState({});
    const [isIncomplte, setIsIncomplte]                     = useState(false);
    const [loading, setLoading]                             = useState(false);
    const location                                          = useLocation();
    const orderData                                         = location.state || "{}";

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
        setCustomerName(orderData.name);
        setPhoneNumber(orderData.phone_number);
        setAddress(orderData.address);
        if(orderData.is_incomplete === 1){
            setIsIncomplte(true);
        }

        const products = (orderData.items || []).map((item) => ({...item.product,quantity: 1,}));

        setCartItems(products);
    }, [orderData]);

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
            const initialCourier = defaultCourierId || (couriers[0] ? couriers[0].id : "");
            setCourierId(initialCourier);
            getCourierWiseData(initialCourier);
        }
    }, [couriers, defaultCourierId, courierId]);

    const insertOrderFrom = async () => {
        setAddLoading(true)
        const res = await postData('/admin/order-froms', {
            name: fromName,
            status: 'active',
        })

        if (res && res?.success) {
            setTimeout(() => {
                setFromName('');
                setAddLoading(false);
                setOrderFromId('');
                message.success('Order source added successfully');
            }, 1000)
        } else {
            setOrderFromError(res?.errors || '')
            setAddLoading(false)
        }
    }

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
        setFromName('')
        setShippingError('')
        setOrderFromError('')
    }

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
        if (product?.id) {
            if (product.variations?.length > 0) {
                if (variationId !== null && variationId !== undefined) {
                    const selectedVariation = product.variations[variationId];
                    const newItem = {
                        item_id    : product.id,
                        key        : `${product.id}_${Date.now()}`,
                        name       : product.name,
                        image      : product.img_path,
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
                    image      : product.img_path,
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
        const totalOfferPrice = cartItems.reduce((total, item) => {return total + item.offer_price * item.quantity}, 0)

        const totalMrp = cartItems.reduce((total, item) => {return total + item.mrp * item.quantity}, 0)

        const totalDiscount = cartItems.reduce((total, item) => {return total + item.discount * item.quantity}, 0)

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

    const filteredOrderFrom = orderFromList?.filter(tag => {
        return !isIncomplte ? tag.slug === "manual" : tag.slug === "incomplete";
    });

    const defaultOrderFromId = filteredOrderFrom?.[0]?.id || "add";

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
            order_from_id      : defaultOrderFromId,
            order_note         : orderNote,
            items              : items,
            delivery_type      : isPathao && !isRedx ? 12                   : 48,
            courier_id         : courierId,
            pickup_store_id    : pathaoStoreId,
            courier_area_id    : selectedPathaoArea.area_value.area_id || '',
            item_weight        : itemWeight,
            is_incomplete      : isIncomplte ? 1                            : 0
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

    const productColumns = 
    [
        {
            title: 'Image',
            dataIndex: 'image',
            key: 'image',
            width: 70,
            render: (src) => (
                <Image src={src} width={40} height={40} style={{ objectFit: 'cover' }} preview={false}/>
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
                            {attributeName(record.variation_1?.attribute_id)}: {record.variation_1?.value}
                        </Typography.Text>
                    )}

                    {record.variation_2 && (
                        <Typography.Text style={{ fontSize: '12px' }}>
                            {attributeName(record.variation_2?.attribute_id)}: {record.variation_2?.value}
                        </Typography.Text>
                    )}

                    {record.variation_3 && (
                        <Typography.Text style={{ fontSize: '12px' }}>
                            {attributeName(record.variation_3?.attribute_id)}: {record.variation_3?.value}
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
            render: (v) => currency(v),
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
    ];

    return (
        <>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {contextHolder}
        
                <Row justify="space-between" align="middle">
                    <Col>
                        <Typography.Title level={3} style={{ marginBottom: 4 }}>
                            Order Add
                        </Typography.Title>

                        <Breadcrumb items={[{ title: 'Dashboard' }, { title: 'Orders' }, { title: 'Order Add' }]}/>
                    </Col>

                    <Col>
                        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')}>
                            Back
                        </Button>
                    </Col>
                </Row>
        
                <Row gutter={[16, 16]}>
                    <Col xs={24}>
                        <Card title="Order Information">
                            <Form layout="vertical" form={form}>
                                <Row gutter={[16, 0]}>
                                    <Col xs={24} sm={12} md={8}>
                                        <Form.Item label="Customer Phone Number" required>
                                            <AutoComplete value={phoneNumber} options={phoneOptions.map((p) => ({ value: p.phone_number }))} onSearch={onPhoneSearch} onSelect={handlePhoneNumberChange}
                                                onChange={(value) => setPhoneNumber(value)} placeholder="Enter phone number" notFoundContent={isLoading ? <Spin size="small" /> : null}>
                                                <Input prefix={<PhoneOutlined />} />
                                            </AutoComplete>
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
                                            <Select placeholder="Select courier" value={courierId} onChange={(value) => {setCourierId(value);getCourierWiseData(value);}}
                                                showSearch optionFilterProp="children">
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
                                </Row>
                
                                {/* Pathao Fields */}
                                {isPathao && (
                                    <Row gutter={[16, 0]}>
                                        <Col xs={24} sm={12} md={8}>
                                            <Form.Item label="Pathao Store" required>
                                                <Select placeholder="Select store" value={pathaoStoreId} onChange={(value) => setPathaoStoreId(value)} showSearch filterOption={(input, option) =>
                                                    option.children.toLowerCase().includes(input.toLowerCase())}
                                                >
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
                                                <Select placeholder="Search area" value={selectedSearchArea} onChange={handlePathaoAreaChange} showSearch onSearch={remoteMethod} filterOption={false}notFoundContent={areaLoading ? <Spin size="small" /> : null}>
                                                    {pathaoCityOptions?.map((item) => (
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
                                                <Select placeholder="Select source" value={defaultOrderFromId} onChange={(value) => setOrderFromId(value)}>
                                                    <Select.Option value="add" style={{ color: 'red' }}>
                                                        Add New
                                                    </Select.Option>
                            
                                                    {filteredOrderFrom?.map(tag => (
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
                                                <Select placeholder="Select Delivery Gateway" value={deliveryChargeId} onChange={(value) => {setDeliveryChargeId(value);shippingCharge(value);}}
                                                style={{ width: "100%" }}>
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
                                        <Form.Item label="Order Note">
                                            <Input.TextArea rows={3} placeholder="Order Note" value={orderNote} onChange={(e) => setOrderNote(e.target.value)}/>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Form>
                        </Card>
                    </Col>
        
                    <Col xs={24}>
                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                            <Card title="Product Information">
                                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                                    {searchError && <Typography.Text type="danger">{searchError}</Typography.Text>}
                                    <Row gutter={12} align="middle">
                                        <Col flex="auto">
                                            <div style={{ position: 'relative' }}>
                                                <Input placeholder="Search Product" value={searchQuery} onChange={(e) => {setSearchQuery(e.target.value),searchProduct()}}/>

                                                {loading && (
                                                    <div style={{position: 'absolute',right: 8,top: 8}}>
                                                        <Spin size="small" />
                                                    </div>
                                                )}
                        
                                                {!hiddenSearchProducts && (
                                                    <Button type="text" size="small" icon={<CloseOutlined />} onClick={clearSearchProducts} style={{position: 'absolute',right: 0,top: 0}}/>
                                                )}

                                                {!hiddenSearchProducts && (
                                                    <Card size="small" style={{position: 'absolute',top: '100%',left: 0,right: 0,zIndex: 1000,maxHeight: '300px',overflow: 'auto',}}>
                                                        {products?.length > 0 ? (
                                                            <Space direction="vertical" style={{ width: '100%' }}>
                                                                {products.map((product) => (
                                                                    <div key={product.id} onClick={() => addProduct(product)} style={{ cursor: 'pointer', padding: '8px' }}>
                                                                        <Row gutter={8}>
                                                                            <Col>
                                                                                <Image src={product.img_path} width={40} preview={false}/>
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
                                                        ) : loading ? (
                                                            <Typography.Text type="secondary">Loading...</Typography.Text>
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
                                                        const displayText = [];

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
                                            <InputNumber min={1} value={quantity} onChange={(v) => setQuantity(v || 1)}/>
                                        </Col>

                                        <Col>
                                            <Button type="primary" icon={<PlusOutlined />} onClick={() => addToCart(productInfo)}>
                                                Add
                                            </Button>
                                        </Col>
                                    </Row>
                    
                                    <Row gutter={[16, 16]} align="top">
                                        <Col xs={24} md={16}>
                                            <Table size="middle" rowKey="key" columns={productColumns} dataSource={cartItems} pagination={false} scroll={{ x: isMobile ? 520 : undefined }}/>
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
                                                        <Col> : {currency(totalPrice.mrp_price - totalPrice.discount_price)}</Col>
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
                                                    Add Order
                                                </Button>
                                            </div>
                                        </Col>
                                    </Row>
                                </Space>
                            </Card>
                        </Space>
                    </Col>
                </Row>
            </Space>
        </>
    )
}
