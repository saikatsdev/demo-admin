import { useRef, useState } from "react";
import { InboxOutlined, DeleteOutlined } from "@ant-design/icons";
import { Button, Image, Typography, message } from "antd";

const { Text } = Typography;

export default function ImagePickerPlain({
    value,
    onChange,
    errors,
    gallery = [],
    fetchMore,
    hasMore,
    loadingMore,
    label = "Thumbnail",
    required = true,
}) {
    const fileInputRef = useRef(null);

    const [sourceModalOpen, setSourceModalOpen] = useState(false);
    const [galleryOpen, setGalleryOpen] = useState(false);

    // 📱 Device upload (same logic as your singleFileChange)
    const handleDeviceChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!/\.(jpe?g|png|webp|gif)$/i.test(file.name)) {
            message.error(
                "Please select a valid image file (jpg, jpeg, png, webp, gif)"
            );
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            onChange({
                originFileObj: file,
                previewUrl: ev.target.result,
            });
        };
        reader.readAsDataURL(file);

        setSourceModalOpen(false);
    };

    // 🖼️ Gallery select
    const handleGallerySelect = (item) => {
        onChange({
            isFromGallery: true,
            galleryPath: item.original_path,
            previewUrl: item.img_path,
        });

        setGalleryOpen(false);
    };

    const clearImage = () => {
        onChange(null);
    };

    return (
        <div>
            {/* Label */}
            <Text strong style={{ display: "block", marginBottom: 8 }}>
                {label} {required && <span style={{ color: "#ff4d4f" }}>*</span>}
            </Text>

            {/* Upload box */}
            {!value && (
                <div
                    className="thumbnail-upload-box"
                    onClick={() => setSourceModalOpen(true)}
                >
                    <InboxOutlined className="thumbnail-upload-inbox" />
                    <div style={{ color: "#666" }}>Choose File</div>
                </div>
            )}

            {/* Errors */}
            {errors?.image && (
                <div style={{ color: "#ff4d4f", marginTop: 4 }}>
                    {errors.image.map((err, i) => (
                        <div key={i}>{err}</div>
                    ))}
                </div>
            )}

            {/* Preview */}
            {value?.previewUrl && (
                <div className="thumbnail-preview-dis">
                    <Image
                        className="thumbnail-img-box"
                        src={value.previewUrl}
                        alt="Thumbnail preview"
                    />
                    <Button
                        className="thumbnail-img-btn"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={clearImage}
                    />
                </div>
            )}

            {/* Hidden input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleDeviceChange}
            />

            {/* Source modal */}
            {sourceModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <Button
                            type="primary"
                            block
                            onClick={() => fileInputRef.current.click()}
                        >
                            📱 Upload From Device
                        </Button>

                        <Button
                            block
                            style={{ marginTop: 8 }}
                            onClick={() => {
                                setSourceModalOpen(false);
                                setGalleryOpen(true);
                            }}
                        >
                            🖼️ Choose From Gallery
                        </Button>

                        <Button
                            type="link"
                            block
                            onClick={() => setSourceModalOpen(false)}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {/* Gallery modal */}
            {galleryOpen && (
                <div className="modal-overlay">
                    <div className="modal-box large">
                        <Text strong>Select From Gallery</Text>

                        <div className="gallery-grid">
                            {gallery.map((item) => (
                                <div
                                    key={item.id}
                                    className="gallery-item"
                                    onClick={() => handleGallerySelect(item)}
                                >
                                    <img src={item.img_path} alt="" />
                                </div>
                            ))}
                        </div>

                        {hasMore && (
                            <Button
                                style={{ marginTop: 12 }}
                                block
                                disabled={loadingMore}
                                onClick={fetchMore}
                            >
                                {loadingMore ? "Loading…" : "Load more"}
                            </Button>
                        )}

                        <Button
                            type="link"
                            block
                            onClick={() => setGalleryOpen(false)}
                        >
                            Close
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
