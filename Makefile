REVISION                   =  $(shell git rev-parse --short=7 HEAD)
ENV			  :=  $(shell pwd | sed 's/^.*-//')

DOCKER_COMPOSE_PROJECT    ?= kshire-$(ENV)
DOCKER_REPOSITORY         ?= ksquare/kshire
DOCKER_BUILDER_TAG        := kshire:builder


DOCKER_REPOSITORY_TAG     := $(DOCKER_REPOSITORY):$(REVISION)

export DOCKER_REPOSITORY_TAG

define docker-compose
	docker-compose \
		-p $(DOCKER_COMPOSE_PROJECT) \
		-f docker-compose.$(ENV).yml \
			$(1)
endef

define image-exec
	docker exec \
		-it $(DOCKER_COMPOSE_PROJECT)_app_1 \
			sh -c '$(1)'
endef

define mysql-clear
	docker exec \
		-i $(DOCKER_COMPOSE_PROJECT)_mysql_1 \
		mysql -uroot \
		-proot \
		-e 'DROP DATABASE IF EXISTS ks_hire; CREATE DATABASE ks_hire;'
endef

## Start containers in detached mode
start: image docker-up

## Stop containers but don't remove them
stop: docker-stop

## Stop and remove containers
down: docker-down

## Make image
image: docker-image

## Populate database
populate:
	npm run sql && npm run seed

## Sync Database
syncDB: 
	npm run syncDB

## Start interactive shell with dev tools available
shell:
	$(call image-exec,bash,-i)

## Show descriptions for Makefile targets
help:
	@echo $$'Available targets:\n'
	@grep -e "^##" -A1 $(MAKEFILE_LIST) | \
		sed -e "/^--$\/d; s/\:.*$\//g; s/\#\#\s*//g" | \
		awk '{if(NR%2 == 0) {printf("\t%-16s\t%s\n", $$0, f)} { f=$$0 }}'

## Starts up app and services.
docker-up:
	$(call docker-compose,up -d mysql)
	$(call docker-compose,up -d app)

## Powers off app and services.
docker-stop:
	$(call docker-compose,stop mysql)
	$(call docker-compose,stop app)

## Powers off app, services and remove containers
docker-down:
	$(call docker-compose,down)

## Synchronize DB with last changes. 
##THIS ONLY SHOULD BE USED WHEN COLUMNS WERE ADDED.
docker-syncdb:
	$(call image-exec,make syncDB)

## Show logs of the app service.
docker-logs:
	$(call docker-compose,logs -tf)

## Creates a docker image.
docker-image: docker-builder
	docker build \
		-t $(DOCKER_REPOSITORY_TAG) \
		-f Dockerfile .

## Creates a builder image
docker-builder:
	docker build \
		-t $(DOCKER_BUILDER_TAG) \
		-f Dockerfile.builder .

## Populates a running container with test data
docker-populate:
	$(call image-exec,make populate)

## Clear the database in a running container
docker-mysql-clear:
	  $(call mysql-clear)
