# Security Spec

1. Data Invariants:
- A user document can only be created by an authenticated user matching the UID.
- A user document's role can only be set to 'member' during creation, and 'admin' can only be set by an existing admin.
- Only users with role 'admin' can read all clients and tasks, members can read clients they created (Wait, the user said: "كل اللي بيحصل من باقي اليوزارات يكون بيظهرله" - the main user sees everything, maybe all members can see everything? It's an internal tool for a department, usually all employees in the department can see all clients, but maybe only admins can delete or add users? Let's say all authenticated users in the department can read/write clients, but only admins can manage users.) Let's simplify: All authenticated users in the `users` collection can read/write clients.
- A client document can only be created/updated by users who have a record in `users/{uid}`.

2. Dirty Dozen Payloads:
- Unauthenticated read/write to clients.
- Modifying another user's profile.
- Creating a client with a 10MB string.
- Creating a task without a valid clientId.

We will write `firestore.rules.test.ts`.
