# AHA Platform Deployment Workflows

## AHA-PROD-CI-CD

**Mode of Trigger:** On-Demand

**Parameter:**
- `Tag_name`: Please provide the GitHub tag name that the user wishes to use for deployment, for example, `v1.0.1`

This workflow utilizes two jobs: `GitHub-ECR-Tag-Check` and `Deploy-ECS` to verify and deploy the `reanbot-wrapper` release to the `aha-prod` environment.

### AHA Prod Release Workflow

Release Process Workflow Diagram.
![AHA-PROD](https://github.com/REAN-Foundation/reancare-service/blob/develop/assets/images/AHA-PROD_Workflow.png?raw=true)

GitHub Action Workflow Run
![AHA-PROD-JOB](https://github.com/REAN-Foundation/reancare-service/blob/develop/assets/images/aha_github_workflow.png?raw=true)

### JOBS

#### GitHub-ECR-Tag-Check

The GitHub ECR Tag Check will perform the following steps:

- This job uses [mukunku/tag-exists-action](https://github.com/marketplace/actions/tag-exists-action) and [git-get-release-action](https://github.com/marketplace/actions/git-get-release-action).
- It validates whether the provided release tag exists or not.
- Retrieves the GitHub release associated with the provided GitHub tag name and stores the release ID.
- Checks the ECR image tag using the same GitHub release ID.

#### Deploy-ECS

The Deploy ECS job will perform the following steps:

- This job uses [docker/build-push-action](https://github.com/marketplace/actions/build-and-push-docker-images).
- It utilizes the 'aha-prod' environment, logs into ECR using credentials, and pulls the ECR image created in PROD-CI-CD with the GitHub release ID.
- Creates a new version of the Amazon ECS task definition with the new Docker image.
- Deploys the Amazon ECS task definition using the Duplo API.

## AHA-UAT-CI-CD

**Mode of Trigger:** On-Demand

**Parameter:**
- `Tag_name`: Please provide the GitHub tag name that the user wishes to use for deployment, for example, `v1.0.1`

This workflow utilizes two jobs: `GitHub-ECR-Tag-Check` and `Deploy-ECS` to verify and deploy the `reanbot-wrapper` release to the `aha-uat` environment.

### AHA UAT Release Workflow

Release Process Workflow Diagram.
![AHA-uat](https://github.com/REAN-Foundation/reancare-service/blob/develop/assets/images/AHA-UAT_wrokflow.png?raw=true)

GitHub Action Workflow Run
![aha-uat-workflow](https://github.com/REAN-Foundation/reancare-service/blob/develop/assets/images/aha_uat_workflow.png?raw=true)

### JOBS

#### CodeScan-ESLint

- This job uses [Super-linter](https://github.com/marketplace/actions/super-linter) action to run.
- It performs static code analysis using ESLint to identify problematic patterns in the application's source code.

#### GitHub-ECR-Tag-Check

The GitHub ECR Tag Check will perform the following steps:

- This job uses [mukunku/tag-exists-action](https://github.com/marketplace/actions/tag-exists-action) and [git-get-release-action](https://github.com/marketplace/actions/git-get-release-action).
- It validates whether the provided release tag exists or not.
- Retrieves the GitHub release associated with the provided GitHub tag name and stores the release ID.
- Checks the ECR image tag using the same GitHub release ID.

#### Deploy-ECS

The Deploy ECS job will perform the following steps:

- This job uses [docker/build-push-action](https://github.com/marketplace/actions/build-and-push-docker-images).
- It utilizes the 'aha-uat' environment, logs into ECR using credentials, and pulls the ECR image created in PROD-CI-CD with the GitHub release ID.
- Creates a new version of the Amazon ECS task definition with the new Docker image.
- Deploys the Amazon ECS task definition using the Duplo API.
