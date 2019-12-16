#!/bin/bash

readonly github_api_endpoint="https://api.github.com"

function ensure_installed {
    if ! [ -x "$(command -v $1)" ]; then
        echo "$1 is not installed but is required, please fix and retry"
        exit 1
    fi
}

function ensure_required {
    if [ -z "$1" ]; then
        echo "$2 is required! Please set it manually or see .env.template"
        exit 1
    fi
}

function trigger_webhook {
    readonly github_api_webhook_test_endpoint="${github_api_endpoint}/repos/${1}/${2}/hooks/${3}/tests"

    if [ -z "$AZGO_DEBUG" ]; then
        curl_args="--silent --output /dev/null"
        err_prompt="Retry with 'AZGO_DEBUG=true'"
    else
        curl_args="-v"
    fi

    http_status_code=$(curl -u "${1}:${4}" --write-out "%{http_code}\n" ${curl_args} -X POST "${github_api_webhook_test_endpoint}")
    
    if [[ "$http_status_code" == "204" ]]; then
        echo "Successfully invoked push webhook trigger"
    else
        echo "Error invoking webhook. Status code: $http_status_code. $err_prompt"
        exit 1
    fi
}

function main {
    source .env

    ensure_installed jq

    ensure_required "$AZGO_REPO_OWNER" "\$AZGO_REPO_OWNER"
    ensure_required "$AZGO_REPO" "\$AZGO_REPO"
    ensure_required "$AZGO_WEBHOOK_ID" "\$AZGO_WEBHOOK_ID"
    ensure_required "$GITHUB_PAT" "\$GITHUB_PAT"

    trigger_webhook "$AZGO_REPO_OWNER" "$AZGO_REPO" "$AZGO_WEBHOOK_ID" "$GITHUB_PAT"
}

main