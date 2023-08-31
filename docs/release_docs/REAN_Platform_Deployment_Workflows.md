# REAN Platform Deployment Workflows

## PR-CI-CD

**Mode of Trigger:** Automated

PR Workflow is automatically triggered whenever a PR with a source branch as a `feature/*` branch is created against the target branch as `develop` branch.

### PR Workflow Diagram
![PR-ci-cd_workflow](https://github.com/REAN-Foundation/reancare-service/blob/develop/assets/images/pr-ci-cd_workflow.png?raw=true)

### GitHub Action Workflow Run
![pr](https://github.com/REAN-Foundation/reancare-service/blob/develop/assets/images/Pr-ci-cd_example.png?raw=true)

### JOBS

#### CodeScan-ESLint
In this job, the code written by developers is analyzed against certain rules for stylistic or programmatic errors.
* This job uses [Super-linter](https://github.com/marketplace/actions/super-linter) action.
* It employs a static code analysis tool to identify problematic patterns in the application source code.

#### Build-Docker-Image
In this job, the Dockerfile is validated, and the image build process is tested to identify any issues that may arise due to recent code changes.
* This job uses [docker/build-push-action](https://github.com/marketplace/actions/build-and-push-docker-images).
* It creates a Docker image with an image tag using the branch name and short SHA of the commit, for example, `feature/test_5e38e33`.

## Dev-CI-CD

**Mode of Trigger:** Automated

Dev Workflow is triggered automatically whenever any PR is merged into the `develop` branch. The workflow builds the applications and deploys the changes to the RF Platform Development environment.

### Dev Workflow Diagram
![Dev-ci-cd_workflow](https://github.com/REAN-Foundation/reancare-service/blob/develop/assets/images/dev-ci-cd_workflow.png?raw=true)

### GitHub Action Workflow Run
![dev](https://github.com/REAN-Foundation/reancare-service/blob/develop/assets/images/Dev-ci-cd_example.png?raw=true)

### JOBS

#### Deploy-ECS
The Deploy ECS job performs the following steps:
* This job uses [docker/build-push-action](https://github.com/marketplace/actions/build-and-push-docker-images).
* It uses the 'dev' environment and logs into ECR using credentials to build a new ECR Docker image with an image tag using the branch name and short SHA of the commit, for example, `/rean-bot-dev-uat:develop_5e38e33`.
* It creates a new version of the Amazon ECS task definition with the new Docker image and deploys the Amazon ECS task definition using the Duplo API.

## UAT-CI-CD

**Mode of Trigger:** Automated

There are two ways to use or trigger the UAT-CI-CD workflow:
1. By creating a Pull Request to merge into the MAIN branch.
2. Whenever a branch with the prefix 'release/' creates a pull request.

### UAT Workflow Diagram
![uat-ci-cd_Workflow](https://github.com/REAN-Foundation/reancare-service/blob/develop/assets/images/uat-ci-cd_workflow.png?raw=true)

### GitHub Action Workflow Run
![uat](https://github.com/REAN-Foundation/reancare-service/blob/develop/assets/images/Uat-ci-cd_example.png?raw=true)

### JOBS

#### CodeScan-ESLint
The CodeScan ESLint job performs the following steps:
* This job uses [Super-linter](https://github.com/marketplace/actions/super-linter).
* It employs a static code analysis tool to identify problematic patterns in the application source code.

#### Label_Checks
The Label Checks job performs the following steps:
* This job uses [pull-request-label-checker](https://github.com/marketplace/actions/label-checker-for-pull-requests).
* On a Pull Request event, it checks whether the Pull Request has one of the major, minor, or patch labels.

#### Deploy-ECS
The Deploy ECS job performs the following steps:
* This job uses [docker/build-push-action](https://github.com/marketplace/actions/build-and-push-docker-images).
* It uses the 'UAT' environment and logs into ECR using credentials to build a new ECR Docker image with an image tag using the branch name and short SHA of the commit, for example, `/rean-bot-dev-uat:develop_5e38e33`.
* It creates a new version of the Amazon ECS task definition with the new Docker image and deploys the Amazon ECS task definition using the Duplo API.

## PROD-CI-CD

**Mode of Trigger:** Automated

Prod Workflow is triggered automatically whenever any PR is merged into the main branch. The workflow builds the applications and deploys the changes to the RF Platform Production environment.

### Prod Workflow Diagram
![prod-ci-cd_Workflow](https://github.com/REAN-Foundation/reancare-service/blob/develop/assets/images/PROD-ci-cd_workflow.png?raw=true)

### GitHub Action Workflow Run
![prod](https://github.com/REAN-Foundation/reancare-service/blob/develop/assets/images/prod-ci-cd_example.png?raw=true)

### JOBS

#### Publish-Release
The Publish-Release job performs the following steps:
* This job uses [release-drafter](https://github.com/release-drafter/release-drafter).
* It creates a new GitHub release with the versioning based on the label given for the pull request.

#### Deploy-ECS
The Deploy-ECS job performs the following steps:
* This job uses [docker/build-push-action](https://github.com/marketplace/actions/build-and-push-docker-images).
* It logs into ECR using credentials and builds a new ECR Docker image with an image tag using the ID of the release created by the Publish-Release job, for example, `reanbot:97777323`.
* It creates a new version of the Amazon ECS task definition with the new Docker image and deploys the Amazon ECS task definition using the Duplo API.
