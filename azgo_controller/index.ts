import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { PushEvent } from "./types/types";
import simplegit = require('simple-git/promise');
import tmp = require('tmp');

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

    // clone HEAD
    let git: simplegit.SimpleGit = simplegit();
    let headDir = await CloneRepoAsync(git, 
        event.repository.clone_url.replace("{/sha}", event.head_commit));

    // clone HEAD~1
    let baseDir = await CloneRepoAsync(git, 
        event.repository.clone_url.replace("{/sha}", event.commits[event.commits.length - 2]));

    // get ARM state

    // 3-way merge

    // update ARM

    // update GitHub
};

export default httpTrigger;
