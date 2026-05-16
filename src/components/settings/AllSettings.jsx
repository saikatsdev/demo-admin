import { DeleteOutlined, EditOutlined, PlusOutlined, SettingOutlined, PictureOutlined } from "@ant-design/icons";
import { Button, Input, Modal, Popconfirm, Select, Space, Table, Tag, message, Card, Typography, Row, Col } from "antd";
import { useEffect, useState } from "react";
import { deleteData, getDatas, postData } from "../../api/common/common";

const { Option } = Select;
const { Title, Text } = Typography;

export default function AllSettings() {
    // State
    const [allSettings, setAllSettings]               = useState([]);
    const [isModalOpen, setIsModalOpen]               = useState(false);
    const [isAddMode, setIsAddMode]                   = useState(false);
    const [editingRecord, setEditingRecord]           = useState(null);
    const [selectedImage, setSelectedImage]           = useState(null);
    const [imagePreview, setImagePreview]             = useState(null);
    const [editKey, setEditKey]                       = useState("");
    const [editType, setEditType]                     = useState("");
    const [settingValue, setSettingValue]             = useState("");
    const [settingCategory, setsettingCategory]       = useState("");
    const [settingInstruction, setSettingInstruction] = useState("");
    const [messageApi, contextHolder]                 = message.useMessage();
    const [settingCategories, setSettingCategories]   = useState([]);
    const [loading, setLoading]                       = useState(false);

    // Fetch data
    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await getDatas("/admin/settings");
            const data = res?.result?.data || [];
            setAllSettings(data);
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
        
        const fetchCategories = async () => {
            const res = await getDatas("/admin/setting-category");
            setSettingCategories(res?.result?.data || []);
        };
        fetchCategories();
    }, []);

    // Edit button click
    const handleEdit = (record) => {
        setEditingRecord(record);
        setEditKey(record.key);
        setEditType(record.type);
        setSettingValue(record.value);
        setsettingCategory(record.category?.id || "");
        setSettingInstruction(record.instruction);
        setSelectedImage(null);
        setImagePreview(record.type === 'image' ? record.value : null);
        setIsAddMode(false);
        setIsModalOpen(true);
    };

    // Add button click
    const handleAdd = () => {
        setEditingRecord(null);
        setEditKey("");
        setEditType("");
        setSettingValue("");
        setsettingCategory("");
        setSettingInstruction("");
        setSelectedImage(null);
        setImagePreview(null);
        setIsAddMode(true);
        setIsModalOpen(true);
    };

    // Image Change
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    // Save for both add & edit
    const handleSave = async () => {
        if (!editKey || !editType || !settingCategory) {
            message.error("Please fill in all required fields.");
            return;
        }

        const formData = new FormData();
        formData.append("items[0][setting_category_id]", settingCategory);
        formData.append("items[0][key]", editKey);
        formData.append("items[0][type]", editType);
        formData.append("items[0][instruction]", settingInstruction || "");

        if (editType === 'image') {
            if (selectedImage) {
                formData.append("items[0][value]", selectedImage);
            } else if (!isAddMode) {
                formData.append("items[0][value]", settingValue || "");
            }
        } else {
            formData.append("items[0][value]", settingValue || "");
        }

        try {
            setLoading(true);
            
            const res = await postData("/admin/settings", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            if (res?.success) {
                messageApi.success(res.msg || "Setting saved successfully");
                setIsModalOpen(false);
                fetchSettings(); // Refresh data
            } else {
                message.error(res?.message || "Failed to save setting");
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
            const res = await deleteData(`/admin/settings/${id}`);
            if (res?.success) {
                setAllSettings(prev => prev.filter(item => item.id !== id));
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
            width: 70,
            render: (_, __, index) => <Text type="secondary">{index + 1}</Text>
        },
        { 
            title: "Setting Details", 
            key: "details",
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text strong style={{ color: '#1f2937' }}>{record.key}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{record.instruction}</Text>
                </div>
            )
        },
        { 
            title: "Value", 
            key: "value",
            render: (_, record) => {
                if (record.type === 'image') {
                    return record.value ? (
                        <div style={{ width: 40, height: 40, borderRadius: 6, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                            <img src={record.value} alt="setting" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    ) : <Text type="secondary">No Image</Text>;
                }
                if (record.type === 'switch-button') {
                    return <Tag color={record.value === "1" ? "green" : "red"}>{record.value === "1" ? "ON" : "OFF"}</Tag>;
                }
                return <div style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {record.value || '-'}
                </div>;
            }
        },
        { 
            title: "Type / Category", 
            key: "type_cat",
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Tag color="blue" style={{ borderRadius: 4 }}>{record.type}</Tag>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{record.category?.name}</Text>
                </Space>
            )
        },
        { 
            title: "Action",
            key: "action",
            align: 'right',
            width: 120,
            render: (_, record) => (
                <Space>
                    <Button 
                        type="primary" 
                        ghost 
                        size="small" 
                        icon={<EditOutlined />} 
                        onClick={() => handleEdit(record)} 
                        style={{ borderRadius: 6 }}
                    />
                    <Popconfirm 
                        title="Delete Setting" 
                        description="Are you sure you want to delete this setting?"
                        onConfirm={() => handleDelete(record.id)} 
                        okText="Yes" 
                        cancelText="No"
                        okButtonProps={{ danger: true }}
                    >
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
                        <SettingOutlined style={{ color: '#2563eb' }} />
                        Master Settings
                    </Title>
                    <Text type="secondary" style={{ fontSize: '15px' }}>
                        Configure and manage all global system settings across different categories.
                    </Text>
                </div>
                
                <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleAdd}
                    style={{ borderRadius: '8px', backgroundColor: '#2563eb', boxShadow: '0 4px 14px 0 rgba(37,99,235,0.39)', fontWeight: 600 }}>
                    Create Setting
                </Button>
            </div>

            <Card 
                bodyStyle={{ padding: 0 }}
                style={{ 
                    borderRadius: '16px', 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                    border: '1px solid #f0f0f0',
                    overflow: 'hidden'
                }}
            >
                <Table 
                    dataSource={allSettings} 
                    columns={columns} 
                    rowKey="id" 
                    loading={loading}
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                />
            </Card>

            <Modal 
                title={
                    <div style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937' }}>
                        {isAddMode ? "Create Global Setting" : "Update Global Setting"}
                    </div>
                }
                open={isModalOpen} 
                onOk={handleSave} 
                onCancel={() => setIsModalOpen(false)} 
                confirmLoading={loading}
                okText={isAddMode ? "Submit" : "Update"}
                okButtonProps={{ style: { borderRadius: 8, backgroundColor: '#2563eb' } }}
                cancelButtonProps={{ style: { borderRadius: 8 } }}
                width={600}
                centered
            >
                <div style={{ padding: '10px 0' }}>
                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <Text strong style={{ display: "block", marginBottom: 8, color: '#4b5563' }}>Setting Key</Text>
                            <Input size="large" value={editKey} onChange={(e) => setEditKey(e.target.value)} placeholder="e.g. SITE_TITLE" style={{ borderRadius: 8 }}/>
                        </Col>
                        <Col span={12}>
                            <Text strong style={{ display: "block", marginBottom: 8, color: '#4b5563' }}>Type</Text>
                            <Select size="large" style={{ width: "100%" }} value={editType} onChange={(value) => setEditType(value)} placeholder="Select Type"
                                dropdownStyle={{ borderRadius: 8 }}
                            >
                                <Option value="switch-button">Switch (Toggle)</Option>
                                <Option value="input">Text Input</Option>
                                <Option value="image">Image Upload</Option>
                                <Option value="description">Long Description</Option>
                            </Select>
                        </Col>

                        <Col span={24}>
                            <Text strong style={{ display: "block", marginBottom: 8, color: '#4b5563' }}>Category</Text>
                            <Select size="large" style={{ width: "100%" }} value={settingCategory} onChange={(value) => setsettingCategory(value)} placeholder="Assign to Category"
                                dropdownStyle={{ borderRadius: 8 }}
                            >
                                {settingCategories.map((item) => (
                                    <Option key={item.id} value={item.id}>{item.name}</Option>
                                ))}
                            </Select>
                        </Col>

                        {(editType === 'switch-button' || editType === 'input') && (
                            <Col span={24}>
                                <Text strong style={{ display: "block", marginBottom: 8, color: '#4b5563' }}>Value</Text>
                                <Input size="large" value={settingValue} onChange={(e) => setSettingValue(e.target.value)} placeholder={editType === 'switch-button' ? "1 or 0" : "Enter value"} style={{ borderRadius: 8 }}/>
                            </Col>
                        )}

                        {editType === 'description' && (
                            <Col span={24}>
                                <Text strong style={{ display: "block", marginBottom: 8, color: '#4b5563' }}>Detailed Description</Text>
                                <Input.TextArea rows={4} value={settingValue} onChange={(e) => setSettingValue(e.target.value)} placeholder="Enter detailed setting information..." style={{ borderRadius: 8 }}/>
                            </Col>
                        )}

                        {editType === 'image' && (
                            <Col span={24}>
                                <Text strong style={{ display: "block", marginBottom: 8, color: '#4b5563' }}>Image Selection</Text>
                                <div style={{ 
                                    border: '2px dashed #e5e7eb', 
                                    borderRadius: 12, 
                                    padding: '20px', 
                                    textAlign: 'center',
                                    backgroundColor: '#f9fafb',
                                    position: 'relative'
                                }}>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleImageChange} 
                                        style={{ 
                                            position: 'absolute', 
                                            top: 0, left: 0, 
                                            width: '100%', height: '100%', 
                                            opacity: 0, cursor: 'pointer' 
                                        }} 
                                    />
                                    {imagePreview ? (
                                        <div style={{ position: 'relative', display: 'inline-block' }}>
                                            <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 8 }} />
                                            <div style={{ fontSize: '12px', marginTop: 8, color: '#2563eb' }}>Click to change image</div>
                                        </div>
                                    ) : (
                                        <div>
                                            <PictureOutlined style={{ fontSize: 32, color: '#9ca3af', marginBottom: 8 }} />
                                            <div style={{ color: '#6b7280' }}>Click or drag image to upload</div>
                                        </div>
                                    )}
                                </div>
                            </Col>
                        )}

                        <Col span={24}>
                            <Text strong style={{ display: "block", marginBottom: 8, color: '#4b5563' }}>Internal Instructions (Optional)</Text>
                            <Input.TextArea 
                                rows={2} 
                                value={settingInstruction} 
                                onChange={(e) => setSettingInstruction(e.target.value)} 
                                placeholder="Explain what this setting does..."
                                style={{ borderRadius: 8 }}
                            />
                        </Col>
                    </Row>
                </div>
            </Modal>
        </div>
    );
}

