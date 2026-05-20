import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeftOutlined, DeleteOutlined, PlusOutlined, EditOutlined, AppstoreOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Card, Popconfirm, Space, Table, Tag, Typography, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { deleteData, getDatas } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";
import "./About.css";

const { Text, Title } = Typography;

export default function About() {
    // Hook
    useTitle("About Pages");

    const navigate = useNavigate();

    // State
    const [query, setQuery]               = useState("");
    const [loading, setLoading]           = useState(false);
    const [abouts, setItems]              = useState([]);
    const [messageApi, contextHolder]     = message.useMessage();

    // Table Columns Configuration
    const columns = 
    [
        {
            title: "SL",
            key: "sl",
            width: 70,
            align: 'center',
            render: (_, __, index) => <Text type="secondary" style={{ fontWeight: 600 }}>{index + 1}</Text>,
        },
        {
            title: "Showcase Image",
            dataIndex: "image",
            key: "image",
            width: 150,
            align: 'center',
            render: (src, record) => src ? (
                <div style={{ padding: 4, border: '1px solid #e2e8f0', borderRadius: 10, display: 'inline-block', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                    <img src={src} alt={record.title} style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover" }}/>
                </div>
            ) : (
                <Tag color="default" style={{ borderRadius: 6 }}>No Image</Tag>
            ),
        },
        {
            title: "About Title",
            dataIndex: "title",
            key: "title",
            render: (text) => <Text strong style={{ fontSize: 15, color: '#1e293b' }}>{text}</Text>,
        },
        {
            title: "Description Preview",
            dataIndex: "description",
            key: "description",
            render: (text) => {
                const plainText = text?.replace(/<[^>]+>/g, '') || "";
                return (
                    <Text ellipsis={{ tooltip: plainText }} style={{ maxWidth: 380, display: 'inline-block', color: '#64748b' }}>
                        {plainText}
                    </Text>
                );
            }
        },
        {
            title: "Actions",
            key: "operation",
            width: 120,
            align: 'center',
            render: (_, record) => (
                <Space size="middle">
                    <Button type="text" icon={<EditOutlined style={{ color: '#6366f1', fontSize: 16 }} />} onClick={() => onEdit(record)} title="Edit Page" style={{ background: '#f5f3ff', borderRadius: 8 }}/>
                    <Popconfirm title="Delete about entry?" description="Are you sure you want to delete this about entry?" okText="Yes" cancelText="No" onConfirm={() => onDelete(record.id)} okButtonProps={{ danger: true }}>
                        <Button type="text" danger icon={<DeleteOutlined style={{ fontSize: 16 }} />} title="Delete Page" style={{ background: '#fef2f2', borderRadius: 8 }}/>
                    </Popconfirm>
                </Space>
            )
        },
    ];

    const openCreate = () => {
        navigate("/add/about");
    }

    const onEdit = (record) => {
        navigate(`/edit/about/${record.id}`);
    }

    useEffect(() => {
        let isMounted = true;

        const fetchAbouts = async () => {
            try {
                setLoading(true);
                const res = await getDatas("/admin/abouts");
                const list = res?.result?.data || [];

                if (isMounted) {
                    setItems(list);
                }
            } catch (error) {
                console.error("Failed to load about list:", error);
                message.error("Failed to retrieve about list data");
            } finally {
                setLoading(false);
            }
        }

        fetchAbouts();

        return () => {
            isMounted = false;
        }
    }, []);

    const filteredData = useMemo(() => {
        if (!query) return abouts;

        const lowerQuery = query.toLowerCase();

        return abouts.filter(item => {
            const titleMatch = item.title?.toLowerCase().includes(lowerQuery);
            const plainDescription = item.description?.replace(/<[^>]+>/g, '').toLowerCase() || "";
            const descMatch = plainDescription.includes(lowerQuery);
            
            return titleMatch || descMatch;
        });
    }, [query, abouts]);

    const onDelete = async (id) => {
        try {
            setLoading(true);
            const res = await deleteData(`/admin/abouts/${id}`);

            if (res?.success) {
                messageApi.open({
                    type: "success",
                    content: res.msg || "About entry deleted successfully",
                });
                
                const refreshed = await getDatas("/admin/abouts");
                setItems(refreshed?.result?.data || []);
            } else {
                messageApi.open({
                    type: "error",
                    content: res?.message || "Failed to delete About entry",
                });
            }
        } catch (error) {
            console.error("Error deleting entry:", error);
            message.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="about-container">
            {contextHolder}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
                <div>
                    <Title level={2} style={{ margin: 0, fontWeight: 800 }}>About Pages</Title>
                    <Breadcrumb
                        style={{ marginTop: 8 }}
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "About Pages" },
                        ]}
                    />
                </div>
                
                <Space size="middle">
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} className="add-btn">
                        Add About Page
                    </Button>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()} className="premium-back-btn">
                        Back
                    </Button>
                </Space>
            </div>

            <Card className="premium-card" style={{ marginTop: 0 }}>
                <div>
                    <div>
                        <AntInput.Search 
                            allowClear 
                            placeholder="Search by title or description..." 
                            prefix={<AppstoreOutlined style={{ color: '#bfbfbf' }} />} 
                            value={query} 
                            onChange={(e) => setQuery(e.target.value)} 
                            style={{ maxWidth: 400 }}
                            className="premium-input"
                        />
                    </div>

                    <Table 
                        bordered 
                        loading={loading} 
                        columns={columns} 
                        dataSource={filteredData}
                        rowKey="id"
                        scroll={{ x: 'max-content' }}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showTotal: (total) => `Total ${total} entries`
                        }}
                    />
                </div>
            </Card>
        </div>
    )
}
