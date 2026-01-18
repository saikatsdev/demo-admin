import { PlusOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Form, Select, Upload, message } from "antd";
import { useState } from "react";
import { Link } from "react-router-dom";
import { postData } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";

const { TextArea } = AntInput;

export default function Banner() {
    // Hook
    useTitle("Add Banner");

    // Variable
    const [form] = Form.useForm();

    // State
    const [messageApi, contextHolder] = message.useMessage();
    const [fileList, setFileList] = useState([]);

    const normFile = (e) => {
      if (Array.isArray(e)) return e;
      return e?.fileList;
    };

    // Method
    const handleSubmit = async (values) => {
        const formData = new FormData();

        formData.append('title', values.title);
        formData.append('type', values.type);
        formData.append('status', values.status);
        formData.append('description', values.description);
        formData.append('device_type', values.device_type);
        formData.append('link', values.link);

        if (fileList.length > 0) {
          formData.append("image", fileList[0].originFileObj);
        }

        const res = await postData("/admin/banners", formData);

        if(res?.success){
            form.resetFields();
            messageApi.open({
                type: "success",
                content: res.msg,
            });
        }
    }

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Add Banner</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Add Banner" },
                        ]}
                    />
                </div>
            </div>

            <div className="banner-wrapper">
                <div className="banner-form">
                    <Form form={form} layout="vertical" onFinish={handleSubmit}>
                        <div>
                            <div style={{display:"flex", gap:"16px"}}>
                                <div style={{width:"45%"}}>
                                    <Form.Item name="title" label="Title" rules={[{ required: true }]}>
                                        <AntInput placeholder="Enter title" />
                                    </Form.Item>
                                </div>

                                <div style={{width:"45%"}}>
                                    <Form.Item name="type" label="Type" rules={[{ required: true }]} initialValue="desktop">
                                        <Select options={[{ value: 'desktop', label: 'Desktop' }, { value: 'mobile', label: 'Mobile' }]} />
                                    </Form.Item>
                                </div>

                                <div style={{width:"45%"}}>
                                    <Form.Item name="status" label="Status" rules={[{ required: true }]} initialValue="active">
                                        <Select options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
                                    </Form.Item>
                                </div>
                            </div>

                            <div style={{ padding: "10px", display:"flex" }}>
                                <div style={{width:"30%"}}>
                                    <Form.Item label="Upload" valuePropName="fileList" name="banner_img" getValueFromEvent={normFile}>
                                        <Upload listType="picture-card" beforeUpload={() => false} fileList={fileList} onChange={({ fileList: newList }) => setFileList(newList)}>
                                            <button style={{color: "inherit", cursor: "inherit", border: 0, background: "none"}} type="button">
                                                <PlusOutlined />
                                                <div style={{ marginTop: 8 }}>Upload</div>
                                            </button>
                                        </Upload>
                                    </Form.Item>
                                </div>

                                <div style={{width:"60%"}}>
                                    <Form.Item label="Description" name="description">
                                        <TextArea rows={4} />
                                    </Form.Item>
                                </div>
                            </div>

                            <div style={{display:"flex", gap:"10px"}}>
                                <div style={{width:"40%"}}>
                                    <Form.Item name="device_type" label="Device Type" rules={[{ required: true }]} initialValue="desktop">
                                        <Select options={[{ value: 'desktop', label: 'Desktop' }, { value: 'mobile', label: 'Mobile' }]} />
                                    </Form.Item>
                                </div>

                                <div style={{width:"50%"}}>
                                    <Form.Item name="link" label="Link" rules={[{ required: true }]}>
                                        <AntInput placeholder="Enter link" />
                                    </Form.Item>
                                </div>
                            </div>

                            <Form.Item style={{textAlign:"right"}}>
                                <Button type="primary" htmlType="submit">
                                    Add Banner
                                </Button>
                            </Form.Item>
                        </div>
                    </Form>
                </div>
            </div>
        </>
    )
}
