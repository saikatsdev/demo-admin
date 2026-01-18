import { Input as AntInput, Breadcrumb, Button, Form, message } from "antd";
import { Link } from "react-router-dom";
import useTitle from "../../../hooks/useTitle";
import { getDatas, postData } from "../../../api/common/common";
import { useEffect } from "react";

export default function GoogleAnalytic() {
    // Hook
    useTitle("Google Analytical Settings");

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

        const res = await postData("/admin/marketing-tools/analytical", formData);

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
                <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{analytical_id:"t8gayyxxrk"}}>
                    <div>
                        <Form.Item name="ga4_measurement_id" label="Analytical ID" rules={[{ required: true }]}>
                            <AntInput placeholder="Enter Analytical id" />
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
