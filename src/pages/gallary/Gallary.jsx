import {DeleteOutlined,PlusOutlined} from "@ant-design/icons";
import { Breadcrumb,message,Button,Space,Modal,Form,Upload } from "antd";
import { Link } from "react-router-dom";
import useTitle from "../../hooks/useTitle";
import { useEffect, useState, useCallback } from "react";
import { deleteData, getDatas, postData } from "../../api/common/common";
import "./Gallary.css";

export default function Gallary() {
    // Page title
    useTitle("All Images");

    // State
    const [gallaries, setGallaries]           = useState([]);
    const [page, setPage]                     = useState(1);
    const [fileList, setFileList]             = useState([]);
    const [hasMore, setHasMore]               = useState(true);
    const [loadingMore, setLoadingMore]       = useState(false);
    const [loading, setLoading]               = useState(true);
    const [selectedIndex, setSelectedIndex]   = useState(null);
    const [isPreviewOpen, setIsPreviewOpen]   = useState(false);
    const [selectedImages, setSelectedImages] = useState([]);
    const [messageApi, contextHolder]         = message.useMessage();
    const [isTrashView, setIsTrashView]       = useState(false);
    const [isModalOpen, setIsModalOpen]       = useState(false);
    const [form]                              = Form.useForm();
    const [formLoading, setFormLoading]       = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        fetchMedia(page);
    }, []);

    const fetchMedia = async (pageNumber = 1, trash = isTrashView) => {
        try {
            if (pageNumber === 1) setLoading(true);
            setLoadingMore(true);

            const res = await getDatas(`/admin/gallary?page=${pageNumber}&trash=${trash ? 1 : 0}`);

            if (res && res?.success) {
                const data = res.result.data;

                if (pageNumber > 1) {
                    setGallaries(prev => [...prev, ...data]);
                } else {
                    setGallaries(data);
                }

                const meta = res.result.meta;
                setPage(meta.current_page);
                setHasMore(meta.current_page < meta.last_page);
            }
        } catch (error) {
            console.error("Failed to load gallery:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchMedia(1, isTrashView);
    }, [isTrashView]);

    const handleChange = ({ fileList: newFileList }) => {
        setFileList(newFileList);
    };

    const toggleSelectImage = (id) => {
        setSelectedImages(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    const markAllImages = () => {
        const allIds = gallaries.map(img => img.id);
        setSelectedImages(allIds);
    };

    const unmarkAllImages = () => {
        setSelectedImages([]);
    };

    const deleteSelectedImages = async () => {
        if(selectedImages.length === 0) return;
        
        const items = selectedImages.map(id => {
            return id;
        });

        try {
            const res = await deleteData('/admin/gallary', { data: { items } });

            if(res && res.success) {
                setGallaries(prev => prev.filter(img => !selectedImages.includes(img.id)));
                setSelectedImages([]);
                
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });
            }else{
                messageApi.open({
                    type: "error",
                    content: "Something Went Wrong",
                });
            }
        } catch (err) {
            console.log(err);
        }
    };

    const openPreview = (index) => {
        if (!gallaries || gallaries.length === 0) return;
        setSelectedIndex(index);
        setIsPreviewOpen(true);
    };

    const closePreview = () => {
        setIsPreviewOpen(false);
        setSelectedIndex(null);
    };

    const showNext = useCallback(() => {
        setSelectedIndex((prev) => {
        if (prev === null || gallaries.length === 0) return prev;
            return (prev + 1) % gallaries.length;
        });
    }, [gallaries.length]);

    const showPrev = useCallback(() => {
        setSelectedIndex((prev) => {
            if (prev === null || gallaries.length === 0) return prev;
            return (prev - 1 + gallaries.length) % gallaries.length;
        });
    }, [gallaries.length]);

    useEffect(() => {
        if (!isPreviewOpen) return;

        const handleKey = (event) => {
            if (event.key === "Escape") {
                closePreview();
            } else if (event.key === "ArrowRight") {
                showNext();
            } else if (event.key === "ArrowLeft") {
                showPrev();
            }
        };

        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [isPreviewOpen, showNext, showPrev]);

    const handleToggleTrash = () => {
        setIsTrashView(prev => !prev);
        setPage(1);
        setSelectedImages([]);
        setPage(1);
    };

    // Restore Method
    const restoreSelectedImages = async () => {
        if (selectedImages.length === 0) return;

        try {
            const res = await postData('/admin/gallary/restore', {items: selectedImages,});
            
            if (res?.success) {
                setGallaries(prev => prev.filter(img => !selectedImages.includes(img.id)));
                setSelectedImages([]);

                messageApi.open({
                    type: "success",
                    content: res.msg,
                });
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Permanent Delete
    const permanentDeleteImages = async () => {
        if (selectedImages.length === 0) return;

        try {
            const res = await deleteData('/admin/gallary/force-delete', {data: { items: selectedImages }});

            if (res?.success) {
                setGallaries(prev => prev.filter(img => !selectedImages.includes(img.id)));
                setSelectedImages([]);

                messageApi.open({
                    type: "success",
                    content: res.msg,
                });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const selectedItem = selectedIndex !== null && gallaries[selectedIndex] ? gallaries[selectedIndex] : null;

    const handleAdd = () => {
        setIsModalOpen(true);
    }

    const normFile = (e) => {
        if (Array.isArray(e)) {
            return e;
        }
        return e?.fileList;
    };

    useEffect(() => {
        const handleDragOver = (e) => {
            e.preventDefault();
            setIsDragging(true);
        };

        const handleDragLeave = (e) => {
            e.preventDefault();
            setIsDragging(false);
        };

        const handleDrop = (e) => {
            e.preventDefault();
            setIsDragging(false);

            const files = e.dataTransfer.files;

            if (files && files.length > 0) {
                handleDropUpload(files);
            }
        };

        window.addEventListener("dragover", handleDragOver);
        window.addEventListener("dragleave", handleDragLeave);
        window.addEventListener("drop", handleDrop);

        return () => {
            window.removeEventListener("dragover", handleDragOver);
            window.removeEventListener("dragleave", handleDragLeave);
            window.removeEventListener("drop", handleDrop);
        };
    }, []);

    const handleDropUpload = async (files) => {
        try {
            const formData = new FormData();

            Array.from(files).forEach((file) => {
                formData.append("images[]", file);
            });

            const res = await postData("/admin/gallary", formData);

            if (res?.success) {
                const data = res?.result?.data || [];

                setGallaries(prev => [...data, ...prev]);

                messageApi.success(res.msg);
            } else {
                messageApi.error("Upload failed");
            }
        } catch (err) {
            console.error(err);
            messageApi.error("Upload error");
        }
    };

    const handleSubmit = async (values) => {
        try {
            setFormLoading(true);
            if (!values.images || values.images.length === 0) {
                message.error("Please upload at least one image");
                return;
            }

            const formData = new FormData();
            
            values.images.forEach((file) => {
                formData.append("images[]", file.originFileObj);
            });

            const res = await postData("/admin/gallary", formData);

            if(res && res?.success){
                const data = res?.result?.data || [];

                setGallaries(prev => [...data, ...prev]);

                messageApi.open({
                    type: 'success',
                    content: res.msg
                });

                setFileList([]);

                form.resetFields();

                setIsModalOpen(false);
            }else{
                messageApi.open({
                    type: 'error',
                    content: "Something Went Wrong"
                });
            }
        } catch (error) {
            console.log(error);
        }finally{
            setFormLoading(false);
        }
    }

    return (
        <>
            {contextHolder}
            {isDragging && (
                <div className="drag-overlay">
                    <div className="drag-box">
                        <p>📤 Drop images to upload</p>
                    </div>
                </div>
            )}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Gallery</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Gallery" },
                        ]}
                    />
                </div>
            </div>

            <div className="gallery-top-toolbar">
                <div className="gallery-actions">
                    <button type="button" className="gallary-top-mark-btn" onClick={markAllImages}>
                        <i className="fa fa-check"></i> Mark All
                    </button>
                    <button type="button" className="gallary-top-unmark-btn" onClick={unmarkAllImages}>
                        <i className="fa fa-times"></i> Unmark All
                    </button>

                    {!isTrashView && selectedImages.length > 0 && (
                        <button type="button" className="delete-top-btn" onClick={deleteSelectedImages}>
                            Delete ({selectedImages.length})
                        </button>
                    )}

                    {isTrashView && (
                        <>
                            <button className="restore-top-btn" disabled={selectedImages.length === 0} onClick={restoreSelectedImages}>
                                Restore {selectedImages.length > 0 && `(${selectedImages.length})`}
                            </button>

                            <button className="delete-top-btn danger" disabled={selectedImages.length === 0} onClick={permanentDeleteImages}>
                                Delete Permanently {selectedImages.length > 0 && `(${selectedImages.length})`}
                            </button>
                        </>
                    )}
                </div>

                <div>
                    <div>
                        <Space>
                            <Button size="small" icon={<DeleteOutlined />} onClick={handleToggleTrash}>
                                {isTrashView ? "Back to List" : "Trash"}
                            </Button>

                            <Button size="small" icon={<PlusOutlined />} type="primary" onClick={handleAdd}>
                                Add
                            </Button>
                        </Space>

                        <span style={{marginLeft:"10px"}} className="gallery-count">
                            {gallaries.length} item{gallaries.length > 1 ? "s" : ""}
                        </span>
                    </div>
                </div>
            </div>

            <div className="gallery-page">
                {loading ? (
                    <div className="gallery-skeleton-grid">
                        {Array.from({ length: 8 }).map((_, idx) => (
                            <div key={idx} className="gallery-skeleton-card" />
                        ))}
                    </div>
                ) : gallaries.length === 0 ? (
                    <div className="gallery-empty-state">
                        <div className="gallery-empty-icon">📁</div>
                        <h2>No images yet</h2>
                        <p>When you upload media, it will appear here automatically.</p>
                    </div>
                ) : (
                    <>
                        <div className="gallery-grid">
                            {gallaries.map((item, index) => (
                                <div key={item.isVariation ? `v-${item.id}` : item.id} className="gallery-card-wrapper">
                                    <input type="checkbox" className="gallery-checkbox" checked={selectedImages.includes(item.id)} onChange={() => toggleSelectImage(item.id)}/>

                                    <div className="gallery-card" onClick={() => openPreview(index)}>
                                        <div className="gallery-card-img-wrapper">
                                            <img src={item.img_path} alt={item.name} loading="lazy" className="gallery-card-img" onError={(e) => e.currentTarget.classList.add("is-broken")}/>
                                            <div className="gallery-card-overlay">
                                                <div className="gallery-card-badge">
                                                    {item.isVariation ? "Variation" : "Preview"}
                                                    <span className="gallery-card-badge-dot" />
                                                </div>
                                                <h3 className="gallery-card-title" title={item.name}>{item.name}</h3>
                                                <p className="gallery-card-slug">{item.slug?.replace(/-/g, " ")}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <div className="gallery-loadmore">
                {hasMore && (
                    <button type="button" className="gallery-loadmore-btn" disabled={loadingMore} onClick={() => fetchMedia(page + 1)}>
                        {loadingMore ? "Loading…" : "Load more"}
                    </button>
                )}

                {!hasMore && (
                    <p className="no-more-items">No more images to load</p>
                )}
            </div>

            {isPreviewOpen && selectedItem && (
                <div className="gallery-preview-backdrop" onClick={closePreview} aria-modal="true" role="dialog">
                    <div className="gallery-preview-dialog" onClick={(e) => e.stopPropagation()}>
                        <button type="button" className="gallery-preview-close" onClick={closePreview} aria-label="Close preview">
                            ✕
                        </button>

                        <div className="gallery-preview-image-wrapper">
                            <img src={selectedItem.img_path} alt={selectedItem.name} className="gallery-preview-image"/>

                            {gallaries.length > 1 && (
                                <>
                                    <button type="button" className="gallery-preview-nav-btn gallery-preview-nav-btn--prev" onClick={showPrev} aria-label="Previous image">
                                        ‹
                                    </button>
                                    <button type="button" className="gallery-preview-nav-btn gallery-preview-nav-btn--next" onClick={showNext} aria-label="Next image">
                                        ›
                                    </button>
                                </>
                            )}
                        </div>

                        <aside className="gallery-preview-meta">
                            <div className="gallery-preview-chip-row">
                                <span className="gallery-preview-chip">
                                    #{String(selectedItem.id).padStart(2, "0")}
                                </span>
                                <span className="gallery-preview-chip">
                                    {selectedIndex + 1} / {gallaries.length}
                                </span>
                            </div>

                            <h2 className="gallery-preview-title">{selectedItem.name}</h2>
                            <p className="gallery-preview-slug">
                                {selectedItem.slug?.replace(/-/g, " ")}
                            </p>

                            <div className="gallery-preview-meta-grid">
                                <div>
                                    <span className="gallery-preview-label">Original URL</span>
                                    <a href={selectedItem.img_path} target="_blank" rel="noreferrer" className="gallery-preview-link">
                                        Open image in new tab
                                    </a>
                                </div>

                                <div>
                                    <span className="gallery-preview-label">File type</span>
                                    <span className="gallery-preview-value">
                                        {selectedItem.img_path?.split(".").pop()?.toUpperCase() || "Unknown"}
                                    </span>
                                </div>
                            </div>

                            <p className="gallery-preview-hint">
                                Tip: Use ← and → to switch images, Esc to close.
                            </p>
                        </aside>
                    </div>
                </div>
            )}

            <Modal title="Add Images" okText="Add Images" open={isModalOpen} onOk={() => form.submit()} onCancel={() => setIsModalOpen(false)} loading={formLoading}>
                <Form form={form} onFinish={handleSubmit}>
                    <Form.Item label="Upload" valuePropName="fileList" name="images" getValueFromEvent={normFile}>
                        <Upload listType="picture-card" fileList={fileList} onChange={handleChange} multiple beforeUpload={() => false}>
                            {fileList.length >= 8 ? null : (
                                <button style={{border: 0,background: "none",cursor: "pointer"}} type="button">
                                    <PlusOutlined />
                                    <div style={{ marginTop: 8 }}>Upload</div>
                                </button>
                            )}
                        </Upload>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    )
}
