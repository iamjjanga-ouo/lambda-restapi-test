#!/bin/bash

# run redis,mariadb with docker-compose
docker-compose -f ./docker_code/db_instances.yml up -d

## connect redis
# docker exec -it redis6379 redis-cli -h 127.0.0.1 -p 6379 -a 'mypassword'

## connect mariadb
# docker exec -it maria3306 mysql -u root -p
# enter password 'mypassword'