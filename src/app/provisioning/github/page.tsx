import Link from "next/link";
import {OAuthApp} from "octokit";

const oAuthApp = new OAuthApp({
    clientId: 'Ov23li3Np3iIajnUAGqn',
    clientSecret: '51ef5535006c925b06a1c6dc6b61c20a4fefe221',
    defaultScopes: ['repo']
});

const redirectUrl = 'http://localhost:3000/api/auth/callback/github';

const {url} = oAuthApp.getWebFlowAuthorizationUrl({redirectUrl});

type Props = {
    params: { id: string }
    searchParams: { [key: string]: string | string[] | undefined }
}

export default function GitHub({searchParams}: Readonly<Props>) {
    if (searchParams.success === 'true' && typeof searchParams.url === 'string') {
        return <div>
            Your site will soon be available on
            <Link href={searchParams.url}>{searchParams.url}</Link>
        </div>
    }

    return <Link href={url}>Provision to GitHub</Link>
}