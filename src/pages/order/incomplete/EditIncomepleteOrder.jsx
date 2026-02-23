import { ArrowLeftOutlined, DeleteOutlined, FileTextOutlined, PlusOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Form, Modal, Space, Table, message, Select } from "antd";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getDatas, postData } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";

export default function EditIncomepleteOrder() {
    // Variable
    const {id}        = useParams();
    const dropdownRef = useRef(null);
    const navigate    = useNavigate();

    useTitle("Edit Incomplete Order");

    const [inCompleteOrders, setInCompleteOrders]   = useState({ items: [] });
    const [loading, setLoading]                     = useState(false);
    const [query, setQuery]                         = useState("");
    const [results, setResults]                     = useState([]);
    const [noteModalVisible, setNoteModalVisible]   = useState(false);
    const [currentNoteRecord, setCurrentNoteRecord] = useState(null);
    const [messageApi, contextHolder]               = message.useMessage();
    const [form]                                    = Form.useForm();

    const columns = 
    [
        {
            title: "Product Name",
            dataIndex: ["product", "name"],
            key: "name",
            width:300,
            render: (text) => <span style={{textTransform:"capitalize"}}>{text}</span>,
        },
        {
            title: "MRP",
            dataIndex: ["product", "mrp"],
            key: "mrp",
        },
        {
            title: "Sell Price",
            dataIndex: ["product", "sell_price"],
            key: "sell_price",
        },
        {
            title: "Note",
            dataIndex: "note",
            key: "note",
        },
        {
            title: "Variations",
            dataIndex: "variations",
            key: "variations",
            render: (_, record) => {
                const attr1 = record.attribute_value_1?.value || "";
                const attr2 = record.attribute_value_2?.value || "";
                const attr3 = record.attribute_value_3?.value || "";

                const variationText = [attr1, attr2, attr3].filter(Boolean).join(" / ");

                return <span>{variationText || "-"}</span>;
            }
        },
        {
            title: "Actions",
            key: "actions",
            width:150,
            render: (_, record) => (
                <Space size="middle">
                    <Button type="default" icon={<FileTextOutlined />} onClick={() => handleNote(record)} >
                        Note
                    </Button>
                    <Button type="primary" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
                        Delete
                    </Button>
                </Space>
            ),
        },
    ];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setResults([]);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleDelete = (record) => {
        setInCompleteOrders(prev => ({
            ...prev,
            items: prev.items.filter(item => item.id !== record.id)
        }));
    };

    const handleNote = (record) => {
        setCurrentNoteRecord(record);
        setNoteModalVisible(true);
        form.setFieldsValue({ note: record.note || "" });
    };

    const handleAddProduct = (product) => {
        const newItem = {
            id: product.id,
            product: product,
            attribute_value_1: product.variations?.[0]?.attribute_value1 || null,
            attribute_value_2: product.variations?.[0]?.attribute_value2 || null,
            attribute_value_3: product.variations?.[0]?.attribute_value3 || null,
            note: "",
        };

        setInCompleteOrders((prev) => ({
            ...prev,
            items: [...prev.items, newItem],
        }));

        setResults([]);
    };

    useEffect(() => {
        if (!query) {
            setResults([]);
            return;
        }

        const delayDebounce = setTimeout(async () => {
            try {
                const res = await getDatas('/admin/products/search', {search_key : query});
                if(res && res?.success){
                    setResults(res.result || []);
                }
            } catch (err) {
                console.error(err);
            }
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [query]);

    useEffect(() => {
        let isMounted = true;
        const fetchIncompleteOrder = async () => {
            setLoading(true);

            const res = await getDatas(`/admin/incomplete-orders/${id}`);
            const list = res?.result || [];

            console.log(list);

            if(isMounted){
                setInCompleteOrders(list);
                form.setFieldsValue({
                    name        : list.name || "",
                    phone_number: list.phone_number || "",
                    ip_address  : list.ip_address || "",
                    address     : list.address || "",
                    created_at  : list.created_at || "",
                    status      : list.status.id || undefined
                });

                setLoading(false);
            }
        }

        fetchIncompleteOrder();

        return () => { isMounted = false; }
    }, [id, form]);

    const handleUpdate = async (values) => {
        const payload = {
            name: values.name,
            phone_number: values.phone_number,
            address: values.address,
            ip_address: values.ip_address || "",
            status_id: values.status,
            items: inCompleteOrders.items.map((item) => ({
                product_id: item.product?.id,
                attribute_value_id_1: item.attribute_value_1?.id || null,
                attribute_value_id_2: item.attribute_value_2?.id || null,
                attribute_value_id_3: item.attribute_value_3?.id || null,
                note: item.note || "",
            })),
            _method: "PUT",
        };

        const res = await postData(`/admin/incomplete-orders/${id}`, payload, {headers: {"Content-Type": "multipart/form-data",}});

        if(res && res?.success){
            messageApi.open({
                type: "success",
                content: res?.msg,
            });

            setTimeout(() => {
                navigate("/incomplete/orders");
            }, 500);
        }
    };

    const handleUpdateNote = () => {
        const noteValue = form.getFieldValue("note");

        const updatedItems = inCompleteOrders.items.map((item) =>
            item.id === currentNoteRecord.id ? { ...item, note: noteValue } : item
        );

        setInCompleteOrders((prev) => ({...prev,items: updatedItems,}));

        setNoteModalVisible(false);
    };

    const handleOrder = () => {
        const orderData = {
            name        : form.getFieldValue("name"),
            phone_number: form.getFieldValue("phone_number"),
            address     : form.getFieldValue("address"),
            status      : form.getFieldValue("status"),
            items       : inCompleteOrders.items,
        };

        navigate("/order-add", { state: orderData });
    }

    return (
        <>
            {contextHolder}

            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title" style={{fontWeight:"600"}}>Edit</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb items={[{ title: <Link to="/dashboard">Dashboard</Link> },{ title: "Edit" }]}/>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <AntInput.Search allowClear placeholder="Search Key ..." style={{ width: 300 }}/>
                <Space>
                    <Button size="small" icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>Back</Button>
                </Space>
            </div>

            {!loading ? (
                <div style={{boxShadow:"0 0 10px rgba(0,0,0,0.1)", padding:"10px"}}>
                    <div>
                        <Form form={form} onFinish={handleUpdate}>
                            <div style={{display:"grid",  gridTemplateColumns: "repeat(5, 1fr)",  gap: "12px"}}>
                                <Form.Item label="Name" name="name">
                                    <AntInput placeholder="Enter Name" />
                                </Form.Item>

                                <Form.Item label="Phone Number" name="phone_number">
                                    <AntInput placeholder="Enter Phone Number" />
                                </Form.Item>

                                <Form.Item label="Address" name="address">
                                    <AntInput placeholder="Enter Address" />
                                </Form.Item>

                                <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                                    <Select placeholder="Select Status">
                                        <Select.Option value={3}>Approved</Select.Option>
                                        <Select.Option value={1}>Pending</Select.Option>
                                        <Select.Option value={8}>Canceled</Select.Option>
                                    </Select>
                                </Form.Item>
                            </div>

                            <div style={{display:"grid",  gridTemplateColumns: "repeat(2, 1fr)",  gap: "12px"}}>
                                <div style={{ position: "relative", width: "100%" }}>
                                    <Form.Item label="Search Product" name="product">
                                        <AntInput placeholder="Write Product Name" onChange={(e) => setQuery(e.target.value)} value={query}/>
                                    </Form.Item>
                                    {results.length > 0 && (
                                        <div className="edit_div" ref={dropdownRef}>
                                            {results.map((item) => (
                                                <div key={item.id} className="edit_div_id" onClick={() => handleAddProduct(item)} onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")} onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}>
                                                    <img className="edit_div_image_img" src={item.img_path} alt={item.name}/>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: "500", fontSize: "14px", marginBottom: "4px" }}>
                                                            {item.name.length > 50 ? item.name.slice(0, 50) + "..." : item.name}
                                                        </div>
                                                        <div style={{ color: "#1890ff", fontWeight: "600" }}>
                                                            {Number(item.sell_price).toFixed(0)} টাকা
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <Button style={{width:"100px"}} type="primary" onClick={() => window.history.back()}>
                                    <PlusOutlined />
                                    Add
                                </Button>
                            </div>

                            <div>
                                <Table  loading={loading} dataSource={inCompleteOrders?.items.map(item => ({ ...item, key: item.id }))} columns={columns}  pagination={false} bordered/>
                            </div>

                            <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:"20px"}}>
                                <div></div>
                                <div style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
                                    <Form.Item style={{marginRight:"10px"}}>
                                        <Button type="primary" onClick={handleOrder}>Get Order</Button>
                                    </Form.Item>
                                    <Form.Item>
                                        <Button type="primary" htmlType="submit">Update</Button>
                                    </Form.Item>
                                </div>
                            </div>
                        </Form>
                    </div>
              </div>
            ) : (
                <p>Loading...</p>
            )}

            <Modal title="Note your custom feedback" open={noteModalVisible} onCancel={() => setNoteModalVisible(false)} onOk={handleUpdateNote} okText="Update">
                <Form form={form} layout="vertical">
                    <Form.Item label="Note" name="note">
                        <AntInput.TextArea rows={4} />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    )
}
