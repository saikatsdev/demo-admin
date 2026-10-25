# Project Workspace Instructions

## Project Paths

- Frontend admin panel: `E:\React\demo-admin`
- Laravel backend API: `C:\laragon\www\main-api`

## Working Rules

- Treat `C:\laragon\www\main-api` as the backend for this React admin panel.
- When a task involves API routes, controllers, requests, resources, repositories, services, models, migrations, permissions, or seeders, inspect the backend project at the path above.
- When a task involves React pages, components, routes, sidebar navigation, state, or API calls, work in the frontend project.
- For changes that affect both API contracts and the admin UI, verify the request and response shape in the backend before modifying the frontend.
- Preserve existing project architecture and conventions in both repositories.

## Authorization and Scope

- Do not implement, create, edit, delete, migrate, seed, or run a state-changing command unless the user explicitly asks for that exact work.
- Do not infer permission to implement additional features from a discussion, explanation, plan, example, or code snippet.
- Inspecting relevant code and reporting findings is allowed when needed to answer the user's request, but make no code changes without explicit permission.
- Keep every change limited to the files and behavior requested by the user. Ask before expanding the scope.
- Do not run database migrations or seeders unless the user explicitly asks to execute them. Creating or editing a migration/seeder does not authorize running it.

## Laravel Migration Conventions

- Whenever a migration contains a `status` column, it must be a string column, never a boolean or enum database column.
- Import `App\Enums\StatusEnum` and use `StatusEnum::ACTIVE` as the default unless the user specifies a different status/default.
- Use this status definition:

```php
$table->string('status')->default(StatusEnum::ACTIVE)->index();
```

- For departments, keep `parent_id` nullable for future department hierarchy support.
- For departments, keep `head_user_id` nullable for future department-head assignment.
- Nullable department foreign keys must use `nullOnDelete()` so deleting the related parent department or user does not delete the department.
- Department codes must be unique.

## HRM Conventions

- HRM-related models that belong to the team domain should be created under `App\Models\Team` (for example, `App\Models\Team\Department`).
- HRM permissions belong under the `HRM` permission module, including the existing `teams`, `orders-team-list`, and `orders-team-settings` permission groups.
- Only the HRM dashboard permission uses the `hrm-` prefix: `hrm-dashboard-read`.
- Other HRM permissions use generic domain names without an `hrm-` prefix, such as `departments-read`, `employees-read`, `attendance-read`, `leave-requests-read`, `payroll-read`, and `performance-read`.
- Frontend HRM sidebar visibility must be controlled by permissions, not only by role names.
- Preserve nullable `parent_id` and `head_user_id` on departments even when the first version of the UI does not use them.
