# Updating documentation

*Everybody's favorite hobby...*

## Working on documentation

All documentation is placed in the ```docs```folder. Each description is placed in an MarkDown file per subject. This will make it [readable on GitHub itself](https://github.com/cvdlinden/wiim-now-playing/tree/main/docs).

However the documentation is best read at the [GitHub Pages for WiiM Now Playing](https://cvdlinden.github.io/wiim-now-playing/).

The GitHub Pages are build using [VitePress](https://vitepress.dev/) in combination with a Workflow. And in order to see what you are updating i.e. live editing of documentation, run the following in a shell:

```shell
npm run docs:dev
```

This will start a documentation development server, which is separate from the other development servers.

```console
  vitepress v1.6.4

  ➜  Local:   http://localhost:5173/wiim-now-playing/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

Use the provided url to see live updates as you edit and save the MD files (hot reload).

> [!NOTE]
> Only MD files in the ```docs``` folder, and referenced in ```docs/.vitepress/config.mjs```, will be published to Pages.  
> There are several other MD files spread around. These will not be published to Pages.

## Github Workflow (Automated publication)

The build and publication of the updated documentation is handled by a GitHub Workflow. Whenever a PR is pushed to Main, the [GitHub Pages](https://cvdlinden.github.io/wiim-now-playing/) will be updated.

The workflow definition can be found at ```.github/workflows/deploy-docs.yml```.

## Build documentation manually

You can build the html documentation manually. The results will be placed in ```docs/.vitepress/dist```.

```shell
npm run docs:build
```

After a manual build you can preview using:

```shell
npm run docs:preview
```
