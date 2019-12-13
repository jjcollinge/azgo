# azgo

This is an experimental codebase to explore applying GitOps practices (pull vs push) to the Azure Resource Manager (ARM) API.

The benefits of doing so include:
* Not using `az` directly
* Not requiring pipeline access to the ARM API
* Versioned and auditable change log
* Simple git based operations i.e. Rollback via `git reset`
* Provides an external hook point to apply access control and policies

## Design

GitHub Webhook --> Azure Function --> Azure Resource Manager

1. You make a git commit to your GitHub repository to update a template or configuration
2. A GitHub webhook is triggered that calls the azgo web server (controller)
3. The azgo controller clones the git repository at the versioned git commit
4. The controller then makes a comparision between the state defined in the Git repo and that expressed in the ARM API
5. For any diverged state, the controller makes the approriate modifications 

### Secrets
Secrets are stored in the git repo as a Azure KeyVault versioned reference


