import {Input as AntInput,Breadcrumb,Button,Form,Select,Space,message} from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getDatas, postData } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";

export default function EditProductCatelog() {
    // Hook
    useTitle("Edit Product Catelog");

    const { id }   = useParams();
    const [form]   = Form.useForm();
    const navigate = useNavigate();

    // State
    const [categories, setCategories] = useState([]);
    const [messageApi, contextHolder] = message.useMessage();
    const [loading, setLoading]       = useState(false);
    const [errors, setErrors]         = useState({});

    useEffect(() => {
        const fetchSingleData = async () => {
            const res = await getDatas(`/admin/product/catalogs/${id}`);

            if (res?.success) {
                const list = res?.result;

                const categoryIds = list.categories.map((item) => Number(item.category_id));

                form.setFieldsValue({
                    name      : list.name,
                    status    : list.status,
                    categories: categoryIds,
                });
            }
        };

        fetchSingleData();
    }, [id, form]);

    useEffect(() => {
        let isMounted = true;

        const fetchCategories = async () => {
            const res = await getDatas("/admin/categories");

            const list = res?.result?.data || [];

            if (isMounted) {
                setCategories(list.map((cat) => ({label: cat.name,value: cat.id})));
            }
        };

        fetchCategories();
    }, []);

    const handleSubmit = async (values) => {
        const formData = new FormData();

        formData.append("name", values.name);
        formData.append("status", values.status);

        values.categories.forEach((id, index) => {
            formData.append(`category_ids[${index}]`, id);
        });

        formData.append("_method", "PUT");

        try {
            setLoading(true);

            const res = await postData(`/admin/product/catalogs/update-fb-xml-feed/${id}`,formData);

            if (res && res?.success) {
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });

                form.resetFields();

                setTimeout(() => {
                    navigate("/product/catalogs");
                }, 500);
            }else{
                setErrors(res?.errors);
            }
        } catch (error) {
            console.log(error);
        }finally{
            setLoading(false);
        }
    };

    return (
        <>
            {contextHolder}

            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Edit Product Catelogs</h1>
                </div>

                <div className="head-actions">
                    <Breadcrumb items={[{ title: <Link to="/dashboard">Dashboard</Link> },{ title: "Edit Product Catelogs" }]}/>
                </div>
            </div>

            <div className="catelog-form">
                <Form form={form} layout="s" onFinish={handleSubmit}>
                    <div>
                        <div style={{ display: "flex", gap: "16px" }}>
                            <div style={{ width: "45%" }}>
                                <Form.Item name="name" label="Name" rules={[{ required: true }]} validateStatus={errors?.name ? "error" : ""} help={errors?.name?.[0]}>
                                    <AntInput placeholder="Enter Name" />
                                </Form.Item>
                            </div>

                            <div style={{ width: "45%" }}>
                                <Form.Item name="status" label="Status" rules={[{ required: true }]} initialValue="active">
                                    <Select options={[{ value: "active", label: "Active" },{ value: "inactive", label: "Inactive" }]}/>
                                </Form.Item>
                            </div>
                        </div>

                        <div style={{ width: "60%" }}>
                            <Form.Item name="categories" label="Categories" rules={[{ required: true }]}>
                                <Select mode="multiple" showSearch optionFilterProp="label" options={categories} placeholder="Select One"/>
                            </Form.Item>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <div></div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <Space>
                                    <Form.Item>
                                        <Button type="primary" htmlType="submit" loading={loading}>
                                            Update
                                        </Button>
                                    </Form.Item>

                                    <Form.Item>
                                        <Button style={{backgroundColor: "#ffffff", color: "#000000ff",border: "1px solid #929292ff"}} onClick={() => window.history.back()}>
                                            Back
                                        </Button>
                                    </Form.Item>
                                </Space>
                            </div>
                        </div>
                    </div>
                </Form>
            </div>
        </>
    )
}
