import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Input, Modal, Popconfirm, Select, Space, Table, message } from "antd";
import { useEffect, useState } from "react";
import { deleteData, getDatas, postData } from "../../api/common/common";

const { Option } = Select;

export default function AllSettings() {
    // State
    const [allSettings, setAllSettings]               = useState([]);
    const [isModalOpen, setIsModalOpen]               = useState(false);
    const [isAddMode, setIsAddMode]                   = useState(false);
    const [editingRecord, setEditingRecord]           = useState(null);
    const [selectedImage, setSelectedImage]           = useState(null);
    const [editKey, setEditKey]                       = useState("");
    const [editType, setEditType]                     = useState("");
    const [settingValue, setSettingValue]             = useState("");
    const [settingCategory, setsettingCategory]       = useState("");
    const [settingInstruction, setSettingInstruction] = useState("");
    const [messageApi, contextHolder]                 = message.useMessage();
    const [settingCategories, setSettingCategories]   = useState([]);

    // Fetch data
    useEffect(() => {
        let isMounted = true;
        const fetchedSetting = async () => {
            const res = await getDatas("/admin/settings");
            const data = res?.result?.data || [];
            if (isMounted) setAllSettings(data);
        };
        fetchedSetting();
        return () => { isMounted = false; }
    }, []);

    // Edit button click
    const handleEdit = (record) => {
        setEditingRecord(record);

        setEditKey(record.key);
        setEditType(record.type);
        setSettingValue(record.value);
        setsettingCategory(record.category?.id || "");
        setSettingInstruction(record.instruction);

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

        setIsAddMode(true);
        setIsModalOpen(true);
    };

    // Save for both add & edit
    const handleSave = async () => {
        if (isAddMode) {
            const newRecord = {
                items: [
                    {
                        id                 : Math.max(...allSettings.map(r => r.id)) + 1,
                        setting_category_id: settingCategory,
                        key                : editKey,
                        type               : editType,
                        value              : settingValue,
                        instruction        : settingInstruction,
                    }
                ]
            };
            
            try {
              const res = await postData("/admin/settings", newRecord);

              if (res?.success) {
                setAllSettings((prev) => [...prev, res.result]);
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
                items: [
                    {
                        setting_category_id: settingCategory,
                        key                : editKey,
                        type               : editType,
                        value              : settingValue,
                        instruction        : settingInstruction,
                    }
                ]
            };

            try {
                const res = await postData("/admin/settings", updatedRecord);

                if (res && res?.success) {
                    setAllSettings((prev) =>
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
            const res = await deleteData(`/admin/settings/${id}`);
            
            if (res?.success) {
                setAllSettings(prev => prev.filter(item => item.id !== id));
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
            title: "Key", 
            dataIndex: "key", 
            key: "key" 
        },
        { 
            title: "Value", 
            dataIndex: "value", 
            key: "value" 
        },
        { 
            title: "Type", 
            dataIndex: "type", 
            key: "type" 
        },
        { 
            title: "Category Name", 
            dataIndex: "category", 
            key: "category",
            render: (category) => (
                category?.name
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

    useEffect(() => {
        let isMounted = true;

        const fetchedSettingCategories = async () => {
            const res = await getDatas("/admin/setting-category");

            const data = res?.result?.data || [];
            if (isMounted) setSettingCategories(data);
        }

        fetchedSettingCategories();

        return () => {
            isMounted = false;
        }
    }, []);

    return (
        <div style={{ position: "relative", bottom:"10px" }}>
            {contextHolder}
            <Button  type="primary"  icon={<PlusOutlined />}  style={{ position: "absolute", right: 0, top: -40, zIndex: 1 }} onClick={handleAdd} >
                Add More
            </Button>

            <Table dataSource={allSettings} columns={columns} rowKey="id" />

            <Modal title={isAddMode ? "Add New Setting" : "Edit Setting"} open={isModalOpen} onOk={handleSave} onCancel={() => setIsModalOpen(false)} okText={isAddMode ? "Submit" : "Update"}>

                <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
                    Settings Key
                </label>
                <Input style={{marginBottom:"10px"}} value={editKey}  onChange={(e) => setEditKey(e.target.value)}  placeholder="Setting Key"/>
                
                <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
                    Settings Type
                </label>
                <Select style={{ width: "100%", marginBottom:"10px" }} value={editType} onChange={(value) => setEditType(value)} placeholder="Select a Setting Type">
                    <Option value="" disabled>Select One</Option>
                    <Option value="switch-button">Switch Button</Option>
                    <Option value="input">Input Field</Option>
                    <Option value="image">Image</Option>
                    <Option value="description">Description</Option>
                </Select>

                {(editType === 'switch-button' || editType === 'input') && (
                    <>
                        <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
                            Settings Value
                        </label>
                        <Input style={{marginBottom:"10px"}} value={settingValue}  onChange={(e) => setSettingValue(e.target.value)}  placeholder="Setting Value"/>
                    </>
                )}

                {editType === 'description' && (
                    <>
                        <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
                            Settings Value
                        </label>
                        <Input.TextArea  placeholder="Enter setting value" rows={3} style={{ width: "100%", marginBottom: 16 }} value={settingValue}  onChange={(e) => setSettingValue(e.target.value)}/>
                    </>
                )}

                {editType === 'image' && (
                    <>
                        <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
                            Image
                        </label>
                        <input type="file" accept="image/*" onChange={(e) => setSelectedImage(e.target.files[0])} style={{marginBottom:"10px"}}/>

                        {selectedImage && (
                            <div style={{ marginTop: 10, marginBottom: 20 }}>
                                <img src={URL.createObjectURL(selectedImage)} alt="Preview" style={{ width: 100, height: 100, borderRadius: 6, objectFit: "cover" }}/>
                            </div>
                        )}
                    </>
                )}

                <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
                    Setting Category
                </label>
                <Select style={{ width: "100%", marginBottom:"10px" }} value={settingCategory} onChange={(value) => setsettingCategory(value)} placeholder="Select a Setting Category">
                    <Option value="" disabled>Select One</Option>
                    {settingCategories.map((item) => (
                        <Option key={item.id} value={item.id}>
                            {item.name}
                        </Option>
                    ))}
                </Select>

                <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
                    Setting Instruction
                </label>
                <Input.TextArea  placeholder="Enter setting instruction" rows={3} style={{ width: "100%", marginBottom: 16 }} value={settingInstruction} onChange={(e) => setSettingInstruction(e.target.value)}/>
            </Modal>
        </div>
    );
}
