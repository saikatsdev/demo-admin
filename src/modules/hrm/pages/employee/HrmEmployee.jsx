import { EyeOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import { useNavigate } from "react-router-dom";
import Employee from "../../../../pages/auth/Employee";

export default function HrmEmployee() {
    const navigate = useNavigate();

    const renderProfileAction = (employee) => (
        <Tooltip title="View Full Details">
            <Button
                icon={<EyeOutlined />}
                onClick={() => navigate(`/hrm/employees/${employee.id}/profile`)}
                style={{
                    borderRadius: "8px",
                    color: "#0891b2",
                    borderColor: "#0891b2",
                }}
            />
        </Tooltip>
    );

    return <Employee renderLeadingAction={renderProfileAction} />;
}
