import { useState } from "react";
import { Modal, Button, Row, Col, Tabs, Upload, message } from "antd";
import { InboxOutlined, PlusOutlined, CheckCircleFilled, CloudUploadOutlined } from "@ant-design/icons";
import { postData } from "../../api/common/common";

const { Dragger } = Upload;

export default function ProductImagePicker({ gallery = [], fetchMore, hasMore, loadingMore, onChange, onUploadSuccess }) {
    // States
    const [galleryOpen, setGalleryOpen]       = useState(false);
    const [activeTab, setActiveTab]           = useState("gallery");
    const [selectedIds, setSelectedIds]       = useState([]);
    const [preview, setPreview]               = useState(null);
    const [fileList, setFileList]             = useState([]);

    const handleCustomUpload = async ({ file, onProgress, onSuccess, onError }) => {
        try {
            const dimensions = await new Promise((resolve) => {
                const img = new window.Image();
                const objectUrl = URL.createObjectURL(file);
                img.onload = () => {
                    URL.revokeObjectURL(objectUrl);
                    resolve({ width: img.width, height: img.height });
                };
                img.onerror = () => {
                    URL.revokeObjectURL(objectUrl);
                    resolve({ width: 800, height: 800 });
                };
                img.src = objectUrl;
            });

            const formData = new FormData();
            formData.append("images[]", file);
            formData.append("width[]", dimensions.width);
            formData.append("height[]", dimensions.height);

            const res = await postData("/admin/gallary/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                onUploadProgress: (event) => {
                    const percent = Math.floor((event.loaded / event.total) * 100);
                    onProgress({ percent });
                },
            });

            if (res && res.success) {
                const newGalleryItems = Array.isArray(res.result) ? res.result : (res.result?.data || []);
                onUploadSuccess?.(newGalleryItems);
                onSuccess(res, file);
            } else {
                onError(new Error(res.message || "Upload failed"));
            }
        } catch (error) {
            onError(error);
        }
    };

    const handleUploadChange = ({ fileList: newFileList }) => {
        setFileList(newFileList);

        const allDone = newFileList.length > 0 && newFileList.every(file => file.status === 'done');
        if (allDone) {
            setTimeout(() => {
                setActiveTab("gallery");
                setFileList([]);
            }, 500);
        }
    };

    const uploadProps = {
        name: 'file',
        multiple: true,
        fileList,
        customRequest: handleCustomUpload,
        onChange: handleUploadChange,
        showUploadList: true,
    };

    const handleSelectGallery = (item) => {
        setSelectedIds([item.id]);
        setPreview(item.img_path);

        const img = new window.Image();

        img.onload = function () {
            const width = img.width;
            const height = img.height;
            onChange?.({ file: null, width, height, galleryPath: item.original_path });
        };

        img.src = item.img_path;

        setGalleryOpen(false);
    };

    return (
        <>
            {preview ? (
                <img src={preview} alt="selected" className="gallary-uploaded-img" onClick={() => setGalleryOpen(true)} style={{ cursor: "pointer", width: 120, height: 120, objectFit: "fill", borderRadius: 8 }}/>
            ) : (
                <div className="gallary-modal-box" onClick={() => setGalleryOpen(true)}>
                    <CloudUploadOutlined style={{ fontSize: 28 }} />
                    <div style={{ marginTop: 8, fontWeight: 600 }}>Media Library</div>
                </div>
            )}

            <Modal 
                title="Select Thumbnail" 
                open={galleryOpen} 
                onCancel={() => setGalleryOpen(false)} 
                footer={null} 
                width={800}
                style={{ top: 20 }}
            >
                <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
                    {
                        key: 'upload',
                        label: 'Upload Files',
                        children: (
                            <div style={{ padding: '20px 0' }}>
                                <Dragger {...uploadProps}>
                                    <p className="ant-upload-drag-icon">
                                        <InboxOutlined />
                                    </p>
                                    <p className="ant-upload-text">Click or drag file to this area to upload</p>
                                    <p className="ant-upload-hint">
                                        You can upload multiple images here to add to your gallery.
                                    </p>
                                </Dragger>
                            </div>
                        )
                    },
                    {
                        key: 'gallery',
                        label: 'Gallery',
                        children: (
                            <div style={{ maxHeight: '60vh', overflowY: 'auto', overflowX: 'hidden', padding: '10px 5px' }}>
                                <Row gutter={[16, 16]}>
                                    {gallery.map((item) => (
                                        <Col xs={12} sm={8} md={6} lg={4} key={item.id}>
                                            <div className={`sub-gallary-images-box ${selectedIds.includes(item.id) ? "sub-selected" : ""}`} onClick={() => handleSelectGallery(item)}>
                                                <img src={item.img_path} className="sub-gallery-img" alt="Gallery item" />
                                                <div className="selection-overlay">
                                                    <div className="selection-check">
                                                        <CheckCircleFilled />
                                                    </div>
                                                </div>
                                            </div>
                                        </Col>
                                    ))}

                                    <Col span={24} style={{ textAlign: "center", marginTop: 20 }}>
                                        {hasMore && (
                                            <Button type="default" loading={loadingMore} onClick={fetchMore}>
                                                {loadingMore ? "Loading…" : "Load more"}
                                            </Button>
                                        )}
                                    </Col>
                                </Row>
                            </div>
                        )
                    }
                ]} />
            </Modal>
        </>
    );
}