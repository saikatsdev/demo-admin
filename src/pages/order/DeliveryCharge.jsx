import React, { useEffect, useState } from "react";
import {ArrowLeftOutlined,DeleteOutlined,PlusOutlined,MenuOutlined} from "@ant-design/icons";
import {Input as AntInput,Breadcrumb,Button,Form,message,Modal,Popconfirm,Select,Space,Table,Tag} from "antd";
import { Link } from "react-router-dom";
import { deleteData, getDatas, postData } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";

import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import {SortableContext,useSortable,verticalListSortingStrategy} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const DraggableRow = (props) => {
    const {attributes,listeners,setNodeRef,transform,transition,isDragging} = useSortable({id: props["data-row-key"]});

    const style = {...props.style,transform: CSS.Transform.toString(transform),transition,...(isDragging ? { background: "#fafafa" } : {}),};

    return (
        <tr ref={setNodeRef} style={style} {...attributes}>
            {React.Children.map(props.children, (child, index) => {
                if (index === 0) {
                    return (
                        <td>
                            <MenuOutlined {...listeners} onMouseDown={(e) => e.stopPropagation()} style={{cursor: "grab",color: "#888",}}/>
                        </td>
                    );
                }
                return child;
            })}
        </tr>
    );
};

export default function DeliveryCharge() {
    useTitle("Delivery Charge");

    const [query, setQuery]               = useState("");
    const [loading, setLoading]           = useState(false);
    const [items, setItems]               = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [isModalOpen, setIsModalOpen]   = useState(false);
    const [editingItems, setEditingItems] = useState(null);
    const [messageApi, contextHolder]     = message.useMessage();
    const [form]                          = Form.useForm();

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const columns = [
        {
            title: "",
            width: 40,
        },
        {
            title: "SL",
            render: (_, __, index) => index + 1,
        },
        {
            title: "Name",
            dataIndex: "name",
        },
        {
            title: "Delivery Fee",
            dataIndex: "delivery_fee",
        },
        {
            title: "Min Time",
            dataIndex: "min_time",
        },
        {
            title: "Max Time",
            dataIndex: "max_time",
        },
        {
            title: "Time Unit",
            dataIndex: "time_unit",
        },
        {
            title: "Status",
            dataIndex: "status",
            render: (status) => (
                <Tag color={status === "active" ? "green" : "red"}>
                    {status}
                </Tag>
            ),
        },
        {
            title: "Action",
            width: 160,
            render: (_, record) => (
                <Space>
                    <Button size="small" type="primary" onClick={() => onEdit(record)}>
                        Edit
                    </Button>
                    <Popconfirm title="Delete item?" onConfirm={() => onDelete(record.id)}>
                        <Button size="small" danger>
                            <DeleteOutlined/>
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const res = await getDatas("/admin/delivery-gateways");
            const list = res?.result?.data || [];
            setItems(list);
            setFilteredData(list);
            setLoading(false);
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (!query) {
            setFilteredData(items);
            return;
        }
        const q = query.toLowerCase();
        setFilteredData(
            items.filter(
                (i) =>
                    i.name?.toLowerCase().includes(q) ||
                    i.status?.toLowerCase().includes(q)
            )
        );
    }, [query, items]);

    const handleDragEnd = async ({ active, over }) => {
        if (!over || active.id === over.id) return;

        const oldIndex = filteredData.findIndex((i) => i.id === active.id);
        const newIndex = filteredData.findIndex((i) => i.id === over.id);

        const newData = [...filteredData];
        const [moved] = newData.splice(oldIndex, 1);
        newData.splice(newIndex, 0, moved);

        setFilteredData(newData);
        setItems(newData);

        const payload = newData.map((item, index) => ({
            id: item.id,
            position: index + 1,
        }));

        try {
            setLoading(true);

            const res = await postData("/admin/delivery-gateways/reorder", {items: payload});

            if(res && res?.success){
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

    const openCreate = () => {
        setEditingItems(null);
        setIsModalOpen(true);
        form.resetFields();
    };

    const onEdit = (record) => {
        setEditingItems(record);
        setIsModalOpen(true);
        form.setFieldsValue(record);
    };

    const onDelete = async (id) => {
        const res = await deleteData(`/admin/delivery-gateways/${id}`);
        if (res?.success) {
            const refreshed = await getDatas("/admin/delivery-gateways");
            setItems(refreshed?.result?.data || []);
            setFilteredData(refreshed?.result?.data || []);
            messageApi.success(res.msg);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const values = await form.validateFields();

        const formData = new FormData();

        formData.append('name', values.name);
        formData.append('delivery_fee', values.delivery_fee);
        formData.append('min_time', values.min_time);
        formData.append('max_time', values.max_time);
        formData.append('time_unit', values.time_unit);
        if(values.status) formData.append('status', values.status);

        if(editingItems?.id) formData.append('_method', 'PUT');

        const url = editingItems?.id ? `/admin/delivery-gateways/${editingItems.id}` : `/admin/delivery-gateways`;

        setLoading(true);

        const res = await postData(url, formData, {headers:{ "Content-Type": "multipart/form-data"}, method: editingItems?.id ? "PUT" : "POST"});

        if(res && res?.success){
            const refreshed = await getDatas("/admin/delivery-gateways");

            setItems(refreshed?.result?.data);

            messageApi.open({
                type: "success",
                content: res.msg,
            });
        }

        setTimeout(() => {
            setLoading(false);
            setIsModalOpen(false);
        }, 500);
    }

    return (
        <>
            {contextHolder}

            <div className="pagehead">
                <h1 className="title">Delivery Charge List</h1>
                <Breadcrumb
                    items={[
                        { title: <Link to="/dashboard">Dashboard</Link> },
                        { title: "Delivery Charge" },
                    ]}
                />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <AntInput.Search allowClear placeholder="Search..." style={{ width: 300 }} value={query} onChange={(e) => setQuery(e.target.value)}/>

                <Space>
                    <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreate}>
                        Add
                    </Button>
                    <Button size="small" icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
                        Back
                    </Button>
                </Space>
            </div>

            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                <SortableContext items={filteredData.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                    <Table bordered loading={loading} columns={columns} dataSource={filteredData} rowKey="id" pagination={false}
                        components={{
                            body: {
                                row: DraggableRow,
                            },
                        }}
                    />
                </SortableContext>
            </DndContext>

            <div>
                <Modal title={editingItems ? "Edit Info" : "Create New"} open={isModalOpen} onOk={handleSubmit} okText={editingItems ? "Update" : "Create"}
                    confirmLoading={loading} onCancel={() => setIsModalOpen(false)}>
                    <div>
                        <Form form={form} layout="s" initialValues={{width:"960", height:"1200"}}>
                            <div>
                                <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                                    <AntInput placeholder="Enter Name" />
                                </Form.Item>

                                <Form.Item name="delivery_fee" label="Delivery Fee" rules={[{ required: true }]}>
                                    <AntInput placeholder="Enter Delivery Fee" />
                                </Form.Item>

                                <Form.Item name="min_time" label="Minimum Time" rules={[{ required: true }]}>
                                    <AntInput placeholder="Enter Minimum Time" />
                                </Form.Item>

                                <Form.Item name="max_time" label="Maximum Time" rules={[{ required: true }]}>
                                    <AntInput placeholder="Enter Maximum Time" />
                                </Form.Item>


                                <Form.Item name="time_unit" label="Time Unit" rules={[{ required: true }]}>
                                    <Select options={[{ value: 'hours', label: 'Hours' }, { value: 'days', label: 'Days' }, { value: 'weeks', label: 'Weeks' }]} />
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
    );
}
