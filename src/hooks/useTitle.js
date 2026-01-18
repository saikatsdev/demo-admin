import { useEffect, useState } from "react";
import { getDatas } from "../api/common/common";

function useTitle(title) {
  const [projectName, setProjectName] = useState(() => {
    return localStorage.getItem("project_name") || "";
  });

  useEffect(() => {
    if (!projectName) {
      const fetchProjectName = async () => {
        try {
          const res = await getDatas(`/settings/1`);
          if (res && res.success) {
            const name = res.result?.value || "";
            setProjectName(name);
            localStorage.setItem("project_name", name);
          }
        } catch (err) {
          console.error("Failed to load project name:", err);
        }
      };
      fetchProjectName();
    }
  }, [projectName]);

  useEffect(() => {
    if (title) {
      document.title = projectName ? `${title} | ${projectName}` : title;
    }
  }, [title, projectName]);
}

export default useTitle;
