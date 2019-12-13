import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { PushEvent } from "./types/types";
import simplegit = require('simple-git/promise');
import tmp = require('tmp');
import * as msRest from "@azure/ms-rest-js";
import * as msRestAzure from "@azure/ms-rest-azure-js";
import * as msRestNodeAuth from "@azure/ms-rest-nodeauth";
import { ResourceManagementClient, ResourceManagementModels, ResourceManagementMappers } from "@azure/arm-resources";

const subscriptionId = process.env["AZURE_SUBSCRIPTION_ID"];
const tenantId = process.env["AZURE_TENANT_ID"]
const clientSecret = process.env["AZURE_CLIENT_ID"]
const clientId = process.env["AZURE_CLIENT_SECRET"]

async function CloneRepoAsync(git: simplegit.SimpleGit, cloneURL: string) {
    var tmpDir = tmp.dirSync();
    await git.clone(cloneURL, tmpDir);
    return tmpDir.name;
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('azgo controller triggered.');

    // request validation

    let event: PushEvent = JSON.parse(req.body);
    context.log('commit: ' + event.head_commit);

    // clone git repo HEAD
    let git: simplegit.SimpleGit = simplegit();
    let headDir = await CloneRepoAsync(git, 
        event.repository.clone_url.replace("{/sha}", event.head_commit));

    // filter ARM templates

    // apply update to ARM
};

export default httpTrigger;
