import { Input as AntInput, Breadcrumb, Button, Form, message,Popconfirm } from "antd";
import { Link } from "react-router-dom";
import useTitle from "../../../hooks/useTitle";
import { getDatas, postData } from "../../../api/common/common";
import { useEffect, useState } from "react";

export default function GoogleAnalytic() {
    // Hook
    useTitle("Google Analytical Settings");

    //Variable
    const [form] = Form.useForm();

    // State
    const [messageApi, contextHolder] = message.useMessage();
    const [showForm, setShowForm]     = useState(false);
    const [loading, setLoading]       = useState(false);

    useEffect(() => {
        const getAllTolls = async () => {
            const res = await getDatas("/admin/marketing-tools");

            if(res?.success && Array.isArray(res.result)){
                const tool = res.result[0];
                form.setFieldsValue({
                    ga4_measurement_id: tool.ga4_measurement_id
                });
            }
        }

        getAllTolls();
    }, []);

    // Method
    const handleSubmit = async (values) => {
        const formData = new FormData();

        formData.append('ga4_measurement_id', values.ga4_measurement_id);

        formData.append('_method', 'PUT');

        try {
            setLoading(true);

            const res = await postData("/admin/marketing-tools/analytical", formData);

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
                    <h1 className="title">Google Analytic Setting</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Google Analytic Setting" },
                        ]}
                    />
                </div>
            </div>

            <div className="catelog-form">
                {!showForm ? (
                    <Popconfirm title="Important Warning" description="Updating google analytical is a critical action. Please be very careful before making any changes." okText="I Understand" cancelText="Cancel" onConfirm={() => setShowForm(true)}>
                        <Button type="primary" danger>
                            Update Google Analytical
                        </Button>
                    </Popconfirm>
                ) : (
                    <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{analytical_id:"t8gayyxxrk"}}>
                        <div>
                            <Form.Item name="ga4_measurement_id" label="Analytical ID" rules={[{ required: true }]}>
                                <AntInput placeholder="Enter Analytical id" />
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
