import { useEffect, useState } from "react";
import useTitle from "../../../hooks/useTitle"

function EditAttendance() {
    // Hook
    useTitle("Edit Attendance");
    const navigate = useNavigate();

    // States
    const [loading, setLoading] = useState(false);
    
    const getAttendance = async () => {
        setLoading(true);
        try {
            const res = await getDatas(`/admin/attendance/${id}`);
            if (res?.success) {
                
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getAttendance();
    }, []);

    return (
        <>

        </>
    )
}

export default EditAttendance