#!/bin/bash
# Savelo IdP - Vercel Ignored Build Step Script (Option B)
#
# When using GitHub Actions to manage prebuilt deployments (Option B),
# configure this command in Vercel Project Settings -> Git -> Ignored Build Step:
# bash scripts/vercel-ignore-build.sh
#
# Exit code 0 tells Vercel to skip automatic Git-triggered builds.
# Exit code 1 would instruct Vercel to proceed with the build.

echo "Skipping automatic Vercel Git build: Deployment is managed by GitHub Actions (vercel deploy --prebuilt)."
exit 0
