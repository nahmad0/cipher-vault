# Host Cipher Vault and your website directory on GitHub

Prepared for **nahmad0**. This guide prepares publication; it does not mean a GitHub repository has been created or a site deployed.

## Recommended layout

| Site | Repository | Address |
| --- | --- | --- |
| Existing cybersecurity newsletter | `nahmad0.github.io` | `https://nahmad0.github.io/` |
| Existing personal portfolio | Existing `nallimi` project | `https://nahmad0.github.io/nallimi/` |
| New Cipher Vault game | Create `cipher-vault` | `https://nahmad0.github.io/cipher-vault/` |
| Website links page, bundled with game | Same `cipher-vault` repository | `https://nahmad0.github.io/cipher-vault/websites/` |

The last two addresses are planned addresses and become available only after deployment. Leave your newsletter repository in place. Publishing this game as the root site would replace the newsletter. You can later add a link from the newsletter or portfolio to the new directory.

## Why there is a separate build

GitHub Pages hosts static files; it does not run this project’s Cloudflare Worker. The added `npm run build:pages` command bundles the same React and Three.js game into ordinary HTML, CSS, and JavaScript in `dist-pages/`. It includes the website directory. Relative asset paths support a project URL such as `/cipher-vault/` without hardcoding your username or repository name.

Use **`dist-pages/`** for GitHub Pages. The existing **`dist/`** directory belongs to the Sites / Worker build. Do not upload that Worker output to GitHub Pages.

## Option A — automatic builds from your source (recommended)

### 1. Check the game locally

Install Node.js 24, then run these commands from the project folder:

```sh
npm ci
npm test
npm run typecheck
npm run build:pages
npm run preview:pages
```

Open the printed preview URL. Check both camera modes and visit `/websites/`. Stop the preview with Ctrl+C when finished.

### 2. Create an empty GitHub repository

Sign in to GitHub as `nahmad0`. Create a new repository named **`cipher-vault`**. For a straightforward GitHub Free setup, choose **Public**. Leave initial README, license, and .gitignore creation unchecked because this local project already contains files and Git history.

The source contains the educational answers. The static game is intended to be public and does not provide private player sessions or trusted scoring. GitHub Pages publication does not carry over the owner-only access of the existing Sites deployment. Do not upload secrets, personal evidence, or API keys.

### 3. Push this project

GitHub Desktop is an option if you prefer a GUI: add the existing local repository, review and commit pending changes, then publish it to the intended new repository. Otherwise, use the following commands after creating the empty repository:

```sh
git status
git add .
git commit -m "Prepare Cipher Vault and website directory for GitHub Pages"
git remote -v
git remote add github https://github.com/nahmad0/cipher-vault.git
git push -u github main
```

The project is already a Git repository on `main`; do not initialize another repository inside it. Using the remote name `github` avoids overwriting any existing `origin` or Sites remote. If `github` already exists, inspect its URL with `git remote get-url github` and use it only if it points to the intended repository. If there are no new changes to commit, Git will say so; continue with the push.

Authenticate using GitHub’s normal browser or credential-manager flow. Never put tokens in source files or embed them in remote URLs. If Git asks for your author identity, set `user.name` and `user.email` to your own values; your GitHub no-reply email is suitable if you prefer to keep your email private.

### 4. Enable GitHub Pages

In the **cipher-vault** repository, open **Settings → Pages**. Under **Build and deployment**, set **Source** to **GitHub Actions**. The supplied `.github/workflows/deploy-pages.yml` handles building and publishing. It installs the locked dependencies, runs the tests and TypeScript check, builds `dist-pages`, and deploys that artifact.

Open **Actions → Deploy Cipher Vault to GitHub Pages → Run workflow**, choose `main`, and run it. This also lets you retry an initial run that happened before Pages was enabled. Future pushes to `main` trigger the workflow automatically. Review the workflow’s deployment URL or **Settings → Pages → Visit site** after it succeeds.

You do not need to create a personal access token or a repository secret for this workflow. GitHub supplies a short-lived workflow token; the deployment job declares the required Pages and identity-token permissions. Organization policies can still require an administrator to enable Actions or approve the deployment environment.

### 5. Open the result

- Game: `https://nahmad0.github.io/cipher-vault/`
- Website directory: `https://nahmad0.github.io/cipher-vault/websites/`

The game header has a **My websites** link. The directory links back to the game and out to your existing newsletter and portfolio. Check all links after the first deployment. A successful local build alone does not establish that these URLs are live.

### 6. Update later

Edit the game or `public/websites/index.html`, verify locally, commit the changes, and push `main` to the `github` remote. GitHub Actions rebuilds and publishes the update. Do not manually edit the generated `dist-pages` folder: the next build replaces it.

## Option B — publish only the built files

Use this if you want to upload files through GitHub’s website without setting up a source-build workflow.

1. Run `npm run build:pages` locally.
2. Create a separate empty **cipher-vault** repository on GitHub.
3. Upload the **contents** of `dist-pages/` to the repository root: `index.html`, the `assets/` folder, `websites/`, and the other generated public files. Do not nest everything inside a folder named `dist-pages`.
4. Add an empty file named `.nojekyll` at that repository root to disable Jekyll processing.
5. In **Settings → Pages**, select **Deploy from a branch**, then `main` and `/ (root)`.
6. Wait for deployment and open **Visit site**.

Use this built-files repository separately from the full-source workflow approach. For updates, rebuild locally and replace the deployed output files. If a browser upload has trouble preserving folders, use GitHub Desktop. The automatic source workflow is generally easier to maintain.

## Publish the links page by itself

Your directory is already one standalone file: **`public/websites/index.html`**. Its CSS is embedded and it does not depend on the game runtime.

To give it its own address such as `https://nahmad0.github.io/my-websites/`:

1. First deploy the game using one of the options above.
2. Make a copy of `public/websites/index.html` outside the game project, to use as the new repository’s root `index.html`.
3. In that copy, change the **Cipher Vault card’s** `href="../"` to `href="https://nahmad0.github.io/cipher-vault/"`. The relative link is correct inside the game’s `/websites/` folder, but would point to your newsletter if used unchanged at `/my-websites/`.
4. Create a separate public repository called **my-websites**. Upload that `index.html` and an empty `.nojekyll` file.
5. Choose **Settings → Pages → Deploy from a branch → main → / (root)**.

Do not rename or repurpose `nahmad0.github.io`, since it already hosts the newsletter. Alternatively, you can add the directory file in a new subfolder of the newsletter’s existing publishing output, but first follow that repository’s own build process so it does not erase your addition on its next deployment.

## Add more websites

Copy one `<article class="card">` in `public/websites/index.html`. Change its title, category, description, and anchor `href` to the real HTTPS URL. The directory is a manually curated list, not an automatic scan of GitHub repositories. A repository URL such as `github.com/nahmad0/example` is a source-code page, not necessarily the website’s address. Use its actual published address.

## Common problems

| Problem | Resolution |
| --- | --- |
| First workflow fails at Configure Pages | Enable Pages with GitHub Actions, then rerun |
| GitHub returns 404 | Confirm the deployment succeeded, repository name matches the path, and `index.html` is at the artifact root |
| GitHub displays source or README instead of the game | Deploy `dist-pages` through the supplied workflow; do not publish the full source folder as static output |
| Assets return 404 under `/cipher-vault/` | Rebuild using `vite.pages.config.ts`; preserve the generated assets folder |
| `git push` is rejected because remote has commits | Do not force-push; reconcile the remote history or use an empty new repository |
| Wrong link after copying the hub to its own repo | Replace the game card’s relative URL as described above |
| Old game after updating source | Check Actions for a failed build and confirm you pushed to `main` |
| Saved flags did not migrate from Sites or localhost | Browser storage is per origin; start fresh on GitHub Pages |

## Official references

GitHub UI labels and workflow requirements were checked against these official guides on 2026-09-07:

- [Creating a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
- [Configuring a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Using custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

A GitHub connection to the assistant is optional for these manual steps. If you want the assistant to create the repository or publish for you, authorize that separately and connect the intended GitHub account if its tools are not already available. No GitHub upload or publication is performed just by reading this guide.
