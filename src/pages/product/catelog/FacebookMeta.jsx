import { Input as AntInput, Breadcrumb, Button, Form, message,Popconfirm } from "antd";
import { Link } from "react-router-dom";
import useTitle from "../../../hooks/useTitle";
import { getDatas, postData } from "../../../api/common/common";
import { useEffect, useState } from "react";

export default function FacebookMeta() {
    // Hook
    useTitle("Facebook Meta Settings");

    // Variables
    const [pixelForm]      = Form.useForm();
    const [conversionForm] = Form.useForm();
    const [eventForm]      = Form.useForm();

    // State
    const [messageApi, contextHolder]     = message.useMessage();
    const [showForm, setShowForm]         = useState(false);
    const [loading, setLoading]           = useState(false);
    const [apiLoading, setApiLoading]     = useState(false);
    const [eventLoading, setEventLoading] = useState(false);

    useEffect(() => {
        const getAllTolls = async () => {
            const res = await getDatas("/admin/marketing-tools");

            if(res?.success && Array.isArray(res.result)){
                const tool = res.result[0];

                pixelForm.setFieldsValue({
                    pixel_id: tool.pixel_id
                });

                conversionForm.setFieldsValue({
                    pixel_api_token: tool.pixel_api_token
                });

                eventForm.setFieldsValue({
                    test_event_code: tool.test_event_code
                });
            }
        }

        getAllTolls();
    }, []);

    const handlePixelSubmit = async (values) => {
        const formData = new FormData();
        formData.append("pixel_id", values.pixel_id);
        formData.append("_method", "PUT");

        try {
            setLoading(true);

            const res = await postData("/admin/marketing-tools/pixel", formData);

            if (res && res?.success) {
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });
            }
        } catch (error) {
            console.log(error);
        }finally{
            setLoading(false);
        }
    };

    const handleConversionSubmit = async (values) => {
        const formData = new FormData();
        formData.append("pixel_api_token", values.pixel_api_token);
        formData.append("_method", "PUT");

        try {
            setApiLoading(true);

            const res = await postData("/admin/marketing-tools/conversion", formData);

            if (res && res?.success) {
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });
            }
        } catch (error) {
            console.log(error);
        }finally{
            setApiLoading(false);
        }
    };

    const handleEventSubmit = async (values) => {
        const formData = new FormData();
        formData.append("test_event_code", values.test_event_code);
        formData.append("_method", "PUT");

        try {
            setEventLoading(true);

            const res = await postData("/admin/marketing-tools/event", formData);

            if (res && res?.success) {
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });
            }
        } catch (error) {
            console.log(error);
        }finally{
            setEventLoading(false);
        }
    };

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Facebook Meta Pixel</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb items={[{ title: <Link to="/dashboard">Dashboard</Link> },{ title: "Clarity Setting" },]}/>
                </div>
            </div>

            {!showForm ? (
                <Popconfirm title="Important Warning" description="Updating facebook meta pixel is a critical action. Please be very careful before making any changes." okText="I Understand" cancelText="Cancel" onConfirm={() => setShowForm(true)}>
                    <Button type="primary" danger>
                        Update Facebook Meta Pixel
                    </Button>
                </Popconfirm>
            ) : (
                <>
                    <div className="catelog-form">
                        <Form form={pixelForm} layout="vertical" onFinish={handlePixelSubmit}>
                            <Form.Item name="pixel_id" label="Meta Pixel ID" rules={[{ required: true, message: "Please enter Pixel ID!" }]}>
                                <AntInput placeholder="Enter Pixel ID" />
                            </Form.Item>

                            <Form.Item style={{ textAlign: "right" }}>
                                <Button type="primary" htmlType="submit" loading={loading}>
                                    Update
                                </Button>
                            </Form.Item>
                        </Form>
                    </div>

                    <div className="catelog-form" style={{ marginTop: 30 }}>
                        <Form form={conversionForm} layout="vertical" onFinish={handleConversionSubmit}>
                            <Form.Item name="pixel_api_token" label="Conversion API Token" rules={[{ required: true, message: "Please enter Conversion API Token!" }]}>
                                <AntInput placeholder="Enter Conversion API Token" />
                            </Form.Item>

                            <Form.Item style={{ textAlign: "right" }}>
                                <Button type="primary" htmlType="submit" loading={apiLoading}>
                                    Update
                                </Button>
                            </Form.Item>
                        </Form>
                    </div>

                    <div className="catelog-form" style={{ marginTop: 30 }}>
                        <Form form={eventForm} layout="vertical" onFinish={handleEventSubmit}>
                            <Form.Item name="test_event_code" label="Test Event Code" rules={[{ required: true, message: "Please enter Code!" }]}>
                                <AntInput placeholder="Enter Code" />
                            </Form.Item>

                            <Form.Item style={{ textAlign: "right" }}>
                                <Button type="primary" htmlType="submit" loading={eventLoading}>
                                    Update
                                </Button>
                            </Form.Item>
                        </Form>
                    </div>
                </>
            )}
        </>
    )
}
