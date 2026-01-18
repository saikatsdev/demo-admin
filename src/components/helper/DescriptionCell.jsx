import React, { useState } from "react";

const DescriptionCell = ({ html }) => {
    const parser = new DOMParser();
    const text = parser.parseFromString(html, "text/html").body.textContent;

    const [expanded, setExpanded] = useState(false);

    return (
        <div style={{ maxWidth: "350px" }}>
            <p
                style={{
                    marginBottom: "5px",
                    textTransform: "capitalize",
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: expanded ? "none" : 4,
                    lineHeight: "20px",
                }}
            >
                {text}
            </p>

            {text.length > 120 && (
                <span
                    onClick={() => setExpanded(!expanded)}
                    style={{
                        color: "#1890ff",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: 500,
                    }}
                >
                    {expanded ? "See Less" : "See More..."}
                </span>
            )}
        </div>
    );
};

export default DescriptionCell;
