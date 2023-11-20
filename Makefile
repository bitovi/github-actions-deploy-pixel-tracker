docker_build_no_cache:
	docker-compose --file docker-compose.yaml build --no-cache
docker_build:
	docker-compose --file docker-compose.yaml build

serve:
	docker-compose --file docker-compose.yaml up -d

stop:
	docker-compose --file docker-compose.yaml down

# make stop and then make serve
bounce:
	make stop
	make serve