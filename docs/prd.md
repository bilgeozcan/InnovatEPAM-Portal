# Product Requirements Document - InnovatEPAM Portal MVP

## Purpose

InnovatEPAM Portal gives employees a focused way to submit innovation ideas and gives evaluator admins a simple workflow to review, accept, or reject those ideas with comments.

## Target Users

- Submitter: any employee who wants to submit and track an idea.
- Evaluator admin: reviewer who can see all submitted ideas and update their review status.

## MVP Scope

### Authentication

- Users can register with name, email, role, and password.
- Users can log in and log out.
- The app distinguishes submitters from evaluator admins.
- Demo accounts are seeded for fast showcase.

### Idea Submission

- Authenticated users can submit an idea with title, category, and description.
- The form supports one file attachment per idea.
- Input validation prevents empty or too-short submissions.

### Idea Listing And Viewing

- Submitters see their own ideas.
- Evaluator admins see all ideas.
- Users can search and filter ideas by status.
- Each idea shows owner, category, update time, attachment, and status history.

### Evaluation Workflow

- Supported statuses are submitted, under review, accepted, and rejected.
- Evaluator admins can move ideas to under review, accepted, or rejected.
- Acceptance and rejection require evaluator comments.
- Status changes are recorded in the idea history.

## Out Of Scope For This Sprint

- Production-grade server authentication.
- Organization SSO.
- Real database persistence.
- Multi-stage configurable review boards.
- Multiple attachments per idea.
- Email or Teams notifications.

## Success Criteria

- The MVP runs locally with `rtk npm start`.
- Behavior tests pass with `rtk npm test`.
- The app supports the required demo flow in 3 to 5 minutes.
- Documentation is limited to the README, project summary, focused specs, ADR, and testing notes.
