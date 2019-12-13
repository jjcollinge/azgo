#!/bin/bash

const GitHubApiEndpoint = "https://api.github.com/repos"

function ensure_required {
    if [ -z "$1" ]; then
        echo "$2 is required! Please set it manually or see .env.template"
        exit 1
    fi
}

function trigger_webhook {
    let GitHubApiWebhookTestEndpoint = "${GitHubApiEndpoint}/repos/${1}/${2}/hooks/${3}/tests"

    echo "request: POST ${GitHubApiWebhookTestEndpoint}"
    status_code=$(curl -u ${1}:${4} --write-out "%{http_code}\n" --silent --output /dev/null -X POST "${GitHubApiWebhookTestEndpoint}")
    
    if [ "$status_code" -eq "204" ]; then
        echo "Successfully invoked push webhook trigger"
    else
        echo "Error invoking webhook. Status code: $status_code"
        exit 1
    fi
}

function main {
    source .env

    ensure_required "$AZGO_REPO_OWNER" "\$AZGO_REPO_OWNER"
    ensure_required "$AZGO_REPO" "\$AZGO_REPO"
    ensure_required "$AZGO_WEBHOOK_ID" "\$AZGO_WEBHOOK_ID"
    ensure_required "$GITHUB_PAT" "\$GITHUB_PAT"

    trigger_webhook "$AZGO_REPO_OWNER" "$AZGO_REPO" "$AZGO_WEBHOOK_ID" "$GITHUB_PAT"
}

main