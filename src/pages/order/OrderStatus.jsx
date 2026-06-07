

import React, { useEffect, useState, useContext, useMemo } from "react";
import { ArrowLeftOutlined, MenuOutlined,PlusOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, message, Space, Table, Tag } from "antd";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { getDatas, postData } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";

import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {arrayMove,SortableContext,useSortable,verticalListSortingStrategy} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const RowContext = React.createContext({});

const DragHandle = () => {
    const { setActivatorNodeRef, listeners } = useContext(RowContext);
    
    return (
        <MenuOutlined ref={setActivatorNodeRef} style={{ cursor: 'move', color: '#999' }} {...listeners}/>
    );
};

const Row = (props) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: props['data-row-key'],
    });

    const style = {
        ...props.style,
        transform: CSS.Transform.toString(transform && { ...transform, scaleY: 1 }),
        transition,
        ...(isDragging ? { position: 'relative', zIndex: 9999, background: '#fafafa' } : {}),
    };

    const contextValue = useMemo(
        () => ({ setActivatorNodeRef, listeners }),
        [setActivatorNodeRef, listeners],
    );

    return (
        <RowContext.Provider value={contextValue}>
            <tr {...props} ref={setNodeRef} style={style} {...attributes} />
        </RowContext.Provider>
    );
};

export default function OrderStatus() {
    //Hook
    useTitle("Order Status");

    // Variable
    const navigate = useNavigate();

    // State
    const [query, setQuery]               = useState("");
    const [loading, setLoading]           = useState(false);
    const [orderStatus, setItems]                = useState([]);
    const [messageApi, contextHolder]     = message.useMessage();
    const [filteredData, setFilteredData] = useState(orderStatus);
    const [pagination, setPagination] = useState({current: 1,pageSize: 20});

    const protectedIds = [7, 8, 9, 10, 13, 14];

    const columns = 
    [
        {
            key: "sort",
            width: 50,
            align: 'center',
            render: () => !query ? <DragHandle /> : null,
        },
        {
            title: "SL",
            key: "sl",
            width: 80,
            render: (_, __, index) => {
                return (pagination.current - 1) * pagination.pageSize + index + 1;
            }
        },
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            render: (_, record) => (
                <Tag style={{backgroundColor: record.bg_color,color: record.text_color,border: "none",fontWeight: 500,padding: "4px 12px",borderRadius: "6px"}}>
                    {record.name}
                </Tag>
            )
        },
        {
            title: "BG Color",
            dataIndex: "bg_color",
            key: "bg_color"
        },
        {
            title: "Text Color",
            dataIndex: "text_color",
            key: "text_color"
        },
        {
            title: "Order Count",
            dataIndex: "orders_count",
            key: "orders_count"
        },
        {
            title: "Total Amount",
            dataIndex: "total_amount",
            key: "total_amount"
        },
        {
            title: "Position",
            dataIndex: "position",
            key: "position"
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag color={status === 'active' ? "green" : "danger"} style={{textTransform:"capitalize"}}>{status}</Tag>
            )
        },
        {
            title: "Action",
            key: "operation",
            width:170,
            render: (_, record) => {
                const isDisabled = protectedIds.includes(record.id);

                return (
                    <Space>
                        <Button size="small" type="primary" onClick={() => navigate(`/order-status/edit/${record.id}`)} disabled={isDisabled}>
                            Edit
                        </Button>
                    </Space>
                )
            }
        },
    ];

    //Method
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 1,
            },
        }),
    );

    const onDragEnd = ({ active, over }) => {
        if (active.id !== over?.id) {
            const activeIndex = filteredData.findIndex((i) => i.id === active.id);
            const overIndex = filteredData.findIndex((i) => i.id === over?.id);

            const newFilteredData = arrayMove(filteredData, activeIndex, overIndex);

            const basePosition = (pagination.current - 1) * pagination.pageSize;
            const updatedItems = newFilteredData.map((item, index) => ({
                id: item.id,
                position: basePosition + index + 1
            }));

            // Update UI state
            setFilteredData(newFilteredData);
            setItems(prevItems => {
                const newItems = [...prevItems];
                updatedItems.forEach(u => {
                    const idx = newItems.findIndex(i => i.id === u.id);
                    if (idx !== -1) newItems[idx].position = u.position;
                });
                return newItems.sort((a, b) => a.position - b.position);
            });

            // Call API once, outside state updater
            postData('/admin/statuses/position', { items: updatedItems }).then(res => {
                if (res?.success) {
                    messageApi.open({
                        type: "success",
                        content: res.msg || "Status position updated successfully",
                    });
                } else {
                    messageApi.open({
                        type: "error",
                        content: res.message || "Failed to update status position",
                    });
                }
            });
        }
    };

    // Removed onEdit modal logic

    useEffect(() => {
        if(!query){
            setFilteredData(orderStatus);
        }

        const lowerQuery = query.toLowerCase();

        const filtered = orderStatus?.filter(item => 
            item.name?.toLowerCase().includes(lowerQuery) || item.status?.toLowerCase().includes(lowerQuery)
        );

        setFilteredData(filtered);
    }, [query, orderStatus]);

    useEffect(() => {
        let isMounted = true;

        const fetchContactList = async () => {
            setLoading(true);

            const res = await getDatas("/admin/statuses");

            const list = res?.result?.data;

            if(isMounted){
                setItems(list);
            }

            setLoading(false);
        }

        fetchContactList();

        return () => {
            isMounted = false;
        }
    }, []);


    // Removed handleSubmit modal logic

    const user = useSelector((state) => state.auth.user);

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">All Statuses List</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "All Statuses List" },
                        ]}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <AntInput.Search allowClear placeholder="Search Key ..." style={{ width: 300 }} value={query} onChange={(e) => setQuery(e.target.value)}/>
                <Space>
                    <Button icon={<ArrowLeftOutlined />} size="small" onClick={() => window.history.back()}>Back</Button>

                    {user.phone_number === '01700000017' && (
                        <Button icon={<PlusOutlined />} size="small" type="primary" onClick={() => navigate("/order-status/add")}>
                            Add Status
                        </Button>
                    )}
                </Space>
            </div>

            <DndContext sensors={sensors} modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
                <SortableContext
                    items={filteredData.map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <Table bordered loading={loading} columns={columns} dataSource={filteredData} rowKey="id"
                        components={{
                            body: {
                                row: Row,
                            },
                        }}
                        pagination={{
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total: filteredData.length,
                            showSizeChanger: true,
                            onChange: (page, pageSize) => {
                                setPagination({
                                    current: page,
                                    pageSize: pageSize,
                                });
                            },
                        }}
                    />
                </SortableContext>
            </DndContext>


        </>
    )
}
