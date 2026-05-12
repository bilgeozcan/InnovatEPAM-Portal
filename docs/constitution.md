# Testing Constitution

## Principles

1. Test business rules in pure functions before testing browser wiring.
2. Cover every MVP requirement from `docs/prd.md` and `docs/stories.md` with at least one automated assertion or a documented demo step.
3. Keep tests deterministic by passing explicit dates and IDs.
4. Prefer no external test dependencies for the sprint MVP.
5. Treat role boundaries as high-risk and test them directly.

## Current Test Gates

Run:

```powershell
rtk npm test
rtk npm run smoke:edge
```

The suite covers:

- Registration and login behavior.
- Duplicate email prevention.
- Password hash redaction from public user objects.
- Idea creation with a single attachment.
- Submitter-scoped idea visibility.
- Evaluator Admin (admin role)-only review status updates.
- Required comments for accepted or rejected decisions.
- Role-aware portal metrics.
- Microsoft Edge runtime flow from submitter submission through Evaluator Admin acceptance.

## Manual Demo Gate

Before showcase:

1. Start the app with `rtk npm start`.
2. Login as submitter demo and submit one idea with a file.
3. Logout and login as Evaluator Admin demo.
4. Move the idea to accepted or rejected with a comment.
5. Confirm the status history shows the evaluator comment.
