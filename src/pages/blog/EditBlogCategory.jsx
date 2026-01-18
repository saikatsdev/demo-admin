import { Link, useNavigate, useParams } from 'react-router-dom';
import useTitle from '../../hooks/useTitle'
import { ArrowLeftOutlined,PlusOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Form, message, Upload,Select } from "antd";
import { getDatas, postData } from '../../api/common/common';
import { useEffect } from 'react';

export default function EditBlogCategory() {
    // Hook
    useTitle("Edit Blog Category");

    // Variable
    const navigate = useNavigate();
    const {id} = useParams();

    // State
    const [form]                      = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();

    // Method
    const normFile = (e) => {
        if (Array.isArray(e)) return e;
        return e?.fileList;
    };

    useEffect(() => {
        const getBlogCategory = async () => {
            const res = await getDatas(`/admin/blog-post-categories/${id}`);

            if(res && res?.success){
                const data = res?.result || [];

                form.setFieldsValue({
                    name: data.name,
                    status: data.status,

                    image: data.image
                        ? [
                            {
                                uid: "-1",
                                name: "existing.png",
                                status: "done",
                                url: data.image,
                            }
                        ]
                        : [],
                });
            }
        }

        getBlogCategory();
    }, [id]);

    const handleSubmit = async (values) => {
        const formData = new FormData();
        
        formData.append('name', values.name);
        formData.append('status', values.status);
        formData.append('width', values.width);
        formData.append('height', values.height);

        if (values.image && values.image.length > 0) {
            const file = values.image[0];
            if (file.originFileObj) {
                formData.append("image", file.originFileObj);
            }
        }

        formData.append("_method", "PUT");

        const res = await postData(`/admin/blog-post-categories/${id}`, formData, {headers:{ "Content-Type": "multipart/form-data" }});

        messageApi.open({
            type: "success",
            content: res.msg,
        });

        setTimeout(() => {
            navigate("/blog/categories");
        }, 400);
    }

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Edit Blog Category</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Edit Blog Category" },
                        ]}
                    />
                </div>
            </div>

            <div className="blog-form">
                <div className="form-head-wrapper">
                    <h2 className="form-head-title">Edit Blog Catgeory</h2>

                    <button className="form-head-btn" type="button" onClick={() => window.history.back()}>
                        <ArrowLeftOutlined className="form-head-btn-icon" />
                        <span>Back</span>
                    </button>
                </div>
                <div className="blog-form-layout">
                    <Form layout="vertical" form={form} onFinish={handleSubmit} initialValues={{width:450, height:450}}>
                        <Form.Item label="Category Name" name="name">
                            <AntInput placeholder="Enter name" />
                        </Form.Item>

                        <Form.Item name="status" label="Status" initialValue="active">
                            <Select options={[{ value: "active", label: "Active" },{ value: "inactive", label: "Inactive" }]}/>
                        </Form.Item>

                        <Form.Item label="Upload" valuePropName="fileList" getValueFromEvent={normFile} name="image">
                            <Upload beforeUpload={() => false} listType="picture-card">
                                <button style={{ color: 'inherit', cursor: 'inherit', border: 0, background: 'none' }} type="button">
                                    <PlusOutlined />
                                    <div style={{ marginTop: 8 }}>Upload</div>
                                </button>
                            </Upload>
                        </Form.Item>

                        <div style={{display:"flex", justifyContent:"space-between"}}>
                            <Form.Item label="Width" name="width">
                                <AntInput placeholder="Enter width" />
                            </Form.Item>

                            <Form.Item label="Height" name="height">
                                <AntInput placeholder="Enter height" />
                            </Form.Item>
                        </div>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" block>
                                Update
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            </div>
        </>
    )
}
