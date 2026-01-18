import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Input, Modal, Popconfirm, Select, Space, Table, Tag, message } from "antd";
import { useEffect, useState } from "react";
import { deleteData, getDatas, postData, putData } from "../../api/common/common";

const { Option } = Select;

export default function SettingCategory() {
    // State
    const [settingCategory, setSettingCategory] = useState([]);
    const [isModalOpen, setIsModalOpen]         = useState(false);
    const [isAddMode, setIsAddMode]             = useState(false);
    const [editingRecord, setEditingRecord]     = useState(null);
    const [editName, setEditName]               = useState("");
    const [editStatus, setEditStatus]           = useState("active");
    const [messageApi, contextHolder]           = message.useMessage();

    // Fetch data
    useEffect(() => {
        let isMounted = true;
        const fetchedSetting = async () => {
            const res = await getDatas("/admin/setting-category");
            const data = res?.result?.data || [];
            if (isMounted) setSettingCategory(data);
        };
        fetchedSetting();
        return () => { isMounted = false; }
    }, []);

    // Edit button click
    const handleEdit = (record) => {
        setEditingRecord(record);
        setEditName(record.name);
        setIsAddMode(false);
        setIsModalOpen(true);
    };

    // Add button click
    const handleAdd = () => {
        setEditingRecord(null);
        setEditName("");
        setIsAddMode(true);
        setIsModalOpen(true);
    };

    // Save for both add & edit
    const handleSave = async () => {
        if (isAddMode) {
            const newRecord = {
                id: Math.max(...settingCategory.map(r => r.id)) + 1,
                name: editName,
                status: editStatus || "active",
            };
            
            try {
                const res = await postData("/admin/setting-category", newRecord);

                if (res?.success) {
                    setSettingCategory((prev) => [...prev, res.result]);
                    setIsModalOpen(false);
                    messageApi.open({
                    type: "success",
                    content: res.msg,
                    });
                } else {
                    console.error("Failed to create:", res?.message || res);
                }
            } catch (err) {
                console.error("API error:", err);
            }
        } else {
            const updatedRecord = {
                name: editName,
                status: editStatus,
            };

            try {
                const res = await putData(`/admin/setting-category/${editingRecord.id}`, updatedRecord);

                if (res?.success) {
                    setSettingCategory((prev) =>
                        prev.map(item =>
                            item.id === editingRecord.id ? res.result : item
                        )
                    );
                    setIsModalOpen(false);
                    messageApi.open({
                        type: "success",
                        content: res.msg,
                    });
                } else {
                    console.error("Failed to update:", res?.message || res);
                }
            } catch (err) {
                console.error("API error:", err);
            }
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await deleteData(`/admin/setting-category/${id}`);
            
            if (res?.success) {
                setSettingCategory(prev => prev.filter(item => item.id !== id));
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });
            } else {
                console.error("Failed to delete:", res?.message || res);
            }
        } catch (error) {
            console.error("API error:", error);
        }
    };


    const columns = [
        { 
            title: "SL", 
            key: "sl", 
            render: (_, __, index) => index + 1 
        },
        { 
            title: "Name", 
            dataIndex: "name", 
            key: "name" 
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag color={status === 'active' ? "green" : "red"} style={{textTransform:"capitalize"}}>{status}</Tag>
            )
        },
        { 
            title: "Action",
            key: "action",
            render: (_, record) => (
                <Space>
                <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                <Popconfirm title="Are you sure to delete?" onConfirm={() => handleDelete(record.id)} okText="Yes" cancelText="No">
                    <Button danger size="small" icon={<DeleteOutlined />} />
                </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div style={{ position: "relative", bottom:"10px" }}>
            {contextHolder}
            <Button  type="primary"  icon={<PlusOutlined />}  style={{ position: "absolute", right: 0, top: -40, zIndex: 1 }} onClick={handleAdd} >
                Add More
            </Button>

            <Table dataSource={settingCategory} columns={columns} rowKey="id" />

            <Modal title={isAddMode ? "Add New Setting" : "Edit Setting"} open={isModalOpen} onOk={handleSave} onCancel={() => setIsModalOpen(false)}>
                <Input style={{marginBottom:"10px"}} value={editName}  onChange={(e) => setEditName(e.target.value)}  placeholder="Setting Name"/>
                
                <Select value={editStatus} onChange={(value) => setEditStatus(value)} style={{ width: "100%" }}>
                    <Option value="active">Active</Option>
                    <Option value="inactive">Inactive</Option>
                </Select>
            </Modal>
        </div>
    );
}
