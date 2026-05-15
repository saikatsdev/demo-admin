import { DeleteOutlined, EditOutlined, PlusOutlined, AppstoreOutlined } from "@ant-design/icons";
import { Button, Input, Modal, Popconfirm, Select, Space, Table, Tag, message, Card, Typography } from "antd";
import { useEffect, useState } from "react";
import { deleteData, getDatas, postData, putData } from "../../api/common/common";

const { Option } = Select;
const { Title, Text } = Typography;

export default function SettingCategory() {
    // State
    const [settingCategory, setSettingCategory] = useState([]);
    const [isModalOpen, setIsModalOpen]         = useState(false);
    const [isAddMode, setIsAddMode]             = useState(false);
    const [editingRecord, setEditingRecord]     = useState(null);
    const [editName, setEditName]               = useState("");
    const [editStatus, setEditStatus]           = useState("active");
    const [messageApi, contextHolder]           = message.useMessage();
    const [loading, setLoading]                 = useState(false);

    // Fetch data
    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await getDatas("/admin/setting-category");
            const data = res?.result?.data || [];
            setSettingCategory(data);
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // Edit button click
    const handleEdit = (record) => {
        setEditingRecord(record);
        setEditName(record.name);
        setEditStatus(record.status || "active");
        setIsAddMode(false);
        setIsModalOpen(true);
    };

    // Add button click
    const handleAdd = () => {
        setEditingRecord(null);
        setEditName("");
        setEditStatus("active");
        setIsAddMode(true);
        setIsModalOpen(true);
    };

    // Save for both add & edit
    const handleSave = async () => {
        if (!editName.trim()) {
            messageApi.warning("Category name is required");
            return;
        }

        const payload = {
            name: editName,
            status: editStatus || "active",
        };

        try {
            setLoading(true);
            let res;
            if (isAddMode) {
                res = await postData("/admin/setting-category", payload);
            } else {
                res = await putData(`/admin/setting-category/${editingRecord.id}`, payload);
            }

            if (res?.success) {
                messageApi.success(res.msg || "Operation successful");
                setIsModalOpen(false);
                fetchCategories();
            } else {
                message.error(res?.message || "Operation failed");
            }
        } catch (err) {
            console.error("Save error:", err);
            message.error("An error occurred while saving.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await deleteData(`/admin/setting-category/${id}`);
            if (res?.success) {
                setSettingCategory(prev => prev.filter(item => item.id !== id));
                messageApi.success(res.msg || "Deleted successfully");
            } else {
                message.error(res?.message || "Failed to delete");
            }
        } catch (error) {
            console.error("Delete error:", error);
        }
    };

    const columns = [
        { 
            title: "SL", 
            key: "sl", 
            width: 80,
            render: (_, __, index) => <Text type="secondary">{index + 1}</Text>
        },
        { 
            title: "Category Name", 
            dataIndex: "name", 
            key: "name",
            render: (text) => <Text strong style={{ color: '#1f2937' }}>{text}</Text>
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 150,
            render: (status) => (
                <Tag 
                    color={status === 'active' ? "success" : "error"} 
                    style={{ textTransform: "capitalize", borderRadius: 4, padding: '2px 10px' }}
                >
                    {status || 'active'}
                </Tag>
            )
        },
        { 
            title: "Action",
            key: "action",
            align: 'right',
            width: 120,
            render: (_, record) => (
                <Space>
                    <Button type="primary" ghost size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ borderRadius: 6 }}/>
                    <Popconfirm title="Delete Category" description="Are you sure you want to delete this category?" onConfirm={() => handleDelete(record.id)} okText="Yes" cancelText="No" okButtonProps={{ danger: true }}>
                        <Button danger ghost size="small" icon={<DeleteOutlined />} style={{ borderRadius: 6 }} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: '24px 0'}}>
            {contextHolder}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <Title level={3} style={{ margin: 0, color: '#1f2937', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <AppstoreOutlined style={{ color: '#2563eb' }} />
                        Setting Categories
                    </Title>
                    <Text type="secondary" style={{ fontSize: '15px' }}>
                        Organize your global settings into logical groups for better management.
                    </Text>
                </div>
                
                <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleAdd} style={{ borderRadius: '8px', backgroundColor: '#2563eb', boxShadow: '0 4px 14px 0 rgba(37,99,235,0.39)', fontWeight: 600 }}>
                    Add Category
                </Button>
            </div>

            <Card bodyStyle={{ padding: 0 }} style={{ 
                    borderRadius: '16px', 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                    border: '1px solid #f0f0f0',
                    overflow: 'hidden'
                }}
            >
                <Table 
                    dataSource={settingCategory} 
                    columns={columns} 
                    rowKey="id" 
                    loading={loading}
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                />
            </Card>

            <Modal 
                title={
                    <div style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937' }}>
                        {isAddMode ? "Create Category" : "Update Category"}
                    </div>
                }
                open={isModalOpen} 
                onOk={handleSave} 
                onCancel={() => setIsModalOpen(false)} 
                confirmLoading={loading}
                okText={isAddMode ? "Submit" : "Update"}
                okButtonProps={{ style: { borderRadius: 8, backgroundColor: '#2563eb' } }}
                cancelButtonProps={{ style: { borderRadius: 8 } }}
                centered
            >
                <div style={{ padding: '10px 0' }}>
                    <div style={{ marginBottom: 20 }}>
                        <Text strong style={{ display: "block", marginBottom: 8, color: '#4b5563' }}>Category Name</Text>
                        <Input 
                            size="large"
                            value={editName}  
                            onChange={(e) => setEditName(e.target.value)}  
                            placeholder="e.g. General Settings"
                            style={{ borderRadius: 8 }}
                        />
                    </div>
                    
                    <div>
                        <Text strong style={{ display: "block", marginBottom: 8, color: '#4b5563' }}>Status</Text>
                        <Select 
                            size="large"
                            value={editStatus} 
                            onChange={(value) => setEditStatus(value)} 
                            style={{ width: "100%" }}
                            dropdownStyle={{ borderRadius: 8 }}
                        >
                            <Option value="active">Active</Option>
                            <Option value="inactive">Inactive</Option>
                        </Select>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

