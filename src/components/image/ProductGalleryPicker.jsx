import { useState } from "react";
import { Modal, Button, Row, Col, Tabs, Upload, message, } from "antd";
import { PlusOutlined, DeleteOutlined, InboxOutlined, CloudUploadOutlined, CheckCircleFilled } from "@ant-design/icons";
import { postData } from "../../api/common/common";

const { Dragger } = Upload;

export default function ProductGalleryPicker({gallery = [],fetchMore,hasMore,loadingMore,onChange,onUploadSuccess}) {
    // State
    const [images, setImages]                 = useState([]);
    const [galleryOpen, setGalleryOpen]       = useState(false);
    const [activeTab, setActiveTab]           = useState("gallery");
    const [fileList, setFileList]             = useState([]);

    const selectedIds = images.map(img => img.uid);

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
                let newGalleryItems = [];
                if (res.result?.data && Array.isArray(res.result.data)) {
                    newGalleryItems = res.result.data;
                } else if (Array.isArray(res.result)) {
                    newGalleryItems = res.result;
                } else if (res.result) {
                    newGalleryItems = [res.result];
                }
                
                onUploadSuccess?.(newGalleryItems);
                onSuccess(res, file);
                message.success(`${file.name} uploaded successfully`);
            } else {
                onError(new Error(res.message || "Upload failed"));
                message.error(`${file.name} upload failed.`);
            }
        } catch (error) {
            onError(error);
            message.error(`${file.name} upload failed.`);
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

    const handleSelect = (item) => {
        if (images.find(img => img.uid === item.id)) {
            removeImage(item.id);
            return;
        }

        const img = new Image();
        
        img.onload = () => {
            onChange?.({
                file       : null,
                width      : img.width,
                height     : img.height,
                galleryPath: item.original_path,
                uid        : item.id
            });
        };

        img.src = item.img_path;

        setImages(prev => [
            ...prev,
            {
                uid: item.id,
                url: item.img_path
            }
        ]);
    };

    const removeImage = (uid) => {
        setImages(prev => prev.filter(img => img.uid !== uid));
        onChange?.({ remove: true, uid });
    };

    const uploadProps = {
        name: 'file',
        multiple: true,
        fileList,
        customRequest: handleCustomUpload,
        onChange: handleUploadChange,
        showUploadList: {
            showRemoveIcon: true,
            showDownloadIcon: false,
        },
    };

    return (
        <>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <div className="gallary-modal-box" onClick={() => setGalleryOpen(true)}>
                    <CloudUploadOutlined style={{ fontSize: 24 }} />
                    <div style={{ marginTop: 8, fontSize: '11px', fontWeight: 600 }}>Media Library</div>
                </div>

                {images.map((img) => (
                    <div key={img.uid} className="gallery-preview-item" style={{ position: "relative" }}>
                        <img src={img.url} alt="product" className="gallary-uploaded-img" />
                        <Button 
                            type="text" 
                            danger 
                            icon={<DeleteOutlined style={{ fontSize: '10px' }} />} 
                            onClick={() => removeImage(img.uid)}
                            className="preview-remove-btn"
                            style={{
                                position    : "absolute",
                                top         : -6,
                                right       : -6,
                                background  : "#ff4d4f",
                                color       : "#fff",
                                borderRadius: "50%",
                                width       : 20,
                                height      : 20,
                                padding     : 0,
                                display     : 'flex',
                                alignItems  : 'center',
                                justifyContent: 'center',
                                border      : '2px solid #fff',
                                boxShadow   : '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                        />
                    </div>
                ))}
            </div>

            <Modal 
                title="Select Images" 
                open={galleryOpen} 
                footer={null} 
                onCancel={() => setGalleryOpen(false)} 
                width={800}
                style={{ top: 20 }}
            >
                <Tabs 
                    activeKey={activeTab} 
                    onChange={setActiveTab}
                    items={[
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
                                            Support for a single or bulk upload. Strictly prohibited from uploading company data or other
                                            banned files.
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
                                        {gallery.map((item) => {
                                            const selected = selectedIds.includes(item.id);

                                            return (
                                                <Col xs={12} sm={8} md={6} lg={4} key={item.id}>
                                                    <div className={`sub-gallary-images-box ${selected ? "sub-selected" : ""}`} onClick={() => handleSelect(item)}>
                                                        <img src={item.img_path} className="sub-gallery-img" alt="Gallery" />
                                                        <div className="selection-overlay">
                                                            <div className="selection-check">
                                                                <CheckCircleFilled />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Col>
                                            );
                                        })}

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
                    ]}
                />
            </Modal>
        </>
    );
}