type GitHubRepo = {
    stargazers_count: number;
};

export async function getGitHubStars(owner: string = "mehulxbuilds", repo: string = "design"): Promise<number> {
    const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}`,
        {
            headers: {
                Accept: "application/vnd.github+json",
            },
            next: {
                revalidate: 300,
            },
        }
    );

    if (!res.ok) {
        throw new Error(`Failed to fetch repository: ${res.status}`);
    }

    const data: GitHubRepo = await res.json();

    return data.stargazers_count;
};