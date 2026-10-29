# Frontend modules

Each optional backend module has one frontend registration object in this directory.

## Module contract

```jsx
export const exampleModule = {
    key: "EXAMPLE",
    routes: [
        { path: "/example", component: ExamplePage },
    ],
    getNavigation: ({ can, canAny }) => ({
        title: "Example",
        icon: <ExampleIcon />,
        submenus: [
            can("examples-read") && { label: "Examples", path: "/example" },
        ].filter(Boolean),
    }),
};
```

Register the module in `src/modules/registry.js`. The module `key` must match its
name in the backend `modules_statuses.json` file. Routes and navigation are only
rendered when the authenticated module-status API returns `true` for that key.

Keep module-owned pages, components, hooks and API helpers inside the module
directory. Shared application code should remain outside `src/modules`.
