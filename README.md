# ARPAUI

The Department of Labor has been asked to lead the executive initiative (ARPA program) to modernize and reform Unemployment Insurance (UI). As part of this program, we are intending to use the DOL GitHub repository as a central source code repository. Following USDS playbook guidelines will help development teams to develop and deploy the code internal to DOL, share the code with respective partners (states), and also eventually make code open-source when appropriate.

## ADRs

[Architectural Decision Records for this project](./docs/adr/).

## Development

This application requires:

- Python 3.x
- Node.js 14.16

Both are specified in `Dockerfile` but you will likely need both locally (natively) installed on your host machine as well.

### Setup

This documentation assumes you are developing on a Unix-like system (Linux, Mac OS).

Add these entries to your `/etc/hosts` file:

```sh
# mirror what docker does for the host machine
127.0.0.1  host.docker.internal

# dol.gov
127.0.0.1  sandbox.ui.dol.gov
```

Bootstrap your environment for the first time:

```sh
% cd path/to/this/repo
% python3 -m venv .venv
% . .venv/bin/activate
(.venv) % cp core/.env-example core/.env
(.venv) % make dev-deps
(.venv) % pre-commit install
(.venv) % make services-setup
(.venv) % make container-build
```

During local development, you can run the app dependency services with:

```sh
(.venv) % make services-start
```

View the services logs with:

```sh
(.venv) % make services-logs
```

Stop the services:

```sh
(.venv) % make services-stop
```

If you need to run the development SMTP server (does not send actual email, just logs to stdout), you can start with:

```sh
(.venv) % make smtp-server
```

NOTE that the SMTP server runs in the foreground, so start it in a dedicated terminal window. You can stop it with `Ctrl-C`.

If you ever need to connect to the Redis service directly from the terminal with the `redis-cli` tool (assuming you already have it installed),
use the make target:

```sh
(.venv) % make redis-cli
127.0.0.1:6379>
```

Connect to the MySQL server directly (assuming you have the `mysql` client already installed):

```sh
(.venv) % make mysql-cli
MySQL [unemployment]>
```

You can install both `mysql` and `redis-cli` on MacOS with Homebrew.

To start a Docker container interactively and run the Django web server:

```sh
(.venv) % make login
root@randomdockerstring:/app# make dev-run
```

You can now visit http://sandbox.ui.dol.gov:8004/ (thanks to your `/etc/hosts` entries) or http://localhost:8004/.

To run the tests:

```sh
(.venv) % make login
root@randomdockerstring:/app# make test
```

### HTTPS

In order to view an https connection locally, you will need to set up a proxy. You can use the [ssl-proxy](https://github.com/suyashkumar/ssl-proxy) tool.
You will need to install it somewhere locally in your `PATH`, and create a symlink to it called `ssl-proxy`. Then:

```sh
(.venv) % make dev-ssl-proxy
```

which will start a reverse proxy listening at https://sandbox.ui.dol.gov:4430/ and proxy to the Django server running at http://sandbox.ui.dol.gov:8004/

Like the SMTP server, the HTTPS proxy will log to stdout so start it in its own terminal window.

### Home page and Django templates

The default home page is a static file in `home/templates/index.html`. It uses the Django templating system. It is managed separately from the React application(s).

There are additional static template files in `home/templates` that are used during the Identity Provider authentication workflow. They all share and extend
a common `base.html` template.

### React frontend

The frontend application is found inside of `./claimant`. The `claimant` application has its own README and `make` commands.

Set up your `.env` file for the React application.

```sh
% cp claimant/.env-example claimant/.env
```

To run the React app independently of Django:

```sh
(.venv) % cd claimant
(.venv) % make deps
(.venv) % make dev-run
```

Note that because Django and React, when run independently, are listening on different ports, your browser
will consider them different domains and so cookies are not passed between them. We avoid this using the
"proxy" feature in `package.json` which should (in theory) pass cookies correctly. If you cannot run the proxy,
you may need to initiate an authenticated session first directly via Django, and then you should be able to view the authenticated
parts of the React app because your browser will send the correct session cookie to Django.

To view the React app via Django, you need to build it:

Make sure the proxy is running (`make dev-ssl-proxy`). Then:

```sh
(.venv) % cd claimant
(.venv) % make build
```

If your Django app is running, it's available at https://sandbox.ui.dol.gov:4430/claimant/.
Note that the Django-served React app is the pre-built (`NODE_ENV=production`) version and doesn't live-update as the source code is updated.

Note: you may get a "your connection is not private" warning in your browser. In Chrome, go to 'advanced' and choose to go to the site anyway.
If you get a message saying HSTS is required, it may be that another `.dol.gov` site has cached a cookie. Try clearing your browser cache and cookies.

## Identity Providers

Eventually, multiple Identity Providers (IdPs) will be available in the application.
The app is currently integrated with login.gov only.
Use the instructions for [login.gov sandbox setup](docs/login-dot-gov-sandbox.md).

## Security

We implement multiple layers of security checks.

For keeping up with CVEs and other outdated dependencies, you can run:

```sh
% make security
```

which will run the relevant Python and JavaScript scans. The same tools are run as part of the `make lint` `pre-commit` hooks,
but are available for running indepedently as well.

In addition, we rely on the GitHub [Dependabot](https://docs.github.com/en/code-security/supply-chain-security/managing-vulnerabilities-in-your-projects-dependencies/configuring-dependabot-security-updates)
tool to maintain dependencies.

## Development

When using `git commit` to change or add files, the pre-commit hooks run. Some hooks such as `black` or `prettier` may modify files to enforce consistent styles. When this occurs you may see `Failed` messages and the commit may not complete. Inspect the files mentioned in the error, ensure they're correct, and retry the commit. Most editors have built-in format-on-save support for Prettier, see https://prettier.io/ .

## Deployment

To build the Docker container:

```sh
% make container-build
```

The build process will install all Django and React dependencies and build the React app(s) to generate and collect all static files.

To run the container:

```sh
% make container-run
```

To open a shell in the running container (requires `make container-run` previously):

```sh
% make container-attach
```

## Help

Run `make` or `make help` to display a full list of available `make` commands.
