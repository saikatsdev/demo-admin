import { ArrowLeftOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Form, message, Modal, Popconfirm, Select, Space, Table, Tag } from "antd";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteData, getDatas, postData } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";

export default function BlogTag() {
    // Hook
    useTitle("All Blog Tags");

    // State
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();
    const [blogTags, setBlogTags] = useState([]);
    const [filteredData, setFilteredData] = useState(blogTags);
    const [editingBlogTags, setEditingBlogTags] = useState(null);
    const [form] = Form.useForm();

    // Columns for Table Data
    const columns = [
        {
            title: "SL",
            key:"sl",
            width:10,
            render: (_,__, index) => (
                index + 1
            )
        },
        {
            title: "Name",
            dataIndex: "name",
            key:"name"
        },
        {
            title: "Status",
            dataIndex: 'status',
            key: "status",
            render: (status) => (
                <Tag color={status === 'active' ? 'green' : 'red'} style={{textTransform:"capitalize"}}>{status}</Tag>
            )
        },
        {
            title: "Action",
            key: "operation",
            width:170,
            render: (_, record) => (
                <Space>
                    <Button size="small" type="primary" onClick={() => onEdit(record)}>
                        Edit
                    </Button>
                    <Popconfirm title="Delete Courier?" okText="Yes" cancelText="No" onConfirm={() => onDelete(record.id)}>
                        <Button size="small" danger>
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            )
        },
    ];

    // Search Query
    useEffect(() => {
        if(!query){
            setFilteredData(blogTags);
        }

        const lowerQuery = query.toLowerCase();

        const filtered = blogTags.filter(item => 
            item.name.toLowerCase().includes(lowerQuery) || item?.status.toLowerCase().includes(lowerQuery)
        );

        setFilteredData(filtered);
    }, [query, blogTags]);

    // Method
    const openCreate = () => {
        setIsModalOpen(true);
        setEditingBlogTags(null);
        form.resetFields();
    }

    const onEdit = (record) => {
        setEditingBlogTags(record);
        form.setFieldsValue({
            name:record.name,
            status:record.status,
        });
        setIsModalOpen(true);
    }

    useEffect(() => {
        let isMounted = true;

        const fetchBlogTags = async () => {
            setLoading(true);

            const res = await getDatas("/admin/tags");

            const lists = res?.result?.data || [];

            if(isMounted){
                setBlogTags(lists);
            }

            setLoading(false);
        }

        fetchBlogTags();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const values = await form.validateFields();

        const formData = new FormData();

        formData.append('name',values.name);
        if(values.status) formData.append('status', values.status);

        if(editingBlogTags?.id) formData.append('_method', 'PUT');

        setLoading(true);

        const url = editingBlogTags?.id ? `/admin/tags/${editingBlogTags.id}` : "/admin/tags";

        const res = await postData(url, formData);

        if(res?.success){
            const refreshedData = await getDatas("/admin/tags");

            setBlogTags(refreshedData?.result?.data || []);

            messageApi.open({
              type: "success",
              content: res.msg,
            });
        }

        setTimeout(() => {
          setIsModalOpen(false);
          setLoading(false);
        }, 1000);
    }

    // Delete Method
    const onDelete = async (id) => {
        const res = await deleteData(`/admin/tags/${id}`);

        if(res?.success){
            const refreshed = await getDatas("/admin/tags");

            setBlogTags(refreshed?.result?.data || []);

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
                    <h1 className="title">All Blog Tags</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "All Blog Tags" },
                        ]}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <AntInput.Search allowClear placeholder="Search Key ..." style={{ width: 300 }} value={query} onChange={(e) => setQuery(e.target.value)}/>
                <Space>
                    <Button size="small" icon={<DeleteOutlined />}>Trash</Button>
                    <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreate}>Add</Button>
                    <Button icon={<ArrowLeftOutlined />} size="small" onClick={() => window.history.back()}>Back</Button>
                </Space>
            </div>

            <Table bordered loading={loading} columns={columns}  dataSource={filteredData}/>

            <div>
                <Modal
                    title={editingBlogTags ? "Edit blog category" : "Create a new blog category"}
                    open={isModalOpen}
                    onOk={handleSubmit}
                    okText={editingBlogTags ? "Update" : "Create"}
                    confirmLoading={loading}
                    onCancel={() => setIsModalOpen(false)}
                >
                    <div>
                        <Form form={form} layout="vertical" initialValues={{width:"960", height:"1200"}}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                                <Form.Item name="name" label="Blog Name" rules={[{ required: true }]}>
                                    <AntInput placeholder="Enter Blog Name" />
                                </Form.Item>

                                <Form.Item name="status" label="Status" rules={[{ required: true }]} initialValue="active">
                                    <Select options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
                                </Form.Item>
                            </div>
                        </Form>
                    </div>
                </Modal>
            </div>
        </>
    )
}
