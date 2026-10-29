import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import NotificationWrapper from "./components/NotificationWrapper.jsx";
import { store } from "./store.js";
import AppSettingsProvider from "./contexts/AppSettingsProvider.jsx";
import ModuleProvider from "./contexts/ModuleProvider.jsx";

export const Root = () => {
    return (
        <Provider store={store}>
            <ModuleProvider>
                <AppSettingsProvider>
                    <BrowserRouter>
                        <NotificationWrapper>
                            <App />
                        </NotificationWrapper>
                    </BrowserRouter>
                </AppSettingsProvider>
            </ModuleProvider>
        </Provider>
    );
};

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <Root />
    </StrictMode>
);
