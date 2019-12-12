# azgo

This is an experimental codebase to explore applying GitOps practices (pull vs push) to the Azure Resource Manager (ARM) API.

The benefits of doing so include:
* Not using `az` directly
* Not requiring pipeline access to the ARM API
* Versioned and auditable change log
* Simple git based operations i.e. Rollback via `git reset`
* Provides an external hook point to apply access control and policies
