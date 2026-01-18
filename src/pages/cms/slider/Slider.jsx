import { ArrowLeftOutlined, CheckOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Skeleton, Space } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { deleteData, getDatas } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";

export default function Slider() {
    // Variable
    const navigate = useNavigate();

    // State
    const [sliders,setSlider] = useState([]);
    const [loading, setLoading] = useState(false);

    // Hook
    useTitle("All Silder");

    // Method
    const openCreate = () => {
        navigate("/add/slider");
    }

    const handleEdit = (id) => {
        navigate(`/slider/edit/${id}`);
    }

    useEffect(() => {
        let isMounted = true;

        const fetchSlider = async () => {
            setLoading(true);

            const res = await getDatas("/admin/sliders");

            const list = res?.result?.data;

            if(isMounted){
                setSlider(list);
            }

            setLoading(false);
        }

        fetchSlider();

        return () => {
            isMounted = false;
        }
    }, []);

    const handleDelete = (id) => {
      Swal.fire({
        title: "Are you sure?",
        text: "This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!",
      }).then( async (result) => {
        if (result.isConfirmed) {
          const res = await deleteData(`/admin/sliders/${id}`);

          if(res?.success){
            const refreshed = await getDatas("/admin/sliders");

            setSlider(refreshed?.result?.data);

            Swal.fire({
              title: "Deleted!",
              text: res?.msg || "Slider deleted successfully",
              icon: "success",
              confirmButtonColor: "#3085d6",
            });
          }
        }
      });
    };

    return (
        <>
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">All Home Sliders</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "All Home Sliders" },
                        ]}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div></div>
                <Space>
                    <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreate}>Add</Button>
                    <Button icon={<ArrowLeftOutlined />} size="small" onClick={() => window.history.back()}>Back</Button>
                </Space>
            </div>

            <div className="slider-card">
                {loading
                    ? Array.from({ length: 6 }).map((_, idx) => (
                        <div key={idx} className="card">
                            {/* Skeleton image */}
                            <div className="card-image">
                                <Skeleton.Image style={{ width: "100%", height: 160, borderRadius: 8 }} active />
                            </div>

                            {/* Card footer */}
                            <div className="card-footer">
                                <Skeleton.Button active size="small" style={{ width: 60 }} />
                                <Skeleton.Button active size="small" style={{ width: 60 }} />
                                <Skeleton.Button active size="small" style={{ width: 60 }} />
                            </div>
                        </div>
                    ))
                    : sliders?.map((slider) => (
                        <div key={slider.id} className="card">
                            {/* Image */}
                            <div className="card-image">
                                <img src={slider.image} alt={slider.title} />
                            </div>

                            {/* Footer buttons */}
                            <div className="card-footer">
                                <div className="slider-card-footer">
                                    <div>
                                        <button className="slide-btn button-primary" onClick={() => handleEdit(slider.id)}>
                                            <EditOutlined style={{marginRight:"6px"}} />
                                            Edit
                                        </button>
                                    </div>
                                    <div>
                                        {slider.status === 'active' ? (
                                            <button className="slide-btn button-success" style={{marginRight:"10px"}}>
                                                <CheckOutlined  style={{marginRight:"6px", fontWeight:"bold"}}/>
                                                Active
                                            </button>
                                        ) : (
                                            <button className="slide-btn button-warning" style={{marginRight:"10px"}}>
                                                <CheckOutlined  style={{marginRight:"6px", fontWeight:"bold"}}/>
                                                Inactive
                                            </button>
                                        )}
                                        
                                        <button className="slide-btn button-danger" onClick={() => handleDelete(slider.id)}>
                                            <DeleteOutlined  style={{marginRight: "6px"}}/>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

        </>
    )
}
