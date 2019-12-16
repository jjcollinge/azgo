import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { PushEvent } from "./types/types";
import simplegit = require('simple-git/promise');
import tmp = require('tmp');
import * as msRest from "@azure/ms-rest-js";
import * as msRestAzure from "@azure/ms-rest-azure-js";
import * as msRestNodeAuth from "@azure/ms-rest-nodeauth";
import { ResourceManagementClient, ResourceManagementModels, ResourceManagementMappers, ResourceGroups, Deployments } from "@azure/arm-resources";
import glob from "glob"
import mergeARMTemplates from "arm-template-merge"
import { Resource } from "@azure/arm-resources/esm/models/mappers";
import * as fs from "fs";

const subscriptionId = process.env["AZURE_SUBSCRIPTION_ID"];
const tenantId = process.env["AZURE_TENANT_ID"];
const clientSecret = process.env["AZURE_CLIENT_ID"];
const clientId = process.env["AZURE_CLIENT_SECRET"];
const resourecGroupName = process.env["AZGO_RESOURCE_GROUP"];
const resourecGroupLocation = process.env["AZGO_RESOURCE_GROUP_LOCATION"];

async function CloneRepoAsync(git: simplegit.SimpleGit, cloneURL: string): Promise<string> {
    var tmpDir = tmp.dirSync();
    await git.clone(cloneURL, tmpDir);
    return tmpDir.name;
}

function GetARMTemplatePaths(root: string): Array<String> {
    if (root[root.length - 1] == "/") {
        root = root.slice(0, root.length - 1);
    }
    return glob.sync(root + "/**.json")
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('azgo controller triggered.');

    // TODO: request validation

    let event: PushEvent = JSON.parse(req.body);
    context.log('commit: ' + event.head_commit);

    // clone git repo HEAD
    let git: simplegit.SimpleGit = simplegit();
    let headDir = await CloneRepoAsync(git, 
        event.repository.clone_url.replace("{/sha}", event.head_commit));
    context.log("cloned repo " + event.repository.name + " to directory " + headDir);

    // filter ARM templates
    let armTemplatePaths = GetARMTemplatePaths(headDir);
    let numARMTemplatesFound = armTemplatePaths.length;

    if (numARMTemplatesFound < 1) {
        context.log("no ARM templates found");
        return context.done();
    } else {
        context.log("found ARM " + numARMTemplatesFound + " templates")
    }

    // merge into single ARM template
    let merged = {};
    armTemplatePaths.forEach(armTemplatePath => {
        let armTemplate = fs.readFileSync(armTemplatePath as string, 'utf8')
        merged = mergeARMTemplates(armTemplate);
    });

    // apply update to ARM
    let creds = await msRestNodeAuth.loginWithServicePrincipalSecret(clientId, clientSecret, tenantId);
    let client = new ResourceManagementClient(creds, subscriptionId);
    let deployment: ResourceManagementModels.Deployment = {
        properties: {
            mode: "Complete",
            template: merged
        }
    };

    let resourceGroupExists = await client.resourceGroups.checkExistence(resourecGroupName);
    if (resourceGroupExists._response.bodyAsText == "false") {
        context.log("resource group " + resourecGroupName + "does not exist, creating it");
        let resourceGroup = {
            name: resourecGroupName,
            location: resourecGroupLocation
        };
        await client.resourceGroups.createOrUpdate(resourecGroupName, resourceGroup);
    }
    
    let res = await client.deployments.createOrUpdate(resourecGroupName, resourecGroupName, deployment);
    if (res._response.status == 200) {
        context.log("successful deployment");
    } else {
        context.log("unsuccessful deployment, return http status code: " + res._response.status);
        context.log("error message: " + res._response.bodyAsText);
    }

    return context.done();
};

export default httpTrigger;
