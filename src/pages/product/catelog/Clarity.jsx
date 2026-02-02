import { Input as AntInput, Breadcrumb, Button, Form, message,Popconfirm } from "antd";
import { Link } from "react-router-dom";
import useTitle from "../../../hooks/useTitle";
import { getDatas, postData } from "../../../api/common/common";
import { useEffect, useState } from "react";

export default function Clarity() {
    // Hook
    useTitle("Clarity Settings");

    //Variable
    const [form] = Form.useForm();

    // State
    const [messageApi, contextHolder] = message.useMessage();
    const [showForm, setShowForm]     = useState(false);
    const [loading, setLoading]         = useState(false);

    useEffect(() => {
        const getAllTolls = async () => {
            const res = await getDatas("/admin/marketing-tools");

            if(res?.success && Array.isArray(res.result)){
                const tool = res.result[0];
                form.setFieldsValue({
                    clarity_id: tool.clarity_id
                });
            }
        }

        getAllTolls();
    }, []);

    // Method
    const handleSubmit = async (values) => {
        const formData = new FormData();

        formData.append('clarity_id', values.clarity_id);

        formData.append('_method', 'PUT');

        try {
            setLoading(true);

            const res = await postData("/admin/marketing-tools/clarity", formData);

            if(res?.success){
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
    }

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Clarity Setting</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Clarity Setting" },
                        ]}
                    />
                </div>
            </div>

            <div className="catelog-form">
                {!showForm ? (
                    <Popconfirm title="Important Warning" description="Updating Clarity is a critical action. Please be very careful before making any changes." okText="I Understand" cancelText="Cancel" onConfirm={() => setShowForm(true)}>
                        <Button type="primary" danger>
                            Update Clarity
                        </Button>
                    </Popconfirm>
                ) : (
                    <Form form={form} layout="vertical" onFinish={handleSubmit}>
                        <div>
                            <Form.Item name="clarity_id" label="Clarity ID" rules={[{ required: true }]}>
                                <AntInput placeholder="Enter Clarity id" />
                            </Form.Item>

                            <Form.Item style={{textAlign:"right"}}>
                                <Button type="primary" htmlType="submit" loading={loading}>
                                    Update
                                </Button>
                            </Form.Item>
                        </div>
                    </Form>
                )}
            </div>
        </>
    )
}
