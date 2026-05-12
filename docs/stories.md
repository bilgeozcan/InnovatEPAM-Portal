# Epics And Stories

## Epic 1 - User Management

### Story 1.1 - Register Account

As an employee, I want to register with my role so that I can access the innovation portal.

Acceptance criteria:

- Name, email, role, and password are required.
- Email addresses are normalized to lowercase.
- Duplicate email registrations are blocked.
- Passwords must have at least 8 characters and include letters and numbers.

### Story 1.2 - Login And Logout

As a registered user, I want to log in and log out so that my session is controlled.

Acceptance criteria:

- Valid credentials start a browser session.
- Invalid credentials show a clear error.
- Logout clears the active session.
- Public user objects never expose password hashes.

## Epic 2 - Idea Submission

### Story 2.1 - Submit Idea

As a submitter, I want to submit an idea with business context so that evaluators can review it.

Acceptance criteria:

- Title must be at least 5 characters.
- Description must be at least 20 characters.
- Category must match the approved category list.
- New ideas start with submitted status.

### Story 2.2 - Attach One File

As a submitter, I want to attach one file so that supporting context travels with the idea.

Acceptance criteria:

- The browser form accepts a single file input.
- Attachments are stored with name, type, size, upload timestamp, and data URL.
- Files larger than 2 MB are rejected in the browser.

## Epic 3 - Idea Board

### Story 3.1 - View Ideas

As a user, I want to see ideas relevant to my role so that I can track progress.

Acceptance criteria:

- Submitters see only their own ideas.
- Evaluator admins see all ideas.
- Ideas display status, owner, category, update time, attachment, and description.
- Search and status filtering update the board.

## Epic 4 - Evaluation Workflow

### Story 4.1 - Review Idea

As an evaluator admin, I want to update an idea status with comments so that submitters understand the decision.

Acceptance criteria:

- Only evaluator admins can change review status.
- Valid review statuses are under review, accepted, and rejected.
- Accepted and rejected changes require comments.
- Every status update appends a status history entry.
