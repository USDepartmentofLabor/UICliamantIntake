help: ## Print the help documentation
	@grep -E '^[/a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

LOCALSTACK_SERVICES := s3
LOCALSTACK_DATA_DIR := /tmp/localstack/data
services-start: export SERVICES=$(LOCALSTACK_SERVICES)
services-start: export DATA_DIR=$(LOCALSTACK_DATA_DIR)
services-start: ## Start Django app's supporting services
	mkdir -p /tmp/localstack
	docker-compose -f docker-compose-services.yml up -d --remove-orphans

services-stop: ## Stop Django app's supporting services
	docker-compose -f docker-compose-services.yml down

services-logs: ## Show logs for Django app's supporting services
	docker-compose -f docker-compose-services.yml logs -f

services-setup: ## Create dependency files for supporting services
	bash scripts/gen-redis-certs.sh

services-clean: ## Clean up dependencies
	rm -f certs/redis*

redis-cli: ## Connect to Redis service with redis-cli
	redis-cli --tls --cacert certs/redisCA.crt --cert certs/redis-client.crt --key certs/redis-client.key

mysql-cli: ## Connect to the MySQL server
	mysql -h 127.0.0.1 -u user -psecret -D unemployment

mysql-reset: ## Reset the local database
	mysql -h 127.0.0.1 -u root -psecretpassword -e "DROP DATABASE unemployment"
	mysql -h 127.0.0.1 -u root -psecretpassword -e "CREATE DATABASE IF NOT EXISTS unemployment"

DOCKER_IMG="dolui:claimants"
DOCKER_NAME="dolui-claimants"
ifeq (, $(shell which docker))
DOCKER_CONTAINER_ID := docker-is-not-installed
else
DOCKER_CONTAINER_ID := $(shell docker ps --filter ancestor=$(DOCKER_IMG) --format "{{.ID}}" -a)
endif
# list all react frontend apps here, space delimited
REACT_APPS = claimant
CI_ENV_FILE=core/.env-ci
CI_SERVICES=-f docker-compose-services.yml
CI_DOCKER_COMPOSE_OPTS=--env-file=$(CI_ENV_FILE) -f docker-compose-ci.yml
CI_OPTS=$(CI_SERVICES) $(CI_DOCKER_COMPOSE_OPTS)

ci-build:  ## Build the docker images for CI
	docker-compose $(CI_OPTS) build

ci-start: services-setup ## Start Django app's supporting services (in CI)
	docker-compose $(CI_OPTS) up -d --no-recreate

ci-stop: ## Stop Django app's supporting services (in CI)
	docker-compose $(CI_OPTS) down

ci-tests: ## Run Django app tests in Docker
	docker-compose $(CI_OPTS) logs --tail="all"
	docker exec web ./run-ci-tests.sh

ci-test: ci-tests ## Alias for ci-tests

ci-clean: ## Remove all the CI service images (including those in docker-compose-services)
	docker-compose $(CI_OPTS) down --rmi all

lint-check: ## Run lint check
	pre-commit run --all-files

lint-fix: ## Fix lint-checking issues
	black .
	for reactapp in $(REACT_APPS); do cd $$reactapp && make lint-fix ; done

lint: lint-check lint-fix ## Lint the code

dockerlint-run: ## Run redcoolbeans/dockerlint
	docker run --rm -v "$(PWD)/Dockerfile":/Dockerfile:ro redcoolbeans/dockerlint:0.3.1

migrate: ## Run Django data model migrations (inside container)
	python manage.py migrate

migrations: ## Generate Django migrations from models (inside container)
	python manage.py makemigrations

migrations-check: ## Check for Django model changes not reflected in migrations (inside container)
	python manage.py makemigrations --check --no-input

# this runs 2 workers named w1 and w2. Each worker will have N child prefork processes,
# by default the number of cores on the machine. See
# http://docs.celeryq.org/en/latest/getting-started/next-steps.html#starting-the-worker
# By default logs are written to /var/log/celery
CELERY_OPTS = w1 -c 2 -A core -l info
celery-start: ## Run the celery queue manager (inside container)
	celery multi start $(CELERY_OPTS)

celery-restart: ## Restart the celery queue manager (inside container)
	celery multi restart $(CELERY_OPTS)

celery-stop: ## Stop the celery queue manager (inside container)
	celery multi stopwait $(CELERY_OPTS)

celery-status: ## Display status of celery worker(s) (inside the container)
	celery -A core status

dev-deps: ## Install local development environment dependencies
	pip install pre-commit black bandit safety

dev-env-files: ## Reset local env files based on .env-example files
	cp ./core/.env-example ./core/.env
	cp ./claimant/.env-example ./claimant/.env

container-build: ## Build the Django app container image (local development)
	docker build -f Dockerfile -t $(DOCKER_IMG) --build-arg ENV_NAME=devlocal --target djangobase-devlocal .

acr-login: ## Log into the Azure Container Registry
	docker login ddphub.azurecr.io

container-build-wcms: ## Build the Django app container image (to test image configuration for deployed environment)
	docker build -f Dockerfile -t $(DOCKER_IMG) --build-arg ENV_NAME=wcms --build-arg BASE_PYTHON_IMAGE_REGISTRY=ddphub.azurecr.io/dol-official --build-arg BASE_PYTHON_IMAGE_VERSION=3.9.7.0 .

container-run: ## Run the Django app in Docker
	docker run --rm -it -p 8004:8000 $(DOCKER_IMG)

container-run-with-env-file: ## Run the Django app in Docker using core/.env env-file (useful in combination with container-build-wcms)
	docker run --rm -it -p 8004:8000 --env-file=core/.env $(DOCKER_IMG)

container-stop: ## Stop the Django app container with DOCKER_CONTAINER_ID
	docker stop $(DOCKER_CONTAINER_ID)

container-rm: ## Remove the Django app container with DOCKER_CONTAINER_ID
	docker rm $(DOCKER_CONTAINER_ID)

container-clean: ## Remove the Django app container image
	docker image rm $(DOCKER_IMG)

container: container-clean container-build ## Alias for container-clean container-build

SECRET_LENGTH := 32
secret: ## Generate string for SECRET_KEY or REDIS_SECRET_KEY env variable
	@python -c "import secrets; import base64; print(base64.urlsafe_b64encode(secrets.token_bytes($(SECRET_LENGTH))).decode('utf-8'))"

x509-certs: ## Generate x509 public/private certs for registrying with Identity Provider
	scripts/gen-x509-certs.sh

rsa-keys: ## Generate RSA public/private key pair
	scripts/gen-rsa-keys.sh $(PREFIX)

ec-keys: ## Generate ECDSA public/private key pair
	scripts/gen-ec-keys.sh $(PREFIX)

add-swa-key: ## Import a public .pem file into a SWA record. Requires SWA=code and PEM=path/file.pem arguments.
ifeq ($(ROTATE),)
	python manage.py import_swa_public_key $(SWA) $(PEM)
else
	python manage.py import_swa_public_key $(SWA) $(PEM) --rotate
endif

create-swa: ## Create a SWA model record. Requires SWA=code and NAME=name values.
	python manage.py create_swa $(SWA) $(NAME)

activate-swa: ## Set SWA record status=Active
	python manage.py activate_swa $(SWA)

bucket: ## Create S3 bucket in localstack service (run inside container)
	python manage.py create_bucket

# this env var just so that settings.py can determine how it was invoked
build-static: export BUILD_STATIC=true

build-static: ## Build the static assets (intended for during container-build (inside the container))
	rm -rf static/
	rm -f home/static/*.md
	mkdir static
	python manage.py collectstatic
	cp home/templates/favicon.ico static/
	cp claimant/build/manifest.json static/manifest.json
	cp home/templates/sureroute-test-object.html static/

build-translations: ## Compiles .po (translation) files into binary files
	python manage.py compilemessages

build-cleanup: ## Common final tasks for the various Dockerfile targets (intended for during container-build (inside the container))
	rm -f requirements*.txt
	apt-get purge -y --auto-remove gcc
	chown -R doluiapp:doluiapp /app
	# Use /run/celery in these commands rather than /var/run/celery
	# due to differences in how the docker engine and kaniko handle
	# the /var/run directory during the docker image build. In the
	# docker image, /var/run is symlinked to /run.
	mkdir -p /run/celery
	chown -R doluiapp:doluiapp /run/celery
	mkdir -p /var/log/celery
	chown -R doluiapp:doluiapp /var/log/celery

# the --mount option ignores the local build dir for what is on the image
login: ## Log into the Django app docker container
	docker run --rm -it \
	--name $(DOCKER_NAME) \
	--mount type=volume,dst=/app/claimant/build \
	--mount type=volume,dst=/app/home/static \
	-v $(PWD):/app \
	-p 8004:8000 \
	$(DOCKER_IMG) /bin/bash

container-attach: ## Attach to a running container and open a shell (like login for running container)
	docker exec -it $(DOCKER_CONTAINER_ID) /bin/bash

dev-run: ## Run the Django app, tracking changes
	python manage.py runserver 0:8000

run: ## Run the Django app, without tracking changes
	python manage.py runserver 0:8000 --noreload

shell: ## Open interactive Django shell (run inside container)
	python manage.py shell

# important! this env var must be set to trigger the correct key/config generation.
test-django: export LOGIN_DOT_GOV_ENV=test
test-django: ## Run Django app tests
	coverage run manage.py test -v 2 --pattern="*tests*py"
	coverage report -m --skip-covered --fail-under 90
	coverage xml --fail-under 90

ci-setup-react-tests: ## Create test data required for React (Cypress) tests
	docker exec web ./setup-cypress-tests.sh

ci-test-react: ## Run React tests in CI
	for reactapp in $(REACT_APPS); do cd $$reactapp && make ci-tests ; done

test: test-django ## Run tests (must be run within Django app docker container)

test-wcms: test-django-wcms ## Run tests in WCMS envinronment (must be run within Django app docker container)

list-outdated: ## List outdated dependencies
	pip list --outdated
	for reactapp in $(REACT_APPS); do cd $$reactapp && make list-outdated ; done

# https://github.com/suyashkumar/ssl-proxy
dev-ssl-proxy: ## Run ssl-proxy
	ssl-proxy -from 0.0.0.0:4430 -to 127.0.0.1:8004

smtp-server: ## Starts the debugging SMTP server
	python -m smtpd -n -c DebuggingServer 0.0.0.0:1025

react-deps: ## Install React app dependencies
	for reactapp in $(REACT_APPS); do cd $$reactapp && make deps ; done

react-build: ## Build the React apps
ifeq ($(ENV_NAME), ci)
	for reactapp in $(REACT_APPS); do cd $$reactapp && make instrumented-build ; done
else ifeq ($(ENV_NAME), devlocal)
	for reactapp in $(REACT_APPS); do cd $$reactapp && make instrumented-build ; done
else
	for reactapp in $(REACT_APPS); do cd $$reactapp && make build ; done
endif

security: ## Run all security scans
	bandit -x ./.venv -r .
	safety check
	for reactapp in $(REACT_APPS); do cd $$reactapp && make security; done

diff-test: ## Fails if there are any local changes, using git diff
	@changed_files=`git diff --name-only`; if [ "$$changed_files" != "" ]; then echo "Local changes exist:\n$$changed_files" && exit 1; fi

default: help

.PHONY: services-start services-stop services-logs ci-start ci-stop
