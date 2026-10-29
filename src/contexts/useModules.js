import { useContext } from "react";
import { ModuleContext } from "./ModuleContext";

export const useModules = () => {
    const context = useContext(ModuleContext);

    if (!context) {
        throw new Error("useModules must be used inside ModuleProvider");
    }

    return context;
};
