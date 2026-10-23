
# Engineering instructions

## Before making changes
- Inspect the repository and identify its stack.
- Read existing documentation and conventions.
- For complex work, propose a short plan before implementation.
- Ask before major architectural changes or new infrastructure.

## Implementation
- Prefer small, focused, maintainable changes.
- Reuse existing patterns before introducing abstractions.
- Use strict typing where supported.
- Avoid unnecessary dependencies and premature optimisation.
- Preserve public APIs unless a change is requested.

## Verification
- Add or update tests for changed behaviour.
- Run relevant tests, linting and type checks.
- Report commands executed and any failures.
- Never claim tests passed unless they actually ran.

## Security
- Never expose secrets, credentials or environment variables.
- Never commit .env files or private keys.
- Validate untrusted input and handle errors explicitly.
- Ask before destructive operations or external side effects.

## Completion
- Summarise changes and important design decisions.
- List verification results and known limitations.
- Highlight anything requiring manual review.
