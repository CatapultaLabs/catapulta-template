import {NextRequest, NextResponse} from "next/server";
import {OAuthApp, Octokit} from "octokit";
import * as fs from "node:fs";
import path from "node:path";

const oAuthApp = new OAuthApp({
    clientId: 'Ov23li3Np3iIajnUAGqn',
    clientSecret: '51ef5535006c925b06a1c6dc6b61c20a4fefe221'
});

async function handler(req: NextRequest) {
    const code = req.nextUrl.searchParams.get('code');

    if (code === null) {
        return NextResponse.json(
            {message: 'Invalid or missing authorization code. Please ensure the code provided is correct and hasn\'t expired.'},
            {status: 400}
        );
    }

    const {authentication} = await oAuthApp.createToken({code});

    const octokit = new Octokit({auth: authentication.token});

    const owner = await getFirstOrganization(octokit);
    const repo = await createRepository(octokit, owner);

    await copyFilesFromTemplate(octokit, owner, repo);

    const htmlUrl = await createSite(octokit, owner, repo);

    await oAuthApp.deleteAuthorization({token: authentication.token});

    return NextResponse.redirect(new URL(`/provisioning/github?success=true&url=${htmlUrl}`, req.url));
}

const getFirstOrganization = async (octokit: Octokit) => {
    const {data} = await octokit.rest.orgs.listForAuthenticatedUser();

    // First one just for POC
    return data[0].login;
}

const createRepository = async (octokit: Octokit, org: string) => {
    const {data} = await octokit.rest.repos.createInOrg({
        org,
        name: 'catapulta-provisioned',
        description: 'Powered by Catapulta Labs',
        auto_init: true,
    });

    return data.name;
}

const copyFilesFromTemplate = async (octokit: Octokit, owner: string, repo: string) => {
    const basePath = path.join(process.cwd(), '.templates/aws');

    for (const absolutePath of readFilesRecursively(basePath)) {
        const relativePath = absolutePath.replace(basePath + '/', '');

        let sha: string | undefined;

        // if (relativePath === 'README.md') {
        //     const { data } = await octokit.rest.repos.getContent({
        //         owner,
        //         repo,
        //         path: 'README.md'
        //     })
        //
        //     sha = data.sha;
        // }

        const content = fs.readFileSync(absolutePath);

        await octokit.rest.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: relativePath,
            message: `Add ${relativePath}`,
            content: Buffer.from(content).toString('base64'),
            sha
        });
    }
}

const createSite = async (octokit: Octokit, owner: string, repo: string) => {
    const {data: pageSiteData} = await octokit.rest.repos.createPagesSite({
        owner,
        repo,
        source: {
            branch: 'main',
            path: '/',
        }
    });

    return pageSiteData.html_url;
}

const readFilesRecursively = (dir: string) => {
    let results: string[] = [];

    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat?.isDirectory()) {
            results = results.concat(readFilesRecursively(filePath));
        } else {
            results.push(filePath);
        }
    }

    return results;
};

export {handler as GET};
