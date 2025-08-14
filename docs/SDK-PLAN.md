# SDK Plan

This document outlines the strategy for generating and publishing a typed client SDK for frontend applications.

## Strategy

The primary strategy is to generate a typed client from the `openapi.yaml` contract. This will ensure that the frontend applications are always in sync with the API.

### Client Generation

We will use an open-source tool to generate the client. The generated client will be published as a private package to GitHub Packages.

### Handoff to Frontend

When the API contract is updated, the following artifacts will be delivered to the frontend teams:

1.  The updated `openapi.yaml` file.
2.  A new version of the generated client SDK will be published to GitHub Packages.
3.  An issue will be created in each frontend repository with a checklist for consuming the updated API. This issue will reference the API pull request.
