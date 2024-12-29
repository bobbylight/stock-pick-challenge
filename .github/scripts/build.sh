#!/usr/bin/env bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
PROJECT_ROOT="${SCRIPT_DIR}/../.."

cd "${PROJECT_ROOT}/app" || exit 1
npm install || exit 2
npm run build || exit 3
npm run lint:nofix || exit 4
