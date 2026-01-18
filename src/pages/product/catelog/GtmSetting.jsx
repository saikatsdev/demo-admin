import { Input as AntInput, Breadcrumb, Button, Form, message } from "antd";
import { Link } from "react-router-dom";
import { getDatas, postData } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";
import { useEffect } from "react";

export default function GtmSetting() {
    // Hook
    useTitle("GTM Setting");

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
                    gtm_id: tool.gtm_id
                });
            }
        }

        getAllTolls();
    }, []);

    // Method
    const handleSubmit = async (values) => {
        const formData = new FormData();

        formData.append('gtm_id', values.gtm_id);

        formData.append('_method', 'PUT');

        const res = await postData("/admin/marketing-tools/gtm", formData);

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
                    <h1 className="title">GTM Setting</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "GTM Setting" },
                        ]}
                    />
                </div>
            </div>

            <div className="catelog-form">
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <div>
                        <Form.Item name="gtm_id" label="GTM ID">
                            <AntInput placeholder="Enter gtm id" />
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
