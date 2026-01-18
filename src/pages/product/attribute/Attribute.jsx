import { ArrowLeftOutlined, PlusOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Form, Modal, Popconfirm, Select, Space, Table, Tag, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { deleteData, getDatas, postData } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";

export default function Attribute() {
    // Hook
    useTitle("All Attributes");

    // State
    const [query, setQuery]                       = useState("");
    const [editingAttribute, setEditingAttribute] = useState(null)
    const [attributes, setAttributes]             = useState([]);
    const [isModalOpen, setIsModalOpen]           = useState(false);
    const [loading, setLoading]                   = useState(false);
    const [pagination, setPagination]             = useState({ current: 1, pageSize: 10, total: 0 })
    const { current, pageSize }                   = pagination;
    const [debouncedQuery, setDebouncedQuery]     = useState("");
    const [form]                                  = Form.useForm();
    const [messageApi, contextHolder]             = message.useMessage();

    const columns = [
      {
        title: "SL",
        key: "sl",
        width: 50,
        render: (_, __, index) =>
          index + 1 + (pagination.current - 1) * pagination.pageSize,
      },
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
      },
      {
        title: "Slug",
        dataIndex: "slug",
        key: "slug",
      },
      {
        title: "Values",
        dataIndex: "values",
        key: "values",
        render: (values, record) => (
          <>
            {values && values.length > 0 
              ? values.map((v) => v.value).join(", ")
              : "-"
            }

            <Link 
              to={`/attributes/config/${record.id}`} 
              style={{ marginLeft: 8, color: "#1677ff" }}
            >
              Config
            </Link>
          </>
        )
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (status) => (
          <Tag style={{textTransform:"capitalize"}} color={status === "active" ? "green" : "red"}>{status}</Tag>
        ),
      },
      {
        title: "Action",
        key: "operation",
        width: 160,
        render: (_, record) => (
          <Space>
            <Button size="small" type="primary" onClick={() => onEdit(record)}>
              Edit
            </Button>
            <Popconfirm title="Delete attribute?" okText="Yes" cancelText="No" onConfirm={() => onDelete(record.id)}>
              <Button size="small" danger>
                Delete
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ];

    useEffect(() => {
        const handle = setTimeout(() => {
            setDebouncedQuery(query)
        }, 500)
        return () => clearTimeout(handle)
        }, [query])
    
      useEffect(() => {
        setPagination((p) => (p.current === 1 ? p : { ...p, current: 1 }))
      }, [debouncedQuery])
    
      useEffect(() => {
        let isMounted = true;
        const fetchAttributes = async () => {
          setLoading(true);
          const params = { params: { page: current, per_page: pageSize, search_key: debouncedQuery || undefined } };
          const res = await getDatas("/admin/attributes", params);
          const list = res?.result?.data || [];
          const meta = res?.result?.meta;
          if (isMounted) {
            setAttributes(list);
            if (meta) {
              setPagination((p) => {
                const next = {
                  ...p,
                  current: meta.current_page || p.current,
                  pageSize: meta.per_page || p.pageSize,
                  total: meta.total || p.total,
                }
                const unchanged = p.current === next.current && p.pageSize === next.pageSize && p.total === next.total
                return unchanged ? p : next
              })
            }
          }
          setLoading(false);
        }
        fetchAttributes();
        return () => {
          isMounted = false;
        }
      }, [current, pageSize, debouncedQuery])


    const filteredData = useMemo(() => {
      if (!query) return attributes;
      const lowerQuery = query.toLowerCase();
      return attributes.filter(
        (b) => b.name?.toLowerCase().includes(lowerQuery)
      );
    }, [attributes, query]);

    const onDelete = async (id) => {
        const res = await deleteData(`/admin/attributes/${id}`);
        if (res && res?.success) {
            messageApi.open({
              type: "success",
              content: res.msg,
            });
            const params = { params: { page: current, per_page: pageSize, search_key: debouncedQuery || undefined } }
            const refreshed = await getDatas("/admin/attributes", params);
            setAttributes(refreshed?.result?.data || [])
            const meta = refreshed?.result?.meta
            if (meta) setPagination((p) => ({ ...p, total: meta.total || p.total }))
        }
    }

    const onEdit = (record) => {
      setEditingAttribute(record);
      form.setFieldsValue({
        name: record.name,
        slug: record.slug,
        status: record.status,
      });
      setIsModalOpen(true);
    };

    const openCreate = () => {
      setEditingAttribute(null);
      form.resetFields();
      setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        const values = await form.validateFields()
        const formData = new FormData()
        formData.append('name', values.name)
        formData.append('slug', values.slug)
        if (values.status) formData.append('status', values.status)
        if (editingAttribute?.id) formData.append("_method", "PUT");
    
        let res;
        if (editingAttribute?.id) {
          res = await postData(`/admin/attributes/${editingAttribute.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        } else {
          res = await postData('/admin/attributes', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        }
        if (res && res?.success) {
          setIsModalOpen(false)
          form.resetFields()

          messageApi.open({
            type: "success",
            content: res.msg,
          });

          // refresh list
          const params = { params: { page: current, per_page: pageSize, search_key: debouncedQuery || undefined } }
          const refreshed = await getDatas("/admin/attributes", params);
          setAttributes(refreshed?.result?.data || [])
          const meta = refreshed?.result?.meta
          if (meta) setPagination((p) => ({ ...p, total: meta.total || p.total }))
        }
      }

  return (
    <>
      {contextHolder}
      <div className="pagehead">
        <div className="head-left">
          <h1 className="title">All Attributes</h1>
        </div>
        <div className="head-actions">
          <Breadcrumb
            items={[
              { title: <Link to="/dashboard">Dashboard</Link> },
              { title: "All Attributes" },
            ]}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <AntInput.Search
          allowClear
          placeholder="Search Key ..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: 300 }}
        />
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Add
          </Button>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => window.history.back()}
          >
            Back
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          onChange: (page, pageSize) => {
            setPagination((p) => ({ ...p, current: page, pageSize }));
          },
        }}
        columns={columns}
        dataSource={filteredData}
        scroll={{ x: "max-content" }}
      />

      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        title={editingAttribute ? "Edit Attribute" : "Create Attribute"}
        onOk={handleSubmit}
        okText={editingAttribute ? "Update" : "Create"}
      >
        <Form form={form} layout="vertical">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0 16px",
            }}
          >
            <Form.Item
              name="name"
              label="Attribute Name"
              rules={[{ required: true }]}
            >
              <AntInput placeholder="Enter Attribute Name" />
            </Form.Item>

            <Form.Item
              name="slug"
              label="Attribute slug"
              rules={[{ required: true }]}
            >
              <AntInput placeholder="Enter Attribute slug" />
            </Form.Item>

            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true }]}
              initialValue="active"
            >
              <Select
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </>
  );
}
