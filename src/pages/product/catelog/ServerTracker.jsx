import { Input as AntInput, Breadcrumb, Button, Form, message } from "antd";
import { Link } from "react-router-dom";
import { getDatas, postData } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";
import { useEffect } from "react";

export default function ServerTracker() {
    // Hook
    useTitle("Server Tracker");

    //Variable
    const [form] = Form.useForm();

    // State
    const [messageApi, contextHolder] = message.useMessage();

    useEffect(() => {
        const getAllTolls = async () => {
            const res = await getDatas("/admin/marketing-tools");

            if(res?.success && Array.isArray(res.result)){
                const tool = res.result[0];
                form.setFieldsValue({
                    get_tracked_license_key: tool.get_tracked_license_key
                });
            }
        }

        getAllTolls();
    }, []);

    // Method
    const handleSubmit = async (values) => {
        const formData = new FormData();

        formData.append('get_tracked_license_key', values.get_tracked_license_key);

        formData.append('_method', 'PUT');

        const res = await postData("/admin/marketing-tools/server-track", formData);

        if(res?.success){
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
                    <h1 className="title">Server Tracker License Key</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Server Tracker License Key" },
                        ]}
                    />
                </div>
            </div>

            <div className="catelog-form">
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <div>
                        <Form.Item name="get_tracked_license_key" label="License Key">
                            <AntInput placeholder="Enter License Key" />
                        </Form.Item>

                        <Form.Item style={{textAlign:"right"}}>
                            <Button type="primary" htmlType="submit">
                                Update
                            </Button>
                        </Form.Item>
                    </div>
                </Form>
            </div>
        </>
    )
}
