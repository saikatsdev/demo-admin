import { ArrowLeftOutlined, PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, FilterOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, message, Popconfirm, Space, Table, Tag, Card, Typography, Tooltip } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteData, getDatas } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";

const { Title, Text } = Typography;

export default function ProductType() {
    //Hook
    useTitle("All Product Type");

    // Variable
    const navigate = useNavigate();

    // State
    const [query, setQuery]               = useState("");
    const [loading, setLoading]           = useState(false);
    const [productTypes, setItems]        = useState([]);
    const [messageApi, contextHolder]     = message.useMessage();
    const [filteredData, setFilteredData] = useState(productTypes);

    //Table Columns
    const columns = 
    [
        {
            title: "SL",
            key: "sl",
            width: 80,
            align: 'center',
            render: (_, __, index) => (
                <Text type="secondary" style={{ fontWeight: 500 }}>
                    {index + 1}
                </Text>
            ),
        },
        {
            title: "Type Name",
            dataIndex: "name",
            key: "name",
            render: (text) => <Text strong style={{ color: '#1e293b' }}>{text}</Text>,
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 120,
            render: (status) => (
                <Tag 
                    color={status === "active" ? "success" : "error"} 
                    style={{ borderRadius: '20px', padding: '0 12px', textTransform: 'capitalize', fontWeight: 600 }}
                >
                    {status}
                </Tag>
            ),
        },
        {
            title: "Action",
            key: "operation",
            width: 140,
            align: 'center',
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="Edit Type">
                        <Button type="text" icon={<EditOutlined style={{ color: '#0ea5e9' }} />} onClick={() => onEdit(record)} style={{ background: '#f0f9ff', borderRadius: '8px' }}/>
                    </Tooltip>
                    <Tooltip title="Delete Type">
                        <Popconfirm title="Are you sure you want to delete this product type?" okText="Yes" cancelText="No" onConfirm={() => onDelete(record.id)}>
                            <Button type="text" danger icon={<DeleteOutlined />} style={{ background: '#fef2f2', borderRadius: '8px' }}/>
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    //Method
    const openCreate = () => {
        navigate("/add/product-type");
    }

    const onEdit = (record) => {
        navigate(`/edit/product-type/${record.id}`);
    }

    useEffect(() => {
        if (!query) {
            setFilteredData(productTypes);
            return;
        }

        const lowerQuery = query.toLowerCase();

        const filtered = productTypes?.filter(item => 
            item.name?.toLowerCase().includes(lowerQuery) || 
            item.status?.toLowerCase().includes(lowerQuery)
        );

        setFilteredData(filtered);
    }, [query, productTypes]);

    useEffect(() => {
        let isMounted = true;

        const fetchContactList = async () => {
            setLoading(true);

            const res = await getDatas("/admin/product-types");

            const list = res?.result?.data;

            if(isMounted){
                setItems(list);
            }

            setLoading(false);
        }

        fetchContactList();

        return () => {
            isMounted = false;
        }
    }, []);

    const onDelete = async (id) => {
        const res = await deleteData(`/admin/product-types/${id}`);

        if(res?.success){
            const refreshed = await getDatas("/admin/product-types");

            setItems(refreshed?.result?.data);

            messageApi.open({
                type: "success",
                content: res.msg,
            });
        }else{
            messageApi.open({
                type: "error",
                content: "Something Went Wrong",
            });
        }
    }

    return (
        <div style={{ background: '#f4f7fe', minHeight: '100vh' }}>
            {contextHolder}
            
            <div style={{
                background: '#fff',
                padding: '16px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24
            }}>
                <Space size="middle">
                    <Button 
                        icon={<ArrowLeftOutlined />} 
                        onClick={() => navigate(-1)} 
                        style={{ border: 'none', background: '#f1f5f9', borderRadius: '8px' }}
                    />
                    <div>
                        <Title level={4} style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>Product Types</Title>
                        <Breadcrumb
                            style={{ fontSize: '12px' }}
                            items={[
                                { title: <Link to="/dashboard" style={{ color: '#64748b' }}>Dashboard</Link> },
                                { title: <span style={{ color: '#1e293b', fontWeight: 500 }}>Product Types</span> },
                            ]}
                        />
                    </div>
                </Space>
                <Space>
                    <Button 
                        type="primary" 
                        icon={<PlusOutlined />} 
                        onClick={openCreate}
                        style={{ 
                            borderRadius: '8px',
                            background  : '#2563eb',
                            height      : '40px',
                            padding     : '0 20px',
                            fontWeight  : 600,
                            boxShadow   : '0 4px 10px rgba(37, 99, 235, 0.2)'
                        }}
                    >
                        Create Product Type
                    </Button>
                </Space>
            </div>

            <div>
                <Card 
                    variant="borderless"
                    style={{ borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                    title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                            <Space>
                                <FilterOutlined style={{ color: '#6366f1' }} />
                                <Text strong style={{ fontSize: '16px' }}>All Product Types</Text>
                            </Space>
                            <AntInput 
                                prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                                placeholder="Search types by name..." 
                                value={query} 
                                onChange={(e) => setQuery(e.target.value)} 
                                style={{ width: 280, borderRadius: '8px' }}
                                allowClear
                            />
                        </div>
                    }
                >
                    <Table 
                        rowKey="id" 
                        loading={loading}
                        columns={columns}
                        dataSource={filteredData}
                        scroll={{ x: "max-content" }}
                        style={{ borderRadius: '8px' }}
                        pagination={{
                            showSizeChanger: true,
                            showTotal: (total) => `Total ${total} types`,
                        }}
                    />
                </Card>
            </div>
        </div>
    )
}
