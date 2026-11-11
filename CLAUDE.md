@AGENTS.md

# Claude Code

- Bloom changes reach every app: follow the [agent team workflow](https://github.com/OxyHQ/oxy/blob/main/docs/engineering/agent-team-workflow.md) for cross-family work, and plan first for anything that touches `package.json#exports`, peers or a shared owner such as Surface, Screen or the overlay root.
- Work in a worktree: Claude Code sessions are detected by the pre-commit hook (`CLAUDECODE`) and cannot commit in the shared checkout. Do not use `git stash` (the stash list is shared across worktrees).
- Do not delegate writes to a forked subagent outside an isolated worktree.
